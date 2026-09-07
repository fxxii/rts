# Ironvale — 3D browser RTS design proposal

**Date:** 7 September 2026  
**Status:** Proposed design, not an implemented game. Working title only.  
**Delivered with this document:** original procedural audio assets, an event manifest, a reproducible audio generator, an audio preview, and technical asset validation. No game client, multiplayer server, 3D models, or playable build is included.

## 1. Product decision and interpretation boundaries

Build a genuine, continuously running, medieval 1v1 real-time strategy game in a browser. Preserve the economy → scouting → age advancement → army composition → map control → siege loop. A game with decorative buildings, instant-spawning soldiers, and one attack button does not satisfy the brief.

Three phrases in the request have materially different interpretations:

| Request | Interpretations | Working proposal; not an approved constraint |
|---|---|---|
| “web.js for 3d” | Three.js; another particular library called Web.js; browser JavaScript generally | Three.js with TypeScript. The exact library remains a confirmation item. |
| “1v1 player” | One human against AI; two humans online | Two humans online is the primary target. One human versus one bot uses the same rules for practice and testing. |
| “all element in aoe2” | All core gameplay systems; every unit, building, civilization, technology, expansion, campaign and mode in a specified release | Retain the full units/buildings ambition and all core systems. Exact roster parity is an additional acceptance condition, not something this proposal claims to have completed. |

The user did not name an AoE2 edition, patch, or DLC set. Therefore **no claim of exact all-AoE2 content coverage is justified yet**. The unit-family lists below are a design inventory, not an audited complete current AoE2 roster. A future versioned coverage inventory must enumerate every reference item, its intended counterpart and an acceptance test. Expansion-specific content must never disappear silently behind a generic “unique unit” entry.

Early milestones intentionally contain fewer pieces. That is implementation order, not a unilateral reduction of the final requirement. Campaigns, teams, editors, ranking and other non-1v1 modes are separate scope interpretations, not assumed deliverables of the first playable match.

Use original models, icons, music, recordings, interface artwork, names for fictional factions, and presentation. The accompanying pack contains no AoE2 assets. Historical unit/building concepts remain recognizable.

## 2. Approaches considered

**Recommended: Three.js + TypeScript + an independent authoritative simulation.** This matches the likely rendering request, allows browser-native deployment, and makes gameplay testable without graphics. Three.js itself supplies rendering/scene capabilities, not a complete game engine: its own manual explicitly identifies missing game systems such as collision and pathfinding.[1] The custom simulation is substantial work, not a renderer setting.

**Alternative: Babylon.js + the same independent simulation.** Babylon provides a broader integrated feature set, including animation, audio and rendering backends.[2] Prefer this only if “web.js” means browser 3D generally and integrated engine tooling matters more than Three.js specifically. It would not remove the need for RTS economy, combat, networking or balance.

**Alternative: a deliberately smaller RTS.** Fewer ages and unit types would reduce the first-release workload but conflict with the requested AoE2 breadth. This is not the proposed final scope. A small end-to-end development slice is still useful.

Do not make runtime gameplay depend on an LLM. Use the available model access for specification, implementation, tests, reviews, content preparation and balance analysis. The game itself should run without model calls or subscriptions.

## 3. Play experience and success criteria

Proposed desktop-first, mouse-and-keyboard presentation: stylized low-poly 3D, elevated orthographic camera, a stable default rotation, zoom and pan, clear team colors and recognizable silhouettes. Buildings have visible construction and damage stages. Units show idle, movement, attack, work and death states. Art quality means legibility at normal play zoom, not merely detailed close-up models.

Suggested initial targets, all subject to measurement:

| Area | Proposed acceptance target |
|---|---|
| Complete match | Create/join room → load → play → victory/defeat → results → rematch, without developer controls |
| Scale | 200 population per player, tested with 400 active controllable units plus buildings and resources |
| Match pacing | Median 25–40 real minutes in representative human playtests; no forced match timer |
| Responsiveness | Local selection/order feedback within 100 ms; authoritative effects depend on network conditions |
| Rendering | Target 60 fps at 1080p on the chosen reference machine; report measured frame-time distributions |
| Reference machine | Proposed M1 MacBook Air, 8 GB, current stable Chrome; verify hardware availability before locking performance acceptance |
| Networking | Complete a match under simulated 150 ms round-trip latency; reconnect after a 10-second disconnect without duplicated commands |
| Reliability | Automated economy/combat/pathing tests; repeated headless full matches; no negative resources or duplicate ownership |
| Enjoyment | Human testers can explain a meaningful strategic decision, a mistake, and a credible alternative strategy; measure rematch interest |

