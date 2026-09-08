# Ironvale handover — 2026-09-08

## Objective and approval
Deliver the full approved Ironvale specification through A–F. Explicit approvals cover Three.js/TypeScript, online human duel + bot practice, latest dated reference, and the consolidated written specification (decision 004). Do not ask again or reduce the final scope to this development slice.

## Working checkpoint
Workspace `/Users/gram/Workspace-rts`, branch `ironvale/foundation`. Baseline 35f201f preserved original inputs, template guidance and approval; the next implementation commit contains source/lockfile/evidence. Unrelated files/backups remain intact. Canonical supplied audio stays under `plan/ironvale_design_pack`; predev/prebuild verifies and reproduces ignored `public/audio`.

Implemented: renderer-free authoritative rules; four physical resources; paid construction/repair and queues; five development units, nine buildings, five researches; movement/combat/fog/memory/conquest; tick-batched intents and recorded disconnect outcomes; online rooms/reconnect/rematch; observation-only bot; original Three.js models, HUD/input/minimap; supplied Web Audio with persistent buses, spatialization, budget, fallback and actual events. Server-private in-memory terminal replay records include 200-tick hashes; durable/version-fingerprinted packaging remains open.

Reference ledger: 1466 individual localized records with pinned provenance, separate 19-item provisional development mapping; full counterpart parity remains blocked/not-started. No A–F checkpoint or complete-game claim.

## Final commands and results
- `npm run typecheck`, `npm run lint`: passed.
- `npm test`: 63 passed / 11 files, 22.49s final integrated run.
- `npm run validate:assets` and `npm run build`: 139 clips / 278 hashes / 79 event mappings passed; client and server build passed. Vite reports 573.78 kB JS chunk warning.
- `npm run test:browser`: 9 passed / 2.2m, including actual deposit, paid house/Barracks construction and Swordsman training, corrected room join, isolated duel/rematch, repeated failures during a 10s outage, actual harvest/production audio, reload activation, all encodings/fallback/loops/budget.
- `TEST_BASE_URL=http://127.0.0.1:3001 npm run test:browser -- tests/browser/match.spec.ts tests/browser/duel.spec.ts tests/browser/reconnect.spec.ts`: 3 passed / 1.5m against final compiled app.
- `npm run headless -- 36000`: normal conquest at 17695 ticks, 523 accepted commands, exact replay hash 7c96d63ed931d3c0868aa45daf070a0f4c1091fddefbb93bad1272e04aa26d28. `docs/evidence/headless.json` stores final output.
- `npm run stress`: 400 initial active units, 600 ticks, p50/p95/p99/max 29.49/35.12/39.12/43.34ms, 0 ticks > 50ms. M1 Pro 10 cores, 16 GB, Node 24.13.0, macOS 26.5. Not reference M1 Air or renderer evidence.
- Software-rendered Chromium 153 at 1080p: frame p50/p95/p99/max 66.6/100/200/850ms, 159 frames, 9 visible entities. 60fps NOT established/met in this sample. No 400-visible-unit GPU test.
- Actual screenshot artifacts inspected via image tool. Interactive Browser plugin reported no available browser. Human listening/playtesting and real two-device evidence remain absent.
- Independent security and integrated reviews completed; all reported implementation defects repaired with regressions. See docs/evidence/review-resolutions.md. No failing test deleted or check waived.

## Active processes and ownership
All subagents finished; root owns integration. Production server is currently running through exec session 99682, PID 60934 (`node server-dist/server/index.js`), listening at `http://127.0.0.1:3001`. Last health probe returned status ok. No Vite/browser suite or benchmark remains running. Inspect jobs/port before starting another server. This is a running local process, not a deployment or promise of background agent work.

## Exact next task
Close the remaining B1 evidence gap: exercise a normal conquest through player UI using an actually gathered/paid army, including visible fighting/death/result and rematch; current browser outcome tests resign, while normal conquest is headless. Keep human playtesting a separate gate. Then expand the next approved strategic-depth task into a concrete plan and implement paid farms/reseeding before broadening age trees/content; do not restart design approval.

## Known incomplete product work
Farms/hunting/herdables/fishing/naval/trade/markets; full age/prerequisite/upgrade branches; siege/monks/relics; formations/garrison/transport commands; walls/gates/elevation; distinct factions/unique content/ancient rulesets; victory settings; original complete icons/animations/voice polish; long sessions/real hardware/rendering scale; controlled/open-field equal-resource balance and map fairness; human rematch interest and real two-device play. The complete 1466-item reference ledger is not implemented. See approved spec/plan and docs/evidence/checkpoint.md; early slices do not waive these gates.

## Inputs preserved
ZIP located in Downloads and safely audited earlier; 288 files matched pack, 278 audio hashes matched. Standalone design markdown and Pasted markdown(7).md not found in accessible locations; DESIGN.md is available. Desktop access was OS-denied. Original approval/intake evidence remains in docs/ironvale-intake.md and docs/decisions.
