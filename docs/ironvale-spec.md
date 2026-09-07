# Ironvale — specification for approval

Status: APPROVED. User replied “approve” to the consolidated specification approval question. Implementation is authorized; no completed game is claimed.

This specification develops the [supplied proposal](../plan/ironvale_design_pack/DESIGN.md) under the user's product contract. The supplied file remains unchanged. Three.js with strict TypeScript and online human 1v1 with same-rules bot practice are approved. The user selected “latest” for reference content and then directed work to continue. The adaptations below were approved together by that consolidated approval; original proposal wording is retained for traceability.

## 1. Product and content boundary

Deliver a continuously running desktop browser RTS: gather, scout, expand, advance ages, select counters, contest territory, siege, win or lose, and rematch. Standard medieval matches use food, wood, gold and stone; Dark, Feudal, Castle and Imperial ages; a 200-population limit per player; and original low-poly 3D presentation. No gameplay requires model services or credentials.

Freeze the reference to released AoE2 Definitive Edition PC content as of 7 September 2026. The latest numbered official release notes found are Update 177723; this is a documented reference, not a locally verified game-data revision. [Reference evidence and limits](decisions/003-reference-version.md) remain attached to the content ledger.

Retain base DE and its incorporated expansions, Lords of the West, Dawn of the Dukes, Dynasties of India, Return of Rome's AoE2 Romans, The Mountain Royals, The Three Kingdoms and The Last Chieftains. Preserve every reference unit, building, technology, upgrade branch, civilization bonus, availability restriction and special ability relevant to the supported duel rulesets. Names used to identify reference content in the audit do not authorize copying artwork, sound, models or branding.

To preserve the broad interpretation following “continue,” this draft also includes the released Chronicles: Battle for Greece, Chronicles: Alexander the Great and Return of Rome ancient-era rosters. Their differing ages, economy, naval and technology mechanics belong to selectable duel rulesets on the shared engine. They are not flattened into medieval reskins. Both players select the same ruleset before a match; cross-ruleset matchups are outside this proposal. This is a material scope proposal submitted with this specification.

Campaign creation, story scripts, cinematic presentation, accounts, ranked ladders, teams, monetization and an editor are outside the requested game. Audit campaign-only and scenario-only records explicitly with a reason and source; do not silently erase them. A special actor required by a supported objective must be implemented. Victors and Vanquished contributes any applicable duel content found by the audit, without authorizing a campaign implementation. Unreleased products, including the announced September 22 Viking Sagas release, fall after the reference date. Later additions require a recorded scope change.

### Inventory and completeness contract

Create a versioned, machine-readable coverage ledger before claiming content completeness. Each reference item has its own stable entry: reference ID/name, kind, ruleset, edition/build/source, Ironvale counterpart ID, prerequisites/availability, distinctive mechanics, implementation status, model/icon/provenance status, audio bindings, test evidence and any explicit exclusion reason. Separate upgrades and civilization-specific replacements are separate entries. “Unique unit,” “navy” or “economy upgrades” cannot stand in for individual coverage.

The supplied unit/building/technology inventory remains a minimum inventory in addition to the versioned reference audit. It includes physical workers, fishing ships, traders, scout/eagle alternatives, melee infantry lines, spears, archers, skirmishers, mounted archers, heavy cavalry, camels, regional elephant/lancer families, gunpowder, all siege roles, monks, navy, transports and neutral animals. Preserve the full economic, military, research, religious, defensive and objective building lists in proposal section 5. Technology coverage includes all economy, promotion, combat, building, sight, projectile, siege, navy, monastery and civilization-specific branches.

Reference acquisition is required engineering work, not an assumption that the proposal's tables are exhaustive. Official introductory pages alone cannot certify the inventory. Preserve source dates and data hashes where obtained, distinguish independently verified mechanics from inferred values, and block an item when evidence is insufficient. Never fill an unknown mechanic with a generic substitute and mark it verified. A schema/coverage check rejects duplicate IDs, unresolved counterpart IDs, missing source attribution, circular/impossible prerequisites, missing faction availability, invalid asset/audio references and unsupported ability definitions. No unmapped required item permits checkpoint E completion.

## 2. Rules and match lifecycle

### Economy, construction and queues

Workers travel to an eligible source, perform timed gathering into a bounded carried inventory, travel to a compatible owned drop-off and deposit. Only deposit credits spendable resources. Retasking retains carried goods; switching resource type requires deposit first. Death loses carried goods. Exhaustion triggers a deterministic search for another observed compatible source. A destroyed or unreachable drop-off causes selection of another reachable owned drop-off; if none exists, retain cargo and report the blocked state. Neither automatic behavior discovers unrevealed resources.

