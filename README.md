# VR Mod Manager

A Windows desktop app that tracks VR mods for PC games, finds your game installs, and installs and
removes the mods for you.

Built with Electron + React + TypeScript, with a shadcn/ui + Tailwind CSS v4 interface.

It also recognises mods you installed by hand, works out which build they are by checksumming them
against release history, and tells you when something newer has shipped — all without a GitHub API
token.

## Documentation

| Document | Covers |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | process model, detection, install engine, GitHub without a token, on-disk state, trust boundaries |
| [docs/CATALOG.md](docs/CATALOG.md) | the data format and how to add a game or a mod |
| [docs/UI.md](docs/UI.md) | component tree, mod states, the update rule, theming |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | scripts, TypeScript setup, packaging, editing gotchas |
| [docs/ROADMAP.md](docs/ROADMAP.md) | what works, what is next, what is deliberately out of scope |
| [TODO.md](TODO.md) | the same outstanding work as a checklist |

## What it manages today

<!-- catalog:start -->
| Game | Mod | Author | Maturity | Source | Auto-install |
|---|---|---|---|---|---|
| Halo: The Master Chief Collection | MCCVR Halo Build | moistman42069 | experimental | GitHub | yes |
| Halo: Combat Evolved (2003 PC / Custom Edition) | HaloCEVR | LivingFray | stable | GitHub | yes |
| Alien: Isolation | MotherVR | Nibre | beta | GitHub | yes |
| Alien: Isolation | GRAND-MotherVR | JayP | alpha | alienisolationvr.com | yes |
| BioShock Remastered | bioshock-vr | VR-Stereo-Hub | beta | GitHub | yes |
| BioShock Remastered | BioShock Remastered VR | BioVRDev | beta | GitHub | yes |
| BioShock 2 Remastered | bioshock-vr | VR-Stereo-Hub | beta | GitHub | yes |
| BioShock Infinite | bioshock-vr | VR-Stereo-Hub | alpha | GitHub | yes |
| GTA: San Andreas - The Definitive Edition | GTA: San Andreas Definitive Edition - 6DoF UEVR Plugin | Holydh | beta | nexusmods.com | manual download |
| GTA: Vice City - The Definitive Edition | GTA VICE CITY VR | MaslowCorporation | experimental | github.com | guide only |
| GTA: Vice City (2002 classic) | Vice City VR | Vice City VR project | alpha | compoundvr.com | manual download |
| Grand Theft Auto IV: The Complete Edition | GTA4VR | bordplate | experimental | GitHub | yes |
| Grand Theft Auto V Legacy | GTAVXR | LVL | beta | GitHub | runs its setup |
| Red Dead Redemption (2024 PC port) | RDRVR | Disonomouss | alpha | GitHub | yes |
| DOOM 3: BFG Edition | DOOM 3 BFG VR: Fully Possessed | KozGit, forked by NPi2Loup | alpha | GitHub | yes |
| DOOM (2016) | KHARVOX | CactusVRStudios | beta | GitHub | yes |
| DOOM Eternal | KHARVOX: ARGENT | CactusVRStudios | beta | GitHub | yes |
| DOOM Eternal | EternalVR | ArcadaLabs-Jason | alpha | GitHub | yes |
| Left 4 Dead 2 | L4D2VR | sd805, continued by keyou91 | beta | GitHub | yes |
| F.E.A.R. | F.E.A.R. VR | DR-89 | beta | GitHub | yes |
| F.E.A.R. | F.E.A.R. VR | TheFreeMike | beta | github.com | guide only |
| Dishonored | Dishonored VR | Pizza Parker and VOID (VR-Stereo-Hub), continuing GingasVR | beta | GitHub | yes |
| Crysis | Crysis VR | fholger | stable | GitHub | runs its setup |
| Fallout: New Vegas | FNVVR Reborn | df4l | experimental | GitHub | yes |
| Fallout: New Vegas | A Tale of Two Realities | KUPOkinz | beta | discord.com | manual download |
| Deus Ex: Human Revolution - Director's Cut | DeusExHRVR | farmerarmor | experimental | GitHub | yes |
| Resident Evil 2 (2019 remake) | REFramework | praydog | stable | GitHub | yes |
| Resident Evil 3 (2020 remake) | REFramework | praydog | stable | GitHub | yes |
| Resident Evil 4 (2023 remake) | REFramework | praydog | stable | GitHub | yes |
| Resident Evil 7: Biohazard | REFramework | praydog | stable | GitHub | yes |
| Resident Evil Village | REFramework | praydog | stable | GitHub | yes |
| Resident Evil 4 (2023 remake) | RE4VR | Talemann | beta | biohazardvr.com | guide only |
| Resident Evil Requiem | RE9VR | Talemann | beta | biohazardvr.com | guide only |
| Cyberpunk 2077 | CyberpunkVRPort | dariulone | beta | GitHub | yes |
| Outer Wilds | NomaiVR | Raicuparta | beta | outerwildsmods.com | guide only |
| Valheim | BepInExPack Valheim | denikson (maintained by Azumatt) | stable | thunderstore.io | manual download |
| Valheim | VHVR | brandonmousseau | beta | GitHub | yes |
| Lethal Company | BepInEx | BepInEx | stable | GitHub | yes |
| Lethal Company | FixPluginTypesSerialization | xiaoxiao921 (Evaisa on Thunderstore) | stable | thunderstore.io | manual download |
| Lethal Company | LCVR | DaXcess | stable | GitHub | yes |
| Metal Gear Solid 2 (Master Collection) | MGS2-PCVR | Shiffo0 | beta | GitHub | yes |
| Metal Gear Solid Δ: Snake Eater | 6DOF motion controls VR for MGS Delta - UEVR Plugin | Holydh | beta | nexusmods.com | manual download |
| Metal Gear Solid V: The Phantom Pain | MGS5VR | nikamigaming-create | experimental | GitHub | yes |
| Max Payne 2: The Fall of Max Payne | MaxPayne2VR | betotron, powered by techbuzz | beta | GitHub | yes |
| Max Payne 2: The Fall of Max Payne | Max Payne 2 VR | evilSheep | beta | GitHub | runs its setup |
| Call of Duty: Modern Warfare 2 Campaign Remastered | Overlord | Aeka0 | beta | GitHub | yes |
| Call of Duty 4: Modern Warfare (2007) | KisakCOD VR | jplakon | beta | GitHub | yes |
| Call of Duty: World at War | World War VR | jplakon | beta | GitHub | yes |
| Call of Duty: Black Ops III | BO3VR | MrDoodsterVR | experimental | youtube.com | guide only |
| UEVR (Unreal Engine VR injector) | UEVR | praydog | stable | GitHub | yes |
| Titanfall 2 | Titanfall 2 VR | CircuitLord | beta | github.com | guide only |
| Project Zomboid | PZVR | axizt (full-body tracking and haptics by GingasVR) | experimental | steamcommunity.com | guide only |
| Project Zomboid | Project Viewpoint | ellu | experimental | steamcommunity.com | guide only |
| Project Zomboid | Project Zomboid VR REBORN | bobman123123 | experimental | bobman123123.itch.io | guide only |
| Dead Space (2023 remake) | Dead Space R.E.A.L. VR profile | Luke Ross | experimental | steamcommunity.com | guide only |
| The Legend Of Zelda: Ocarina Of Time (PC Port) | Shipwright-VR | ShinyWindow | beta | GitHub | yes |
| Perfect Dark (PC Port) | Perfect Dark VR | Tsuey / Alex Le Tux | experimental | github.com | guide only |

