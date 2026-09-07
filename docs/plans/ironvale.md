# Ironvale Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for the tightly coupled core; bounded independent research, presentation and review may be delegated. Follow the approved specification. Checkboxes track actual execution, not inferred completion.

**Goal:** Deliver the complete approved Ironvale browser RTS through verified A–F checkpoints.

**Architecture:** Renderer-free fixed-tick rules produce filtered player observations. Node authenticates two seats and schedules rules; Three.js/HUD/audio consume the same permitted view. Content and bot are independent of rendering and transport.

**Tech Stack:** strict TypeScript, Three.js, Vite, Node 24, ws, Vitest, Playwright and ESLint; exact dependency pins and lockfile live in package.json/package-lock.json.

**Spec:** [approved specification](../ironvale-spec.md); approval recorded in decision 004.

## Global constraints and baseline

- Preserve the supplied design/audio files and unrelated guidance/backups. Original audio hashes must remain verifiable.
- 20 Hz authoritative simulation; approximately 10 Hz permitted-state updates; independent rendering.
- No DOM, Three.js, audio or wall-clock gameplay dependencies in sim. Stable IDs, integer arithmetic, recorded seeds, deterministic ordering and same-build checkpoint hashes.
- Full item-level released-content coverage as defined in the approved spec; ancient rulesets included. Small slices never waive final content.
- Two authenticated seats; intentions only; payload/rate/ownership/visibility validation; harmless duplicates and reconnect.
- Fog filters serialization, entity references, events, minimap, raycasts and audio. No live seed/replay disclosure.
- Human playtest, real two-device and documented reference-machine gates remain distinct from automation.
- Initial disk baseline has guidance and supplied pack, no Git/package/source/game tests. Establish a local feature branch; preserve all existing files. No external deployment.
- Root integrator owns sim/protocol interfaces, dependencies, Git, shared test resources and acceptance. Delegates receive exclusive file ownership.
- Commands below run from repository root. Tests use only disposable in-memory matches and loopback ports. No database, accounts or paid service.

## Contract and file map

| Files | Contract |
|---|---|
| `src/content/types.ts`, `catalog.ts`, `validate.ts` | `Content` maps typed `UnitDef`, `BuildingDef`, `TechDef`; `validateContent(content): string[]`; `CONTENT` is the B development slice |
| `src/protocol/types.ts`, `decode.ts` | `Command` discriminated intention union; `CommandResult`; `PlayerView`; runtime `decodeCommand(value): Command | undefined` |
| `src/sim/types.ts`, `world.ts`, `commands.ts`, `economy.ts`, `combat.ts`, `navigation.ts`, `visibility.ts`, `index.ts` | `createMatch(seed = 1): World`; `command(world, player, cmd): CommandResult`; `step(world, commands?): void`; `observe(world, player): PlayerView` |
| `src/sim/replay.ts` | `replay(seed, timedCommands, ticks)` and canonical `checkpoint(world)` support server-side SHA-256 validation |
| `src/server/app.ts`, `index.ts`, `session.ts`, `match-worker.ts` | HTTP/static/health/WebSocket composition; two-seat rooms; worker lifecycle and command ledger |
| `src/client/main.ts`, `renderer.ts`, `models.ts`, `input.ts`, `hud.ts`, `audio.ts`, `style.css` | Start/join/practice, filtered view presentation and intention submission |
| `src/bot/index.ts` | `decide(view, memory): Command[]`; observes only the same player view |
| `tools/validate-assets.ts`, `headless.ts`, `dev.ts` | Provenance checks, runnable headless match and owned local development process lifecycle |
| `docs/content/*`, `docs/evidence/*`, `HANDOVER.md` | Versioned coverage, actual verification and exact next task |

## Task A1 — Runnable content/protocol foundation

Files: create package/lockfile, strict tsconfigs, Vitest/ESLint configs, content/protocol files above, `tests/content.test.ts`, `tests/protocol.test.ts`, `tools/validate-assets.ts`.

- [ ] Pin/install compatible dependencies after official docs checks; ignore generated/private outputs.
- [ ] Write tests: `expect(decodeCommand({type:'move',ids:[1],x:NaN,z:2})).toBeUndefined()`; reject duplicate/missing content IDs, cyclic prerequisites, impossible availability and negative costs; verify all supplied audio hashes and event references.
- [ ] Run `npm test -- tests/content.test.ts tests/protocol.test.ts`; observe missing behavior fail.
- [ ] Implement typed records and runtime decoder with finite/bounded coordinates and at most 200 IDs; assets validator resolves real pack paths without mutation.
- [ ] Run `npm run typecheck`, `npm run lint`, `npm test -- tests/content.test.ts tests/protocol.test.ts`, `npm run validate:assets`; record results and commit intended files.