Implement berries, hunting, herdables, depletion, farms/reseeding, shore/deep fishing, fishing vessels and fish traps with their own rules and availability. Neutral ownership changes are authoritative. Farm reseeding requires a new payment; default manual reseeding, with an explicit paid auto-reseed toggle. Gathering and repairs use integer accumulators so fractional per-tick rates do not disappear.

Building placement validates the ruleset's age/prerequisites, explored location, visible footprint, terrain/slope, occupancy, cost and reachable selected builders before charging. Rejection reveals no hidden blocker details. Successful placement reserves its footprint immediately; overlap cannot double-spend or overlap foundations. Workers must arrive before construction progresses. Builder contribution uses a data-defined diminishing-return schedule. Repair spends the applicable resources while restoring health and stops on insufficient funds. Obstacles are updated on placement, cancellation, gates changing state and destruction.

Pay production and research costs once at enqueue. One active item per queue; age research competes in the relevant queue. Revalidate completion and population before spawning. A blocked ready unit stays queued without new charges; update the HUD reason and retry when capacity/space changes. Garrisoned and transported units consume population. Use a stable, bounded search for valid spawn positions; no unit appears inside a wall or impassable tile. Upgrades apply through explicit rules to existing units and future production.

Proposed refund policy: cancelling an uncompleted training/research item returns 100% of its paid cost, including a unit blocked at spawn. Cancelling a foundation returns the unbuilt fraction of its paid cost, rounded down per resource; initial zero-progress cancellation returns all cost. Destruction returns no foundation, repair or queued-item payment. Never return spent repair resources or refund completed research. These are Ironvale policies subject to this review, not claims of exact reference-game refunds.

### Markets and trade

Market exchange buys/sells resource lots through authoritative, bounded price data and transaction fees; insufficient funds reject atomically. Show the actual quoted cost and executed price; a stale quote can be rejected rather than silently executing an unexpected cost.

Retain the supplied trade proposal: a trade cart routes between an owned market and an eligible opponent-owned market; a trade cog uses eligible docks. Own-to-own trading and neutral endpoints are invalid in standard duels. Traders are vulnerable to attack. Endpoint destruction suspends the route; changing or recreating an endpoint invalidates pending earnings. Gold is calculated from the validated route and credited once on completing the return delivery to its originating owned endpoint. Distance and prices are versioned balance data; no client reports its own payout. This makes duel trade risky and does not guarantee a safe gold income. Ruleset-specific differences require explicit content records and tests.

### Combat and special interactions

Separate damage categories, armor, category bonuses, range/minimum range, wind-up, attack interval, movement, accuracy, projectile travel and splash rules. Schedule authoritative releases/impacts; animation cannot apply damage. Resolve same-tick impacts consistently so simultaneous elimination can draw. Equal-resource counter tests include stationary and open-field situations. Elevation modifies combat under explicit rules and meaningful terrain metadata.

Keep cavalry raiding, ranged kiting, infantry/spear counters, siege protection and defended expansion viable. Provide line, box, spread and flank formation intents with deterministic slot ordering and reachable goals; units do not teleport to slots. Formation transitions cannot reset attack timers or grant speed boosts. Document any numerical departure from reference content in balance data.

Implement rams, onager-style splash, scorpion-style piercing, packing/unpacking trebuchets, gunpowder siege, naval counters and demolition behavior distinctly. Friendly-fire and target-category rules are explicit per weapon. Buildings can attack and garrison only where their definitions permit it.

Monks heal permitted targets over time, convert through authoritative seeded timing/resistance rules, carry relics and deposit them in eligible storage for timed income. Conversion transfers ownership once, cancels incompatible old orders and updates population/visibility. Dropped relics remain real map entities. The reference audit defines resistance, conversion eligibility, unit-specific abilities and technology effects; their schema must support the actual mechanic rather than just a label.

Garrisons and transports store passenger IDs as live entities with one owning container. Capacity, eligibility and embark reachability are validated. Unload reserves reachable legal positions and leaves passengers aboard when blocked. Standard proposal: sinking kills passengers; land-building destruction attempts deterministic emergency ejection and kills passengers that cannot be placed. Reference-specific exceptions have dedicated records/tests. Passengers remain counted for population and elimination.

### Victory, disconnect and rematch

