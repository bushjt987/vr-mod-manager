import type { ResolvedRelease, SourceDef } from '@shared/types'
import { resolveDirect } from './direct'
import { resolveLatestRelease } from './github'

/** Every source the app can download from by itself, i.e. all but `manual`. */
export type DownloadableSource = Exclude<SourceDef, { kind: 'manual' }>

export function isDownloadable(source: SourceDef): source is DownloadableSource {
  return source.kind !== 'manual'
}

/**
 * Resolve the build to download. `version` pins a specific GitHub tag; a direct
 * link only ever serves its newest build, so asking it for anything else fails
 * here rather than quietly fetching a different build than the one requested.
 */
export async function resolveRelease(
  source: DownloadableSource,
  version?: string,
): Promise<ResolvedRelease> {
  if (source.kind === 'github') {
    return resolveLatestRelease(version === undefined ? source : { ...source, tag: version })
  }

  const release = await resolveDirect(source)
  if (version !== undefined && version !== release.version) {
    throw new Error(
      `Only the newest build (${release.version}) can still be downloaded from ${new URL(source.url).hostname}, not ${version}.`,
    )
  }
  return release
}
