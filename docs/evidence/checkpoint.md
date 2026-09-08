# Playable foundation evidence — 2026-09-08

This records a runnable **development slice**, not completed Ironvale or a passed A–F checkpoint. Source and lockfile are integrated on `ironvale/foundation`; see the implementation commit after baseline 35f201f.

## Delivered behavior

The composed browser/server game supports practice and two-player rooms, physical four-resource gathering/carrying/deposit, paid building construction/repair, population, training/research queues and cancellation, five distinct procedural unit models, nine buildings, a small age/research set, scouting/fog/memory, timed combat, conquest/resignation, reconnect and rematch. The authoritative simulation runs in one worker per room; clients submit bounded intentions. Bots receive the same permitted observation and use ordinary commands. Original supplied Web Audio plays through game events and persistent six-bus settings.

The complete reference ledger has 1466 individually identified records with localized names and pinned source/name provenance. A separate 19-item development ledger records actual provisional IDs/evidence. Neither marks full reference parity implemented.

## Executed verification

- `npm run typecheck`, `npm run lint`: passed.
- `npm test`: **63 tests passed across 11 files** in 22.49seconds.
- `npm run validate:assets` and build synchronization:139 logical clips,278 encoding hashes,79 event mappings passed. Original pack unchanged.
- `npm run test:browser`: **9passed** in 2.2minutes using Chromium 153.0.8010.12. Actual UI journeys include food deposit; 25 wood house with real capacity increase; 175 wood Barracks and paid Swordsman; two isolated clients; invalid-code correction; outcomes/rematch; ten-second repeated reconnect failures; real event audio and reload activation; full278file decoding/fallback/loops/source budget.
- `npm run build` plus `npm start`: actual compiled client/server served. **All three final production browser tests passed** in 1.5 minutes: corrected-code duel, paid practice economy/military production, and ten-second reconnect. `/health` returned status ok from the compiled server. An initial startup failed because the script used `server-dist/src/server/index.js`; corrected to the actual emitted `server-dist/server/index.js` and exercised successfully.
- `npm run headless -- 36000`: the final run reached normal conquest at tick 17695, 523 accepted commands, and matching replay hash `7c96d63ed931d3c0868aa45daf070a0f4c1091fddefbb93bad1272e04aa26d28`. The final rerun after construction/visibility fixes produced the identical outcome/hash; [headless.json](headless.json) records it. Bot victory is not human enjoyment evidence.
- Coverage validation confirmed 1466 unique IDs/counterpart reservations, readable core names and explicit blocked completeness.

`tests/server.test.ts` uses actual ephemeral WebSocket servers/workers and now includes an actual ten-second closed-connection interval plus 75 ms outbound/75 ms inbound delivery delays. This is application-level simulated latency on one machine. It verifies the same seat/epoch/sequence, unchanged payment and exactly one completed worker; it is not an internet or physical two-device measurement.

Source review findings/resolutions are in [review resolutions](review-resolutions.md). No tests were deleted or checks waived. The browser retry, long-placement path and malformed-message regressions were reproduced before fixing.

## Measured conditions and limits

Available hardware: MacBook Pro 18,3, Apple M1 Pro 10 cores, 16 GB; macOS 26.5/build 25F71; npm-script Node 24.13.0. This differs from the proposed M1 Air 8 GB.

| Scenario | p50 | p95 | p99 | Maximum |
|---|---:|---:|---:|---:|
|600 ticks, 400 initial active units converging; headless with filtered views |29.49ms|35.12ms|39.12ms|43.34ms|
|1080p starting practice view, 159 frames, software rendering |66.6ms|100ms|200ms|850ms|

Full machine/fixture metadata: [tick measurements](performance.json), [frame measurements](frames.json). The tick run ended with 326 units after combat; no sampled tick exceeded 50 ms. The earlier unoptimized run p95 was 70.27 ms. CPU profiling and complete-state hash comparison drove the optimization. The before run overlapped browser startup near its end; the final stress run had no browser suite running.

The frame sample used headless Chromium ANGLE SwiftShader, 9 visible entities and 50 draw calls, normal audio and live bot/server. It **does not meet 60 fps** and does not characterize the physical GPU or 400-visible-unit rendering. No reference-hardware or release-performance success is claimed.

Screenshots from automated practice were inspected: distinct worker/scout/building/resource models, live economy HUD, construction and population changes rendered. The interactive Browser plugin returned no available browser; direct interactive inspection and human/acoustic playtesting remain unverified.

## Open release gates

Full content/unique factions/ancient rulesets; farms/hunting/herdables/fishing; market/trade; advanced ages/upgrades/counters; naval/transports; siege/monks/relics; garrison/walls/gates/elevation/formations; configurable objectives; scalable physical-GPU rendering/animation; long sessions; equal-investment controlled/open-field balance; map fairness and human rematch interest; real two-device play; durable/version-fingerprinted replay packaging. Live workers record 200-tick hashes and retain terminal records privately in room memory, which is not durable storage.

The browser journey proves resignation outcomes; normal conquest is currently proven headlessly. No checkpoint is promoted on compilation, asset existence, test count or bot wins alone.