Standard conquest ends on resignation or when a player has neither surviving controllable units (including passengers) nor surviving completed buildings with a legal production path to a controllable unit under that faction's tree. Current lack of resources or population capacity does not invalidate that production capability. Foundations alone do not prevent defeat. Resolve elimination at the end of a tick after ownership and destruction effects; simultaneous elimination is a draw.

Room options enable wonder/relic victories separately; both are off by default. Proposed initial continuous-hold timer is 600 simulation seconds for either objective, configurable before both players ready. Relic victory requires all map victory relics in owned eligible storage. Loss of the qualifying condition resets its timer. Destroying a wonder resets its timer. Simultaneous valid victory triggers draw. Relic income remains available with relic victory disabled.

After disconnect, the match continues and the seat is reserved for 60 seconds of server elapsed time. Reconnect restores the same seat and fresh authorized view. At grace expiry the server records a disconnect-forfeit command; sim processes it deterministically. Both missing players reaching expiry in the same tick draw. A server crash terminates the match as interrupted; crash-resume is not promised by the reconnect feature.

The result is finalized once and shared with both players. Rematch requires both players' agreement, creates a fresh match ID and seed, resets command epochs and world state, and keeps authenticated room seats. A disconnected player cannot be marked ready by the opponent. Practice allows a direct rematch with a fresh bot controller.

## 3. Architecture and authoritative data flow

Use one strict TypeScript project with independently importable modules under `src/sim`, `src/content`, `src/protocol`, `src/server`, `src/client` and `src/bot`. Three.js renders the client; Vite builds it; Node with WebSocket hosts the authoritative service. Vitest and Playwright supply rule/network and browser verification. Confirm APIs against current official documentation, select a supported Node baseline and pin compatible dependencies and lockfile during implementation planning. No package installation or API version is represented as verified yet.

| Boundary | Owns | Public contract and restrictions |
|---|---|---|
| content | Typed immutable rulesets, definitions, availability, balance and references | `validateContent`, version/hash, ID lookups; data uses typed abilities rather than executable callback strings |
| sim | World, commands, orders, paths, economy, combat, research, visibility, outcomes | `createMatch(config, content)`, `step(world, tickCommands)`, `observe(world, player)`, canonical checkpoint; no renderer, DOM, audio, network or wall-clock access |
| protocol | Versioned discriminated commands, errors and view/event schemas | Runtime decoding and bounded validation; never trusts a TypeScript type cast as network validation |
| server | Rooms, session bindings, command sequencing, workers, clocks, persistence and results | Binds identity to a seat before commands reach sim; schedules 20 Hz ticks and approximately 10 Hz authorized views |
| client | Input, HUD, view interpolation, models, animation, permitted sound and loading/recovery | Sends intentions; observes filtered state only; local markers do not imply accepted outcomes |
| bot | Observation-driven economy/scouting/combat decisions | `decide(observation, memory)` emits normal commands; same costs, knowledge and rate limits as a human |

One worker owns one match simulation and its bot. A bounded server worker pool prevents unbounded room creation; saturated hosts reject new rooms with a readable retry response. Hosting-density defaults are measured, not guessed. Practice initially creates a private match through the same Node service as online play. This keeps the production path shared and runs locally without external services; standalone offline-browser packaging is not required for the first release.

All authoritative time is integer ticks at 20 Hz. Use integer position/resource subunits and bounded numeric ranges, deterministic tie-breaking by stable ID, recorded gameplay seeds, separate presentation RNG and deterministic path-work scheduling. Commands assigned to a tick sort by player ID then accepted sequence. Fixed scheduling records external administrative inputs such as disconnect forfeit. Rendering and music have independent clocks.

Replay records include match/ruleset/build/content versions, initial config, server-only seeds, ordered effective-tick commands and SHA-256 checkpoint hashes every 200 ticks. Canonical state includes pending queues/projectiles/orders, navigation progress, RNG state, visibility and memory, so equal visible positions alone cannot masquerade as replay equality. Same-build replays must reproduce every checkpoint. Live clients cannot download authoritative replays or seeds; unrestricted replay export is allowed only after match finalization.

### Protocol and sessions

Commands carry protocol version, match ID/epoch, increasing sequence, action and bounded entity/target data. The server derives player identity from the authenticated connection; a claimed player ID never confers ownership. Validate shape, finite numeric values, bounds, ownership, command eligibility, target visibility, prerequisites, cost and placement at the real execution boundary.