None of these game targets has been tested in this delivery. Automated bots cannot establish that a game is entertaining.

## 4. Core gameplay contract

### Economy and ages

Use four resources: food, wood, gold and stone. Villagers physically travel, gather into a limited carried inventory, return to a valid drop-off point, and resume work. Gathering does not credit the treasury until drop-off. Resource depletion, task interruption and destroyed drop-off buildings require explicit behavior. Farms require investment and reseeding; fishing, hunting, herdables and berries provide distinct early food choices.

Four ages—Dark, Feudal, Castle and Imperial—gate buildings, units and technologies. Age research takes resources and time and competes with other production in the same queue where applicable. AoE2’s official introductory guide describes this four-age structure and the relationships among villagers, construction, unit training and research.[3] Numerical costs and times for this game are not certified AoE2 copies; calibrate them through a versioned balance table.

Population is enforced when a queued unit is ready to spawn. Reserve costs at enqueue time. When population is full or no valid spawn tile exists, show a clear blocked state; do not silently lose a unit or repeatedly charge its cost. Cancellation and destruction have explicit, tested refund policies.

Construction requires a valid footprint, resources, a reachable worker and progress. Additional builders use diminishing returns. Repair consumes resources over time. Destroyed or cancelled construction updates navigation immediately. Garrisoned and transported units still occupy population.

Markets support resource exchange. Trade carts and trade cogs remain in the content target, but there are no guaranteed safe ally routes in a two-opponent game. Proposed route rule: the endpoint must be an eligible building owned by the other player; own-to-own trading is invalid, and traders can be attacked. No neutral market or free infinite-gold mechanic is silently added to standard duel maps. Reference-game trade eligibility still needs verification during exact-parity work.

### Combat and control

Keep ordinary damage, melee/pierce armor, category bonuses, range, attack interval, wind-up, movement speed, projectile travel, minimum range where relevant, splash damage and target restrictions as distinct data fields. An animation never decides a hit: the simulation schedules and resolves it. Cosmetic projectile trails follow the authoritative projectile.

Preserve infantry, anti-cavalry, ranged, anti-ranged, fast raiders, heavy cavalry, siege, gunpowder, monks and naval roles. Counters must be tested at equal resource investment, not just equal unit count. Include both controlled arena tests and open-field tests where range and movement matter.

Commands: select, drag-select, additive selection, double-click type selection, move, attack, attack-move, stop, hold position, patrol, gather, deposit, build, repair, garrison, ungarrison, heal, convert, board/unload, pack/unpack siege, set rally point and shift-queue. Control groups, idle-worker cycling, production hotkeys and a minimap are essential usability work.

Movement should not erase tactics. Heavy armies turn and assemble predictably; cavalry can raid and disengage; siege requires protection. Avoid arbitrary hidden catch-up bonuses. Provide clear signals when a command is invalid or a route is blocked.

### Visibility, terrain and objectives

Maintain unexplored, explored-but-not-visible, and currently visible states per player. Enemy mobile units disappear when no longer visible. Buildings and resources can persist as last-seen information; destruction in darkness must not update that memory until observed again.

Maps need accessible starting resources, defensive space, contested gold/stone, alternate paths and meaningful expansion opportunities. Elevation, cliffs, water, shallows, forests, walls and gates must have defined movement and sight rules. A visually high hill cannot be a meaningless decoration if elevation bonuses are enabled.

Standard conquest: resignation or elimination under an explicit rule. Proposed elimination rule is no surviving controllable units and no surviving building capable of producing a controllable unit. Losing a Town Center alone does not immediately end the match. Define simultaneous elimination as a draw. A disconnected player can reconnect for 60 seconds; after the grace period the server awards a disconnect loss. These are proposed rules, not assertions about AoE2’s exact rules.

Wonder and relic-timer victories remain supported configurable modes, switched off in the proposed standard competitive duel. A relic may still have an economic role when relic victory is off. Decide exact timers in the balance data. Units carried inside a transport or garrison count as alive.

## 5. Content inventory—not an exact current AoE2 catalog

AoE2 civilization identity includes differing technology availability, bonuses, unique units and unique technologies.[4] Preserve this structure. Do not give every faction every upgrade merely because that is easier to implement.

### Unit families

