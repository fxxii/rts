# Foundation rules evidence

This records bounded rules hardening on the development content, not completion of acceptance stage A or the approved full reference inventory.

## Implemented contract

- Public `createMatch(seed)`, `command(world, player, command)`, `step(world)` and `observe(world, player)` remain compatible. Canonical replay includes attack schedules, resumable navigation state, private event mappings, queues and cargo.
- Attacks have six simulation ticks of windup. Melee impacts at release; ranged attacks travel at 500 coordinate units per tick after release. Release checks live attacker, target and range. Released ranged attacks persist after attacker death. Stop/retask cancels unreleased attacks without resetting cooldown. Due impacts are accumulated before destruction, allowing mutual elimination. Combat acquisition takes priority over attack-move travel, avoiding two movements in one tick. Armor, category bonus and forging use the existing development catalog.
- Simulation updates allocate consecutive per-player event IDs only for allowed events; repeated snapshots retain stable IDs so consumers can deduplicate. Events persist for the existing five-tick snapshot window. Visibility or an owned alert permits event coordinates; hidden attacker identity/coordinates are not added to owned-target alerts. `observe` does not mutate canonical state. Buildings retain last-seen memory until rescout; hidden units/resources are absent. Contained units grant no sight.
- Navigation caches routes by obstacle revision and endpoints, caps aggregate expansion at 512 per tick, and resumes searches in slices of 64 expansions. Search/cache counts are bounded (512/1024). Deterministic local separation and detours prevent the tested overlapping movement and navigate past idle workers. Target changes invalidate old routes immediately. No movement exceeds catalog speed apart from sub-unit integer rounding.
- Workers retain the requested resource kind after depletion and deposit. A blocked nearest drop-off is temporarily excluded after 100 stationary ticks and retried after 300 ticks, permitting another compatible drop-off. Missing drop-offs retain cargo. Completed population/spawn-blocked queues retain their payments; cancellation refunds once and destruction refunds nothing. Construction uses independent read-only reachability validation, preserving movement route state and replay determinism.
- Conquest counts actual living passenger entities and completed production buildings. Destroyed containers destroy their listed passengers in this foundation implementation.

## Verification

Regression-first failures were observed for instant attack damage, absent ranged travel, zero event IDs, hidden resource memory, container events, mutating observation, aggregate navigation state, unit overlap, source retention, wrong destination reuse, inaccessible drop-off recovery, stop during windup, rejected construction changing replay state, and attack-move moving twice in one tick.

The focused tests use real public commands/step/observe wiring. Fixtures directly position/spawn entities or set cargo/HP for bounded edge cases. Tests exercise exact impact damage, same-tick draw, stop cooldown, passenger destruction, production capability, deposits, capacity/spawn retention, cancellation and destruction, obstacle movement, event privacy, building rescout, and observation-independent full-state replay. They do not substitute mocks for simulation behavior.

Commands run: `npm test`, `npm run typecheck`, and `npx eslint src/sim tests/economy.test.ts tests/combat.test.ts tests/visibility.test.ts tests/replay.test.ts tests/navigation.test.ts`. See delivery message for final counts; the shared workspace may include concurrent server/client checks.

## Remaining approved-spec work

Full content/reference audit, multiple damage/armor classes, minimum range, accuracy/misses, splash, elevation, movement classes/water/cliffs/gates, full coarse group routing and reserved destination/drop-off slots remain absent. The two-dimensional development map and small roster are unchanged. Local steering is a bounded heuristic, not a guarantee against all crowd deadlocks. There are no public garrison/transport orders yet; passenger elimination tests cover the existing entity/container representation only. Economic trade, fishing and the many additional requested systems are not represented by these tests. Equal-resource stationary/open-field counter balance, large-army performance and human playtesting are not claimed here.

## Seeded physical-economy follow-up

The actual seed-42 bot match exposed two route defects missed by isolated near-source fixtures. Workers selected diagonal open resource cells 1,414 units away despite a 1,250 gather radius, and town-center corner cells 2,828 units away despite a 2,150 deposit radius. Those endpoints produced empty routes forever without satisfying the interaction. Route goals now respect interaction range. A separate regression covers a worker 1,280 units away whose rounded start already equals the valid goal: navigation now completes the remaining sub-cell movement. Travel orders still permit an occupied destination's perimeter, so attack-move toward a building approaches and engages it. Free non-grid destinations also complete correctly.

