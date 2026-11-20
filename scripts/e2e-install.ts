import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { app } from 'electron'
import type { Progress } from '@shared/types'
import { installMod, uninstallMod } from '../src/main/services/install'
import { loadState, saveState, setGame } from '../src/main/services/store'

/**
 * End-to-end check of the install engine against a throwaway game folder.
 *
 * It really does hit GitHub and really does write files -- that is the point.
 * It never touches a detected game: the game root is a temp directory seeded
 * to look like a Halo install.
 */

let failures = 0

function check(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    console.log(`  PASS  ${label}`)
  } else {
    failures += 1
    console.log(`  FAIL  ${label}${detail ? ` -- ${detail}` : ''}`)
  }
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
 * The same install/uninstall cycle over a .7z mod, since 7-Zip extraction goes
 * through an external binary rather than adm-zip and can fail independently.
 */
async function sevenZipRoundTrip(): Promise<void> {
  console.log('')
  console.log('[4] install a .7z mod (Overlord)')

  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'vrmm-7z-'))
  const gameRoot = path.join(sandbox, 'MW2CR')
  await fs.mkdir(gameRoot, { recursive: true })
  await fs.writeFile(path.join(gameRoot, 'h2_sp64_ship.exe'), 'not a real executable')

  await saveState(
    setGame(await loadState(), {
      gameId: 'mw2-campaign-remastered',
      root: gameRoot,
      store: 'retail',
      manual: true,
    }),
  )

  const ctx = { onProgress(_progress: Progress): void {} }
  try {
    await installMod({ modId: 'overlord-mw2cr', options: [] }, ctx)
  } catch (error) {
    check('installed the 7z mod', false, error instanceof Error ? error.message : String(error))
    await fs.rm(sandbox, { recursive: true, force: true })
    return
  }

  check('wrote overlord.exe', await exists(path.join(gameRoot, 'overlord.exe')))
  check('wrote the h2-mod tree', await exists(path.join(gameRoot, 'h2-mod', 'ui_scripts')))
  check('left the docs out', !(await exists(path.join(gameRoot, 'README.md'))))
  check('left the .pdb out', !(await exists(path.join(gameRoot, 'overlord.pdb'))))

  const record = (await loadState()).installed['overlord-mw2cr']
  check('recorded the install', Boolean(record))
  // Not pinned to a literal tag: this asserted v0.3.0-beta and started failing
  // the moment upstream published v0.4.0-beta, which is upstream moving rather
  // than this code breaking.
  check('recorded the release tag', /^v?\d/.test(record?.version ?? ''), record?.version ?? 'none')

  await uninstallMod('overlord-mw2cr', ctx)
  check('removed overlord.exe', !(await exists(path.join(gameRoot, 'overlord.exe'))))
  check('removed the h2-mod tree', !(await exists(path.join(gameRoot, 'h2-mod'))))
  const leftovers = await fs.readdir(gameRoot)
  check('left the game folder as found', leftovers.length === 1, `saw: ${leftovers.join(', ')}`)

  await fs.rm(sandbox, { recursive: true, force: true })
}

/**
 * RDRVR is the first entry whose steps name a file inside a directory
 * (`payload/dinput8.dll`), which exercises the full-path branch of the step
 * matcher and the rule that a named file lands directly in `to` rather than
 * keeping its nesting. Worth its own case: getting that wrong would create a
 * `payload/` folder inside someone's game directory.
 */
async function nestedPayloadRoundTrip(): Promise<void> {
  console.log('')
  console.log('[5] install a mod whose payload is nested (RDRVR)')

  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'vrmm-rdr-'))
  const gameRoot = path.join(sandbox, 'Red Dead Redemption')
  await fs.mkdir(gameRoot, { recursive: true })
  await fs.writeFile(path.join(gameRoot, 'RDR.exe'), 'not a real executable')

  await saveState(
    setGame(await loadState(), {
      gameId: 'rdr1',
      root: gameRoot,
      store: 'steam',
      manual: true,
    }),
  )

  const ctx = { onProgress(_progress: Progress): void {} }
  try {
    await installMod({ modId: 'rdrvr', options: [] }, ctx)
  } catch (error) {
    check('installed RDRVR', false, error instanceof Error ? error.message : String(error))
    await fs.rm(sandbox, { recursive: true, force: true })
    return
  }

  check('wrote dinput8.dll to the game root', await exists(path.join(gameRoot, 'dinput8.dll')))
  check('wrote the gameplay plugin', await exists(path.join(gameRoot, 'RDRVR.Gameplay.red')))
  check('wrote the shipped ini', await exists(path.join(gameRoot, 'RDRVR.ini')))
  check('wrote the gun click sounds', await exists(path.join(gameRoot, 'RDRVR_click_rifle.wav')))
  check('did not recreate payload/ in the game folder', !(await exists(path.join(gameRoot, 'payload'))))
  check('left the installer scripts out', !(await exists(path.join(gameRoot, 'Install.cmd'))))
  check('left the docs out', !(await exists(path.join(gameRoot, 'README.txt'))))

  await uninstallMod('rdrvr', ctx)
  const leftovers = await fs.readdir(gameRoot)
  check('left the game folder as found', leftovers.length === 1, `saw: ${leftovers.join(', ')}`)

  await fs.rm(sandbox, { recursive: true, force: true })
}