## Task A2 — Physical economy and orders

Dependencies: A1. Files: sim types/world/commands/economy/navigation, `tests/economy.test.ts`, `tests/navigation.test.ts`.

- [ ] Write real-world command tests: treasury unchanged during gathering; deposit increases exactly carried amount; retask preserves cargo; depletion/destroyed drop-off recovers without hidden scouting; illegal construction cannot charge.
- [ ] Run focused tests and observe failure, then implement integer-tick move/gather/deposit/build/repair and bounded deterministic path search/obstacle updates.
- [ ] Queue tests enqueue twice with insufficient remaining funds, cancel once, destroy producer, fill population/block spawn, and assert no duplicate/refund/negative-resource behavior.
- [ ] Implement paid queues, construction fractions, spawn retention, age prerequisites and research using the approved refund policy.
- [ ] Run `npm test -- tests/economy.test.ts tests/navigation.test.ts`, `npm run typecheck`; inspect canonical state and commit.

## Task A3 — Combat, observation, outcome and replay

Dependencies: A2. Files: combat/visibility/replay/index, `tests/combat.test.ts`, `tests/visibility.test.ts`, `tests/replay.test.ts`, `tools/headless.ts`.

- [ ] Write combat tests at attack wind-up/interval boundaries; spear/cavalry category bonus differs from ordinary infantry damage; stop/retask cannot reset cooldown.
- [ ] Write fog test: observe enemy building, leave sight, destroy it, assert old building memory remains until rescanned; never expose unseen resources or enemy units.
- [ ] Write elimination tests preserving garrison/transport identities and simultaneous draw; replay two same-seed command logs and compare checkpoints, then change a command and require divergence.
- [ ] Run failing tests, implement deterministic scheduled combat, filtered view IDs/events, outcomes and canonical checkpoints; no renderer imports.
- [ ] Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run headless`; inspect normal headless outcome and record A evidence. A remains incomplete if any required rule acceptance is absent.

## Task B1 — Complete playable development match

Dependencies: A3. Files: client main/renderer/models/input/hud/style, `index.html`, `vite.config.ts`, bot baseline controller, `tests/browser/match.spec.ts`, `playwright.config.ts`.

- [ ] Write browser journey through Start/practice: select worker, issue resource order, observe real deposit, place/pay/build a house, queue/pay/train infantry, fight, reach ordinary outcome and rematch.
- [ ] Implement orthographic terrain/units/buildings with distinct procedural silhouettes and state animation; pan/zoom, selection/drag/add/type, contextual commands and clear legal-action panel.
- [ ] Add control groups, attack-move/stop/hold/patrol/queued commands, rally and idle cycling from actual sim actions. Disable unfinished actions with reasons and label the release development slice.
- [ ] Add resource/population/age/queue/requirements/minimap/alerts/results and connection/loading/retry/help. No development cheats in shipped UI.
- [ ] Run `npm run build`, `npm run test:browser -- tests/browser/match.spec.ts`; inspect actual browser/screenshots at desktop resolutions; retain explicit human gate.

## Task B2 — Supplied audio event integration

Dependencies: A1/B1 observation events. Files: audio module, `tools/sync-assets.ts`, `tests/browser/audio.spec.ts`, development preview UI, provenance docs.

- [ ] Validate every supplied hash before copying assets to served public paths; never regenerate existing clips.
- [ ] Write browser tests decoding event variants, forcing Ogg fallback, starting via user gesture, changing/restoring all buses and checking group-order acknowledgment count.
- [ ] Implement manifest-driven event selection, cooldown/concurrency, 32-source priority budget, spatialization, loop crossfade/ducking and cleanup. Consume only permitted events.
- [ ] Run `npm run validate:assets`, `npm run test:browser -- tests/browser/audio.spec.ts`; listen to economy/construction/combat/results and preview loops. Mark absent event families not started until real game wiring exists.

## Task C — Real two-seat authoritative server

Dependencies: A3; begin before completing all content. Files: server files, client session transport, `tests/server.test.ts`, `tests/browser/duel.spec.ts`, runbook.

- [ ] Start ephemeral server and two real WebSocket clients; assert separate seats, ownership rejection, duplicate idempotency, third-seat rejection, malformed/rate limits and hidden state absence.
- [ ] Implement create/join tokens, bounded worker-per-match scheduling, accepted-sequence high-water marks, per-view refs, fresh snapshot/rebind on reconnect, 60-second forfeit input and finalized results/rematch epochs.
- [ ] Rewire B client and practice through the server composition; bot consumes `observe` and submits normal validated commands. Run `npm test -- tests/server.test.ts`.
- [ ] Run `npm run test:browser -- tests/browser/duel.spec.ts` with isolated contexts, simulated 150 ms RTT and 10-second outage; record a separate two-device manual procedure and evidence status.
- [ ] Run production `npm run build` and `npm start`; verify `/health`, Start/Join and rematch against the built app; document exact startup/join commands.

## Task D — Strategic depth

Dependencies: C. Files: content records, sim `research.ts`, `siege.ts`, `monastery.ts`, `containers.ts`, bot strategy, models/HUD adapters; tests named `research`, `siege`, `monastery`, `containers`, `balance`.

- [ ] Enumerate individual reference items for core land/building/technology branches; each imported record has a mechanic and test before verified status.
- [ ] Implement/test four age trees, upgrades, production prerequisites, walls/gates/elevation, siege projectile/packing/splash distinctions, healing/conversion/relic economy, formations and garrisons through real commands.
- [ ] Exercise conversion ownership/population, relic drop/deposit, blocked ejection and contained-unit elimination; run `npm test -- tests/research.test.ts tests/siege.test.ts tests/monastery.test.ts tests/containers.test.ts`.
- [ ] Add observation-only scouting/economy/army bot and faction distinctions after mirrored counter tests; run `npm test -- tests/balance.test.ts` and record controlled/open-field results at equal costs.
- [ ] Extend browser journeys to each exposed action; run `npm run test:browser` and conduct documented human strategic playtests.

## Task E — Complete approved content and rulesets

Dependencies: D. Files: versioned `docs/content/coverage.json`, source inventory, content/rulesets, sim `naval.ts`, `trade.ts`, `objectives.ts`, applicable model/audio records; `tests/naval.test.ts`, `trade.test.ts`, `objectives.test.ts`, `coverage.test.ts`.

- [ ] Audit every reference item individually including civilization availability/bonuses/unique techs and ancient rulesets; record excluded campaign-only actors with reason/source. Missing source/implementation stays blocked or not started.
- [ ] Implement physical fishing/fish traps, naval counters/demolition, passenger embark/unload/sinking, opponent-endpoint trade with once-only returned payouts, market quotes and wonder/relic timers.
- [ ] Implement remaining reference mechanics and original counterparts; add per-item tests and real event bindings. No generic placeholder establishes coverage.
- [ ] Run `npm test -- tests/naval.test.ts tests/trade.test.ts tests/objectives.test.ts tests/coverage.test.ts`, `npm run validate:assets`, full browser/build gates. Fail coverage when any required counterpart/mechanic/asset/test is unmapped.

## Task F — Release evidence and packaging

Dependencies: E. Files: `tools/stress.ts`, `tests/browser/stress.spec.ts`, deployment/runbook, `docs/evidence/performance.json`, `human-playtests.md`, release checklist.

- [ ] Run seeded 400-active-unit scenarios and long matches; collect p50/p95/p99/max tick/frame distributions with hardware/browser/build/network conditions: `npm run stress` and `npm run test:browser -- tests/browser/stress.spec.ts`.
- [ ] Exercise production asset failures/retry/context loss, parallel battles/audio budget and long-session cleanup. Profile and fix measured bottlenecks; rerun only affected scenarios.
- [ ] Conduct real two-device and human playtests; record map fairness, strategies, decisions and rematch interest. Unavailable hardware/humans remain explicitly unverified.
- [ ] Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run validate:assets`, `npm run test:browser`, `npm run build`; independent whole-change/security review, fix findings and document deployable packaging.

## Execution ledger

All tasks currently not started. Documentation approval is complete; application behavior remains unimplemented. This plan is self-reviewed against spec sections 1–6. Root may refine task granularity/interfaces from actual code evidence without weakening gates; record material changes. Exact commands become verified only after recorded successful execution.

Official API sources checked before selection: [Vite](https://vite.dev/guide/), [Vitest](https://vitest.dev/guide/), [Three.js](https://threejs.org/manual/en/installation.html), [Node releases](https://nodejs.org/en/about/previous-releases), [ws](https://github.com/websockets/ws), [Playwright](https://playwright.dev/docs/intro). Registry versions/engines are checked separately and pinned in the lockfile.