New public-command regressions exercise all three seeded workers gathering wood/gold/food through multiple deposits, three workers sharing one crowded food source, a sub-cell source approach, non-grid movement and attack-move at a distant occupied building. Final check at this milestone: 9 test files / 52 tests passed, typecheck passed, scoped ESLint passed.

Seed-42 headless probe at 18,000 ticks increased from the reported stalled baseline of 34 accepted commands to 212 accepted commands, with replay hash equality. Player 0 had 19 units and seven buildings; player 1 had one unit and four buildings, demonstrating actual economic and combat progression. The match was still unfinished. These are development probes, not balanced-bot or performance acceptance claims; the workspace had concurrent checks. The bot still has a limited repeating construction-site search and the development resource/content inventory remains finite.

A further crowded drop-off regression showed that interaction route goals should exclude currently occupied unit slots. Navigation now selects another free endpoint before relying on local detours. The final seed-42 18,000-tick probe executed 278 accepted commands, had zero `blocked` rejections, reproduced its replay hash, and ended with four versus two units after extensive attrition; it was still unfinished. A prior 36,000-tick run before this last endpoint-occupancy refinement also remained unfinished with exact replay equality. The approved full economy/content and a bot that handles exhausted food or endgames are still required; this task does not claim bot-match completion.

Final combined suite after endpoint occupancy: 10 files / 56 tests passed. Typecheck and scoped lint were also run on the final navigation change. No bot, protocol, replay, world, command, or renderer code was changed in this follow-up.


## Construction reachability review fix

Integration review reproduced permanently rejected reachable construction: the single 64-expansion movement slice returned no route, and rejection rolled its progress back. Construction now uses `canReachAny`, a read-only reverse breadth-first traversal over a disposable obstacle grid built once per validation. It checks all selected builders in one traversal and visits at most `width * height` cells (4,096 on the development map). This is a per-construction-command validation bound, separate from the unchanged 512-expansion-per-tick movement scheduler. It stores no cache, cursor or budget in world state. Construction no longer clones/rolls back the incremental scheduler.

Regression-first tests reproduced distant and heavily detoured reachable-site failures, then verified acceptance with exactly one payment and no scheduler/cache changes. An enclosed visible site still rejects as blocked with identical canonical hash and treasury. Focused navigation, economy and replay verification passed: 3 files / 27 tests. Typecheck and scoped ESLint passed. The former long-placement-route limitation is resolved; broader terrain classes and crowd-reservation limitations remain.

## Profile-guided combat visibility optimization

A short CPU-profile comparison reused the 400-unit army setup from `tools/stress.ts`, ran 120 simulation ticks, and observed both players every other tick. Disposable harness/profiles are in `temp/profile-armies.ts` and `temp/armies-{before,after}.cpuprofile`; the recorded full-stress artifact was not changed. The baseline CPU profile attributed approximately 4,669 ms of self samples to `combatStep`, versus 100 ms to visibility updates. Combat was testing fog membership against many distant candidates before rejecting them by distance.

The optimization evaluates the existing distance predicate before visibility and replaces linear membership scanning in the simulation-owned sorted visibility array with binary search. Candidate ordering, distance values, damage rules and world state representation are unchanged. An exhaustive generated-map test compares visibility membership for every cell and retains owned/contained-unit behavior.

Before: p50 63.98 ms, p95 69.71 ms, total 7,687 ms for 120 ticks. After: p50 30.87 ms, p95 39.61 ms, total 3,848 ms. The after-profile attributed approximately 483 ms of self samples to `combatStep`; navigation then dominated the remaining cost. Both runs produced exactly `c67e602a55a8c6dd4a77e330206a54d34e45fcb3d6dfea34ed215bb1f8cdd655` as their complete canonical checkpoint. These short profiled local comparisons establish improvement and exact fixture parity, not the 600-tick performance gate, target-machine performance or full-game completion. Root owns the final full-stress rerun and artifact.