46 games, 57 mods.
<!-- catalog:end -->

Regenerate this table with `npm run docs:table`; it is printed straight from the catalog.

BioShock 1, F.E.A.R., Max Payne 2 and Fallout: New Vegas each list two competing mods — installing one rules the other out, and the
app greys out the loser. Alien: Isolation, Resident Evil 4 and the UEVR-based entries also pair up,
but those are layered rather than competing: GRAND-MotherVR needs MotherVR underneath it, RE4VR needs
REFramework, and the GTA and MGS Delta plugins need UEVR. A mod says so on its card when a
prerequisite is missing.

## Running it

```bash
npm install
npm run dev
```

Other scripts: `npm run typecheck`, `npm run build`, `npm run dist` (a Windows NSIS installer in
`release/`), `npm run scan` (read-only report of what is on this PC), `npm run check-sources` (does
every catalog source still resolve?). Details in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

If `npm run dev` fails with `Error: Electron uninstall`, the Electron binary did not download during
install. Fix it with `node node_modules/electron/install.js`.

## How it works, briefly

- **The catalog is data, the installer is an interpreter over it.** `src/shared/catalog.ts` is plain
  data; adding a mod needs no installer changes. Install steps are copies only, because every step
  has to be reversible or Uninstall is a lie.
- **Games are found** through Steam's `libraryfolders.vdf`, `<drive>:\XboxGames`, and registry probes
  named by the catalog. A folder you pick by hand is never overwritten by a later guess.
- **Mods you installed yourself are recognised** by looking for their own files, then named by
  reading a version file if the mod ships one, or by checksumming them against release history if it
  does not.
- **Nothing is overwritten.** Displaced files are backed up and restored on uninstall; a failed
  install rolls back; a hostile archive is rejected before a single byte is written.
- **GitHub lookups cost no API quota.** Release resolution uses the ordinary github.com pages rather
  than `api.github.com`, so there is no 60-requests-an-hour limit to hit and no token to ship.

Each of those has a section in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) explaining the reasoning
and the traps.

## Adding a mod

1. Add a `GameDef` to `GAMES` if the game is new.
2. Add a `ModDef` to `MODS`.
3. For a GitHub source, check the real asset filename on the releases page and write `assetPattern`
   against it. Set `allowPrerelease` if the project only ships prereleases.
4. Verify the install destination against the mod's own README, and set `verifyPaths` to something
   that exists in every storefront's copy of the game.
5. `npm run check-sources`, `npm run scan`, `npm run docs:table`.

Full field reference and the gotchas worth knowing: [docs/CATALOG.md](docs/CATALOG.md).

## Caveats

These are community mods that inject into games. They break when games update, most are alpha or
beta, and antivirus software flags injection-based VR mods fairly often. The `maturity` field and the
per-mod `notes` carry the warnings the mod authors give — read them before installing.
