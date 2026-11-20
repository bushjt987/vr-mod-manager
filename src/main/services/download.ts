import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

/**
 * Stream a URL to disk.
 *
 * Mod archives run to hundreds of megabytes, so the body is piped straight to
 * the filesystem instead of being buffered. The download lands on a `.part`
 * file and is renamed only after the stream closes cleanly, so an interrupted
 * download can never be mistaken for a finished one on the next run.
 */
export async function downloadFile(
  url: string,
  destPath: string,
  onProgress?: (received: number, total: number) => void,
): Promise<void> {
  const partPath = `${destPath}.part`
  await fs.mkdir(path.dirname(destPath), { recursive: true })
  await fs.rm(partPath, { force: true })

  const response = await fetch(url, { headers: { 'User-Agent': 'vr-mod-manager' } })
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText} for ${url}`)
  }
  if (!response.body) {
    throw new Error(`Download failed: no response body for ${url}`)
  }

  // Redirects and chunked responses can omit content-length; 0 tells callers to
  // show an indeterminate progress bar rather than a bogus percentage.
  const lengthHeader = response.headers.get('content-length')
  const parsedLength = lengthHeader === null ? Number.NaN : Number.parseInt(lengthHeader, 10)
  const total = Number.isFinite(parsedLength) && parsedLength > 0 ? parsedLength : 0

  let received = 0
  const source = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0])
  if (onProgress) {
    source.on('data', (chunk: Buffer | string) => {
      received += typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.length
      onProgress(received, total)
    })
  }

  try {
    await pipeline(source, createWriteStream(partPath))
  } catch (error) {
    await fs.rm(partPath, { force: true })
    throw error
  }

  // rename is atomic within a volume, so the final path appears complete or not at all.
  await fs.rm(destPath, { force: true })
  await fs.rename(partPath, destPath)
}

/** Streaming SHA-256, so hashing a large archive costs no more memory than downloading it did. */
export async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256')
  await pipeline(createReadStream(filePath), hash)
  return hash.digest('hex')
}
