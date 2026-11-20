import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { app } from 'electron'
import type { IdentifyOutcome } from '@shared/api'
import type { ModDef, Progress, ResolvedRelease } from '@shared/types'
import { extractArchive, findSingleRootDir, listArchiveEntries } from './archive'
import { downloadFile, sha256File } from './download'
import { listRecentTags } from './github'
import { fingerprintFor, fingerprintSignature } from './presence'
import { resolveRelease } from './release'
import { loadState, removeIdentified, saveState, setIdentified } from './store'

/**
 * Work out which build of a hand-installed mod is on disk.
 *
 * Most mods record no version anywhere -- their DLLs ship with an empty PE
 * version resource and they publish no checksum files -- so the only way to
 * name a build is to compare its files against the releases themselves. This
 * walks release history newest-first and stops at the first one whose files
 * hash identically.
 *
 * That costs a download per release inspected, which is why it runs on demand.
 * Archives land in the same cache the installer uses, so identifying a mod and
 * then installing it does not fetch twice.
 */

export interface IdentifyContext {
  onProgress(progress: Progress): void
}

/** How far back to look before calling a build unrecognised. */
const MAX_RELEASES = 12

function cacheDir(): string {
  return path.join(app.getPath('userData'), 'cache')
}

async function exists(target: string): Promise<boolean> {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

/**
 * Locate the archive entry that supplies a given installed file. Mods are not
 * consistent about nesting, so match the full relative path first and fall back
 * to the basename -- the same rule the installer uses when placing files.
 */
function entryFor(entries: string[], fingerprintPath: string): string | undefined {
  const wanted = fingerprintPath.toLowerCase()
  const exact = entries.find((entry) => entry.toLowerCase() === wanted)
  if (exact) return exact

  const base = path.posix.basename(wanted)
  return entries.find((entry) => path.posix.basename(entry).toLowerCase() === base)
}

/** Do the mod's installed files match this specific release exactly? */
async function matchesRelease(
  mod: ModDef,
  gameRoot: string,
  release: ResolvedRelease,
  files: string[],
  ctx: IdentifyContext,
): Promise<boolean> {
  await fs.mkdir(cacheDir(), { recursive: true })
  const archivePath = path.join(cacheDir(), `${mod.id}-${release.version}-${release.assetName}`)
  if (!(await exists(archivePath))) {
    await downloadFile(release.downloadUrl, archivePath, (received, total) => {
      ctx.onProgress({ phase: 'downloading', received, total })
    })
  }

  ctx.onProgress({ phase: 'extracting' })
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vrmm-id-'))
  try {
    await extractArchive(archivePath, workDir)

    let entries = await listArchiveEntries(archivePath)
    let extractedRoot = workDir
    if (mod.install.stripRootDir) {
      const rootDir = findSingleRootDir(entries)
      if (rootDir) {
        extractedRoot = path.join(workDir, rootDir)
        entries = entries.map((entry) => entry.slice(rootDir.length + 1))
      }
    }

    for (const relative of files) {
      const entry = entryFor(entries, relative)
      // A release that never contained this file cannot be the one installed.
      if (!entry) return false

      const [onDisk, inRelease] = await Promise.all([
        sha256File(path.join(gameRoot, relative)),
        sha256File(path.join(extractedRoot, entry)),
      ])
      if (onDisk !== inRelease) return false
    }
    return true
  } finally {
    await fs.rm(workDir, { recursive: true, force: true })
  }
}

export async function identifyBuild(
  mod: ModDef,
  gameRoot: string,
  ctx: IdentifyContext,
): Promise<IdentifyOutcome> {
  const source = mod.source
  if (source.kind === 'manual') {
    return {
      kind: 'unknown',
      reason: `${mod.name} is downloaded by hand, so there are no releases to compare against.`,
    }
  }

  // Directory markers cannot be hashed, so only real files are usable here.
  const files = fingerprintFor(mod).filter((entry) => path.posix.extname(entry) !== '')
  if (files.length === 0) {
    return { kind: 'unknown', reason: `${mod.name} has no file signature to compare.` }
  }

  for (const relative of files) {
    if (!(await exists(path.join(gameRoot, relative)))) {
      return { kind: 'unknown', reason: `${relative} is missing from the game folder.` }
    }
  }

  ctx.onProgress({ phase: 'resolving' })
  // A direct link has no history: its one current build is all there is to try.
  const tags =
    source.kind === 'github'
      ? await listRecentTags(source.repo, MAX_RELEASES)
      : [(await resolveRelease(source)).version]
  if (tags.length === 0) {
    return { kind: 'unknown', reason: `${mod.name} has published no releases.` }
  }
  const latestVersion = tags[0]

  for (const tag of tags) {
    // resolveRelease honours an explicit version, so reuse it per release.
    const release = await resolveRelease(source, tag)
    if (await matchesRelease(mod, gameRoot, release, files, ctx)) {
      // Keep the answer: re-deriving it means downloading releases again.
      const signature = await fingerprintSignature(mod, gameRoot)
      if (signature) {
        await saveState(
          setIdentified(await loadState(), mod.id, {
            version: tag,
            signature,
            checkedAt: new Date().toISOString(),
          }),
        )
      }
      return { kind: 'identified', version: tag, isLatest: tag === latestVersion, latestVersion }
    }
  }

  // Either older than the window we searched, or the files have been edited.
  // Drop any stale answer rather than leaving one that no longer holds.
  await saveState(removeIdentified(await loadState(), mod.id))
  return { kind: 'unrecognised', latestVersion, searched: tags.length }
}