Initial limits: 16 KiB incoming messages, at most 200 selected entity IDs, 30 command messages per second with a burst of 60, and at most 32 queued orders per entity. Malformed or excessive requests receive bounded errors/rate control; repeated abuse closes the connection. Use cryptographically random seat/session tokens, explicit allowed origins and TLS/WSS for non-local deployment. Do not log tokens or world contents. Room codes grant joining an available seat, not taking over an occupied one.

Accept sequential commands with a high-water mark. A duplicate accepted sequence produces an acknowledgment without another mutation; an old duplicate receives an already-processed response even after detailed acknowledgment eviction. Future sequence gaps reject with the expected sequence. Reconnect replaces the previous socket binding and uses a fresh visible snapshot plus high-water mark to reconcile pending intentions. Match epochs isolate rematch commands. A stale socket cannot act after replacement.

### Fog as a network boundary

Track unexplored, explored-hidden and visible cells separately for each player. Observation assembly occurs before serialization and is the only client state source. Own state remains available; enemy mobile entities are removed on loss of sight. Static buildings/resources retain deliberate last-seen snapshots with observation timestamps; unseen destruction or depletion cannot update them. Hidden occupant lists, enemy queues/cargo/resources and unexplored resource layouts are absent from views. Ruleset-approved global objective announcements disclose only their specified information.

Use per-view opaque entity references so gaps in global allocation IDs do not disclose hidden production. Filter projectile/effect/sound events and attacker attribution as well as entities. An attack on an owned unit can alert the owner without exposing an unseen attacker's identity or location. Minimap, particles, audio, selection/raycasts, debug output and preload data consume the same permitted view. Do not ship map seeds or generated full resource lists to clients. Reject hidden-target and hidden-placement probing without identifying the blocker.

### Navigation

Use a two-dimensional navigation grid with height, cliffs, land/water/shallows, source occupancy and dynamic building/gate obstacles. Shared/coarse routes serve groups; local deterministic steering separates units and reserves destination/drop-off/unload slots. Route caches include obstacle revision and movement class. No per-frame whole-map path search for every unit.

Bound work by deterministic node-expansion budgets per tick; unfinished searches resume next tick in a stable queue. Progress-free units retry at bounded intervals, at most three recovery attempts before reporting blocked and waiting for a relevant obstacle/order change. Terrain is never bypassed as a recovery shortcut. Depletion, gate changes, destroyed obstacles and newly blocked goals invalidate affected routes. Navigation tests include single-width gates, crossing armies, crowded drop-offs, retreats, blocked spawns and unloads.

## 4. Player presentation and audio

Elevated orthographic camera with pan/zoom, stylized terrain and original distinct unit/building silhouettes. Infantry equipment, horses, ranged weapons, siege machinery and ship hulls must read at normal zoom. Team colors also use shape/outline cues. Show selection, health, work/construction, attack wind-up, damage and death states. Shared geometry/materials, culling and animation frequency controls are profiled against actual frame distributions.

Implement click, drag, additive/type selection, control groups, contextual right-click, attack-move, stop, hold, patrol, shift queues, rally points, idle-worker cycling and hotkeys. Command-panel actions come from the same content/prerequisite data as sim. Every exposed control works or has a visible disabled reason. HUD includes resources, population, age, minimap, selection/actions, production/research queues, requirements, alerts and results. Development scenario shortcuts never appear in production player flows.

Start/Create/Join and practice screens have loading, connection status, errors and retry. Include controls help and persistent settings. Renderer context loss shows recovery while preserving the network session where possible. Reconnect shows progress and grace remaining; client prediction cannot spend resources or manufacture unit movement.

Integrate the supplied 139 logical audio clips and 79 manifest events without regenerating working assets. Preserve manifest/file hashes and provenance. Synthetic eSpeak voices remain labeled as placeholders in credits/settings. Content validation checks actual paths and bindings, while event tests prove the correct game action triggers playback.

Web Audio activates from the user's Start/Create/Join/practice interaction. Prefer supported Ogg decoding and fall back to WAV on unsupported/decode failure; report missing assets without crashing the match. One variant per event, one acknowledgment per group order. Separate persistent master/effects/voice/alerts/ambience/music controls; route UI effects into effects while respecting their non-spatial placement.

Use camera-relative spatialization, manifest gains/cooldowns/concurrency, a 32-source global budget and priorities favoring alerts and selected-group acknowledgment over distant work. Stop/disconnect ended sources, cancel pending audio on match transitions and release decoded/loop resources on exit. Crossfade exploration/battle loops on aligned positions and duck music under voice/alerts. Audible enemy events must originate from the permitted view. Audio never changes sim state or its RNG.

