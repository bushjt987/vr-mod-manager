import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)

/**
 * Read a single registry value via `reg query`.
 *
 * Shelling out keeps us free of a native dependency, which matters because
 * native modules have to be rebuilt against every Electron release.
 * Returns undefined when the key or value is missing.
 */
export async function readRegistryValue(key: string, value: string): Promise<string | undefined> {
  try {
    const { stdout } = await run('reg', ['query', key, '/v', value], {
      windowsHide: true,
      timeout: 5000,
    })
    // Output looks like:  "    SteamPath    REG_SZ    C:\Program Files (x86)\Steam"
    const line = stdout
      .split(/\r?\n/)
      .find((l) => l.trim().toLowerCase().startsWith(value.toLowerCase()))
    if (!line) return undefined
    const match = line.trim().match(/^\S+(?:\s+\S+)*?\s+REG_[A-Z_]+\s+(.*)$/)
    const result = match?.[1]?.trim()
    return result && result.length > 0 ? result : undefined
  } catch {
    // reg exits non-zero when the key does not exist; that is not an error here.
    return undefined
  }
}