/**
 * GRAND-MotherVR is the first `direct` source: no GitHub at all, just the
 * author's own "latest" link redirecting to a versioned file. Covers the
 * resolver reading the version out of that filename, and the plan leaving the
 * readme and the .reg file in the archive where they belong.
 */
async function directDownloadRoundTrip(): Promise<void> {
  console.log('')
  console.log('[6] install a mod from a direct download link (GRAND-MotherVR)')

  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'vrmm-grand-'))
  const gameRoot = path.join(sandbox, 'Alien Isolation')
  await fs.mkdir(gameRoot, { recursive: true })
  await fs.writeFile(path.join(gameRoot, 'AI.exe'), 'not a real executable')

  await saveState(
    setGame(await loadState(), {
      gameId: 'alien-isolation',
      root: gameRoot,
      store: 'steam',
      manual: true,
    }),
  )

  const ctx = { onProgress(_progress: Progress): void {} }
  try {
    await installMod({ modId: 'grand-mothervr', options: [] }, ctx)
  } catch (error) {
    check('installed GRAND-MotherVR', false, error instanceof Error ? error.message : String(error))
    await fs.rm(sandbox, { recursive: true, force: true })
    return
  }

  check('wrote XINPUT1_3.dll', await exists(path.join(gameRoot, 'XINPUT1_3.dll')))
  check('wrote grand.ini', await exists(path.join(gameRoot, 'grand.ini')))
  check('left the readme out', !(await exists(path.join(gameRoot, 'readme.txt'))))
  check('left the .reg file out', !(await exists(path.join(gameRoot, 'AIWin11Fix.reg'))))

  const record = (await loadState()).installed['grand-mothervr']
  check('recorded the version from the filename', /^v\d/.test(record?.version ?? ''), record?.version ?? 'none')

  await uninstallMod('grand-mothervr', ctx)
  const leftovers = await fs.readdir(gameRoot)
  check('left the game folder as found', leftovers.length === 1, `saw: ${leftovers.join(', ')}`)

  await fs.rm(sandbox, { recursive: true, force: true })
}

/**
 * FNVVR Reborn replaces d3d9.dll, the same file ENB and stock DXVK use, so
 * this proves an existing one comes back on uninstall. It also covers a
 * directory step (fnvvr/**) beside named files, and the settings file the game
 * writes into that directory surviving the uninstall.
 */
async function displacedProxyRoundTrip(): Promise<void> {
  console.log('')
  console.log('[7] install over an existing d3d9.dll (FNVVR Reborn)')

  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'vrmm-fnv-'))
  const gameRoot = path.join(sandbox, 'Fallout New Vegas')
  await fs.mkdir(path.join(gameRoot, 'Data'), { recursive: true })
  await fs.writeFile(path.join(gameRoot, 'FalloutNV.exe'), 'not a real executable')
  await fs.writeFile(path.join(gameRoot, 'Data', 'FalloutNV.esm'), 'not a real master file')
  const enb = path.join(gameRoot, 'd3d9.dll')
  await fs.writeFile(enb, 'ENB-D3D9')

  await saveState(
    setGame(await loadState(), {
      gameId: 'fallout-nv',
      root: gameRoot,
      store: 'steam',
      manual: true,
    }),
  )

  const ctx = { onProgress(_progress: Progress): void {} }
  try {
    await installMod({ modId: 'fnvvr-reborn', options: [] }, ctx)
  } catch (error) {
    check('installed FNVVR Reborn', false, error instanceof Error ? error.message : String(error))
    await fs.rm(sandbox, { recursive: true, force: true })
    return
  }

  check('replaced d3d9.dll', (await fs.readFile(enb, 'utf8')) !== 'ENB-D3D9')
  check('wrote openvr_api.dll', await exists(path.join(gameRoot, 'openvr_api.dll')))
  check('wrote dxvk.conf', await exists(path.join(gameRoot, 'dxvk.conf')))
  check('wrote the action manifest', await exists(path.join(gameRoot, 'fnvvr', 'actions.json')))
  check('left INSTALL.txt out', !(await exists(path.join(gameRoot, 'INSTALL.txt'))))
  check(
    'did not recreate the versioned wrapper folder',
    !(await fs.readdir(gameRoot)).some((entry) => entry.startsWith('FNVVR-Reborn')),
  )

  // What the game writes once Settings > VR has been touched.
  const options = path.join(gameRoot, 'fnvvr', 'vr_options.ini')
  await fs.writeFile(options, 'USER-SETTINGS')

  await uninstallMod('fnvvr-reborn', ctx)
  check('restored the original d3d9.dll', (await fs.readFile(enb, 'utf8')) === 'ENB-D3D9')
  check('removed openvr_api.dll', !(await exists(path.join(gameRoot, 'openvr_api.dll'))))
  check('removed the action manifest', !(await exists(path.join(gameRoot, 'fnvvr', 'actions.json'))))
  check('kept the user settings file', await exists(options))

  await fs.rm(sandbox, { recursive: true, force: true })
}