| Family | Target line or examples | Necessary distinctions |
|---|---|---|
| Economy | Villager, fishing ship, trade cart, trade cog | Carry/drop-off; production; routes; vulnerability |
| Exploration | Scout/light cavalry; eagle-style alternative | Sight, speed, age scaling, faction eligibility |
| Infantry | Militia → men-at-arms → swordsmen → champion-equivalent | Mainline melee upgrades |
| Anti-cavalry | Spearman → pikeman → halberdier-equivalent | Explicit cavalry/elephant bonus categories |
| Foot archers | Archer → crossbow → advanced archer | Range, accuracy, projectile timing |
| Counter archers | Skirmisher → elite skirmisher; faction-specific branches | Pierce defense and anti-archer bonus |
| Mounted archers | Cavalry archer → heavy counterpart | Mobility, firing delay, upgrades |
| Heavy cavalry | Knight → cavalier → paladin-equivalent; faction-specific replacements | Expensive frontline and restricted upgrades |
| Anti-cavalry cavalry | Camel family and restricted higher tiers | Armor-category interactions |
| Regional families | Eagles, steppe lancers, battle elephants, elephant archers, siege elephants | Separate mechanics where needed; not reskinned knights |
| Gunpowder | Hand cannon unit, bombard cannon | Ranged armor and siege distinctions |
| Siege | Ram, mangonel/onager, scorpion, trebuchet families | Garrison rules, splash/friendly fire policy, piercing, packing |
| Support | Monk family | Healing, conversion timers, resistance, relic carrying |
| Navy | Galley, fire ship, demolition ship, cannon galleon families | Naval counters, explosion rules and range |
| Transport | Transport ship | Capacity, embark, unload, passenger loss on sinking |
| Unique content | Per-civilization units and upgrade/replacement branches | Individual inventory rows required before parity acceptance |
| Scenario-only | Kings, heroes or other special actors when the chosen mode requires them | Separate from the standard duel’s trainable roster |

Herdables, hunted animals and ambient wildlife need their own neutral-entity rules and assets. They are not player military units.

### Building families

Economic: Town Center, house, mill, lumber camp, mining camp, farm, market, dock and fish trap. Military: barracks, archery range, stable, siege workshop and castle. Research/support: blacksmith, university and monastery. Defenses: outpost, palisade wall/gate, stone wall/gate, upgraded walls, watch/guard/keep-style tower line and bombard tower. Objectives: wonder and relic storage behavior. Civilization-specific economic, religious, military and defensive buildings require additional individually mapped records after the reference roster is frozen.

Every record needs costs, age/prerequisites, footprint or radius, health, armor, build/train time, queues, availability, actions, upgrades, model/icon references and sound-event bindings. Unique abilities need dedicated tests, not untyped callback strings embedded in JSON.

### Technology coverage

Include economy gathering/carry/movement improvements, farm upgrades, unit-line promotions, attack/armor upgrades, building durability, vision, ranged ballistics/accuracy rules, siege improvements, naval upgrades, monastery technologies and faction-specific technologies. Represent prerequisites as an acyclic graph. The UI renders this same graph and explains blocked requirements.

A schema validator must reject missing IDs, duplicate upgrade branches, cycles, nonexistent audio events, missing faction availability and impossible prerequisites. Missing assets fail a build check; they must not become silent null references during a match.

## 6. Architecture and contracts

### Separation

The supplied brainstorming reference emphasizes architectural decomposition and independently understandable components.[8] Proposed boundaries:

- `sim`: authoritative world state and rules. No Three.js, DOM, sound APIs or wall-clock reads.
- `content`: typed unit/building/technology/faction definitions plus validation.
- `protocol`: versioned commands, rejection codes and visible-state messages.
- `server`: room ownership, connection lifecycle, tick scheduling and replay storage.
- `client`: input, HUD, rendering, interpolation and audio event consumption.
- `bot`: a player controller that receives only its permitted observations and issues normal commands.
- `tests`: headless fixtures, adversarial networking and browser interaction tests.

These are design boundaries, not a pre-created repository scaffold.

### Authoritative simulation

Start with a 20 Hz fixed simulation step (50 ms). Render independently. A browser client requests orders; it never declares damage, resources, completion or victory. The server validates the request, assigns the effective tick, applies rules, then emits permitted state and events.

Use stable numeric IDs, explicit seeded randomness, ordered command processing and fixed-point authoritative movement/resource arithmetic where practical. Seeded randomness alone is not proof of deterministic replay. Deterministic tie-breaking, iteration order, version-pinned content and deterministic path scheduling are also required.

Record command sequence, assigned tick, simulation/content version, periodic snapshots and state hashes. Replaying a match on the same supported build must reproduce checkpoint hashes. Cross-version replay is not assumed.

Start with one isolated match runtime per match. Use bounded workers or processes for CPU-bound simulation rather than allowing one large battle to block all rooms. Node’s worker-thread documentation explicitly identifies CPU-intensive JavaScript as a worker use case.[7] Measure per-match memory/CPU before choosing hosting density; no hosting cost estimate is justified yet.

