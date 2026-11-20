// Publish the installer `npm run dist` just built as a GitHub release, using
// the gh CLI's own login so no token lives in this repo or its env.
//
// The app's auto-updater reads latest.yml from the newest release, so all
// three files have to go up together: the installer, its blockmap (for
// differential downloads), and latest.yml.
//
// Bump "version" in package.json before running `npm run release`; the tag is
// v<version> and a release that already exists is refused by gh.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const { version } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
const releaseDir = path.join(root, 'release')

const installer = `VR-Mod-Manager-Setup-${version}.exe`
const files = [installer, `${installer}.blockmap`, 'latest.yml'].map((name) =>
  path.join(releaseDir, name),
)

for (const file of files) {
  if (!existsSync(file)) {
    console.error(`Missing ${file}. Run npm run dist first.`)
    process.exit(1)
  }
}

const tag = `v${version}`
console.log(`Publishing ${tag} with ${files.length} files...`)
execFileSync(
  'gh',
  ['release', 'create', tag, ...files, '--title', `VR Mod Manager ${version}`, '--generate-notes'],
  { cwd: root, stdio: 'inherit' },
)
console.log(`Released ${tag}. Installed copies pick it up within a few hours, or on next launch.`)
