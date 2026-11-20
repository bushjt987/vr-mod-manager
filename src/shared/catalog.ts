import type { GameDef, ModDef } from './types'

/**
 * The catalog is plain data on purpose: adding a mod should never require
 * touching installer code. Every field the installer needs lives here.
 */

export const GAMES: GameDef[] = [
  {
    id: 'halo-mcc',
    name: 'Halo: The Master Chief Collection',
    steamAppId: 976730,
    xboxFolderNames: ['Halo The Master Chief Collection'],
    verifyPaths: ['MCC', 'mcclauncher.exe'],
    stores: ['steam', 'xbox'],
  },
  {
    id: 'halo-ce',
    name: 'Halo: Combat Evolved (2003 PC / Custom Edition)',
    registryProbes: [
      { key: 'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Microsoft Games\\Halo', value: 'EXE Path' },
      { key: 'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Microsoft Games\\Halo CE', value: 'EXE Path' },
    ],
    verifyPaths: ['halo.exe', 'haloce.exe'],
    stores: ['retail'],
  },
  {
    id: 'alien-isolation',
    name: 'Alien: Isolation',
    steamAppId: 214490,
    verifyPaths: ['AI.exe', 'DATA'],
    stores: ['steam', 'gog', 'epic'],
  },
  {
    id: 'bioshock-remastered',
    name: 'BioShock Remastered',
    steamAppId: 409710,
    verifyPaths: ['Build/Final'],
    stores: ['steam', 'gog', 'epic'],
  },
  {
    id: 'bioshock2-remastered',
    name: 'BioShock 2 Remastered',
    steamAppId: 409720,
    verifyPaths: ['Build/Final'],
    stores: ['steam', 'gog', 'epic'],
  },
  {
    id: 'bioshock-infinite',
    name: 'BioShock Infinite',
    steamAppId: 8870,
    verifyPaths: ['Binaries/Win32'],
    stores: ['steam', 'gog', 'epic'],
  },
  {
    id: 'gta-sa-de',
    name: 'GTA: San Andreas - The Definitive Edition',
    steamAppId: 1547000,
    verifyPaths: ['Gameface/Binaries/Win64'],
    stores: ['steam'],
  },
  {
    id: 'gta-vc-de',
    name: 'GTA: Vice City - The Definitive Edition',
    steamAppId: 1546990,
    verifyPaths: ['Gameface/Binaries/Win64'],
    stores: ['steam', 'rockstar', 'epic'],
  },
  {
    id: 'gta-sa-classic',
    name: 'GTA: San Andreas (2004 classic)',
    steamAppId: 12120,
    verifyPaths: ['gta_sa.exe'],
    stores: ['steam', 'retail'],
  },
  {
    id: 'gta-vc-classic',
    name: 'GTA: Vice City (2002 classic)',
    steamAppId: 12110,
    verifyPaths: ['gta-vc.exe'],
    stores: ['steam', 'retail'],
  },
  {
    id: 'gta4-ce',
    name: 'Grand Theft Auto IV: The Complete Edition',
    steamAppId: 12210,
    // Steam's install folder holds the game one level down, in GTAIV/ (beside
    // the episodes' TLAD/ and TBoGT/ data); mods go in that folder.
    verifyPaths: ['GTAIV/GTAIV.exe'],
    stores: ['steam', 'rockstar'],
  },
  {
    id: 'gta5-legacy',
    name: 'Grand Theft Auto V Legacy',
    // The original PC release. GTA V Enhanced (2025) is a separate Steam app
    // (3240220) with a different engine build, so it is not detected as this.
    steamAppId: 271590,
    verifyPaths: ['GTA5.exe'],
    stores: ['steam', 'rockstar', 'epic'],
  },
  {
    id: 'rdr1',
    name: 'Red Dead Redemption (2024 PC port)',
    steamAppId: 2668510,
    // RDR.exe is what the mod's own installer checks for, and it is the same
    // across Steam, Epic and the Rockstar launcher. The port ships no stable
    // top-level asset folder worth preferring over it.
    verifyPaths: ['RDR.exe'],
    stores: ['steam', 'epic', 'rockstar'],
  },
  {
    id: 'doom3-bfg',
    name: 'DOOM 3: BFG Edition',
    steamAppId: 208200,
    verifyPaths: ['Doom3BFG.exe', 'base'],
    stores: ['steam', 'gog'],
  },
  // The modern DOOM mods all run from their own launcher, and every one of them
  // says to extract it to a folder of its own and NOT into the game folder. So
  // these are standalone: the user picks a folder for the mods, and each mod
  // takes a subfolder of it, which keeps the two Eternal mods apart. The appid
  // still supplies the artwork and the "Install on Steam" link.
  {
    id: 'doom-2016',
    name: 'DOOM (2016)',
    steamAppId: 379720,
    standalone: true,
    verifyPaths: [],
    stores: ['standalone'],
  },
  {
    id: 'doom-eternal',
    name: 'DOOM Eternal',
    steamAppId: 782330,
    standalone: true,
    verifyPaths: [],
    stores: ['standalone'],
  },
  {
    id: 'l4d2',
    name: 'Left 4 Dead 2',
    steamAppId: 550,
    // Files rather than the left4dead2 folder: Steam leaves left4dead2/ behind
    // on uninstall (cfg, addons, saves), so the folder alone accepts a husk.
    // Both of these only exist in a real install.
    verifyPaths: ['left4dead2.exe', 'left4dead2/pak01_dir.vpk'],
    stores: ['steam'],
  },
  {
    id: 'fear',
    name: 'F.E.A.R.',
    steamAppId: 21090,
    verifyPaths: ['FEAR.exe', 'Data'],
    stores: ['steam', 'gog', 'retail'],
  },
  {
    id: 'dishonored',
    name: 'Dishonored',
    steamAppId: 205100,
    // Unreal Engine 3: the exe sits in Binaries/Win32 (Steam's own launch
    // entry), and Binaries/Win32 alone is shared with BioShock Infinite, so the
    // game's own DishonoredGame content folder is the marker that identifies it.
    verifyPaths: ['DishonoredGame', 'Binaries/Win32/Dishonored.exe'],
    stores: ['steam', 'gog', 'epic'],
  },
  {
    id: 'crysis',
    // The 2007 original, not Remastered (a separate appid the mod does not support).
    name: 'Crysis',
    steamAppId: 17300,
    registryProbes: [
      // The GOG key the mod's own installer reads to find the game.
      { key: 'HKLM\\SOFTWARE\\WOW6432Node\\GOG.com\\Games\\1809223221', value: 'path' },
    ],
    // Bin32/Crysis.exe is in every edition; Bin64 only where 64-bit shipped.
    verifyPaths: ['Bin32/Crysis.exe', 'Bin64/Crysis.exe'],
    stores: ['steam', 'gog'],
  },
  {
    id: 'fallout-nv',
    name: 'Fallout: New Vegas',
    steamAppId: 22380,
    // Files rather than the Data folder, which mod managers and leftover saves
    // keep alive after the game itself is gone.
    verifyPaths: ['FalloutNV.exe', 'Data/FalloutNV.esm'],
    stores: ['steam', 'gog', 'epic'],
  },
  {
    id: 'dxhr-dc',
    // The Director's Cut; the 2011 original is a separate appid with a
    // different executable.
    name: "Deus Ex: Human Revolution - Director's Cut",
    steamAppId: 238010,
    verifyPaths: ['DXHRDC.exe'],
    stores: ['steam', 'gog'],
  },
  // RE Engine titles. `natives` is the asset root every one of them ships, and
  // is a steadier marker than the executable names, which vary by release.
  {
    id: 're2',
    name: 'Resident Evil 2 (2019 remake)',
    steamAppId: 883710,
    verifyPaths: ['re2.exe', 'natives'],
    stores: ['steam'],
  },
  {
    id: 're3',
    name: 'Resident Evil 3 (2020 remake)',
    steamAppId: 952060,
    verifyPaths: ['re3.exe', 'natives'],
    stores: ['steam'],
  },
  {
    id: 're4',
    name: 'Resident Evil 4 (2023 remake)',
    steamAppId: 2050650,
    verifyPaths: ['re4.exe', 'natives'],
    stores: ['steam'],
  },
  {
    id: 're7',
    name: 'Resident Evil 7: Biohazard',
    steamAppId: 418370,
    verifyPaths: ['re7.exe', 'natives'],
    stores: ['steam'],
  },
  {
    id: 're8',
    name: 'Resident Evil Village',
    steamAppId: 1196590,
    verifyPaths: ['re8.exe', 'natives'],
    stores: ['steam'],
  },
  {
    id: 're9',
    name: 'Resident Evil Requiem',
    steamAppId: 3764200,
    verifyPaths: ['natives'],
    stores: ['steam'],
  },
  {
    id: 'cyberpunk-2077',
    name: 'Cyberpunk 2077',
    steamAppId: 1091500,
    verifyPaths: ['bin/x64/Cyberpunk2077.exe', 'archive'],
    stores: ['steam', 'gog', 'epic'],
  },
  {
    id: 'outer-wilds',
    name: 'Outer Wilds',
    steamAppId: 753640,
    verifyPaths: ['OuterWilds.exe', 'OuterWilds_Data'],
    stores: ['steam', 'epic', 'xbox'],
  },
  {
    id: 'valheim',
    name: 'Valheim',
    steamAppId: 892970,
    verifyPaths: ['valheim_Data', 'valheim.exe'],
    stores: ['steam', 'xbox'],
  },
  {
    id: 'lethal-company',
    name: 'Lethal Company',
    steamAppId: 1966720,
    verifyPaths: ['Lethal Company_Data', 'Lethal Company.exe'],
    stores: ['steam'],
  },
  {
    id: 'mgs2-mc',
    name: 'Metal Gear Solid 2 (Master Collection)',
    steamAppId: 2131640,
    verifyPaths: ['METAL GEAR SOLID2.exe', 'exe'],
    stores: ['steam'],
  },
  {
    id: 'mgs-delta',
    name: 'Metal Gear Solid Δ: Snake Eater',
    steamAppId: 2417610,
    verifyPaths: ['MGSDelta', 'Engine'],
    stores: ['steam'],
  },
  {
    id: 'mgsv-tpp',
    name: 'Metal Gear Solid V: The Phantom Pain',
    steamAppId: 287700,
    verifyPaths: ['mgsvtpp.exe', 'master'],
    stores: ['steam'],
  },
  {
    id: 'max-payne-2',
    name: 'Max Payne 2: The Fall of Max Payne',
    steamAppId: 12150,
    verifyPaths: ['MaxPayne2.exe', 'data'],
    stores: ['steam', 'retail'],
  },
  {
    id: 'mw2-campaign-remastered',
    name: 'Call of Duty: Modern Warfare 2 Campaign Remastered',
    // Delisted from Steam, so there is no appid to resolve; this one is
    // path-picked.
    verifyPaths: ['h2_sp64_ship.exe', 'zone'],
    // Its Microsoft Store key art, since there is no Steam header to fall back on.
    artUrl:
      'https://store-images.s-microsoft.com/image/apps.28935.13958823218105189.5a0e6185-5389-4d7e-8836-9555f629f20e.ecd109d7-8f50-4e25-a7f8-1b863753f848?w=920',
    stores: ['steam', 'retail'],
  },
  {
    id: 'cod4',
    name: 'Call of Duty 4: Modern Warfare (2007)',
    steamAppId: 7940,
    verifyPaths: ['iw3sp.exe', 'main'],
    stores: ['steam', 'retail'],
  },
  {
    id: 'cod-waw',
    name: 'Call of Duty: World at War',
    steamAppId: 10090,
    verifyPaths: ['CoDWaW.exe', 'main'],
    stores: ['steam', 'retail'],
  },
  {
    id: 'bo3',
    name: 'Call of Duty: Black Ops III',
    steamAppId: 311210,
    verifyPaths: ['BlackOps3.exe', 'zone'],
    stores: ['steam'],
  },
  {
    id: 'titanfall-2',
    name: 'Titanfall 2',
    steamAppId: 1237970,
    // The key EA's installer writes for Steam and EA app copies alike; it is
    // what CircuitLord's installer and Northstar locate the game by.
    registryProbes: [
      { key: 'HKLM\\SOFTWARE\\Respawn\\Titanfall2', value: 'Install Dir' },
      { key: 'HKLM\\SOFTWARE\\WOW6432Node\\Respawn\\Titanfall2', value: 'Install Dir' },
    ],
    verifyPaths: ['Titanfall2.exe', 'r2'],
    // Also sold on the EA app (and through EA Play on Game Pass, which installs
    // via the EA app). StoreKind has no 'ea', so a registry-found copy shows as
    // retail.
    stores: ['steam', 'retail'],
  },
  {
    id: 'project-zomboid',
    name: 'Project Zomboid',
    steamAppId: 108600,
    verifyPaths: ['ProjectZomboid64.exe', 'media'],
    stores: ['steam', 'gog'],
  },
  {
    id: 'dead-space-2023',
    name: 'Dead Space (2023 remake)',
    steamAppId: 1693980,
    verifyPaths: ['Dead Space.exe'],
    // Also sold on the EA app; StoreKind has no 'ea', so that shows as retail.
    stores: ['steam', 'epic', 'retail'],
  },
  {
    id: 'uevr',
    name: 'UEVR (Unreal Engine VR injector)',
    standalone: true,
    verifyPaths: [],
    stores: ['standalone'],
  },
  {
    id: 'soh',
    name: 'The Legend Of Zelda: Ocarina Of Time (PC Port)',
    standalone: true,
    verifyPaths: [],
    stores: ['standalone'],
  },
  {
    id: 'perfect-dark',
    name: 'Perfect Dark (PC Port)',
    standalone: true,
    verifyPaths: [],
    stores: ['standalone'],
  },
]

/**
 * REFramework ships one archive per RE Engine game with identical contents, so
 * the five entries below differ only in which asset they pull and what the game
 * needs said about it.
 */