A development-only preview screen exercises each manifest event, format fallback, loops and competing sources. Automated browser decoding/event capture supplements actual listening during economy, production, age-up, combat, siege, navy, monastery, alerts and match results. Missing sounds may be generated offline reproducibly with original synthesis, accompanied by updated mapping/provenance/hash validation.

## 5. Delivery and acceptance gates

After specification approval, write one executable implementation plan with per-task paths, public interfaces, dependencies, observable acceptance tests and exact commands. Populate the project facts with commands only after they actually run. Establish Git locally, preserve the input pack/backups and commit the dependency lockfile and reviewed work within authorized local development. No paid hosting or external deployment is implied.

| Checkpoint | Required integrated outcome | Evidence that permits completion |
|---|---|---|
| A | Headless content/rules, resources, queues, age prerequisites, combat categories, visibility, victory and replay | Real sim tests through public commands; content validation; deterministic checkpoints; double-spend/refund/capacity/ownership regressions |
| B | Complete UI match on one fair map with mirrored development factions, workers, Town Centers, houses, essential production, infantry/spears/archers/scouts and supplied sound | Browser performs gather/deposit, paid construction/training, orders, fighting, normal outcome and rematch; human development-slice playtest remains explicit |
| C | Create/join online duel with server authority, filtered views, reconnect/results/rematch | Two isolated clients use normal server; malformed/forged/duplicate/third-seat attacks fail; 150 ms RTT and 10-second disconnect checks; separate real two-device evidence |
| D | Four ages, core land/building/technology families, siege, monks/relics, formations/garrison and fair practice bot; distinct factions after mirrored balance | UI journeys and rules regressions; equal-investment controlled/open-field counter tests; bot observation audit; human strategic playtests |
| E | Full approved inventory, naval economy/combat/transports, objectives and unique/ruleset content | Versioned item-level audit has no unmapped required items; mechanics, assets/audio and end-to-end tests attached per item; unsupported actions cannot be disguised |
| F | Polished deployable release, population-scale load and credible human enjoyment evidence | Production and development exercised; stress/soak/network distributions, original asset review, audio listening, human balance/rematch results and reproducible packaging |

Required regressions: double spending; blocked population/spawns; queue/foundation cancellation and destruction refunds; invalid/overlapping/unreachable placement; destroyed drop-off recovery; attack timing and counter categories; visibility memory; garrison/transport elimination; reconnect and rematch idempotency; forged/hidden-target orders; navigation obstacle updates; same-build replay hashes. Network tests inspect actual serialized messages, not only helper returns. Browser tests use the production wiring and separate authenticated identities.

Provide development, production build/start, typecheck, lint, unit/integration and browser-test scripts. The runbook documents installing pinned dependencies, starting the server/client, creating a room, joining from a second machine, firewall/host configuration, reconnect, results and rematch. Production packaging serves the built client and API/WebSocket from documented endpoints. No credentials or private backups are bundled.

Performance targets remain unachieved until measured: 200 population per player, a 400-active-unit stress scenario, simulated approximately 150 ms RTT, recovery from a 10-second outage and 60 fps at 1080p. Record hardware, OS, browser, build, match/ruleset/seed, entity mix, visibility, audio settings and p50/p95/p99/max frame/tick distributions. Distinguish actual hardware/network tests from simulation. The supplied M1 Air/8 GB target remains a comparison target if that machine is unavailable; report available hardware separately without pretending equivalence.

Human gates record starting-resource/map fairness, viable scouting/raiding/defending/expansion, dominant strategies, meaningful decisions/mistakes and rematch interest. Target 25–40-minute representative matches without forced timers. Record real participants and observations; bot wins cannot establish enjoyment. Unavailable human testing remains an open release criterion while engineering continues.

## 6. Review and implementation status

This is a specification, not a playable checkpoint. Application code, item-level inventory, dependency pins, game tests and production packaging do not exist yet. The input audit verified archive integrity, byte equality and audio hashes; browser audio/gameplay remain unverified.

Approval requested for this consolidated specification, particularly: broad released content with separate ancient-era duel rulesets; opponent-endpoint trade; refund/passenger policies; conquest and optional objective defaults; reconnect/rematch behavior; shared authoritative Node practice/online architecture; and staged A–F delivery retaining all final content.

Self-review evidence is in [the specification review](ironvale-spec-review.md). The next action after approval is the installed writing-plans workflow followed by implementation of A, B and early C in dependency order, carrying approved work forward without routine approval requests. Material scope/architecture changes and release/human gates remain explicit.
