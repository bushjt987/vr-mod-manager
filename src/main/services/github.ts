import type { ResolvedRelease, SourceDef } from '../../shared/types'

/** Only the fields of the GitHub releases API we actually rely on. */
interface GithubAsset {
  name: string
  browser_download_url: string
  size: number
}

interface GithubRelease {
  tag_name: string
  draft: boolean
  prerelease: boolean
  published_at: string | null
  html_url: string
  assets: GithubAsset[]
}

type GithubSource = Extract<SourceDef, { kind: 'github' }>

const API_ROOT = 'https://api.github.com'

/**
 * GitHub rejects unidentified clients, and the JSON media type pins us to the
 * current API version rather than whatever becomes the default later.
 */
const HEADERS: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'vr-mod-manager',
}

/**
 * Anonymous requests get 60/hour per IP. GitHub signals exhaustion with a 403
 * (or 429) plus x-ratelimit-remaining: 0, which is otherwise indistinguishable
 * from "this repo is private", so check the header before blaming the repo.
 */
function isRateLimited(response: Response): boolean {
  if (response.status !== 403 && response.status !== 429) return false
  const remaining = response.headers.get('x-ratelimit-remaining')
  return remaining === '0' || response.headers.has('x-ratelimit-reset')
}

/**
 * Resolve the release a github-sourced mod should install right now.
 *
 * Fetches a page of releases rather than /releases/latest because that endpoint
 * hides prereleases entirely, and most VR mods ship nothing else.
 */
async function resolveViaApi(source: GithubSource): Promise<ResolvedRelease> {
  const url = `${API_ROOT}/repos/${source.repo}/releases?per_page=15`

  let response: Response
  try {
    response = await fetch(url, { headers: HEADERS })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`Could not reach GitHub while checking ${source.repo}: ${detail}`)
  }

  if (response.status === 404) {
    throw new Error(
      `GitHub repository "${source.repo}" was not found. It may have been renamed, deleted or made private.`,
    )
  }
  if (isRateLimited(response)) {
    throw new Error(
      'GitHub rate limit reached (60 anonymous requests per hour, per IP). The limit resets hourly -- wait and try again.',
    )
  }
  if (!response.ok) {
    throw new Error(
      `GitHub returned ${response.status} ${response.statusText} for ${source.repo}.`,
    )
  }

  // fetch's json() is typed `any`; the shape is narrowed by the guard below.
  const payload: unknown = await response.json()
  if (!Array.isArray(payload)) {
    throw new Error(`Unexpected response from GitHub for ${source.repo}.`)
  }
  const releases = payload as GithubRelease[]

  const release = pickRelease(releases, source)
  const pattern = new RegExp(source.assetPattern)
  const asset = release.assets.find((candidate) => pattern.test(candidate.name))
  if (!asset) {
    const available = release.assets.map((a) => a.name).join(', ') || 'none'
    throw new Error(
      `Release ${release.tag_name} of ${source.repo} has no asset matching /${source.assetPattern}/. Assets: ${available}.`,
    )
  }

  return {
    version: release.tag_name,
    assetName: asset.name,
    downloadUrl: asset.browser_download_url,
    size: asset.size,
    publishedAt: release.published_at ?? '',
    htmlUrl: release.html_url,
  }
}

function pickRelease(releases: GithubRelease[], source: GithubSource): GithubRelease {
  if (source.tag !== undefined) {
    const pinned = releases.find((release) => release.tag_name === source.tag)
    if (!pinned) {
      throw new Error(
        `Tag "${source.tag}" was not found among the 15 most recent releases of ${source.repo}.`,
      )
    }
    return pinned
  }

  // The API already returns newest first; drafts are never installable.
  const tagPattern = source.tagPattern ? new RegExp(source.tagPattern) : undefined
  const usable = releases.filter(
    (release) =>
      !release.draft &&
      (source.allowPrerelease === true || !release.prerelease) &&
      (!tagPattern || tagPattern.test(release.tag_name)),
  )
  const newest = usable[0]
  if (!newest) {
    const reason =
      releases.length > 0 && source.allowPrerelease !== true
        ? ' Every recent release is a prerelease; this mod is not marked as allowing prereleases.'
        : tagPattern
          ? ` None of the 15 most recent releases has a tag matching ${source.tagPattern}.`
          : ''
    throw new Error(`No installable release found for ${source.repo}.${reason}`)
  }
  return newest
}