function reframework(config: {
  id: string
  gameId: string
  gameLabel: string
  asset: string
  notes?: string[]
}): ModDef {
  return {
    id: config.id,
    name: 'REFramework',
    gameId: config.gameId,
    author: 'praydog',
    homepage: 'https://github.com/praydog/REFramework',
    summary: `Native VR for ${config.gameLabel} through REFramework: stereo rendering, 6DOF head tracking and a full in-game mod framework.`,
    kind: 'vr-mod',
    maturity: 'stable',
    source: {
      kind: 'github',
      repo: 'praydog/REFramework',
      assetPattern: `^${config.asset}\\.zip$`,
    },
    install: {
      stripRootDir: true,
      steps: [
        { from: 'dinput8.dll', to: '.' },
        { from: 'openxr_loader.dll', to: '.' },
        { from: 'reframework_revision.txt', to: '.' },
        { from: 'reframework/**', to: 'reframework' },
        // The archive ships both runtimes and a marker file telling you to
        // delete this one for OpenXR, so the option mirrors that choice.
        { from: 'openvr_api.dll', to: '.', when: 'openvr', optional: true },
      ],
    },
    fingerprint: ['dinput8.dll', 'reframework_revision.txt'],
    // A bare commit SHA: precise about which build is installed, but it cannot
    // be lined up against a release tag, so it is shown and not compared.
    versionFrom: { path: 'reframework_revision.txt' },
    options: [
      {
        id: 'openvr',
        label: 'Use OpenVR (SteamVR)',
        description:
          'Upstream ships this by default and it is what gives you the in-game wrist menu. Turn it off to run through OpenXR instead, which has no wrist menu.',
        default: true,
      },
    ],
    requirements: [`${config.gameLabel} on Steam`, 'A SteamVR- or OpenXR-compatible headset'],
    notes: [
      'REFramework is also the base layer the community addon mods build on.',
      'Releases include TDB variants (RE2_TDB66, RE3_TDB67, RE7_TDB49) for downpatched game builds. This entry always tracks the current build.',
      ...(config.notes ?? []),
    ],
  }
}