### Network and information security

Use an authoritative WebSocket client/server approach rather than requiring cross-browser peer lockstep for the initial release. Proposed snapshots/deltas: 10 Hz, with client interpolation between updates. Show immediate local order markers; these are not authoritative movement or combat prediction.

Each command carries protocol version, room/session identity, increasing client sequence number, action and entity IDs. Validate ownership, state, prerequisites, resources, placement, payload size and rate. Duplicate sequence numbers must not execute twice. Reconnection creates a new connection binding and resends a fresh authorized state; it must not create a second player slot.

Enforce two player slots, secure room tokens, allowed origins, message-size limits, bounded command rates and server-side result finalization. Do not put secrets or the complete match state in the client.

Fog of war is an information boundary, not just a shader. Send only currently permitted enemy information and deliberate last-known data. Do not leak hidden units through the minimap, audio, particles, selection raycasts, production counts or event logs. For random maps, keep unrevealed resource placements and the generating seed server-side until permitted; a known seed can otherwise reveal the unscouted layout.

A single renderer-free simulation also supports a local practice adapter, but online remains authoritative on the server. A local practice game is not evidence of working online 1v1.

### Navigation

Use a 2D navigation grid with terrain height metadata. Buildings and gates update blocked cells. Use cached/coarse A* routes shared by formations, reachable destination slots, local avoidance and explicit re-path/stuck recovery. Do not run a fresh whole-map search for every unit every rendered frame.

Keep authoritative navigation inside the match simulation or apply parallel results only in a deterministic prescribed order. Thread completion order must not decide a fight.

Test single-width gates, crossing armies, mass retreat, trees being depleted, structures being placed/deleted, crowded drop-offs, blocked rally points and unload locations. A route failure returns a usable feedback state; it cannot spin indefinitely or let units cross impassable terrain.

### Rendering and interface

Three.js scene objects are views of entities, never gameplay truth. Use shared geometry/materials, spatial culling, distance-based animation updates and measured batching. Skinned crowd animation requires a deliberate batching strategy; ordinary mesh instancing alone does not automatically solve animated-unit performance.

Default HUD: resources/population across the top; selected entities and actions at bottom; minimap; production/research queues; age progress; attack alerts; idle-worker count; opponent/result status. Hit targets remain accessible at common desktop resolutions. Distinguish team and selection states using shapes/outlines as well as color.

Menus should report asset loading or connection failures and offer retry. A renderer context loss must not silently forfeit a live game; preserve connection state when possible and show reconnection/recovery status.

## 7. Audio: actual supplied assets and integration

The pack contains **139 logical clips**: 113 sound effects, four ambience loops, two synchronized-length original music loops and 20 clearly labeled synthetic placeholder voice lines. Each is delivered as 48 kHz PCM16 WAV and Ogg Vorbis. The two encodings are alternatives, not separate sounds.

Coverage: UI selection/confirm/error/queues/pings; under-attack, age/research/build/unit completion and resource alerts; chopping/mining/harvest/gather/drop-off/build/repair; dirt/stone steps, hoofbeats and wheels; melee swings and impacts, bows/crossbows/arrows, handgun, deaths; rams, catapults, rocks, trebuchets, cannons, explosions and collapse; healing, conversion, relics; rowing, naval cannon/fire/sinking; victory/defeat; forest/river/sea/fire ambience; exploration/battle music; commands and spoken alerts.

These are **procedural starter assets**, not professionally recorded medieval Foley or natural voice acting. A functional event may reuse an appropriate material sound; not every building needs a unique recording. Production polish will require listening in-game, mixing, more variants and likely voice replacement. All speech was generated with eSpeak, not cloned from a real actor or copied from AoE2.

`audio/manifest.json` includes asset IDs, both file paths, sample rate, duration, channels, loop bounds, hashes, event mappings, gain suggestions, variant choices, cooldowns and concurrent-instance limits. `tools/generate_audio.py` regenerates the assets with a fixed seed. The generated voice waveforms can vary across eSpeak versions; the supplied files and hashes are the delivered reference.

Use Web Audio for decoding, mixing, gain buses and spatialization.[5] Resume the AudioContext during an explicit Start/Join user action because browsers may block scripted audio before interaction.[6] Preload UI and essential alerts; stream or decode ambience/music after startup. Prefer the compressed encoding when supported; fall back to WAV. Never decode both formats unnecessarily.