/* ------------------------------------------------------------------ *
 * Web endpoints
 *
 * api.github.com allows 60 anonymous requests an hour per IP, which this app
 * can exhaust just by being restarted a few times. The ordinary github.com
 * pages that serve releases are not part of that budget -- verified the hard
 * way, by watching them keep working while the REST API returned 403 -- and
 * between them they carry everything a release lookup needs. No token, no key
 * to ship.
 *
 * Conditional requests are not a way out of this: an unauthenticated 304 still
 * decrements the limit. Only authenticated requests get that exemption.
 * ------------------------------------------------------------------ */

const WEB_ROOT = 'https://github.com'

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { 'User-Agent': 'vr-mod-manager' } })
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.text()
}

/** Newest release tag including prereleases, from the releases feed. */
async function newestTagFromFeed(repo: string): Promise<string | undefined> {
  const xml = await fetchText(`${WEB_ROOT}/${repo}/releases.atom`)
  const match = xml.match(/releases\/tag\/([^"<]+)/)
  return match ? decodeURIComponent(match[1]) : undefined
}

/**
 * Newest non-prerelease tag. `/releases/latest` redirects to it, or back to the
 * releases index when every release is a prerelease -- which is exactly the
 * signal we need, and is the case for several mods in this catalog.
 */
async function newestStableTag(repo: string): Promise<string | undefined> {
  const response = await fetch(`${WEB_ROOT}/${repo}/releases/latest`, {
    redirect: 'manual',
    headers: { 'User-Agent': 'vr-mod-manager' },
  })
  const location = response.headers.get('location') ?? ''
  const match = location.match(/releases\/tag\/([^"?]+)$/)
  return match ? decodeURIComponent(match[1]) : undefined
}

/** Asset filenames attached to a tag, from the fragment the releases page lazy-loads. */
async function assetsForTag(repo: string, tag: string): Promise<string[]> {
  const html = await fetchText(
    `${WEB_ROOT}/${repo}/releases/expanded_assets/${encodeURIComponent(tag)}`,
  )
  const names = new Set<string>()
  for (const match of html.matchAll(/releases\/download\/[^"]*?\/([^"\/]+)"/g)) {
    names.add(decodeURIComponent(match[1]))
  }
  return [...names]
}

/**
 * Newest tag matching a source's `tagPattern`, from the releases feed. The feed
 * only lists recent releases, so a matching one buried under many others is
 * missed here and left to the API fallback, which looks further back.
 */
async function newestMatchingTag(repo: string, tagPattern: string): Promise<string | undefined> {
  const pattern = new RegExp(tagPattern)
  const tags = await listRecentTags(repo, 50)
  return tags.find((tag) => pattern.test(tag))
}

async function resolveViaWeb(source: GithubSource): Promise<ResolvedRelease> {
  const tag =
    source.tag ??
    (source.allowPrerelease
      ? source.tagPattern
        ? await newestMatchingTag(source.repo, source.tagPattern)
        : await newestTagFromFeed(source.repo)
      : await newestStableTag(source.repo))

  if (!tag) {
    throw new Error(
      source.tagPattern
        ? `${source.repo} has no recent release with a tag matching ${source.tagPattern}.`
        : source.allowPrerelease
          ? `${source.repo} has published no releases.`
          : `${source.repo} has no full release yet - every build so far is a prerelease.`,
    )
  }
  if (source.tagPattern && !new RegExp(source.tagPattern).test(tag)) {
    // Only reachable for stable-only sources, whose newest release is the one
    // the redirect names. The API path filters properly, so defer to it.
    throw new Error(`Newest release ${tag} of ${source.repo} does not match ${source.tagPattern}.`)
  }

  const assets = await assetsForTag(source.repo, tag)
  const pattern = new RegExp(source.assetPattern)
  const assetName = assets.find((name) => pattern.test(name))
  if (!assetName) {
    throw new Error(
      `Release ${tag} of ${source.repo} has no file matching ${source.assetPattern}.` +
        (assets.length > 0 ? ` It contains: ${assets.join(', ')}.` : ' It has no attachments.'),
    )
  }

  const notes = await releaseNotesFor(source.repo, tag)

  return {
    version: tag,
    ...(notes?.title ? { title: notes.title } : {}),
    ...(notes?.notes ? { notes: notes.notes } : {}),
    assetName,
    downloadUrl: `${WEB_ROOT}/${source.repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(assetName)}`,
    // Not published by these endpoints; the download reports its own length.
    size: 0,
    publishedAt: '',
    htmlUrl: `${WEB_ROOT}/${source.repo}/releases/tag/${encodeURIComponent(tag)}`,
  }
}

/**
 * Resolve the newest release, preferring the endpoints that cost no API quota
 * and falling back to the REST API if their markup ever changes shape.
 */
export async function resolveLatestRelease(source: GithubSource): Promise<ResolvedRelease> {
  try {
    return await resolveViaWeb(source)
  } catch (webError) {
    try {
      return await resolveViaApi(source)
    } catch {
      // The web path is the one we actually rely on, so report its failure.
      throw webError instanceof Error ? webError : new Error(String(webError))
    }
  }
}

/**
 * Recent release tags, newest first, including prereleases.
 *
 * Used to walk backwards through release history when a mod records no version
 * of its own: hash its installed files against each release until one matches.
 */
export async function listRecentTags(repo: string, limit = 12): Promise<string[]> {
  const xml = await fetchText(`${WEB_ROOT}/${repo}/releases.atom`)
  const tags: string[] = []
  for (const match of xml.matchAll(/releases\/tag\/([^"<]+)/g)) {
    const tag = decodeURIComponent(match[1])
    if (!tags.includes(tag)) tags.push(tag)
    if (tags.length >= limit) break
  }
  return tags
}

/* ------------------------------------------------------------------ *
 * Release notes
 *
 * The releases feed carries each release's title and body, so the changelog
 * costs nothing extra in API quota -- same reasoning as the resolver above.
 * ------------------------------------------------------------------ */

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name: string) => ENTITIES[name.toLowerCase()] ?? match)
}

/** Flatten the release body's HTML into readable plain text. */
function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<\s*(br|\/p|\/li|\/h\d)\s*\/?>/gi, '\n')
      .replace(/<\s*li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Title and notes for one tag, or undefined when the feed has no entry for it. */
export async function releaseNotesFor(
  repo: string,
  tag: string,
): Promise<{ title?: string; notes?: string } | undefined> {
  let xml: string
  try {
    xml = await fetchText(`${WEB_ROOT}/${repo}/releases.atom`)
  } catch {
    // Notes are a nicety; never fail a resolve over them.
    return undefined
  }

  for (const entry of xml.split('<entry>').slice(1)) {
    const entryTag = entry.match(/releases\/tag\/([^"<]+)/)?.[1]
    if (!entryTag || decodeURIComponent(entryTag) !== tag) continue

    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]
    const body = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1]
    const result: { title?: string; notes?: string } = {}
    if (title) result.title = decodeEntities(title).trim()
    if (body) {
      const text = htmlToText(body)
      // Long enough to be useful, short enough not to swallow the card.
      if (text) result.notes = text.length > 2000 ? text.slice(0, 2000) + '…' : text
    }
    return result
  }
  return undefined
}
