import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { app } from 'electron'
import type { InstallRequest } from '@shared/api'
import { GAMES_BY_ID, MODS_BY_ID } from '@shared/catalog'
import type {
  InstalledMod,
  InstallerDef,
  InstallStep,
  ModDef,
  Progress,
  WrittenFile,
} from '@shared/types'
import { extractArchive, findSingleRootDir, listArchiveEntries } from './archive'
import { downloadFile, sha256File } from './download'
import { runFileAndWait } from './launch'
import { resolveRelease } from './release'
import { loadState, removeIdentified, removeInstalled, saveState, setInstalled } from './store'

export interface InstallContext {
  onProgress(progress: Progress): void
}

/**
 * The installer is deliberately a interpreter over catalog data rather than a
 * place to put per-mod code. Every action it takes has to be reversible, which
 * is what lets uninstall be honest -- see `applyStep` and `revertFiles`.
 */

async function exists(target: string): Promise<boolean> {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

function backupRoot(modId: string): string {
  return path.join(app.getPath('userData'), 'backups', modId)
}

function cacheDir(): string {
  return path.join(app.getPath('userData'), 'cache')
}

/** Where a mod's installer is unpacked to run. One per mod, replaced each run. */
function installerDir(modId: string): string {
  return path.join(app.getPath('userData'), 'installers', modId)
}

/**
 * Guard against a catalog entry escaping the game folder via `..` in `to`.
 * The catalog is data we interpret, so it gets the same distrust as an archive.
 */
function resolveInside(root: string, relative: string): string {
  const resolvedRoot = path.resolve(root)
  const target = path.resolve(resolvedRoot, relative)
  const rel = path.relative(resolvedRoot, target)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Install step tried to write outside the game folder: ${relative}`)
  }
  return target
}

/**
 * Match an archive entry list against a step's `from`.
 *
 * `**` takes everything. Anything else matches on the full relative path or on
 * the bare filename, so a catalog entry can say `dxgi.dll` without caring
 * whether the author nested it in a folder this release.
 */
function matchEntries(entries: string[], from: string): string[] {
  if (from === '**') return entries
  if (from.endsWith('/**')) {
    const prefix = from.slice(0, -3) + '/'
    return entries.filter((entry) => entry.startsWith(prefix))
  }
  const wanted = from.toLowerCase()
  return entries.filter(
    (entry) => entry.toLowerCase() === wanted || path.posix.basename(entry).toLowerCase() === wanted,
  )
}

/** Where an entry lands, relative to the game root. */
function destinationFor(entry: string, step: InstallStep): string {
  const to = step.to === '.' ? '' : step.to
  if (step.from === '**') return path.posix.join(to, entry)
  if (step.from.endsWith('/**')) {
    const prefix = step.from.slice(0, -3) + '/'
    return path.posix.join(to, entry.slice(prefix.length))
  }
  // A named file is placed directly in `to`, ignoring how it was nested.
  return path.posix.join(to, path.posix.basename(entry))
}

/** Undo a set of writes, newest first, restoring anything we displaced. */
async function revertFiles(gameRoot: string, files: WrittenFile[], createdDirs: string[]): Promise<void> {
  for (const file of [...files].reverse()) {
    const target = path.join(gameRoot, file.path)
    try {
      await fs.rm(target, { force: true })
      if (file.backup && (await exists(file.backup))) {
        await fs.mkdir(path.dirname(target), { recursive: true })
        await fs.rename(file.backup, target)
      }
    } catch {
      // Keep unwinding: one stuck file should not strand the rest.
    }
  }
  // Deepest first, and only if we emptied them.
  for (const dir of [...createdDirs].sort((a, b) => b.length - a.length)) {
    try {
      await fs.rmdir(path.join(gameRoot, dir))
    } catch {
      // Not empty, or never created. Either way, leave it alone.
    }
  }
}

interface StepOutcome {
  files: WrittenFile[]
  createdDirs: string[]
}

/**
 * Create a directory, recording every level we actually had to make.
 *
 * Recording only the deepest level is not enough: writing `VR/a/b/c.dll` into a
 * game with no `VR` folder creates three directories, and uninstall has to know
 * about all three or it leaves empty folders behind in the game directory.
 */
async function ensureDir(gameRoot: string, dir: string, created: string[]): Promise<void> {
  const relative = path.relative(gameRoot, dir)
  if (relative === '' || relative.startsWith('..')) return

  let current = gameRoot
  for (const segment of relative.split(path.sep)) {
    current = path.join(current, segment)
    if (!(await exists(current))) {
      await fs.mkdir(current)
      created.push(path.relative(gameRoot, current).split(path.sep).join('/'))
    }
  }
}

async function applyStep(
  step: InstallStep,
  extractedRoot: string,
  entries: string[],
  gameRoot: string,
  modId: string,
  ctx: InstallContext,
): Promise<StepOutcome> {
  const matched = matchEntries(entries, step.from)
  if (matched.length === 0) {
    if (step.optional) return { files: [], createdDirs: [] }
    throw new Error(
      `The download did not contain "${step.from}". The mod author may have changed the archive layout.`,
    )
  }

  const files: WrittenFile[] = []
  const createdDirs: string[] = []

  for (const entry of matched) {
    const relativeDest = destinationFor(entry, step)
    const target = resolveInside(gameRoot, relativeDest)
    ctx.onProgress({ phase: 'copying', file: relativeDest })

    // Create parent directories, remembering the ones that did not exist so
    // uninstall can take them back out again.
    await ensureDir(gameRoot, path.dirname(target), createdDirs)

    // Displace rather than overwrite: a game file we clobber must come back.
    let backup: string | undefined
    if (await exists(target)) {
      backup = path.join(backupRoot(modId), relativeDest)
      await fs.mkdir(path.dirname(backup), { recursive: true })
      await fs.rename(target, backup)
    }

    await fs.copyFile(path.join(extractedRoot, entry), target)
    files.push({ path: relativeDest, backup })
  }

  return { files, createdDirs }
}

/** Fetch the mod archive and report progress. Returns the file and its version. */
async function acquireArchive(
  mod: ModDef,
  request: InstallRequest,
  ctx: InstallContext,
): Promise<{ archivePath: string; version: string; temporary: boolean }> {
  if (mod.source.kind === 'manual') {
    const archivePath = request.archivePath
    if (!archivePath) {
      throw new Error(`${mod.name} has to be downloaded by hand first. Choose the file you downloaded.`)
    }
    if (!(await exists(archivePath))) {
      throw new Error(`That file is no longer there: ${archivePath}`)
    }
    if (mod.source.filePattern && !new RegExp(mod.source.filePattern, 'i').test(archivePath)) {
      throw new Error(
        `${path.basename(archivePath)} does not look like the right download for ${mod.name}.`,
      )
    }
    // Manual downloads carry no version metadata, so the filename is the honest answer.
    return { archivePath, version: path.basename(archivePath), temporary: false }
  }

  ctx.onProgress({ phase: 'resolving' })
  const release = await resolveRelease(mod.source)

  await fs.mkdir(cacheDir(), { recursive: true })
  const archivePath = path.join(cacheDir(), `${mod.id}-${release.version}-${release.assetName}`)

  if (!(await exists(archivePath))) {
    await downloadFile(release.downloadUrl, archivePath, (received, total) => {
      ctx.onProgress({ phase: 'downloading', received, total })
    })
  }
  return { archivePath, version: release.version, temporary: false }
}

export async function installMod(request: InstallRequest, ctx: InstallContext): Promise<void> {
  const mod = MODS_BY_ID.get(request.modId)
  if (!mod) throw new Error(`Unknown mod: ${request.modId}`)

  const game = GAMES_BY_ID.get(mod.gameId)
  if (!game) throw new Error(`${mod.name} refers to a game that is not in the catalog.`)

  const installer = mod.install.installer
  if (!installer && mod.install.steps.length === 0) {
    throw new Error(`${mod.name} is a setup guide rather than a packaged mod - open the guide instead.`)
  }

  let state = await loadState()
  const detected = state.games[mod.gameId]
  if (!detected) {
    throw new Error(`Point the manager at your ${game.name} folder first.`)
  }
  const gameRoot = detected.root
  if (!(await exists(gameRoot))) {
    throw new Error(`The saved folder for ${game.name} is gone: ${gameRoot}`)
  }

  if (installer) {
    await runReleaseInstaller(mod, installer, request, ctx)
    ctx.onProgress({ phase: 'done' })
    return
  }

  // Reinstalling and updating both go through a clean uninstall, so we never
  // stack a new version on top of files the previous one left behind. This uses
  // the silent form: emitting `done` here would tell the renderer the whole job
  // had finished while we were only getting started.
  if (state.installed[mod.id]) {
    await removeInstalledFiles(mod.id)
    state = await loadState()
  }

  const { archivePath, version } = await acquireArchive(mod, request, ctx)

  ctx.onProgress({ phase: 'extracting' })
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vrmm-'))

  const written: WrittenFile[] = []
  const created: string[] = []

  try {
    await extractArchive(archivePath, workDir)

    let entries = await listArchiveEntries(archivePath)
    let extractedRoot = workDir

    // GitHub archives usually nest everything under one folder; drop it so the
    // catalog can talk about paths as the mod author documents them.
    if (mod.install.stripRootDir) {
      const rootDir = findSingleRootDir(entries)
      if (rootDir) {
        extractedRoot = path.join(workDir, rootDir)
        entries = entries.map((entry) => entry.slice(rootDir.length + 1))
      }
    }

    const enabled = new Set(request.options)
    for (const step of mod.install.steps) {
      if (step.when && !enabled.has(step.when)) continue
      const outcome = await applyStep(step, extractedRoot, entries, gameRoot, mod.id, ctx)
      written.push(...outcome.files)
      created.push(...outcome.createdDirs)
    }

    const record: InstalledMod = {
      modId: mod.id,
      gameId: mod.gameId,
      gameRoot,
      version,
      installedAt: new Date().toISOString(),
      files: written,
      createdDirs: created,
      options: [...request.options],
    }
    await saveState(setInstalled(state, record))
    ctx.onProgress({ phase: 'done' })
  } catch (error) {
    // A half-installed mod is worse than none: put the folder back as we found it.
    await revertFiles(gameRoot, written, created)
    throw error
  } finally {
    await fs.rm(workDir, { recursive: true, force: true })
  }
}

/**
 * Start a mod's installer and hold until the user closes it. Whether it
 * installed anything is read off the game folder afterwards, by the same
 * fingerprint check as any install this app did not perform.
 */
async function runInstallerProgram(program: string, ctx: InstallContext): Promise<void> {
  ctx.onProgress({ phase: 'waiting', program: path.basename(program) })
  await runFileAndWait(program)
}

/**
 * Fetch a release and hand it to the mod's own installer.
 *
 * Nothing is written to the game folder from here -- the installer does that,
 * and records it in its own way. The unpacked release has to outlive a
 * single call in case the installer leaves a process running after its window
 * closes, so it is cleared at the start of the next run rather than in a
 * `finally` that could pull files out from under it.
 */
async function runReleaseInstaller(
  mod: ModDef,
  installer: InstallerDef,
  request: InstallRequest,
  ctx: InstallContext,
): Promise<void> {
  const { archivePath } = await acquireArchive(mod, request, ctx)

  // A bare Setup .exe has nothing to unpack: the download is the program.
  if (!installer.run) {
    if (path.extname(archivePath).toLowerCase() !== '.exe') {
      throw new Error(
        `${mod.name} expected its release to be an installer .exe, but got ${path.basename(archivePath)}.`,
      )
    }
    await runInstallerProgram(archivePath, ctx)
    return
  }

  ctx.onProgress({ phase: 'extracting' })
  const workDir = installerDir(mod.id)
  await fs.rm(workDir, { recursive: true, force: true })
  await fs.mkdir(workDir, { recursive: true })
  await extractArchive(archivePath, workDir)

  let extractedRoot = workDir
  if (mod.install.stripRootDir) {
    const rootDir = findSingleRootDir(await listArchiveEntries(archivePath))
    if (rootDir) extractedRoot = path.join(workDir, rootDir)
  }

  const program = resolveInside(extractedRoot, installer.run)
  if (!(await exists(program))) {
    throw new Error(
      `The download did not contain "${installer.run}". The mod author may have changed the archive layout.`,
    )
  }
  await runInstallerProgram(program, ctx)
}

/**
 * Remove a mod that its own installer put in place, by reopening that
 * installer. Prefers the copy the mod keeps in the game folder, which matches
 * what is installed; otherwise falls back to the newest release's.
 */
export async function uninstallWithInstaller(mod: ModDef, ctx: InstallContext): Promise<void> {
  const installer = mod.install.installer
  if (!installer) throw new Error(`${mod.name} does not use its own installer.`)

  const detected = (await loadState()).games[mod.gameId]
  if (!detected) throw new Error(`${mod.name} has no game folder to clean up.`)

  if (installer.uninstall) {
    const program = resolveInside(detected.root, installer.uninstall)
    if (await exists(program)) {
      await runInstallerProgram(program, ctx)
      ctx.onProgress({ phase: 'done' })
      return
    }
  }

  await runReleaseInstaller(mod, installer, { modId: mod.id, options: [] }, ctx)
  ctx.onProgress({ phase: 'done' })
}

/**
 * Reverse an install without reporting progress, so it can be reused as the
 * first half of an update.
 */
async function removeInstalledFiles(modId: string): Promise<void> {
  const state = await loadState()
  const record = state.installed[modId]
  if (!record) return

  await revertFiles(record.gameRoot, record.files, record.createdDirs)
  await fs.rm(backupRoot(modId), { recursive: true, force: true })
  await saveState(removeInstalled(state, modId))
}

export async function uninstallMod(modId: string, ctx: InstallContext): Promise<void> {
  ctx.onProgress({ phase: 'copying', file: 'removing files' })
  await removeInstalledFiles(modId)
  ctx.onProgress({ phase: 'done' })
}

/**
 * Remove a mod this app did not install.
 *
 * There is no file manifest and no backups for such an install, so the only
 * safe rule is: delete a file only if its bytes are identical to the ones that
 * release shipped. That way a file the mod displaced, or one the user edited,
 * is left alone rather than destroyed on a guess -- and anything the mod
 * replaced still cannot be restored, which the UI says plainly.
 *
 * Returns how many files were removed.
 */
export async function uninstallUnmanaged(
  modId: string,
  version: string,
  ctx: InstallContext,
): Promise<number> {
  const mod = MODS_BY_ID.get(modId)
  if (!mod) throw new Error(`Unknown mod: ${modId}`)
  if (mod.source.kind === 'manual') {
    throw new Error(`${mod.name} was downloaded by hand, so its files cannot be verified.`)
  }

  const state = await loadState()
  const detected = state.games[mod.gameId]
  if (!detected) throw new Error(`${mod.name} has no game folder to clean up.`)
  const gameRoot = detected.root

  ctx.onProgress({ phase: 'resolving' })
  const release = await resolveRelease(mod.source, version)

  await fs.mkdir(cacheDir(), { recursive: true })
  const archivePath = path.join(cacheDir(), `${mod.id}-${release.version}-${release.assetName}`)
  if (!(await exists(archivePath))) {
    await downloadFile(release.downloadUrl, archivePath, (received, total) => {
      ctx.onProgress({ phase: 'downloading', received, total })
    })
  }

  ctx.onProgress({ phase: 'extracting' })
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vrmm-rm-'))
  let removed = 0

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

    const touchedDirs = new Set<string>()

    // Every step, including option-gated ones: which options were used is
    // unknowable for an install we did not perform, and the hash check is what
    // keeps this safe rather than the plan.
    for (const step of mod.install.steps) {
      for (const entry of matchEntries(entries, step.from)) {
        const relativeDest = destinationFor(entry, step)
        const target = resolveInside(gameRoot, relativeDest)
        if (!(await exists(target))) continue

        const [onDisk, inRelease] = await Promise.all([
          sha256File(target),
          sha256File(path.join(extractedRoot, entry)),
        ])
        if (onDisk !== inRelease) continue

        ctx.onProgress({ phase: 'copying', file: relativeDest })
        await fs.rm(target, { force: true })
        removed += 1
        touchedDirs.add(path.dirname(relativeDest))
      }
    }

    // Take back any folders the mod left empty, deepest first.
    for (const dir of [...touchedDirs].sort((a, b) => b.length - a.length)) {
      if (dir === '.' || dir === '') continue
      try {
        await fs.rmdir(path.join(gameRoot, dir))
      } catch {
        // Still holds something that is not ours. Leave it.
      }
    }

    await saveState(removeIdentified(await loadState(), mod.id))
    ctx.onProgress({ phase: 'done' })
    return removed
  } finally {
    await fs.rm(workDir, { recursive: true, force: true })
  }
}
