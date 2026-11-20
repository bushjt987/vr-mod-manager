import fs from 'node:fs/promises'
import path from 'node:path'
import AdmZip from 'adm-zip'
import sevenZip from '7zip-min'

/**
 * Resolve a zip entry against the destination and refuse anything that escapes it.
 *
 * This is the zip-slip guard. Mod archives come from third parties, so an entry
 * named `..\..\Windows\System32\foo.dll` -- or an absolute path, or one using
 * backslashes -- must never be written. We resolve and compare ourselves rather
 * than relying on adm-zip's own extraction, which has had traversal bugs.
 */
function safeDestination(entryName: string, destDir: string): string {
  const resolvedRoot = path.resolve(destDir)
  // path.resolve treats both separators on Windows, so a `..\` entry is caught too.
  const target = path.resolve(resolvedRoot, entryName)

  const relative = path.relative(resolvedRoot, target)
  const escapes =
    relative.length === 0 || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)
  if (escapes) {
    throw new Error(
      `Refusing to extract "${entryName}": it resolves outside the destination folder. The archive may be malicious.`,
    )
  }
  return target
}

function openZip(zipPath: string): AdmZip {
  try {
    return new AdmZip(zipPath)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`Could not read archive ${path.basename(zipPath)}: ${detail}`)
  }
}

/** Forward-slash relative paths of the files in the archive. Directory entries are omitted. */
export async function listZipEntries(zipPath: string): Promise<string[]> {
  const zip = openZip(zipPath)
  return zip
    .getEntries()
    .filter((entry) => !entry.isDirectory)
    .map((entry) => entry.entryName.replace(/\\/g, '/'))
}

/**
 * Extract every file in the archive under destDir.
 *
 * Every entry is validated before a single byte is written, so a hostile
 * archive cannot plant files outside the target and then fail partway through.
 */
export async function extractZip(zipPath: string, destDir: string): Promise<void> {
  const zip = openZip(zipPath)
  const files = zip.getEntries().filter((entry) => !entry.isDirectory)

  // Validate the whole manifest up front, before creating anything.
  const planned = files.map((entry) => ({ entry, target: safeDestination(entry.entryName, destDir) }))

  await fs.mkdir(path.resolve(destDir), { recursive: true })
  for (const { entry, target } of planned) {
    await fs.mkdir(path.dirname(target), { recursive: true })
    // getData() is synchronous in adm-zip; entries are individually small enough
    // that a per-entry buffer is not a concern, unlike buffering a whole download.
    await fs.writeFile(target, entry.getData())
  }
}

/**
 * The single wrapper directory every entry sits under, if there is one.
 *
 * GitHub release zips almost always nest their payload one level deep, which is
 * what the catalog's `stripRootDir` flag exists to undo. Returns undefined when
 * anything sits at the top level, since stripping would then lose files.
 */
export function findSingleRootDir(entries: string[]): string | undefined {
  let root: string | undefined
  for (const entry of entries) {
    const normalized = entry.replace(/\\/g, '/').replace(/^\.?\//, '')
    const slash = normalized.indexOf('/')
    // A file at the top level means there is no single wrapper directory.
    if (slash <= 0) return undefined

    const top = normalized.slice(0, slash)
    if (root === undefined) root = top
    else if (root !== top) return undefined
  }
  return root
}

/* ------------------------------------------------------------------ *
 * 7-Zip
 *
 * Some mods ship .7z rather than .zip -- Overlord for MW2 Campaign Remastered
 * is the first here. adm-zip cannot read those, so extraction dispatches on the
 * extension and 7-Zip handles its own format through a bundled 7za binary.
 *
 * The traversal guard still applies: the archive is listed and every entry
 * checked BEFORE 7za is allowed to write anything, so a hostile .7z gets the
 * same treatment as a hostile .zip rather than trusting the external tool.
 * ------------------------------------------------------------------ */

/** Written this way so no escaped backslash literal has to survive editing. */
const WINDOWS_SEP = String.fromCharCode(92)

function is7z(archivePath: string): boolean {
  return path.extname(archivePath).toLowerCase() === '.7z'
}

/** 7-Zip reports paths with backslashes on Windows; the rest of the app uses posix. */
function toPosix(entryName: string): string {
  return entryName.split(WINDOWS_SEP).join('/')
}

async function list7zEntries(archivePath: string): Promise<string[]> {
  let entries
  try {
    entries = await sevenZip.list(archivePath)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`Could not read archive ${path.basename(archivePath)}: ${detail}`)
  }

  // `attr` is "D" for directories and "A" for files.
  return entries
    .filter((entry) => !String(entry.attr ?? '').toUpperCase().startsWith('D'))
    .map((entry) => toPosix(String(entry.name)))
}

async function extract7z(archivePath: string, destDir: string): Promise<void> {
  // Validate the manifest first: 7za does the writing, so this is the only
  // chance to refuse a traversing entry before files land on disk.
  for (const entry of await list7zEntries(archivePath)) {
    safeDestination(entry, destDir)
  }

  await fs.mkdir(path.resolve(destDir), { recursive: true })
  try {
    await sevenZip.unpack(archivePath, path.resolve(destDir))
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`Could not extract ${path.basename(archivePath)}: ${detail}`)
  }
}

/** Forward-slash relative paths of the files in a .zip or .7z archive. */
export async function listArchiveEntries(archivePath: string): Promise<string[]> {
  return is7z(archivePath) ? list7zEntries(archivePath) : listZipEntries(archivePath)
}

/** Extract a .zip or .7z archive under destDir, refusing any entry that escapes it. */
export async function extractArchive(archivePath: string, destDir: string): Promise<void> {
  return is7z(archivePath) ? extract7z(archivePath, destDir) : extractZip(archivePath, destDir)
}