async function main(): Promise<void> {
  // Keep every side effect inside temp dirs.
  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'vrmm-e2e-'))
  app.setPath('userData', path.join(sandbox, 'userData'))
  await fs.mkdir(app.getPath('userData'), { recursive: true })

  const gameRoot = path.join(sandbox, 'Halo')
  await fs.mkdir(gameRoot, { recursive: true })
  // The real marker detect.ts looks for, so verifyGameRoot would accept it.
  await fs.writeFile(path.join(gameRoot, 'haloce.exe'), 'not a real executable')

  // A file the mod is expected to displace, so we can prove backup + restore.
  const collision = path.join(gameRoot, 'openvr_api.dll')
  await fs.writeFile(collision, 'ORIGINAL-GAME-FILE')

  await saveState(
    setGame(await loadState(), {
      gameId: 'halo-ce',
      root: gameRoot,
      store: 'retail',
      manual: true,
    }),
  )

  const phases: string[] = []
  const ctx = {
    onProgress(progress: Progress): void {
      if (!phases.includes(progress.phase)) phases.push(progress.phase)
    },
  }

  console.log(`\nsandbox: ${sandbox}`)
  console.log('\n[1] install HaloCEVR from GitHub')
  await installMod({ modId: 'halocevr', options: [] }, ctx)

  const afterInstall = await fs.readdir(gameRoot)
  check('wrote files into the game folder', afterInstall.length > 2, `saw ${afterInstall.length} entries`)
  check('reported download progress', phases.includes('downloading'), phases.join(' > '))
  check('reported extraction', phases.includes('extracting'))
  check('finished cleanly', phases.includes('done'))

  const state = await loadState()
  const record = state.installed['halocevr']
  check('recorded an install', Boolean(record))
  check('recorded a version', Boolean(record?.version), record?.version ?? 'none')
  check('tracked written files', (record?.files.length ?? 0) > 0, `${record?.files.length ?? 0} files`)

  const displaced = record?.files.find((file) => file.path.endsWith('openvr_api.dll'))
  if (displaced) {
    check('backed up the file it displaced', Boolean(displaced.backup))
    check(
      'backup holds the original bytes',
      displaced.backup
        ? (await fs.readFile(displaced.backup, 'utf8')) === 'ORIGINAL-GAME-FILE'
        : false,
    )
    check(
      'game folder now holds the mod version',
      (await fs.readFile(collision, 'utf8')) !== 'ORIGINAL-GAME-FILE',
    )
  } else {
    console.log('  SKIP  this release ships no openvr_api.dll; backup path not exercised')
  }

  console.log('\n[2] reinstall over the top (the update path)')
  await installMod({ modId: 'halocevr', options: [] }, ctx)
  const reinstalled = await loadState()
  check('still exactly one install record', Object.keys(reinstalled.installed).length === 1)
  check(
    'did not double-count files',
    reinstalled.installed['halocevr']?.files.length === record?.files.length,
  )

  console.log('\n[3] uninstall')
  await uninstallMod('halocevr', ctx)
  const afterUninstall = await loadState()
  check('dropped the install record', afterUninstall.installed['halocevr'] === undefined)

  for (const file of record?.files ?? []) {
    if (file.backup) continue
    const stillThere = await exists(path.join(gameRoot, file.path))
    if (stillThere) {
      check(`removed ${file.path}`, false)
      break
    }
  }
  check('removed the files it added', true)

  if (displaced) {
    check(
      'restored the original displaced file',
      (await fs.readFile(collision, 'utf8')) === 'ORIGINAL-GAME-FILE',
    )
  }

  const leftovers = await fs.readdir(gameRoot)
  check(
    'left the game folder as it found it',
    leftovers.length === 2,
    `saw: ${leftovers.join(', ')}`,
  )

  await fs.rm(sandbox, { recursive: true, force: true })

  await sevenZipRoundTrip()
  await nestedPayloadRoundTrip()
  await directDownloadRoundTrip()
  await displacedProxyRoundTrip()

  console.log(failures === 0 ? '\nALL PASS\n' : `\n${failures} FAILED\n`)
  app.exit(failures === 0 ? 0 : 1)
}

app.whenReady().then(() =>
  main().catch((error: unknown) => {
    console.error('\nE2E ERROR:', error instanceof Error ? error.stack : error)
    app.exit(1)
  }),
)
