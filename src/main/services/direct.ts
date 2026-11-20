import path from 'node:path'
import type { ResolvedRelease, SourceDef } from '@shared/types'

type DirectSource = Extract<SourceDef, { kind: 'direct' }>

/**
 * Resolve a mod hosted on the author's own site behind a "latest" link.
 *
 * Sites like this keep one stable URL and redirect it to the current build's
 * versioned filename, so following the redirects with a HEAD request yields
 * both the real download and its version without fetching the archive itself.
 */
export async function resolveDirect(source: DirectSource): Promise<ResolvedRelease> {
  const host = new URL(source.url).hostname

  let response: Response
  try {
    response = await fetch(source.url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': 'vr-mod-manager' },
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`Could not reach ${host}: ${detail}`)
  }

  if (!response.ok) {
    throw new Error(`${host} returned ${response.status} ${response.statusText} for ${source.url}.`)
  }

  // A dead link on a site builder tends to land on a page rather than a 404.
  const type = response.headers.get('content-type') ?? ''
  if (type.startsWith('text/html')) {
    throw new Error(`${source.url} now leads to a web page instead of a download.`)
  }

  const finalUrl = response.url || source.url
  const assetName = decodeURIComponent(path.posix.basename(new URL(finalUrl).pathname))
  const version = assetName.match(new RegExp(source.versionPattern))?.[1]
  if (!version) {
    throw new Error(
      `The download from ${host} is now called ${assetName}, which does not match /${source.versionPattern}/.`,
    )
  }

  const length = Number.parseInt(response.headers.get('content-length') ?? '', 10)
  const modified = Date.parse(response.headers.get('last-modified') ?? '')

  return {
    version,
    assetName,
    downloadUrl: finalUrl,
    size: Number.isFinite(length) ? length : 0,
    publishedAt: Number.isNaN(modified) ? '' : new Date(modified).toISOString(),
    htmlUrl: source.url,
  }
}