Separate master, world effects, voice, alerts, ambience and music buses. A global simultaneous-voice budget overrides per-event limits. Proposed cap: 32 active voices, with alerts/selected-unit acknowledgment priority over distant work sounds. A group order produces one acknowledgment, not one per soldier. Rate-limit repeated attacks at the same location. Include mute, persistent volume sliders, and visible equivalents of vital alerts.

Spatial audio uses the camera/map position and only the listener’s permitted observations. Do not expose enemies in darkness through sound. Own-unit under-attack warnings remain allowed. Audio begins on simulation events or presentation animation markers as appropriate, but never changes resources, combat timing or random simulation state.

Music loops are 32 seconds long and share timing. Crossfade exploration/battle layers at aligned positions; reduce music under voice/alerts. The provided loop boundaries are technically checked, but listening tests are still required, including decoded compressed loops.

## 8. Development checkpoints and use of the coding model

The attached workflow distinguishes architectural design from later implementation.[8] The following are dependency checkpoints, not a claim that game implementation has started or that design approval has been obtained.

**Checkpoint A — headless rules and content contracts.** Validate resources, costs/refunds, queues, age prerequisites, damage categories, visibility and victory. Demonstrate repeatable replay hashes. No visual polish requirement.

**Checkpoint B — complete minimal match.** One map and mirrored temporary faction data; workers, core economy, infantry, archers, spears, scouts, houses, Town Center and essential production. Every match can finish normally. All available UI actions actually work. This is explicitly a development slice, not “all elements” completion.

**Checkpoint C — true online duel.** Two computers/browsers, two player slots, authoritative commands, hidden-state filtering, disconnect/reconnect, results and rematch. Include bad-command tests. Do not defer multiplayer until after every unit is built.

**Checkpoint D — strategic depth.** All four ages, full core building families, land counter families, siege, upgrades, monks/relics, garrison, formation controls and a non-cheating practice bot. Introduce distinct factions only after mirrored balance is stable.

**Checkpoint E — full requested content.** Naval economy/combat/transports, remaining objectives, unique units/buildings and technologies. Freeze the reference edition/DLC/patch and audit every item. An unnamed expansion or unmapped unit blocks any “complete AoE2 parity” claim.

**Checkpoint F — performance, presentation and enjoyment.** Real 200-population battles, audio mix, animation readability, long-session soak, human playtests, balance iterations and deployable release packaging.

Use one model session as architect/integrator; assign bounded implementation tasks only after interfaces are fixed. Good parallel work areas: content schemas/tests, renderer/view adapters, HUD/input, audio integration, bot behavior and independent review. Simulation/protocol changes require coordinated review, not contradictory parallel patches.

Every task brief includes intent, files owned, APIs consumed, invariants, acceptance tests and commands to run. “Done” requires evidence from the target system. A screenshot does not prove economy correctness; a localhost bot game does not prove multiplayer; generated WAVs do not prove good mixing.

## 9. Verification and remaining decisions

**Verified in this delivery:** audio files exist, decode, have expected rates/channels, are non-silent, contain no clipped PCM samples, match manifest hashes and have valid event references; a ZIP integrity test and audio preview are included. Exact measured results are in `VALIDATION.json`.

**Not verified:** engine selection, actual gameplay, human fun, networking, renderer performance, browser decoding in a deployed game, naturalness of sound, or exact AoE2 content parity. No live game or server is supplied.

The next design decisions are the exact meaning of Web.js, whether AI practice is desired alongside human PvP, and the versioned AoE2 content boundary. The proposed default is Three.js, online human 1v1 plus optional practice, and all core systems with the full roster tracked explicitly. These defaults are proposals rather than silent changes to the user’s brief.

## Sources and provenance

Sources checked 7 September 2026. Numeric product targets and architecture choices are original recommendations, not claims made by the cited sources. The official guides are introductory references, not sufficient evidence for a complete current DLC inventory.

[1] Three.js, “Making a Game.” https://threejs.org/manual/en/game.html  
[2] Babylon.js, “Specifications.” https://www.babylonjs.com/specifications/  
[3] Age of Empires, “Getting Started with Age of Empires II: DE — PC.” https://www.ageofempires.com/learn-to-play/getting-started-aoe2/  
[4] Age of Empires, “Civilizations & Game Modes.” https://www.ageofempires.com/learn-to-play/civilizations-game-modes-aoe2/  
[5] MDN, “Web Audio API.” https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API  
[6] MDN, “Autoplay guide for media and Web Audio APIs.” https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay  
[7] Node.js, “Worker threads.” https://nodejs.org/api/worker_threads.html  
[8] User-provided `Pasted markdown(7).md`, “Brainstorming Ideas Into Designs”: architectural path (lines 65–75), isolation and clarity (lines 158–163), review (lines 182–195).