export const MODS: ModDef[] = [
  /* ---------------- Halo ---------------- */
  {
    id: 'halo-mcc-vr-continuation',
    name: 'MCCVR Halo Build',
    gameId: 'halo-mcc',
    author: 'moistman42069',
    homepage: 'https://github.com/moistman42069/MCCVR-Halo-Build',
    summary:
      'The maintained continuation of MCCVR. All six MCC campaigns are playable: CE Anniversary, Halo 2 Anniversary, 3, ODST, Reach and 4.',
    kind: 'vr-mod',
    maturity: 'experimental',
    source: {
      kind: 'github',
      repo: 'moistman42069/MCCVR-Halo-Build',
      // This project renames its artifacts between releases -- it was
      // "...-Build.zip", it is now "Halo-MCC-VR.zip". Match either, and never
      // the -Source archive published beside them.
      assetPattern: '^Halo-MCC-VR\\.zip$|-Build\\.zip$',
    },
    install: { stripRootDir: true, steps: [{ from: '**', to: 'Halo_MCC_VR' }] },
    // Name the payload files, not just the folder: a directory cannot be
    // hashed, so a bare folder marker detects the mod but leaves its build
    // unidentifiable.
    fingerprint: ['Halo_MCC_VR/HaloMCCVR.dll', 'Halo_MCC_VR/HaloMCCVRLauncher.exe'],
    // Starting MCC any other way, even in anti-cheat-disabled mode, does not
    // inject the mod.
    launch: 'Halo_MCC_VR/HaloMCCVRLauncher.exe',
    // Its manifest records the source commit rather than a version number, so
    // like REFramework this identifies the build without naming a release.
    versionFrom: { path: 'Halo_MCC_VR/CANDIDATE-MANIFEST.json', field: 'source_commit' },
    requirements: ['A PCVR-capable headset with an OpenXR runtime'],
    notes: [
      'Launch only with anti-cheat disabled, and never use it in matchmaking.',
      'An independently maintained continuation of Halo-MCC-VR by pancreations, MIT licence preserved. The original repository now 404s.',
      'Still alpha: full campaign coverage does not mean every mission, transition, headset or runtime combination works.',
      'Switching between campaigns can crash MCC. Close it fully and relaunch through the mod launcher.',
      'Released every few days, so expect churn. Check the published SHA256 before installing.',
      'Windows Defender may flag injection-based VR mods.',
    ],
  },
  {
    id: 'halocevr',
    name: 'HaloCEVR',
    gameId: 'halo-ce',
    author: 'LivingFray',
    homepage: 'https://github.com/LivingFray/HaloCEVR',
    summary:
      'Full VR conversion of the original 2003 Halo: Combat Evolved PC release, with motion controls and 6DOF.',
    kind: 'vr-mod',
    maturity: 'stable',
    source: { kind: 'github', repo: 'LivingFray/HaloCEVR', assetPattern: '^HaloCEVR\\.zip$' },
    install: { stripRootDir: true, steps: [{ from: '**', to: '.' }] },
    // The vrmanifest is unique to this mod; d3d9.dll on its own would not be.
    fingerprint: ['VR/OpenVR/haloce.vrmanifest', 'd3d9.dll'],
    requirements: [
      'Halo PC or Halo Custom Edition (2003 retail release, not MCC)',
      'SteamVR-compatible headset',
    ],
    notes: ['This targets the 2003 PC release only. It is not compatible with MCC.'],
  },


  /* ---------------- Alien: Isolation ---------------- */
  {
    id: 'mothervr',
    name: 'MotherVR',
    gameId: 'alien-isolation',
    author: 'Nibre',
    homepage: 'https://github.com/Nibre/MotherVR',
    summary:
      'Brings full VR support to Alien: Isolation. Play with Touch/Vive controllers, or stay on mouse and keyboard / gamepad.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'github',
      repo: 'Nibre/MotherVR',
      assetPattern: '^MotherVR\\..*\\.zip$',
      // Every MotherVR build ships as a prerelease.
      allowPrerelease: true,
    },
    install: { stripRootDir: true, steps: [{ from: 'dxgi.dll', to: '.' }] },
    requirements: ['Alien: Isolation (Steam, GOG or Epic)', 'SteamVR or Oculus runtime'],
    notes: [
      'Enable VR in-game under Options -> MotherVR after launching.',
      'Nibre stopped developing MotherVR years ago. It is still the base layer every Alien: Isolation VR setup needs, but GRAND-MotherVR is where the active work happens - install this first, then GRAND on top.',
    ],
  },

  {
    id: 'grand-mothervr',
    requires: ['mothervr'],
    name: 'GRAND-MotherVR',
    gameId: 'alien-isolation',
    author: 'JayP',
    homepage: 'https://www.alienisolationvr.com/',
    summary:
      'The actively developed Alien: Isolation VR mod, layered on MotherVR: 6DoF motion controls, room-scale, physical throwing and a VR-optimised render pipeline.',
    kind: 'vr-mod',
    maturity: 'alpha',
    source: {
      kind: 'direct',
      // The site's download button. It redirects to the current build's
      // versioned file, e.g. downloads/files/GRAND-Releasev0.6.2.zip.
      url: 'https://alienisolationvr.com/downloads/click.php?id=GRAND-Release.zip',
      versionPattern: '^GRAND-Release(v\\d+(?:\\.\\d+)*)\\.zip$',
    },
    // The archive also carries readme.txt and AIWin11Fix.reg, neither of which
    // belongs in the game folder; the readme's install section names just these two.
    install: {
      stripRootDir: true,
      steps: [
        { from: 'XINPUT1_3.dll', to: '.' },
        { from: 'grand.ini', to: '.' },
      ],
    },
    requirements: [
      'A working MotherVR v0.8.1 install first - GRAND builds on top of it',
      'The Steam version of Alien: Isolation - Epic and GOG are not supported yet',
      'A SteamVR- or Meta/Oculus Link-compatible headset',
      'Windows 10 or 11',
    ],
    notes: [
      'Install MotherVR first. GRAND then adds XINPUT1_3.dll and grand.ini to the game folder; shader patching happens on the fly at load.',
      'These are test builds - upstream warns to expect immersion-breaking and possibly game-breaking bugs.',
      'Settings live in grand.ini. Updating replaces it with the new build\'s defaults, so note any changes you made first.',
      'If MotherVR crashes on startup under Windows 11, the download includes AIWin11Fix.reg for it. This manager does not apply registry changes; see the readme in the archive or the Flat2VR Discord.',
      'Dropping the MotherVR dependency and adding Epic support are both on the roadmap.',
    ],
  },

  /* ---------------- BioShock ---------------- */
  {
    id: 'bioshock-trilogy-vr-1',
    conflictsWith: ['biovrdev-bioshock-1'],
    name: 'bioshock-vr',
    gameId: 'bioshock-remastered',
    author: 'VR-Stereo-Hub',
    homepage: 'https://github.com/VR-Stereo-Hub/bioshock-trilogy-vr',
    summary:
      'Native VR for BioShock Remastered: stereo rendering, 6DOF and motion controllers over OpenXR.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'github',
      repo: 'VR-Stereo-Hub/bioshock-trilogy-vr',
      assetPattern: '^bioshock-vr-.*\\.zip$',
    },
    install: {
      stripRootDir: true,
      steps: [
        { from: 'xinput1_3.dll', to: 'Build/Final' },
        { from: 'bioshockvr.dll', to: 'Build/Final' },
        // Shipped unconditionally: the mod falls back to these automatically on
        // SteamVR, and they sit harmlessly unused on an OpenXR setup.
        { from: 'bvr_steamvr32.dll', to: 'Build/Final' },
        { from: 'openvr_api.dll', to: 'Build/Final' },
      ],
    },
    // Explicit, because deriving it from the steps would include the SteamVR
    // pair -- and those legitimately never land on an OpenXR-only setup. Only
    // the two files every install has should decide whether the mod is present.
    fingerprint: ['Build/Final/xinput1_3.dll', 'Build/Final/bioshockvr.dll'],
    requirements: ['A PCVR headset with a 32-bit OpenXR runtime', 'Launch through Steam'],
    notes: [
      'BioVRDev/Bioshock-Remastered-VR is a friendly parallel mod for this same game - try both and keep the one you prefer.',
      "Conflicts with itsloopyo's head-tracking mod: both inject through xinput1_3.dll and cannot coexist.",
    ],
  },
  {
    id: 'biovrdev-bioshock-1',
    conflictsWith: ['bioshock-trilogy-vr-1'],
    name: 'BioShock Remastered VR',
    gameId: 'bioshock-remastered',
    author: 'BioVRDev',
    homepage: 'https://github.com/BioVRDev/Bioshock-Remastered-VR',
    summary:
      'A separate native VR mod for BioShock Remastered, developed in parallel with the trilogy mod. Single-game focus.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'github',
      repo: 'BioVRDev/Bioshock-Remastered-VR',
      assetPattern: '^BioshockVR_.*\\.zip$',
    },
    install: { stripRootDir: true, steps: [{ from: '**', to: 'Build/Final' }] },
    // Its own DLL plus its ini. The trilogy mod ships neither, so the two
    // BioShock mods cannot be mistaken for one another.
    fingerprint: ['Build/Final/BioshockVR.dll', 'Build/Final/BioshockVR.ini'],
    requirements: ['A PCVR headset with a 32-bit OpenXR runtime', 'Launch through Steam'],
    notes: [
      'Alternative to the trilogy mod for BioShock 1 - install one or the other, not both.',
      'The two projects share techniques openly; neither is a fork of the other.',
    ],
  },
  {
    id: 'bioshock-trilogy-vr-2',
    name: 'bioshock-vr',
    gameId: 'bioshock2-remastered',
    author: 'VR-Stereo-Hub',
    homepage: 'https://github.com/VR-Stereo-Hub/bioshock-trilogy-vr',
    summary:
      'Native VR for BioShock 2 Remastered from the same trilogy mod, sharing the BioShock 1 renderer work.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'github',
      repo: 'VR-Stereo-Hub/bioshock-trilogy-vr',
      assetPattern: '^bioshock-vr-.*\\.zip$',
    },
    install: {
      stripRootDir: true,
      steps: [
        { from: 'xinput1_3.dll', to: 'Build/Final' },
        { from: 'bioshockvr.dll', to: 'Build/Final' },
        // Shipped unconditionally: the mod falls back to these automatically on
        // SteamVR, and they sit harmlessly unused on an OpenXR setup.
        { from: 'bvr_steamvr32.dll', to: 'Build/Final' },
        { from: 'openvr_api.dll', to: 'Build/Final' },
      ],
    },
    // Explicit, because deriving it from the steps would include the SteamVR
    // pair -- and those legitimately never land on an OpenXR-only setup. Only
    // the two files every install has should decide whether the mod is present.
    fingerprint: ['Build/Final/xinput1_3.dll', 'Build/Final/bioshockvr.dll'],
    requirements: ['A PCVR headset with a 32-bit OpenXR runtime', 'Launch through Steam'],
  },
  {
    id: 'bioshock-trilogy-vr-infinite',
    name: 'bioshock-vr',
    gameId: 'bioshock-infinite',
    author: 'VR-Stereo-Hub',
    homepage: 'https://github.com/VR-Stereo-Hub/bioshock-trilogy-vr',
    summary:
      'From-scratch VR implementation for Infinite, which runs a different engine from the remasters. Early access.',
    kind: 'vr-mod',
    maturity: 'alpha',
    source: {
      kind: 'github',
      repo: 'VR-Stereo-Hub/bioshock-trilogy-vr',
      assetPattern: '^bioshock-vr-.*\\.zip$',
    },
    install: {
      stripRootDir: true,
      steps: [
        { from: 'xinput1_3.dll', to: 'Binaries/Win32' },
        { from: 'bioshockvr.dll', to: 'Binaries/Win32' },
        // Shipped unconditionally: the mod falls back to these automatically on
        // SteamVR, and they sit harmlessly unused on an OpenXR setup.
        { from: 'bvr_steamvr32.dll', to: 'Binaries/Win32' },
        { from: 'openvr_api.dll', to: 'Binaries/Win32' },
      ],
    },
    // Explicit for the same reason as the remasters: the SteamVR pair is not
    // present on every install, so it must not gate detection.
    fingerprint: ['Binaries/Win32/xinput1_3.dll', 'Binaries/Win32/bioshockvr.dll'],
    requirements: ['A PCVR headset with a 32-bit OpenXR runtime', 'Launch through Steam'],
    notes: [
      'Playable through the early city. The Skyline sections and the DLCs have not had a VR pass yet.',
    ],
  },

  /* ---------------- GTA ---------------- */
  {
    id: 'gta-sa-de-uevr',
    requires: ['uevr'],
    name: 'GTA: San Andreas Definitive Edition - 6DoF UEVR Plugin',
    gameId: 'gta-sa-de',
    author: 'Holydh',
    homepage: 'https://www.nexusmods.com/grandtheftautothetrilogy/mods/922',
    summary:
      'A 6DoF UEVR profile/plugin for the Definitive Edition, built on an upgraded build of the UEVR injector by Praydog.',
    kind: 'vr-mod',
    maturity: 'beta',
    requiresStore: ['steam'],
    source: {
      kind: 'manual',
      url: 'https://www.nexusmods.com/grandtheftautothetrilogy/mods/922',
      instructions:
        'Download the plugin ZIP from Nexus (login required), then point this at the file. You also need UEVR itself from uevr.io.',
      filePattern: '\\.zip$',
    },
    install: { stripRootDir: true, steps: [{ from: '**', to: '.' }] },
    requirements: [
      'The Steam version of San Andreas DE - Epic and Rockstar Launcher builds are incompatible',
      'UEVR (Praydog) installed separately',
    ],
    notes: [
      'Only the Steam build works. Epic Games Store and Rockstar Launcher versions are not supported.',
    ],
  },
  {
    id: 'gta-vc-de-uevr',
    requires: ['uevr'],
    name: 'GTA VICE CITY VR',
    gameId: 'gta-vc-de',
    author: 'MaslowCorporation',
    homepage: 'https://github.com/MaslowCorporation/GTA-VICE-CITY-VR',
    summary:
      'A walkthrough for playing Vice City: Definitive Edition in VR through the UEVR injector by Praydog.',
    kind: 'vr-mod',
    maturity: 'experimental',
    source: {
      kind: 'manual',
      url: 'https://github.com/MaslowCorporation/GTA-VICE-CITY-VR',
      instructions:
        'This is a setup guide rather than a packaged mod. Open the page and follow it; there is no file to install here.',
    },
    install: { steps: [] },
    requirements: ['Vice City: Definitive Edition', 'UEVR (Praydog) installed separately'],
    notes: ['Guide only - nothing is copied into the game folder by this manager.'],
  },
  {
    id: 'vice-city-vr-revc',
    name: 'Vice City VR',
    gameId: 'gta-vc-classic',
    author: 'Vice City VR project',
    homepage: 'https://compoundvr.com/games/grand-theft-auto-vice-city/',
    summary:
      'A native VR rebuild of the 2003 PC release on the reVC reverse-engineered engine - stereoscopic 6DOF over OpenXR.',
    kind: 'vr-mod',
    maturity: 'alpha',
    source: {
      kind: 'manual',
      url: 'https://compoundvr.com/games/grand-theft-auto-vice-city/',
      instructions:
        'Download the current alpha build from the project page, then point this at the archive. It ships no game data, so you must own Vice City.',
      filePattern: '\\.(zip|7z)$',
    },
    install: { stripRootDir: true, steps: [{ from: '**', to: '.' }] },
    fingerprint: ['reVC.exe'],
    launch: 'reVC.exe',
    requirements: [
      'A legitimate copy of GTA: Vice City (2003 PC release) for the game data',
      'An OpenXR runtime',
    ],
    notes: [
      'Runs via reVC.exe rather than the original executable. Select your OpenXR runtime before launching.',
    ],
  },

  /* ---------------- GTA IV ---------------- */
  {
    id: 'gta4vr',
    name: 'GTA4VR',
    gameId: 'gta4-ce',
    author: 'bordplate',
    homepage: 'https://github.com/bordplate/GTA4VR',
    summary:
      'First-person stereo VR built into a FusionFix fork: tracked hands and arms on the character rig, physical guns with manual reloads, melee and throwing, a grabbable steering wheel, a wrist radar and a hand-held phone.',
    kind: 'vr-mod',
    maturity: 'experimental',
    source: {
      kind: 'github',
      repo: 'bordplate/GTA4VR',
      // The release also carries FusionFix web/offline installer .exes; the zip
      // is the one the README says to extract.
      assetPattern: '^GTA4VR\\.zip$',
    },
    // README: extract into the folder holding GTAIV.exe. The zip has no
    // wrapper directory. GTA4VR-notices/ (licences, readmes) stays out.
    install: {
      steps: [
        // The ASI loader, which loads plugins/GTAIV.EFLC.FusionFix.asi.
        { from: 'dinput8.dll', to: 'GTAIV' },
        // DXVK (the Vulkan path the mod is developed on) and its backend choice.
        { from: 'd3d9.dll', to: 'GTAIV' },
        { from: 'd3d9.cfg', to: 'GTAIV' },
        { from: 'vulkan.dll', to: 'GTAIV' },
        { from: 'plugins/**', to: 'GTAIV/plugins' },
        { from: 'update/**', to: 'GTAIV/update' },
      ],
    },
    // The FusionFix plugin plus the OpenXR loader only this fork ships beside
    // it. The INI is left out: the in-game VR menu writes to it.
    fingerprint: ['GTAIV/plugins/GTAIV.EFLC.FusionFix.asi', 'GTAIV/plugins/openxr_loader.dll'],
    // No versionFrom: nothing in the zip names the release, so builds are told
    // apart by checksum.
    requiresStore: ['steam'],
    requirements: [
      'GTA IV: The Complete Edition, patch 1.2.0.59 (the current Steam build)',
      'A PCVR headset with a 32-bit-capable OpenXR runtime; SteamVR is the tested one',
      'A GPU with Vulkan support, since the mod renders through DXVK',
    ],
    notes: [
      'Upstream has only tested a VIVE Pro with Vive Wands on SteamVR. Other SteamVR headsets and Touch/Index controllers have default bindings but are untested.',
      'Brings its own FusionFix: do not install FusionFix separately, and any existing FusionFix or ASI loader files are replaced and backed up.',
      'Minigames are not playable with VR controls, and a few missions need a workaround or flat-screen play: set [VR] DisableOpenXR=1 in plugins\\GTAIV.EFLC.FusionFix.ini for that, then back to 0.',
      'The Lost and Damned and The Ballad of Gay Tony are untested.',
      'Dense city scenes can drop below the headset refresh rate.',
      'VR only works on the Vulkan backend. If Vulkan ever fails to start (a too-high VR resolution did it here), FusionFix silently switches later launches to DirectX 9 and VR crashes from then on: set GraphicsAPI = 1 in plugins\\GTAIV.EFLC.FusionFix.cfg and lower EyeRenderScale.',
      'The author says the code was written almost entirely by AI and they have not reviewed most of it.',
      'VR settings live in plugins\\GTAIV.EFLC.FusionFix.ini and change from the in-game VR menu; an update replaces that file, so note any changes first.',
    ],
  },

  /* ---------------- GTA V ---------------- */
  {
    id: 'gtavxr',
    name: 'GTAVXR',
    gameId: 'gta5-legacy',
    author: 'LVL',
    homepage: 'https://github.com/LVL-VR/GTAVXR',
    summary:
      'Story Mode in stereo VR over OpenXR: head tracking, motion-controlled weapons with holsters and dual-wielding, a grabbable steering wheel, physical object pickup, and an in-headset VR menu and trainer.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'github',
      repo: 'LVL-VR/GTAVXR',
      // The Suite installer. GTAVXR-Trainer-Source.zip beside it is source only.
      assetPattern: '^GTAVXR\\.exe$',
    },
    // Not a copy: the Suite patches the user's own GTA5.exe into a separate VR
    // executable, then owns profiles, saves, updates and removal. Its launcher
    // lives outside the game folder, so Uninstall downloads the newest release
    // and opens that.
    install: {
      steps: [],
      installer: {
        instructions:
          'Choose the folder holding GTA5.exe, then click Install GTAVXR. If it says Access is denied, close it, restart this manager as administrator and install again. Before closing, use Settings > This app to install the Suite for its Start menu shortcut - that is where you play from.',
      },
    },
    // The patched VR executable the Suite builds and keeps in the game folder.
    // No versionFrom: the Suite records its version in its own data folder, so
    // builds are told apart by checksum.
    fingerprint: ['GTAVXR_SourceBaseline.exe'],
    // No launch: a VR session has to start from the Suite, which stages the
    // profile's saves and mods and picks the OpenXR runtime. Starting
    // GTAVXR_SourceBaseline.exe directly would skip all of that.
    requirements: [
      'GTA V Legacy 1.0.3889.0 (Steam, Rockstar or Epic) - not GTA V Enhanced, and not any other build',
      'A PCVR headset with an OpenXR runtime; VDXR (Virtual Desktop) is the recommended one, SteamVR works at a frame-rate cost',
      '64-bit Windows and administrator rights for the install',
    ],
    notes: [
      'Play VR from the GTAVXR Suite, not the Play button here - that starts the normal flat game.',
      'A game update from Steam or Rockstar breaks it until GTAVXR releases a matching build; the Suite refuses to install on any other game version.',
      'For a first session, load a save from after the North Yankton prologue. F10 switches between VR and flat-screen to get past a step motion controls cannot do.',
      'Use VR Menu > Recenter whenever the camera ends up out of place, which cutscenes and mission transitions can cause.',
      'Quitting from the pause menu can leave GTA running: save, then use Force GTA to close in the Suite.',
      'ASI plugins and ScriptHookV in the game folder are set aside during VR sessions. Script mods go through the Suite’s own Mods screen instead.',
      'Some antivirus tools have flagged GTAVXR.exe; the release notes list its SHA-256 for checking.',
    ],
  },

  /* ---------------- Red Dead Redemption ---------------- */
  {
    id: 'rdrvr',
    name: 'RDRVR',
    gameId: 'rdr1',
    author: 'Disonomouss',
    homepage: 'https://github.com/Disonomouss/RDRVR',
    summary:
      'Native stereo VR for the 2024 PC port: per-eye rendering, head tracking, and 6DOF motion controls for holding, aiming, holstering and reloading.',
    kind: 'vr-mod',
    maturity: 'alpha',
    source: {
      kind: 'github',
      repo: 'Disonomouss/RDRVR',
      assetPattern: '^RDRVR-.*\\.zip$',
    },
    // The release ships its payload under payload/ alongside its own
    // PowerShell installer. These are exactly the six files that installer
    // copies, per the RDRVR_files.txt manifest inside the archive -- the
    // installer itself is not run, so the docs, the uninstaller scripts and
    // the mod's own install manifest are all left out.
    install: {
      steps: [
        { from: 'payload/dinput8.dll', to: '.' },
        { from: 'payload/RDRVR.Gameplay.red', to: '.' },
        { from: 'payload/RDRVR.ini', to: '.' },
        { from: 'payload/RDRVR_click_revolver.wav', to: '.' },
        { from: 'payload/RDRVR_click_rifle.wav', to: '.' },
        { from: 'payload/RDRVR_click_shotgun.wav', to: '.' },
      ],
    },
    // Two files nothing else ships and nobody hand-edits: settings changed in
    // the headset are written to %LOCALAPPDATA%\RDRVR instead, so RDRVR.ini is
    // left out to keep checksum identification from breaking on an edit.
    fingerprint: ['dinput8.dll', 'RDRVR.Gameplay.red'],
    // Written by the mod's own installer, so this names the build for anyone
    // who installed it the normal way. The value is bare ("0.6.0") against a
    // "v0.6.0" tag, which the version comparison already normalises.
    versionFrom: { path: 'RDRVR_install.json', field: 'version', matchesReleaseTag: true },
    requirements: [
      'Red Dead Redemption (2024 PC port) - Steam, Epic or the Rockstar launcher',
      'RedHook v0.8 by K3rhos, installed in the game folder: https://www.nexusmods.com/reddeadredemption/mods/192',
      'RedHook.ini edited to set [DirectXHook] Disabled=true',
      'A PCVR headset with its OpenXR runtime active (SteamVR, Quest Link, Virtual Desktop, WMR)',
      'Windows 10 or 11 and a DirectX 12 GPU',
    ],
    notes: [
      'RedHook has to be installed first and is not managed here - it is behind a Nexus login, and RDRVR runs as a plugin inside it.',
      'RDRVR draws the frame itself, so RedHook’s own DirectX hook has to be turned off: set [DirectXHook] Disabled=true in RedHook.ini.',
      'Built against one build of RDR.exe. On a different build it verifies its hook points by their bytes and stands down rather than running.',
      'The game sends crash reports to Rockstar, and a crash with the mod installed is reported too.',
    ],
  },

  /* ---------------- DOOM 3 ---------------- */
  {
    id: 'doom3-bfg-vr',
    name: 'DOOM 3 BFG VR: Fully Possessed',
    gameId: 'doom3-bfg',
    author: 'KozGit, forked by NPi2Loup',
    homepage: 'https://github.com/NPi2Loup/DOOM-3-BFG-VR',
    summary:
      'Native Oculus Touch / OpenVR support for DOOM 3 BFG, with comfort locomotion options, customisable controller layouts and voice commands.',
    kind: 'vr-mod',
    maturity: 'alpha',
    source: {
      kind: 'github',
      // KozGit's repository 404s as of September 2026. This fork carries the
      // project on, and is a build ahead of the original (021j vs 021).
      repo: 'NPi2Loup/DOOM-3-BFG-VR',
      // \w rather than \d: builds now carry a letter suffix. The other asset on
      // the release is a ~4 MB patch; this pattern takes the full ~330 MB build.
      assetPattern: '^Doom3BFGVR_Fully_Possessed_Alpha\\w+\\.zip$',
    },
    // The archive carries its own "Fully Possessed" mod folder, so it unpacks
    // at the BFG root rather than over the base game's files.
    install: { stripRootDir: true, steps: [{ from: '**', to: '.' }] },
    // Inferred from the project README rather than a downloaded archive: the
    // release zip is ~330 MB and was not opened to confirm this.
    fingerprint: ['Fully Possessed'],
    requirements: [
      'DOOM 3: BFG Edition, patched to the latest version - the mod ships no game data',
      'Visual C++ 2013 redistributable',
      'Oculus runtime or SteamVR',
    ],
    notes: [
      'This is a ~330 MB download, much larger than the other mods here.',
      'Its fs_game mod directory is used exclusively by Fully Possessed - back up your BFG folder if you run other DOOM 3 mods.',
      "KozGit's original repository was taken down in September 2026; this fork is where the project now lives.",
    ],
  },

  /* ---------------- DOOM (2016) / Eternal ---------------- */
  {
    id: 'kharvox',
    name: 'KHARVOX',
    gameId: 'doom-2016',
    author: 'CactusVRStudios',
    homepage: 'https://github.com/CactusVRStudios/KHARVOX',
    summary:
      'A total VR conversion for DOOM (2016): room-scale 6DoF, tracked motion controls, physical Glory Kills and stereo rendering for the campaign.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'github',
      repo: 'CactusVRStudios/KHARVOX',
      // Asset names do not follow the tag: v1.1.1 ships KHARVOX-v1.11.zip.
      assetPattern: '^KHARVOX-v.*\\.zip$',
    },
    // The archive has no wrapper directory, so the subfolder is ours.
    install: { stripRootDir: true, steps: [{ from: '**', to: 'KHARVOX' }] },
    fingerprint: ['KHARVOX/KharvoxLauncher.exe', 'KHARVOX/KharvoxLayer.json'],
    launch: 'KHARVOX/KharvoxLauncher.exe',
    // First line is the build name, KHARVOX-v1.11 for tag v1.1.1, so it is
    // shown but cannot be compared against the release.
    versionFrom: { path: 'KHARVOX/BUILD.txt', pattern: '^(KHARVOX-\\S+)' },
    requirements: [
      'DOOM (2016) on Steam - the only release it has been tested with',
      'A PCVR headset with an OpenXR runtime: Virtual Desktop (VDXR) for Quest and Pico, SteamVR for Index and PSVR2',
    ],
    notes: [
      'Windows Defender may flag KharvoxLauncher.exe or KharvoxIntro.exe with a machine-learning detection (Bearfoos / Wacatac). Upstream documents this; it is a heuristic, not a named threat.',
      'Start DOOM through KharvoxLauncher.exe whenever you want VR. Use the SFS renderer, with AER as the fallback.',
      'Change graphics quality from the main menu only - changing it mid-level can freeze or crash the game.',
      'bHaptics and PSVR2 adaptive triggers are optional; PSVR2 Toolkit is installed separately.',
    ],
  },
  {
    id: 'kharvox-argent',
    name: 'KHARVOX: ARGENT',
    gameId: 'doom-eternal',
    author: 'CactusVRStudios',
    homepage: 'https://github.com/CactusVRStudios/KHARVOX-ARGENT',
    summary:
      'A VR conversion for DOOM Eternal from the KHARVOX author: stereo rendering, motion controls, Virtual Gunstock and physical melee.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'github',
      repo: 'CactusVRStudios/KHARVOX-ARGENT',
      assetPattern: '^ARGENT-.*\\.zip$',
    },
    install: { stripRootDir: true, steps: [{ from: '**', to: 'KHARVOX-ARGENT' }] },
    fingerprint: ['KHARVOX-ARGENT/ArgentLauncher.exe', 'KHARVOX-ARGENT/ArgentLayer.json'],
    launch: 'KHARVOX-ARGENT/ArgentLauncher.exe',
    // Records ARGENT-1.01a for tag v1.01a, so shown rather than compared.
    versionFrom: { path: 'KHARVOX-ARGENT/build-info.json', field: 'release' },
    requirements: [
      'DOOM Eternal on Steam or the Microsoft Store',
      'A PCVR headset with VDXR, Meta OpenXR or SteamVR OpenXR - other runtimes are unsupported',
    ],
    notes: [
      'In the launcher, select DOOMEternalx64vk.exe, set your VR options and press PLAY.',
      'Do not use SteamVR with Meta headsets; upstream says it causes issues. Use VDXR or Meta XR instead.',
      'AMD graphics cards have known rendering issues, and water can show artifacts in VR.',
      'Use either FSR or DLSS, not both. Stereo DLSS is experimental.',
      'Can sit beside EternalVR, since neither touches the game folder - start the game through one launcher at a time.',
    ],
  },
  {
    id: 'eternalvr',
    name: 'EternalVR',
    gameId: 'doom-eternal',
    author: 'ArcadaLabs-Jason',
    homepage: 'https://github.com/ArcadaLabs-Jason/EternalVR',
    summary:
      'A free OpenXR VR mod for DOOM Eternal: stereo 6DoF, hand aiming, real punches for melee, room-scale, and the full campaign with both DLC.',
    kind: 'vr-mod',
    maturity: 'alpha',
    source: {
      kind: 'github',
      repo: 'ArcadaLabs-Jason/EternalVR',
      // Each release also attaches <zip>.sha256; the anchor keeps it out.
      assetPattern: '^EternalVR-alpha-.*\\.zip$',
      allowPrerelease: true,
    },
    install: { stripRootDir: true, steps: [{ from: '**', to: 'EternalVR' }] },
    fingerprint: ['EternalVR/EternalVR.Launcher.exe', 'EternalVR/layer/VK_LAYER_ETERNALVR.json'],
    launch: 'EternalVR/EternalVR.Launcher.exe',
    // "EternalVR alpha 0.1.35" for tag v0.1.35.
    versionFrom: {
      path: 'EternalVR/BUILD-INFO.txt',
      pattern: '^EternalVR alpha (\\S+)',
      matchesReleaseTag: true,
    },
    requirements: [
      'DOOM Eternal on Steam (build 25216728), or Game Pass / Microsoft Store 1.0.56.0 - the launcher checks which you have',
      'Windows 10 or 11',
      'A PCVR headset with an OpenXR runtime',
    ],
    notes: [
      'Alpha, and updated several times a day. Single-player only.',
      'Its launcher can update itself in place from GitHub. If you let it, this app still shows the version it installed until you reinstall from here; the check can be turned off on the launcher\'s Checks and log tab.',
      'Steam must be running and signed in for the Steam copy. Load Campaign, Continue or a save - starting a new campaign has a known problem.',
      'Under SteamVR the left Menu button opens the SteamVR dashboard, so hold Y to pause.',
      'On AMD Radeon RX 5000 and 6000 cards each eye can render soft; the bundled TROUBLESHOOTING guide has a workaround.',
      'Can sit beside KHARVOX: ARGENT, since neither touches the game folder - start the game through one launcher at a time.',
      'Verify the download against the .sha256 file attached to the release.',
    ],
  },

  /* ---------------- Left 4 Dead 2 ---------------- */
  {
    id: 'l4d2vr',
    name: 'L4D2VR',
    gameId: 'l4d2',
    author: 'sd805, continued by keyou91',
    homepage: 'https://github.com/keyou91/l4d2vr',
    summary:
      '6DoF VR for Left 4 Dead 2 with two-handed motion controls, manual reloading and throwing, a desktop mirror, and VR co-op on any server.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'github',
      // sd805/l4d2vr is the original and has not released since 0.6.2 (July
      // 2025). keyou91's fork is where it is developed now.
      repo: 'keyou91/l4d2vr',
      // Upstream shipped L4D2VR.zip and the fork ships l4d2vr.zip, so either
      // case is accepted. The anchor keeps l4d2vr.dedicated.server.zip out.
      assetPattern: '^[Ll]4[Dd]2[Vv][Rr]\\.zip$',
    },
    // Everything the README says to extract into the game root, minus the
    // root manifest.json and updatelog.txt, which are release notes for the
    // mod's Workshop updater and nothing reads them from the game folder.
    install: {
      steps: [
        { from: 'd3d9.dll', to: '.' },
        { from: 'openvr_api.dll', to: '.' },
        { from: 'left4dead2/**', to: 'left4dead2' },
        { from: 'vr/**', to: 'vr' },
      ],
    },
    // d3d9.dll and openvr_api.dll are names other DXVK and VR mods use too, so
    // the SteamVR action manifest pins it to this mod.
    fingerprint: ['d3d9.dll', 'vr/SteamVRActionManifest/action_manifest.json'],
    // The mod's own build number, 1.1.7 for release V.0.8.2, so it is shown
    // but cannot be compared against the release tag.
    versionFrom: { path: 'vr/version.txt' },
    requirements: [
      'Left 4 Dead 2 on Steam',
      'SteamVR, started before the game',
      'A GPU and current driver with Vulkan 1.3 support - the bundled d3d9.dll is built on DXVK 2.x',
    ],
    notes: [
      'The author warns you use it at your own risk of a VAC ban, and recommends the -insecure launch option to protect yourself. With -insecure you cannot join VAC-secured servers.',
      'Set these Steam launch options yourself (this app cannot): -heapsize 524288 -processheap -high -novid -windowed. Add -bigfonts if your desktop is 2K or higher, or the HUD text is tiny.',
      'Do not use the Steam "Vulkan" launch option or -vulkan, and leave out -w, -h and -fullscreen - the mod manages the window resolution itself.',
      'Turn off "Present non-VR applications on theater screen" in SteamVR, or the game may not show in the headset.',
      'Replaces DirectX 9 with its own DXVK-based d3d9.dll in the game folder. Add -nohmd to play flat without uninstalling; type crosshair 1 in the console to get the crosshair back.',
      'The release zip has everything; no Workshop or VPK content is needed. The README points to a Workshop item for updates, but it has been removed. If you subscribe to a Workshop copy, the mod updates itself from it at launch and this app keeps showing the version it installed.',
      'On first launch the mod writes vr/config.txt, and with -bigfonts it also copies a UI font fix into left4dead2/addons and edits addonlist.txt and autoexec.cfg. Uninstalling here does not remove those.',
      'Contains lots of flashing lights.',
      'The separate dedicated-server package, for hosting VR multiplayer servers, is not installed here.',
    ],
  },

  /* ---------------- F.E.A.R. ---------------- */
  {
    id: 'fear-vr-dr89',
    conflictsWith: ['fear-vr-freemike'],
    name: 'F.E.A.R. VR',
    gameId: 'fear',
    author: 'DR-89',
    homepage: 'https://github.com/DR-89/fear-vr',
    summary:
      'Open-source OpenXR mod for F.E.A.R. 1.08: native stereo world rendering, head tracking and motion controls.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'github',
      repo: 'DR-89/fear-vr',
      // The overlay zip is the drag-and-drop package; the other asset is an
      // installer exe this manager has no way to reverse.
      assetPattern: '-overlay\\.zip$',
      allowPrerelease: true,
    },
    install: { stripRootDir: true, steps: [{ from: '**', to: '.' }] },
    fingerprint: ['FEARVR/release-manifest.json', 'dinput8.dll'],
    launch: 'Start F.E.A.R. VR.cmd',
    versionFrom: {
      path: 'FEARVR/release-manifest.json',
      field: 'version',
      matchesReleaseTag: true,
    },
    requirements: [
      'F.E.A.R. version 1.08 - Steam Ultimate Shooter Edition is confirmed working',
      'Official Public Tools 1.08 (in the Steam edition’s extras folder, or from AusGamers)',
      'SteamVR or Virtual Desktop (VDXR) as the active OpenXR runtime',
      'Windows 10/11 64-bit',
    ],
    notes: [
      'Nothing is replaced: the mod drops dinput8.dll, d3d9.dll, a FEARVR folder and two launch scripts alongside the game.',
      'Launch through the "Start F.E.A.R. VR" script rather than FEAR.exe.',
      'F.E.A.R. HD Textures v2.0.2 from ModDB is recommended alongside it.',
    ],
  },
  {
    id: 'fear-vr-freemike',
    conflictsWith: ['fear-vr-dr89'],
    name: 'F.E.A.R. VR',
    gameId: 'fear',
    author: 'TheFreeMike',
    homepage: 'https://github.com/thefreemike31/fear-vr/releases',
    summary:
      'A separate closed-source F.E.A.R. VR mod, built around physical holster draws and manual reloading.',
    kind: 'vr-mod',
    maturity: 'beta',
    // Its setup verifies the exact executable and rejects other editions.
    requiresStore: ['gog'],
    source: {
      kind: 'manual',
      url: 'https://github.com/thefreemike31/fear-vr/releases',
      instructions:
        'Ships only F.E.A.R. VR Setup.exe, an installer this manager cannot run or reverse. Open the releases page and run it yourself.',
    },
    // Guide-only: an installer exe is not a reversible copy step.
    install: { steps: [] },
    requirements: [
      'The GOG F.E.A.R. Platinum Collection - Steam and retail are outside its supported scope',
      'Windows 10/11, and a Quest 3 with Touch controllers (other hardware is experimental)',
      'Virtual Desktop + VDXR, or Steam Link + SteamVR - no Meta Link or Air Link',
    ],
    notes: [
      'Holsters, physical body draws and manual reloading are its headline features - the open-source F.E.A.R. VR does not have them yet.',
      'In exchange it documents no melee, roomscale or HUD work, all of which the open-source mod has.',
      'Currently v0.1.2, its first public release after a private beta.',
      'Verify the download against the .sha256 published beside it.',
    ],
  },

  /* ---------------- Dishonored ---------------- */
  {
    id: 'dishonored-vr',
    name: 'Dishonored VR',
    gameId: 'dishonored',
    author: 'Pizza Parker and VOID (VR-Stereo-Hub), continuing GingasVR',
    homepage: 'https://github.com/VR-Stereo-Hub/Dishonored-VR',
    summary:
      'Native stereo VR for Dishonored (2012) as a d3d9.dll proxy: 6DoF head tracking, full-arm IK, a motion sword, hand-aimed Blink and powers, hand grabbing and a wrist HUD.',
    kind: 'vr-mod',
    maturity: 'beta',
    requiresStore: ['steam'],
    source: {
      kind: 'github',
      repo: 'VR-Stereo-Hub/Dishonored-VR',
      // The manual-install zip. The release also carries the ~185 MB launcher
      // exe (an installer this manager cannot reverse), SHA256SUMS.txt and a
      // ReShade licence; the anchors keep all three out.
      assetPattern: '^dishonored-vr-v.*\\.zip$',
    },
    // The README's "By hand, from the zip" route: everything goes beside
    // Dishonored.exe in Binaries/Win32. The archive has no wrapper directory,
    // and its scripts and docs stay out, as they do with upstream's launcher.
    install: {
      steps: [
        { from: 'd3d9.dll', to: 'Binaries/Win32' },
        // Shipped unconditionally, as upstream's launcher does: the SteamVR
        // bridge and Valve's loader sit unused on a VDXR setup.
        { from: 'dvr_steamvr32.dll', to: 'Binaries/Win32' },
        { from: 'openvr_api.dll', to: 'Binaries/Win32' },
        { from: 'dishonored_vr.ini', to: 'Binaries/Win32' },
        // Also installed by upstream's launcher (tools/install.ps1 is the
        // reference): the 64-bit DLSS/FSR helper with NVIDIA's and AMD's
        // runtimes, which only runs once an upscaler is switched on, and the
        // ReShade bridge, inert without ReShade. Neither is in the README's
        // by-hand list, and the 1.0.0 and 1.0.1 zips had neither, hence
        // optional.
        { from: 'dvr_dlss/**', to: 'Binaries/Win32/dvr_dlss', optional: true },
        { from: 'DishonoredVR_ReShade.addon32', to: 'Binaries/Win32', optional: true },
      ],
    },
    // The proxy and the bridge that only this mod ships. dishonored_vr.ini is
    // left out because F10 saves into it, so every tuned install would stop
    // matching a known build.
    fingerprint: ['Binaries/Win32/d3d9.dll', 'Binaries/Win32/dvr_steamvr32.dll'],
    // No versionFrom: nothing in the zip names the release (its README and
    // HOW-TO-USE still say 1.0.1 inside the 1.0.4 zip), d3d9.dll has no
    // version resource, and dishonored_vr_install.json is written only by
    // upstream's launcher, so it would go stale after an update from here.
    // Builds are told apart by checksum instead.
    requirements: [
      'Dishonored on Steam (app 205100) - upstream says the GOG and Epic versions use a different exe and are not supported',
      'A headset with a 32-bit OpenXR runtime: Quest 2, 3 or Pro through Virtual Desktop (VDXR, the most tested), or a SteamVR headset through the bundled bridge',
      'A 64-bit Windows PC; a GPU with 8 GB of video memory is the suggested starting point',
      'The DirectX shader compiler (d3dcompiler_47.dll), which Windows Update installs on almost every PC',
    ],
    notes: [
      'The maintained continuation of GingasVR’s Dishonored VR, by Pizza Parker and VOID with her permission. Upstream recommends its DishonoredVR-Launcher exe; this installs the by-hand zip route instead, so the setup the launcher would do for you is listed below.',
      'Open Binaries\\Win32\\dishonored_vr.ini and clear [Paths] DataDir (leave it as DataDir=). The zip ships the developer’s D:\\dvr-data there, and the mod writes its SteamVR bridge manifest and its arm-IK data to that folder; empty means %LOCALAPPDATA%\\DishonoredVR. Upstream’s launcher clears it, but the zip route does not.',
      'Run the game once, then turn off four game settings the mod depends on: in Documents\\My Games\\Dishonored\\DishonoredGame\\Config, DishonoredEngine.ini bSmoothFrameRate=FALSE ([Engine.Engine]) and DepthOfField=False and UseVsync=False ([SystemSettings]), and DishonoredInput.ini bEnableMouseSmoothing=FALSE. setup-game-ini.ps1 -VRBaseline in the release zip does this for you. The game resets them when you use its video options, so redo them afterwards.',
      'Always launch through Steam. Starting Dishonored.exe directly can crash at the main menu.',
      'Quest: stream with Virtual Desktop and choose VDXR as its OpenXR runtime. SteamVR headsets: start SteamVR first, and set [VR] Runtime=steamvr in dishonored_vr.ini if SteamVR is your OpenXR runtime - its own 32-bit OpenXR shows the image upside down, the bundled bridge does not.',
      'Settings, including everything changed in F10, live in dishonored_vr.ini. Updating replaces it with the new build’s defaults, so note any changes you made first.',
      'Coming from GingasVR’s alpha: delete its dxvk_d3d9.dll, and put a normal resolution back, since it set ResX=4032 ResY=2268 in DishonoredEngine.ini.',
      'Released every few days. Verify the download against the SHA256SUMS.txt attached to the release.',
    ],
  },

  /* ---------------- Crysis ---------------- */
  {
    id: 'crysis-vr',
    name: 'Crysis VR',
    gameId: 'crysis',
    author: 'fholger',
    homepage: 'https://github.com/fholger/crysis_vrmod',
    summary:
      'Full 6DOF VR for the original Crysis over OpenXR: motion controls, two-handed weapon grips, body holsters, a hand-driven nanosuit menu and a VR settings page and manual in the main menu.',
    kind: 'vr-mod',
    maturity: 'stable',
    source: {
      kind: 'github',
      repo: 'fholger/crysis_vrmod',
      // The NSIS installer; the .7z beside it is debug symbols. Stable tags only,
      // which skips the rolling "latest" development build.
      assetPattern: '^crysis-vrmod-.*\\.exe$',
    },
    // A bare NSIS Setup .exe, run as downloaded. It writes Mods/VRMod and a
    // CrysisVR.exe into Bin32 and Bin64, plus an uninstaller in the game root,
    // which is what Uninstall reopens.
    install: {
      steps: [],
      installer: {
        uninstall: 'Uninstall_CrysisVR.exe',
        instructions:
          'Windows warns that the installer is unsigned - choose More info, then Run anyway. Check that the folder it shows is your Crysis folder, then click Install.',
      },
    },
    // Both are named in the uninstaller's delete list, and neither is a stock
    // file. No versionFrom: the mod's info.xml still says 1.0 on every release,
    // so builds are told apart by checksum.
    fingerprint: ['Bin64/CrysisVR.exe', 'Bin32/CrysisVR.exe'],
    // The 64-bit build, the only one that works with SteamVR.
    launch: 'Bin64/CrysisVR.exe',
    requirements: [
      'The original Crysis (2007) on Steam or GOG - not Crysis Remastered',
      'An OpenXR runtime and a PC VR headset with motion controllers; tested with SteamVR and Oculus',
      'A strong CPU: upstream recommends a Ryzen 7000, 5800X3D or Intel 12th gen and up',
    ],
    notes: [
      'The game does not have to run flat-screen first, and may not run flat at all on a modern PC; the mod still works.',
      'Play starts the 64-bit build. Bin32\\CrysisVR.exe is said to be more stable, but only works with Virtual Desktop or Quest Link, since SteamVR has no 32-bit OpenXR runtime.',
      'Do not enable anti-aliasing - it causes visual problems and crashes.',
      'Saves live in Documents\\My Games\\Crysis VR, apart from the flat game’s saves.',
      'Smooth locomotion and vehicle sections; vehicles and mounted guns are aimed with the right stick.',
      'Troubleshooting help is on crysis.vrmods.eu.',
    ],
  },

  /* ---------------- Fallout: New Vegas ---------------- */
  {
    id: 'fnvvr-reborn',
    conflictsWith: ['tale-of-two-realities'],
    name: 'FNVVR Reborn',
    gameId: 'fallout-nv',
    author: 'df4l',
    homepage: 'https://github.com/df4l/FNVVR',
    summary:
      'Stereo VR for Fallout: New Vegas built into a DXVK fork (a 32-bit d3d9.dll): motion controls, a hand-held weapon, manual reloads, holsters, a wrist HUD and the Pip-Boy on panels in front of you.',
    kind: 'vr-mod',
    maturity: 'experimental',
    source: {
      kind: 'github',
      repo: 'df4l/FNVVR',
      // Every release so far is a prerelease, one zip per tag.
      assetPattern: '^FNVVR-Reborn-v.*\\.zip$',
      allowPrerelease: true,
    },
    // INSTALL.txt step 1: all four go beside FalloutNV.exe. The zip wraps them
    // in FNVVR-Reborn-v<version>/, and INSTALL.txt itself stays out.
    install: {
      stripRootDir: true,
      steps: [
        { from: 'd3d9.dll', to: '.' },
        // The 32-bit OpenVR client; the game is a 32-bit process.
        { from: 'openvr_api.dll', to: '.' },
        { from: 'dxvk.conf', to: '.' },
        { from: 'fnvvr/**', to: 'fnvvr' },
      ],
    },
    // d3d9.dll alone is shared with ENB and stock DXVK, so pair it with the
    // action manifest only this mod ships. dxvk.conf is left out because users
    // are told to merge their own lines into it.
    fingerprint: ['d3d9.dll', 'fnvvr/actions.json'],
    // No versionFrom: nothing in the zip names the release (dxvk.conf only
    // says FNVVR_Reborn), so builds are told apart by checksum.
    requirements: [
      'Fallout: New Vegas - upstream tests the Steam copy only',
      'SteamVR and a headset; bindings ship for Oculus Touch and the Steam Frame controllers',
      'A GPU with Vulkan support, since DXVK draws the game through Vulkan',
    ],
    notes: [
      'Built and tested on Linux under Proton (Quest 2 through Steam Link). Upstream says it runs on Windows too, but has not tested it there yet.',
      'Start SteamVR before the game. On Windows no launch options are needed; under Proton, upstream asks for WINEDLLOVERRIDES="d3d9=n,b" %command%.',
      'An existing d3d9.dll (ENB, another DXVK build) or dxvk.conf is replaced and backed up, and put back on uninstall. If you had your own dxvk.conf lines, merge them into the new one, above any [section] header.',
      'Choices on the in-game Settings > VR page are saved to fnvvr\\vr_options.ini, which updates leave alone.',
      'Controls can be rebound in SteamVR’s Controller Bindings screen. The Pip-Boy (look at your left arm), flashlight and hotkey wheel are gestures, not buttons.',
      'No full body and no Fallout 3 / Tale of Two Wastelands. A new build lands every day or two.',
      'Problems: send FalloutNV_d3d9.log from the game folder, with your headset and how it is connected.',
    ],
  },
  {
    id: 'tale-of-two-realities',
    name: 'A Tale of Two Realities',
    gameId: 'fallout-nv',
    author: 'KUPOkinz',
    homepage: 'https://discord.com/channels/747967102895390741/1560413111423344730/1568873345120866435',
    summary:
      'Full VR conversion of New Vegas, and of Fallout 3 through Tale of Two Wastelands. Full IK body, hand-handled weapons with manual reloads, holsters, melee, a wrist-mounted Pip-Boy and gravity gloves.',
    kind: 'vr-mod',
    maturity: 'beta',
    conflictsWith: ['fnvvr-reborn'],
    // Released on the Flat2VR Discord only (not Nexus), so it is a manual
    // download. TTWVR.zip 1.0.0 is a plain Data-folder package with no wrapper
    // directory and no .esp: one xNVSE plugin (TTWVR.dll plus a TTWVR/ folder
    // holding its DXVK d3d9, OpenVR client, DLSS/FSR runtimes, a Whisper voice
    // model and TTWVR.ini) and loose meshes, textures and menus, some of which
    // replace vanilla and DLC armor, weapon and Pip-Boy meshes.
    source: {
      kind: 'manual',
      url: 'https://discord.com/channels/747967102895390741/1560413111423344730/1568873345120866435',
      instructions:
        'Released on the Flat2VR Discord, not Nexus. Join the server, download TTWVR.zip from this post, then point this at the file.',
      // Tested against the full path, so anchor on a separator, not ^.
      filePattern: '[\\\\/]TTWVR[^\\\\/]*\\.zip$',
    },
    // Everything goes under Data/. meta.ini is Mod Organizer's download
    // record, not part of the mod, so it stays out.
    install: {
      steps: [
        { from: 'NVSE/**', to: 'Data/NVSE' },
        { from: 'meshes/**', to: 'Data/meshes' },
        { from: 'textures/**', to: 'Data/textures' },
        { from: 'menus/**', to: 'Data/menus' },
      ],
    },
    // The plugin and its data blob are the files only this mod ships.
    fingerprint: ['Data/NVSE/Plugins/TTWVR.dll', 'Data/NVSE/Plugins/TTWVR/TTWVR.dat'],
    // No versionFrom: the only version string is in meta.ini, which is not
    // installed, so builds are told apart by checksum.
    requirements: [
      'Fallout: New Vegas with the 4GB Patch, xNVSE, JIP LN NVSE and Stewie’s Tweaks (Engine Fixes and Engine Optimizations)',
      'For Fallout 3 content: Tale of Two Wastelands set up with the Best of Times guide (thebestoftimes.moddinglinked.com/ttw.html), skipping its optional performance section',
      'Quest through Virtual Desktop with VDXR, or Steam Frame through SteamVR; other headsets are still being tested',
    ],
    notes: [
      'This installs straight into the game’s Data folder. If you run New Vegas or TTW through Mod Organizer 2, install TTWVR.zip with MO2 instead so it sits in your load order, and do not install it here as well.',
      'Some vanilla and DLC armor, weapon and Pip-Boy meshes are replaced; the originals are backed up and put back on uninstall.',
      'Settings live in Data\\NVSE\\Plugins\\TTWVR\\TTWVR.ini. It defaults to DLSS; on an AMD or Intel GPU switch Upscaler to FSR. Updating replaces the ini with the new build’s defaults, so note your changes first.',
      'Before launching, stand straight up and open Virtual Desktop (or SteamVR on the Frame); it locks in your height for the mod’s body tracking. On Quest, turn on Forward Tracking Data in the Virtual Desktop app under Streaming Settings.',
      'In game, sit or stand as you like, hold both arms straight out in front of you and hold both triggers. That calibrates you to the character’s height and keeps the floor in reach; redo it whenever you change position.',
      'Basics: left stick moves, right stick turns, right stick down crouches and up jumps, A/X activates, B is V.A.T.S., Y pauses. Grab weapons from either shoulder or hip with the grip; the Pip-Boy is on your left wrist.',
      'Hold A in conversations to answer by voice. Click and hold the left stick for the console.',
      'Demo and controls walkthrough: youtu.be/iAHKrRGOXqg',
    ],
  },

  /* ---------------- Deus Ex: Human Revolution ---------------- */
  {
    id: 'deus-ex-hr-vr',
    name: 'DeusExHRVR',
    gameId: 'dxhr-dc',
    author: 'farmerarmor',
    homepage: 'https://github.com/farmerarmor/DeusExHRVR',
    summary:
      'Same-frame stereo VR for Human Revolution over OpenXR, built on the game’s own AMD HD3D stereo renderer: head tracking, motion controllers mapped to an Xbox pad, and experimental motion-aimed weapons with per-weapon grip calibration.',
    kind: 'vr-mod',
    maturity: 'experimental',
    source: {
      kind: 'github',
      repo: 'farmerarmor/DeusExHRVR',
      // Every release so far is a prerelease. GitHub's automatic source
      // archives have no compiled DLLs, so match the packaged zip only.
      assetPattern: '^DeusExHRVR-.*-release\\.zip$',
      allowPrerelease: true,
    },
    // The zip wraps everything in DeusExHRVR/, and dist/ inside it is laid out
    // exactly as install.ps1 copies it into the game root. The rest of the zip
    // is source, scripts and licences.
    install: {
      stripRootDir: true,
      steps: [{ from: 'dist/**', to: '.' }],
    },
    // d3d11.dll alone is shared with ReShade and friends; the HD3D proxy and the
    // companion host are this mod's own. No versionFrom: nothing in dist/ names
    // the release, so builds are told apart by checksum.
    fingerprint: ['atidxx32.dll', 'DeusExHRVR/DeusExHRVRHost.exe'],
    // install.ps1 refuses any DXHRDC.exe but the Steam 2.0.66.0 build.
    requiresStore: ['steam'],
    requirements: [
      "Deus Ex: Human Revolution - Director's Cut on Steam, executable version 2.0.66.0 - not the original release, not GOG",
      'An active OpenXR runtime and a PC VR headset; first tested on the Oculus runtime, SteamVR also works',
      'DirectX 11',
    ],
    notes: [
      'The author’s install.ps1 also sets four of the game’s graphics settings, which this manager does not touch. Before playing, set them in the game’s options: DirectX 11 on, Stereo 3D on, V-Sync off, anti-aliasing off.',
      'Start the game normally and load a save: full VR starts by itself. F9 recenters.',
      'Settings go in DeusExHRVR.ini beside DXHRDC.exe; copy DeusExHRVR.ini.example (or .comfort for a gentler setup) from the GitHub repo. MotionControls=1 maps the controllers to an Xbox pad; ExperimentalMotionControls=1 turns on motion-aimed weapons.',
      'Per-weapon grips: hold both thumbsticks for a second, move the controller into the grip you want and let go. Offsets are kept in DeusExHRVR-weapons.ini.',
      'Not done yet: roomscale body movement and VR haptics. Untested missions and effects may still have problems.',
    ],
  },

  /* ---------------- Resident Evil ---------------- */
  reframework({ id: 'reframework-re2', gameId: 're2', gameLabel: 'Resident Evil 2', asset: 'RE2' }),
  reframework({ id: 'reframework-re3', gameId: 're3', gameLabel: 'Resident Evil 3', asset: 'RE3' }),
  reframework({
    id: 'reframework-re4',
    gameId: 're4',
    gameLabel: 'Resident Evil 4',
    asset: 'RE4',
    notes: [
      'VR here is gamepad-only: praydog never shipped motion controls for RE4. Talemann’s RE4VR addon adds them.',
    ],
  }),
  reframework({ id: 'reframework-re7', gameId: 're7', gameLabel: 'Resident Evil 7', asset: 'RE7' }),
  reframework({
    id: 'reframework-re8',
    gameId: 're8',
    gameLabel: 'Resident Evil Village',
    asset: 'RE8',
  }),
  {
    id: 're4vr-talemann',
    requires: ['reframework-re4'],
    name: 'RE4VR',
    gameId: 're4',
    author: 'Talemann',
    homepage: 'https://www.biohazardvr.com/re4',
    summary:
      'Turns Resident Evil 4 Remake, Separate Ways and The Mercenaries into full VR with 6DoF motion controls, going well beyond the gamepad-only base mod.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'manual',
      url: 'https://www.biohazardvr.com/re4',
      instructions:
        'RE4VR ships as an auto-installer that also downpatches the game, so it has to be run by hand. Download it exclusively from the project site and follow its prompts.',
    },
    // Guide-only: an installer that downgrades the game is not a reversible copy.
    install: { steps: [] },
    requirements: [
      'A fresh Steam install of Resident Evil 4 Remake - the DLCs are optional',
      'A PCVR headset',
    ],
    notes: [
      'Currently version 2.0. The installer is all you need; it locates the game, checks the version and downpatches to the last build before the 2026 update so the upscaler works.',
      'Download only from biohazardvr.com - the author distributes it exclusively there.',
      'Because its installer places and downpatches files, removal is its business rather than this manager’s.',
    ],
  },
  {
    id: 're9vr-talemann',
    name: 'RE9VR',
    gameId: 're9',
    author: 'Talemann',
    homepage: 'https://www.biohazardvr.com/re9',
    summary:
      'Full 6DoF motion controls for Resident Evil Requiem, layered on praydog’s gamepad-only VR mod.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'manual',
      url: 'https://www.biohazardvr.com/re9',
      instructions:
        'Requiem VR is a multi-part setup - a REFramework nightly plus VR.zip, then the AFW renderer, then RE9VR itself, plus ViGEm. Follow the guide rather than installing anything from here.',
    },
    // Guide-only: too many moving parts, and it needs a nightly this manager
    // does not track.
    install: { steps: [] },
    requirements: [
      'A fresh Steam install of Resident Evil Requiem',
      'ViGEm installed, with no other controllers connected while playing',
      'A REFramework nightly - the stable release ships no Requiem archive',
      'A PCVR headset (OpenVR or OpenXR; OpenXR has no wrist menu)',
    ],
    notes: [
      'Currently version 1.2.4. Requiem released 27 February 2026.',
      'praydog’s own Requiem VR works but is gamepad-only; RE9VR is what adds motion controls.',
      'PureDark’s AFW rendering is strongly recommended for performance.',
    ],
  },

  /* ---------------- Cyberpunk 2077 ---------------- */
  {
    id: 'cyberpunk-vr-port',
    name: 'CyberpunkVRPort',
    gameId: 'cyberpunk-2077',
    author: 'dariulone',
    homepage: 'https://github.com/dariulone/cyberpunk-vr-port',
    summary:
      'Free, open-source 6DoF VR for Cyberpunk 2077: real per-eye stereo, tracked hands with full-arm IK, physical weapon aiming, motion melee and a visible body.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'github',
      repo: 'dariulone/cyberpunk-vr-port',
      assetPattern: '^CyberpunkVRPort-.*\\.zip$',
    },
    // Five folders go into the game; the readmes and UNINSTALL.bat beside them
    // are documentation, not payload.
    install: {
      steps: [
        { from: 'archive/**', to: 'archive' },
        { from: 'bin/**', to: 'bin' },
        { from: 'engine/**', to: 'engine' },
        { from: 'r6/**', to: 'r6' },
        { from: 'red4ext/**', to: 'red4ext' },
      ],
    },
    fingerprint: ['red4ext/plugins/CyberpunkVR_Stereo/CyberpunkVR_Stereo.dll'],
    requirements: [
      'Cyberpunk 2077 on Steam, GOG or Epic',
      'RED4ext, Cyber Engine Tweaks, redscript and ArchiveXL/TweakXL - it hooks all of them',
      'A PCVR headset with an OpenXR runtime',
    ],
    notes: [
      'Not LukeRoss’s R.E.A.L. mod: this one is free, open source and has native motion controls rather than gamepad-only VR.',
      'Built as a RED4ext plugin (CyberpunkVR_Stereo) plus CET scripts and redscript patches, so it touches five folders in the game.',
      'Ships its own UNINSTALL.bat, though installing from here records the files for a clean removal anyway.',
    ],
  },

  /* ---------------- Outer Wilds ---------------- */
  {
    id: 'nomai-vr',
    name: 'NomaiVR',
    gameId: 'outer-wilds',
    author: 'Raicuparta',
    homepage: 'https://github.com/Raicuparta/nomai-vr',
    summary:
      'Outer Wilds in VR with 6DOF tracking and full motion controls, run through the Outer Wilds Mod Manager.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'manual',
      url: 'https://outerwildsmods.com/',
      instructions:
        'NomaiVR installs into OWML, the Outer Wilds mod loader, rather than the game folder - so it has to go through the Outer Wilds Mod Manager. Get the manager, install OWML, then pick NomaiVR from its mod list.',
    },
    // Guide-only: its destination is the mod manager's own directory, which is
    // nowhere near the game root this app installs into.
    install: { steps: [] },
    requirements: [
      'Outer Wilds 1.1.10 or later - Steam, Epic and Game Pass all work',
      'OWML and the Outer Wilds Mod Manager',
      'Steam and SteamVR installed, plus a headset and controllers',
    ],
    notes: [
      'Echoes of the Eye is supported but not required.',
      'Launch through OWML.Launcher.exe rather than the game directly.',
    ],
  },

  /* ---------------- Valheim ---------------- */
  {
    id: 'bepinex-valheim',
    name: 'BepInExPack Valheim',
    gameId: 'valheim',
    author: 'denikson (maintained by Azumatt)',
    homepage: 'https://thunderstore.io/c/valheim/p/denikson/BepInExPack_Valheim/',
    summary:
      'The Valheim community’s BepInEx build: BepInEx 5.4.23.5 preconfigured for Valheim. VHVR and almost every Valheim mod load through it.',
    kind: 'vr-mod',
    maturity: 'stable',
    // Published only on Thunderstore, whose download links name an exact
    // version and have no "latest" redirect to track, and the pack is a fork
    // (AzumattDev/BepInEx) with no GitHub releases of its own.
    source: {
      kind: 'manual',
      url: 'https://thunderstore.io/c/valheim/p/denikson/BepInExPack_Valheim/',
      instructions:
        'BepInExPack Valheim is only published on Thunderstore. Click Manual Download on the package page, then choose the downloaded ZIP here as it is - do not extract it into the game folder yourself.',
      filePattern: 'BepInExPack_Valheim[^\\\\/]*\\.zip$',
    },
    // The archive keeps its payload under BepInExPack_Valheim/ beside its own
    // manifest and readme, and upstream says to move that folder's contents
    // into the game. Only the Windows files are taken: the start_*.sh scripts
    // and doorstop_libs are for Linux and macOS.
    install: {
      steps: [
        { from: 'BepInExPack_Valheim/winhttp.dll', to: '.' },
        { from: 'BepInExPack_Valheim/doorstop_config.ini', to: '.' },
        { from: 'BepInExPack_Valheim/.doorstop_version', to: '.', optional: true },
        { from: 'BepInExPack_Valheim/BepInEx/**', to: 'BepInEx' },
      ],
    },
    fingerprint: ['winhttp.dll', 'BepInEx/core/BepInEx.Preloader.dll'],
    requirements: [
      'Valheim on Steam, in a clean and unmodified game folder',
    ],
    notes: [
      'VHVR asks for this pack specifically rather than stock BepInEx. It adds a Valheim-tuned BepInEx.cfg, preloader changes and sets the game’s own "modded" flag.',
      'If it loaded, a BepInEx console window opens next to the game.',
      'The pack’s maintainers ask for help requests to go to their Discords, not the official BepInEx one.',
    ],
  },
  {
    id: 'vhvr',
    name: 'VHVR',
    gameId: 'valheim',
    author: 'brandonmousseau',
    homepage: 'https://github.com/brandonmousseau/vhvr-mod',
    summary:
      'Native VR for Valheim through SteamVR: stereo rendering, a VR GUI and full motion controls for melee, archery, building and fishing, with VR gestures synced in multiplayer.',
    kind: 'vr-mod',
    maturity: 'beta',
    requires: ['bepinex-valheim'],
    source: {
      kind: 'github',
      repo: 'brandonmousseau/vhvr-mod',
      // vhvr.zip lately; 0.10.0 shipped as vhvr-0.10.0.zip.
      assetPattern: '^vhvr(-.*)?\\.zip$',
    },
    // The archive mirrors the game folder: the plugin and its bHaptics
    // patterns under BepInEx/plugins, and the SteamVR, Unity XR and OpenVR
    // runtime files the game lacks under Valheim_Data. The archive spells it
    // with a capital V; the game's folder is valheim_Data.
    install: {
      steps: [
        { from: 'BepInEx/**', to: 'BepInEx' },
        { from: 'Valheim_Data/**', to: 'valheim_Data' },
      ],
    },
    fingerprint: ['BepInEx/plugins/ValheimVRMod.dll', 'valheim_Data/Plugins/x86_64/XRSDKOpenVR.dll'],
    requirements: [
      'Valheim 1.0.15 to 1.0.17 for VHVR 0.11.0',
      'BepInExPack Valheim, installed first',
      'SteamVR and a headset that supports OpenVR',
    ],
    notes: [
      'Motion controls are tuned for Oculus Touch and Valve Index; Vive and Steam Frame bindings are included but tentative.',
      'A Valheim update can break the mod until VHVR is patched for it.',
      'The author warns that VR comfort is not that of a game built for VR.',
      'Every guide assumes the Steam edition. The Game Pass edition is untested.',
    ],
  },

  /* ---------------- Lethal Company ---------------- */
  {
    id: 'bepinex-lethal-company',
    name: 'BepInEx',
    gameId: 'lethal-company',
    author: 'BepInEx',
    homepage: 'https://github.com/BepInEx/BepInEx',
    summary:
      'The Unity plugin framework LCVR loads through, installed into the Lethal Company folder.',
    kind: 'vr-mod',
    maturity: 'stable',
    // LCVR's README points at BepInEx's GitHub releases. Thunderstore's
    // BepInExPack is the same 5.4.23.5 files plus a preconfigured
    // BepInEx.cfg. Anchored to the 5.4 line, so a BepInEx 6 release fails to
    // resolve instead of installing a loader LCVR does not target.
    source: {
      kind: 'github',
      repo: 'BepInEx/BepInEx',
      assetPattern: '^BepInEx_win_x64_5\\.4\\..*\\.zip$',
    },
    install: {
      steps: [
        { from: 'winhttp.dll', to: '.' },
        { from: 'doorstop_config.ini', to: '.' },
        { from: '.doorstop_version', to: '.', optional: true },
        { from: 'BepInEx/core/**', to: 'BepInEx/core' },
      ],
    },
    fingerprint: ['winhttp.dll', 'BepInEx/core/BepInEx.Preloader.dll'],
    requirements: ['Lethal Company on Steam'],
    notes: [
      'LCVR’s author says to run the game once after installing BepInEx, before adding the mod.',
      'BepInEx writes its config to BepInEx/config on first launch. Uninstalling here leaves that config and the logs behind.',
    ],
  },
  {
    id: 'fix-plugin-types-serialization-lethal-company',
    name: 'FixPluginTypesSerialization',
    gameId: 'lethal-company',
    author: 'xiaoxiao921 (Evaisa on Thunderstore)',
    homepage: 'https://github.com/xiaoxiao921/FixPluginTypesSerialization',
    summary:
      'A BepInEx patcher that lets Unity deserialize custom types stored in plugin assemblies. LCVR lists it as a dependency.',
    kind: 'vr-mod',
    maturity: 'stable',
    requires: ['bepinex-lethal-company'],
    // Source only on GitHub; the builds are on Thunderstore, whose links name
    // an exact version with no "latest" redirect to track.
    source: {
      kind: 'manual',
      url: 'https://thunderstore.io/c/lethal-company/p/Evaisa/FixPluginTypesSerialization/',
      instructions:
        'FixPluginTypesSerialization builds are only published on Thunderstore. Click Manual Download on the package page, then choose the downloaded ZIP here.',
      filePattern: 'FixPluginTypesSerialization[^\\\\/]*\\.zip$',
    },
    // The two things its Thunderstore readme says to copy.
    install: {
      steps: [
        {
          from: 'BepInEx/patchers/FixPluginTypesSerialization/**',
          to: 'BepInEx/patchers/FixPluginTypesSerialization',
        },
        { from: 'BepInEx/config/FixPluginTypesSerialization.cfg', to: 'BepInEx/config' },
      ],
    },
    fingerprint: ['BepInEx/patchers/FixPluginTypesSerialization/FixPluginTypesSerialization.dll'],
    requirements: ['BepInEx 5, installed first'],
    notes: ['LCVR 1.5.0 was built against version 1.1.4.'],
  },
  {
    id: 'lcvr',
    name: 'LCVR',
    gameId: 'lethal-company',
    author: 'DaXcess',
    homepage: 'https://github.com/DaXcess/LCVR',
    summary:
      'Full 6DOF VR for Lethal Company with tracked hands and motion-based interactions, through Unity’s OpenXR plugin. VR and non-VR players can share a lobby, even with a vanilla host.',
    kind: 'vr-mod',
    maturity: 'stable',
    requires: ['bepinex-lethal-company', 'fix-plugin-types-serialization-lethal-company'],
    source: {
      kind: 'github',
      repo: 'DaXcess/LCVR',
      assetPattern: '^LCVR-\\d.*\\.zip$',
    },
    // The plugin (with its RuntimeDeps and asset bundles) and the preloader
    // patcher, each in its own LCVR folder as the README lays out. The .sig
    // files are the author's GPG signatures for the two DLLs. The readme,
    // licence, changelog and Thunderstore manifest stay out.
    install: {
      steps: [
        { from: 'BepInEx/plugins/LCVR/**', to: 'BepInEx/plugins/LCVR' },
        { from: 'BepInEx/patchers/LCVR/**', to: 'BepInEx/patchers/LCVR' },
      ],
    },
    fingerprint: ['BepInEx/plugins/LCVR/LCVR.dll', 'BepInEx/patchers/LCVR/LCVR.Preload.dll'],
    requirements: [
      'Lethal Company V81 for LCVR 1.5.0, on Steam',
      'BepInEx 5 and FixPluginTypesSerialization, installed first',
      'A PCVR headset with an OpenXR runtime (Meta Quest Link, Virtual Desktop, SteamVR and others)',
    ],
    notes: [
      'LCVR checks the game against known builds and refuses to start on one it does not recognise, which usually means Lethal Company just updated. To force it anyway, add --lcvr-skip-checksum=<LCVR version> to the game’s Steam launch options.',
      '1.5.0 switched to single-pass instanced rendering, which the author warns breaks a lot of other mods. Emote mods, UI mods and mods that add bindings generally need VR-specific support.',
      'On a Quest streamed through Steam Link with SteamVR as the OpenXR runtime, users report jitter in one eye. Make the Meta (Oculus) runtime or Virtual Desktop the active OpenXR runtime instead.',
      'Settings are in-game, behind the VR button on the main menu.',
      'Installed by Gale or r2modman, LCVR lives in the mod manager’s profile folder, not the game folder, so it is not detected here.',
    ],
  },

  /* ---------------- Metal Gear Solid ---------------- */
  {
    id: 'mgs2-pcvr',
    name: 'MGS2-PCVR',
    gameId: 'mgs2-mc',
    author: 'Shiffo0',
    homepage: 'https://github.com/Shiffo0/MGS2-PCVR',
    summary:
      'Native OpenXR VR for the Master Collection release of MGS2. Tanker-focused beta, tested on Quest 3.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'github',
      repo: 'Shiffo0/MGS2-PCVR',
      assetPattern: '^MGS2-PCVR-v.*\\.zip$',
    },
    // Loader, hook and its .on toggles go beside the executable; the readmes,
    // licences and screenshots in the archive do not.
    install: {
      steps: [
        { from: 'winmm.dll', to: '.' },
        { from: 'openxr_loader.dll', to: '.' },
        { from: 'dg_hook.asi', to: '.' },
        { from: 'dg_hook.on', to: '.' },
        { from: 'dg_present.on', to: '.' },
        { from: 'dg_xr.on', to: '.' },
      ],
    },
    fingerprint: ['dg_hook.asi', 'winmm.dll'],
    requirements: [
      'Metal Gear Solid 2 - Master Collection Version on Steam',
      'A PCVR headset with an OpenXR runtime',
    ],
    notes: [
      'Beta, and focused on the Tanker chapter - later chapters are not finished.',
      'The release ships FILES.sha256; verify the download against it.',
    ],
  },
  {
    id: 'mgs-delta-uevr',
    requires: ['uevr'],
    name: '6DOF motion controls VR for MGS Delta - UEVR Plugin',
    gameId: 'mgs-delta',
    author: 'Holydh',
    homepage: 'https://www.nexusmods.com/metalgearsoliddeltasnakeeater/mods/167',
    summary:
      'Full first-person VR with 6DoF motion controls for Snake Eater, as a UEVR plugin and profile.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'manual',
      url: 'https://www.nexusmods.com/metalgearsoliddeltasnakeeater/mods/167',
      instructions:
        'Nexus requires a login to download, so grab the plugin yourself, then point this at the file. You also need UEVR itself from uevr.io.',
      filePattern: '\\.zip$',
    },
    install: { stripRootDir: true, steps: [{ from: '**', to: '.' }] },
    requirements: [
      'Metal Gear Solid Delta: Snake Eater on Steam',
      'UEVR (Praydog) installed separately',
      'A PCVR headset',
    ],
    notes: [
      'By the same author as the GTA: San Andreas DE plugin.',
      'Also distributed through the Flatscreen2VR Discord.',
    ],
  },
  {
    id: 'mgs5vr',
    name: 'MGS5VR',
    gameId: 'mgsv-tpp',
    author: 'nikamigaming-create',
    homepage: 'https://github.com/nikamigaming-create/MGS5VR',
    summary:
      'Native stereo OpenXR VR for The Phantom Pain: tracked hands and weapons, physical binoculars and scopes, and a left-wrist HUD.',
    kind: 'vr-mod',
    maturity: 'experimental',
    source: {
      kind: 'github',
      repo: 'nikamigaming-create/MGS5VR',
      // Each release also attaches a SHA256SUMS-<date>.txt beside the zip.
      assetPattern: '^MGS5VR-experimental-.*\\.zip$',
      allowPrerelease: true,
      // Since 2026-10-27 upstream also publishes nightly-* prereleases, several
      // a day, packaged differently (Install.cmd). Upstream keeps the
      // experimental releases as the recommended download, so follow only those.
      tagPattern: '^experimental-',
    },
    // The mod's own installer cannot be reproduced as file copies: it checks
    // mgsvtpp.exe against one exact SHA-256, runs mgs5vr_import.exe to extract
    // binocular and iDroid assets from the user's own game archives, and writes
    // dinput8.dll, its INIs and mgs5vr-install.json beside the executable. So
    // the package goes into its own subfolder, as upstream says to extract the
    // complete folder, and its launcher does the in-game install.
    install: { stripRootDir: true, steps: [{ from: '**', to: 'MGS5VR' }] },
    fingerprint: ['MGS5VR/MGS5VR-Launcher.exe', 'MGS5VR/dinput8.dll'],
    // Its Launch button also matters after install: it sets the OpenXR runtime
    // for the game process alone and starts it under Steam's app identity.
    launch: 'MGS5VR/MGS5VR-Launcher.exe',
    // Written by upstream's package-release.py with the release tag verbatim.
    versionFrom: { path: 'MGS5VR/RELEASE.json', field: 'tag', matchesReleaseTag: true },
    requiresStore: ['steam'],
    requirements: [
      'Metal Gear Solid V: The Phantom Pain 1.0.15.4 on Steam - the installer rejects any other executable',
      'Steam running and signed in when you launch',
      'A PC-connected OpenXR headset; only Quest 3 with Touch controllers has been tested',
      'The Microsoft Edge WebView2 runtime, for the launcher window',
    ],
    notes: [
      'After installing here, open MGS5VR-Launcher.exe, choose mgsvtpp.exe and select Install VR. That step imports assets from your own game and puts dinput8.dll beside the executable; until it runs the mod is inactive.',
      'After updating here, choose Update / Keep My Settings in the launcher. Before uninstalling here, choose Remove Mod in the launcher, or its dinput8.dll and INIs stay in the game folder.',
      'Load Continue then Resume Game; tracked VR enters automatically.',
      'Experimental and updated every few days. Captions, some HUD elements and full weapon, gadget and vehicle coverage are still being worked through.',
      'Ground Zeroes is not supported as a first-person VR port.',
      'Verify the download against the SHA256SUMS file attached to the release.',
    ],
  },

  /* ---------------- Max Payne ---------------- */
  {
    id: 'maxpayne2-vr',
    conflictsWith: ['max-payne-2-vr-evilsheep'],
    name: 'MaxPayne2VR',
    gameId: 'max-payne-2',
    author: 'betotron, powered by techbuzz',
    homepage: 'https://github.com/betotron/MaxPayne2VR-release',
    summary:
      'Native VR for the 2003 Max Payne 2, with 6DoF motion controls. Drops a handful of files beside the game and plays.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'github',
      repo: 'betotron/MaxPayne2VR-release',
      assetPattern: '^MaxPayne2VR-v.*\\.zip$',
    },
    // The archive is a distribution bundle - readmes and screenshots beside a
    // `mod` folder holding the payload. Only that folder goes into the game.
    install: { steps: [{ from: 'mod/**', to: '.' }] },
    // winmm.dll is the injector and the ini is unique to this mod; d3d8/d3d9
    // are too generic to identify it on their own.
    fingerprint: ['winmm.dll', 'MaxPayne2VR.ini'],
    requirements: [
      'Max Payne 2 (2003) on Steam or retail',
      'A PCVR headset - Virtual Desktop with VDXR is the supported controller setup',
    ],
    notes: [
      'Controller support currently targets Virtual Desktop / VDXR; head-based turning is available otherwise.',
      'Editing MaxPayne2VR.ini changes its fingerprint, so a tuned install may report as an unrecognised build.',
    ],
  },
  {
    id: 'max-payne-2-vr-evilsheep',
    conflictsWith: ['maxpayne2-vr'],
    name: 'Max Payne 2 VR',
    gameId: 'max-payne-2',
    author: 'evilSheep',
    homepage: 'https://github.com/evilSheep/max-payne-2-vr',
    summary:
      'A separate closed-source Max Payne 2 VR mod: first person as Max and Mona with a full IK body, dual wielding, manual reloads, holsters, melee and bullet time.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'github',
      repo: 'evilSheep/max-payne-2-vr',
      assetPattern: '^max-payne-2-vr-v.*\\.zip$',
      // Every build so far is a prerelease.
      allowPrerelease: true,
    },
    // Not a plain copy: Setup generates assets from the user's own game files
    // (none are shipped) and installs transactionally, keeping originals and a
    // receipt under MP2VR-Install. It also keeps a full copy of itself there,
    // which is what Uninstall reopens.
    install: {
      steps: [],
      installer: {
        run: 'Max Payne 2 VR Setup.exe',
        uninstall: 'MP2VR-Install/Max Payne 2 VR Setup.exe',
        instructions:
          'In Setup, select maxpayne2.exe in your game folder, then choose Install / update (or Uninstall). Generating assets takes a few minutes.',
      },
    },
    // Setup leaves the settings ini behind on uninstall, so it proves nothing.
    // The .asi is removed and the receipt is kept, so together they mean
    // "installed now".
    fingerprint: ['maxpayne2vr.asi', 'MP2VR-Install/receipt.json'],
    // Setup's receipt; the version is the release tag without its "v".
    versionFrom: { path: 'MP2VR-Install/receipt.json', field: 'version', matchesReleaseTag: true },
    requirements: [
      'Max Payne 2 on Steam (English or German) - the verified executables; other builds are unverified',
      'Run the unmodded game once, and close it, before installing',
      'SteamVR and a PC-connected headset with two tracked controllers - tested on Quest 3 (PC VR) and PSVR2',
    ],
    notes: [
      'Select MP2VR_FirstPerson in the game’s startup window, with D3D Hardware T&L as the acceleration mode.',
      'Reloading is manual by default. Since v0.1.0-rc.67, AutoReload=1 under [VR] in maxpayne2vr_settings.ini switches to automatic reloads.',
      'Turn with the right stick, smooth or snap; DisableStickTurning=1 turns it off. Most options live under VR Settings in the main menu.',
      'PSVR2 adaptive triggers need the separate PSVR2 Toolkit. Valve Index users run Fix Index Controls.cmd once - Setup leaves a copy in MP2VR-Install in the game folder.',
      'Setup keeps your saves, VR settings and any mod file you edited, and backs up any game file it replaces.',
    ],
  },

  /* ---------------- Call of Duty ---------------- */
  {
    id: 'overlord-mw2cr',
    name: 'Overlord',
    gameId: 'mw2-campaign-remastered',
    author: 'Aeka0',
    homepage: 'https://github.com/Aeka0/Overlord',
    summary:
      'Native stereoscopic VR for the MW2 Campaign Remastered: 6DOF head and hand tracking, physical weapon handling and VR interactions through the campaign.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'github',
      repo: 'Aeka0/Overlord',
      // The only asset, and a .7z rather than a zip.
      assetPattern: '^Overlord.*\\.7z$',
      allowPrerelease: true,
    },
    // Single "Beta 3" wrapper folder. The docs, licences and .pdb beside the
    // payload stay out of the game.
    install: {
      stripRootDir: true,
      steps: [
        { from: 'overlord.exe', to: '.' },
        { from: 'openxr_loader.dll', to: '.' },
        { from: 'overlord.vrmanifest', to: '.' },
        { from: 'release-info.json', to: '.' },
        { from: 'h2-mod/**', to: 'h2-mod' },
        { from: 'steamvr/**', to: 'steamvr' },
      ],
    },
    fingerprint: ['overlord.exe', 'overlord.vrmanifest'],
    // Reports "Beta 3" rather than the v0.3.0-beta tag, so it is shown and not
    // compared against releases.
    versionFrom: { path: 'release-info.json', field: 'version' },
    requirements: [
      'Call of Duty: Modern Warfare 2 Campaign Remastered, legally owned and installed',
      'h2-mod, the MW2CR modding framework it is built on',
      'Windows 10/11 64-bit, SteamVR with head and hand tracking',
    ],
    notes: [
      'For the 2020 Campaign Remastered only - there is no VR mod for the 2009 original.',
      'Built on H2-Mod, itself descended from IW6x and S1x.',
      'Defaults to OpenXR with OpenVR kept as a manual fallback. Quest controllers over SteamVR are the only validated combination.',
      'Roughly a 35 MB download; it bundles replacement campaign audio as well as the VR code.',
    ],
  },

  {
    id: 'kisakcod-vr',
    name: 'KisakCOD VR',
    gameId: 'cod4',
    author: 'jplakon',
    homepage: 'https://github.com/jplakon/CallOfDuty4_VR',
    summary:
      'Single-player OpenXR VR conversion of the 2007 Call of Duty 4: stereoscopic rendering, 6DoF head tracking, motion-controller aiming and physical scopes.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'github',
      repo: 'jplakon/CallOfDuty4_VR',
      // The portable zip, not the Setup.exe published beside it -- an installer
      // is not something this manager can reverse.
      assetPattern: '^KisakCOD-VR-.*\\.zip$',
      allowPrerelease: true,
    },
    install: { stripRootDir: true, steps: [{ from: '**', to: '.' }] },
    fingerprint: ['KisakCOD-sp.exe', 'Launch-KisakCOD-VR.bat'],
    launch: 'Launch-KisakCOD-VR.bat',
    versionFrom: {
      path: 'BUILD-INFO.txt',
      pattern: '^Version:\\s*(\\S+)',
      matchesReleaseTag: true,
    },
    requirements: [
      'The original 2007 Call of Duty 4 for Windows - the Microsoft/Xbox app layout is not supported',
      'An OpenXR runtime, or SteamVR for the compatibility backend',
    ],
    notes: [
      'Unpacks beside iw3sp.exe and ships no game data of its own.',
      'Launch through Launch-KisakCOD-VR.bat rather than the original executable.',
      'Verify the download against the bundled SHA256SUMS.txt.',
    ],
  },
  {
    id: 'worldwar-vr',
    name: 'World War VR',
    gameId: 'cod-waw',
    author: 'jplakon',
    homepage: 'https://github.com/jplakon/WorldWarVR',
    summary:
      'OpenXR VR for Call of Duty: World at War, with 6DOF motion controls, manual reloads and physical scopes.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'github',
      // Moved from RyanCraighead/WorldWarVR-Releases, which only ever shipped
      // an installer exe. This home publishes a portable zip, so it can be
      // installed and removed from here.
      repo: 'jplakon/WorldWarVR',
      assetPattern: '-Portable\\.zip$',
      allowPrerelease: true,
    },
    // Upstream says to extract it into its own new, empty folder: it is a
    // portable launcher with its own runtime, not files dropped over the game.
    // A subfolder of the game keeps the two together and satisfies that.
    install: { stripRootDir: true, steps: [{ from: '**', to: 'WorldWarVR' }] },
    fingerprint: ['WorldWarVR/WorldWarVR.exe', 'WorldWarVR/wawvr-launcher.exe'],
    launch: 'WorldWarVR/WorldWarVR.exe',
    versionFrom: {
      path: 'WorldWarVR/BUILD-INFO.txt',
      // No anchor: the version sits a few lines into the file.
      pattern: 'Product version:\\s*(\\S+)',
      matchesReleaseTag: true,
    },
    requirements: [
      'Call of Duty: World at War updated to version 1.7 - it ships no game content',
      'Windows 10 2004 or newer, 64-bit',
      'A PCVR headset with an OpenXR runtime and two tracked controllers',
    ],
    notes: [
      'Zombies is the primary test target and the best-supported mode. Campaign and local/offline multiplayer are experimental; online multiplayer is unsupported.',
      'Not every Zombies map, scripted sequence or upgraded weapon has had the same attention, and custom Zombies maps have outstanding DirectX crash reports.',
      'Launch through its own launcher in the WorldWarVR folder, not the game executable, and pick Main Menu for Zombies or Campaign.',
      'Free: no Patreon subscription, despite earlier builds being distributed that way.',
      'Verify the download against the published SHA256SUMS.txt.',
    ],
  },
  {
    id: 'bo3vr',
    name: 'BO3VR',
    gameId: 'bo3',
    author: 'MrDoodsterVR',
    homepage: 'https://www.youtube.com/@MrDoodsterVR',
    summary:
      'Work-in-progress OpenXR VR mod for Black Ops III Zombies: true stereo rendering and motion-controller aiming, with 6DoF head tracking still being built.',
    kind: 'vr-mod',
    maturity: 'experimental',
    source: {
      kind: 'manual',
      url: 'https://www.youtube.com/@MrDoodsterVR',
      instructions:
        'There is no public download yet. Development updates are posted on the YouTube channel, with support through ko-fi.com/sanoha; install from there once a build is released.',
    },
    // Guide only until a build is published. Nothing is known yet about the
    // payload, so there is no install plan or fingerprint to write.
    install: { steps: [] },
    requirements: [
      'Call of Duty: Black Ops III on Steam',
      'A PCVR headset with an OpenXR runtime and tracked controllers',
    ],
    notes: [
      'Early experimental build, shown in development videos from August 2026. Zombies is the only mode demonstrated.',
      'Tested on PSVR2 with Sense controllers. The camera is not true 6DoF yet, and barricades, wall buys and doors did not work in the first test.',
      'A native conversion rather than a vorpX-style floating screen. vorpX also has a paid Black Ops III profile, which is not in this catalog.',
    ],
  },
  {
    id: 'uevr',
    name: 'UEVR',
    gameId: 'uevr',
    author: 'praydog',
    homepage: 'https://github.com/praydog/UEVR',
    summary:
      'The universal VR injector for Unreal Engine 4.8-5.4 games. Several plugins and profiles in this catalog are useless without it.',
    kind: 'vr-mod',
    maturity: 'stable',
    source: { kind: 'github', repo: 'praydog/UEVR', assetPattern: '^UEVR\\.zip$' },
    install: { stripRootDir: true, steps: [{ from: '**', to: '.' }] },
    fingerprint: ['UEVRInjector.exe', 'UEVRBackend.dll'],
    launch: 'UEVRInjector.exe',
    // A commit SHA: identifies the build exactly, but does not line up with a
    // release tag, so it is shown rather than compared.
    versionFrom: { path: 'revision.txt' },
    requirements: ['A PCVR headset', 'The Unreal Engine game you want to inject into'],
    notes: [
      'A standalone tool rather than a per-game mod: pick a folder to install it into, then run UEVRInjector.exe and attach it to a running game.',
      'Profiles and plugins for individual games are listed under those games.',
    ],
  },

  /* ---------------- Titanfall 2 ---------------- */
  {
    id: 'titanfall-2-vr',
    name: 'Titanfall 2 VR',
    gameId: 'titanfall-2',
    author: 'CircuitLord',
    homepage: 'https://github.com/CircuitLord/CircuitLordVRModInstaller',
    summary:
      'Full VR for the Titanfall 2 campaign on the Northstar framework: stereo rendering, full-body IK, manual reloads and Titan controls.',
    kind: 'vr-mod',
    maturity: 'beta',
    source: {
      kind: 'manual',
      url: 'https://github.com/CircuitLord/CircuitLordVRModInstaller/releases/latest',
      instructions:
        'Download CircuitLordVRModInstaller.exe from the latest release and run it. It finds Titanfall 2, checks the EA app, and installs Northstar and the mod into a separate TF2VR profile in the game folder. Play through its Launch in VR button.',
    },
    // Guide only. The mod package (mod-packages/Titanfall2VR-*.zip) is not a
    // plain copy: it ships bsdiff patches that the installer's asset_patcher.exe
    // applies to the user's own game files, and it is merged with a pinned
    // Northstar build into TF2VR/. Nor is there a file to `launch`: VR starts
    // through TF2VR/tools/crash_monitor.exe with arguments from launch.json and
    // TF2VR_* environment variables, which only the installer sets. And the
    // installer itself is a bare .exe that self-updates from AppData, not an
    // archive, so it cannot be installed from here either.
    install: { steps: [] },
    // What the installer itself checks for, so an install it made shows up.
    fingerprint: ['Titanfall2VRLauncher.exe', 'TF2VR/plugins/Titanfall2VR.dll'],
    // The installer's own install record. Its version is the mod's (1.0.15),
    // not the installer's release tag.
    versionFrom: { path: '.circuitlord-vr-mods/Titanfall2VR.json', field: 'version' },
    requirements: [
      'Titanfall 2 on Steam or the EA app',
      'The EA app installed and signed in - Titanfall 2 will not start without it. If it is missing, launch the game once normally to install it',
      'A PCVR headset; start SteamVR or your OpenXR runtime before launching',
    ],
    notes: [
      'Campaign only.',
      "Launching Titanfall 2 normally, including from this app's Play button, stays unmodded. To play in VR, use the installer's Launch in VR button.",
      'VR saves and settings live separately in %LOCALAPPDATA%\\Respawn\\Titanfall2_VR, so your regular campaign is untouched.',
      'Remove any dxgi.dll or d3d11.dll another mod (such as ReShade) put in the game folder or bin\\x64_retail - the installer refuses to launch VR while they are there.',
      'An EA app copy under Program Files is read-only; the installer asks once for administrator rights to make the game folder writable.',
      'Cutscenes play on a floating 2D screen by default. An advanced option renders them in full VR, which the mod warns is intense.',
      'Update and uninstall it from the installer too; it records exactly the files it wrote.',
    ],
  },

  /* ---------------- Project Zomboid ---------------- */
  // Both mods below are Steam Workshop items for Build 42, loaded through
  // ZombieBuddy. The Workshop is the only distribution, and the game loads them
  // itself, so there is nothing to copy: guide-only entries.
  {
    id: 'pzvr',
    name: 'PZVR',
    gameId: 'project-zomboid',
    author: 'axizt (full-body tracking and haptics by GingasVR)',
    homepage: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3816830877',
    summary:
      'Real VR for Project Zomboid Build 42, layered on Project Viewpoint. Supports multiplayer, including mixed VR and non-VR players.',
    kind: 'vr-mod',
    maturity: 'experimental',
    source: {
      kind: 'manual',
      url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3816830877',
      instructions:
        'Subscribe to PZVR on the Steam Workshop after ZombieBuddy and Project Viewpoint are set up. Enable it in the game, press Allow when ZombieBuddy asks about the PZVR Java mod (restart if needed), connect your headset and choose your OpenXR runtime, then press Start VR in the main menu.',
    },
    install: { steps: [] },
    requirements: [
      'Project Zomboid Build 42',
      'ZombieBuddy and Project Viewpoint, both from the Steam Workshop',
      'An active OpenXR runtime (SteamVR or Meta Link)',
    ],
    notes: [
      'The author warns that PZVR and Project Viewpoint are both work in progress, so expect bugs.',
      'In a world, O also starts VR. Visuals are client-only for now; syncing to other players is planned.',
      'The Workshop page showed a notice that the item was removed for violating Steam guidelines when I read it, but it was updated the day before. Check that it is still reachable before relying on it.',
    ],
  },
  {
    id: 'project-viewpoint',
    name: 'Project Viewpoint',
    gameId: 'project-zomboid',
    author: 'ellu',
    homepage: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3809306528',
    summary:
      'A 3D rendering engine for Project Zomboid with first- and third-person views, PBR lighting and weather. The base that PZVR builds on.',
    kind: 'vr-mod',
    maturity: 'experimental',
    source: {
      kind: 'manual',
      url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3809306528',
      instructions:
        'Subscribe to ZombieBuddy (Workshop ID 3619862853) and then Project Viewpoint on the Steam Workshop, and enable both in the game. Relaunch if the items have not downloaded.',
    },
    install: { steps: [] },
    requirements: ['Project Zomboid Build 42', 'ZombieBuddy from the Steam Workshop'],
    notes: [
      'Not VR on its own; it is the first-person view that PZVR needs.',
      'Controls: O toggles first person, Shift+O switches first and third person, Delete opens settings, middle mouse toggles the cursor.',
      'Early development. Some AMD users report crashes (try the Medium preset) and performance drops.',
      'Its Workshop page also carried a removal notice when I read it. Confirm it is still available.',
    ],
  },
  {
    id: 'project-zomboid-vr',
    name: 'Project Zomboid VR REBORN',
    gameId: 'project-zomboid',
    author: 'bobman123123',
    homepage: 'https://bobman123123.itch.io/project-zomboid-vr',
    summary:
      'A fan-made VR recreation of Project Zomboid, built from scratch in Unity. Not a mod of the real game.',
    kind: 'pc-port',
    maturity: 'experimental',
    source: {
      kind: 'manual',
      url: 'https://bobman123123.itch.io/project-zomboid-vr',
      instructions:
        'Download the build from the itch.io page and extract it to a folder of its own. The page lists no version or file details yet, so check it for the current state before installing.',
    },
    // Guide only: itch.io has no stable direct link, and this is a separate
    // Unity game rather than files for the user's Project Zomboid install.
    install: { steps: [] },
    requirements: ['A PCVR headset with SteamVR or an OpenXR runtime'],
    notes: [
      'A separate demo that reimplements the game; it does not use or modify your Project Zomboid install. The page is explicit that it is "not the real project".',
      'Planned features per the page: guns, hunger and thirst, rain, moodles, doors and windows, building, snow and healing. Expect a lot to be missing.',
      "The author's earlier Project Zomboid VR DEMO (itch.io) stalled at version 0.3 in October 2024. REBORN is the newer, in-development project.",
      'The author says AI assistance was used for some of the code.',
      'To play VR in the real game, use PZVR instead.',
    ],
  },

  /* ---------------- Dead Space (2023) ---------------- */
  {
    id: 'dead-space-realvr',
    name: 'Dead Space R.E.A.L. VR profile',
    gameId: 'dead-space-2023',
    author: 'Luke Ross',
    homepage: 'https://steamcommunity.com/app/1693980/discussions/0/586182021532023276/',
    summary:
      "Luke Ross's R.E.A.L. VR driver with a profile for the Dead Space remake: stereoscopic rendering with an optional full first-person view.",
    kind: 'vr-mod',
    maturity: 'experimental',
    source: {
      kind: 'manual',
      url: 'https://steamcommunity.com/app/1693980/discussions/0/586182021532023276/',
      instructions:
        "Get the Dead Space profile from Luke Ross's official channels and follow its readme. It began as a Patreon early-access release, and I could not confirm where or whether it is publicly downloadable now, so check his channels before installing.",
    },
    // Guide only: no verified direct download, and the driver comes with its
    // own setup steps.
    install: { steps: [] },
    requirements: [
      'Dead Space (2023 remake) on Steam, Epic or the EA app',
      'A PCVR headset with SteamVR',
    ],
    notes: [
      'Dead Space is Frostbite, not Unreal, so UEVR does not apply.',
      'Luke Ross has changed how he distributes his mods (Patreon, then a free re-release of most of the kit), so the status of this profile is unconfirmed. Only download from his official channels, not from mirror sites.',
      'This is a driver-style mod, not a native VR port: expect to tune it, and motion controls are limited.',
    ],
  },

  /* ---------------- Ocarina of Time ---------------- */
  {
    id: 'shipwright-vr',
    name: 'Shipwright-VR',
    gameId: 'soh',
    author: 'ShinyWindow',
    homepage: 'https://github.com/ShinyWindow/Shipwright-VR',
    summary:
      'Ship of Harkinian with OpenVR built into the renderer - the Ocarina of Time PC port, in VR.',
    kind: 'pc-port',
    maturity: 'beta',
    source: {
      kind: 'github',
      repo: 'ShinyWindow/Shipwright-VR',
      assetPattern: '^Ship-.*win64.*\\.zip$',
      // Deliberately NOT allowPrerelease. The project tags full releases, and
      // its prereleases are sometimes Quest-only -- v1.4.2 ships nothing but an
      // APK, which resolved to "no asset matching win64" and broke the entry.
      // The newest full release is always the newest PC build.
    },
    install: { stripRootDir: true, steps: [{ from: '**', to: '.' }] },
    // A wildcard plan derives no fingerprint, so name one. soh.exe alone: the
    // asset archive beside it is ~50 MB and hashing that on every check would
    // be slow, and the executable is what actually differs between builds.
    fingerprint: ['soh.exe'],
    launch: 'soh.exe',
    requirements: [
      'Your own legally dumped Ocarina of Time ROM - none is supplied',
      'Run the included asset extractor once against your ROM before first launch',
      'An OpenVR runtime (SteamVR)',
    ],
    notes: [
      'A standalone application rather than a patch: pick an empty folder to install into.',
      'A fork of Harbour Masters Shipwright, currently tracking Ship of Harkinian 9.2.3.',
      'Roughly a 77 MB download.',
    ],
  },

  /* ---------------- Perfect Dark ---------------- */
  {
    id: 'perfect-dark-vr',
    name: 'Perfect Dark VR',
    gameId: 'perfect-dark',
    author: 'Tsuey / Alex Le Tux',
    homepage: 'https://github.com/Tsuey/perfect_dark_VR',
    summary:
      'PCVR and standalone Quest VR port built on the Perfect Dark decompilation and its PC port.',
    kind: 'pc-port',
    maturity: 'experimental',
    source: {
      kind: 'manual',
      url: 'https://github.com/Tsuey/perfect_dark_VR',
      instructions:
        'No packaged release has been published - the repository is source-only, on its "port" branch. Check the project page for a build before installing.',
    },
    // Watch entry: nothing to copy until upstream tags a release.
    install: { steps: [] },
    requirements: [
      'Your own legally dumped Perfect Dark ROM - none is supplied',
      'An OpenXR or OpenVR runtime',
    ],
    notes: [
      'Derived from the n64decomp/perfect_dark decompilation and the perfect-dark-pc-port project.',
      'A public Quest and PC VR build exists, but this manager has no verified download URL for it yet - set the source URL once you have one.',
    ],
  },
]

export const GAMES_BY_ID = new Map(GAMES.map((g) => [g.id, g]))
export const MODS_BY_ID = new Map(MODS.map((m) => [m.id, m]))
