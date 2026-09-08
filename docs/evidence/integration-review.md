# Integrated development-slice review — 2026-09-08

Reviewed baseline `35f201f` on `ironvale/foundation`; implementation/config/tests are untracked working-tree additions. This is a source review of the development slice, not A–F or full-game approval.
Read AGENTS.md, project facts, approved spec, implementation plan, verification guide and review checklist. Inspected actual sim/content/protocol/server/bot/client composition, production scripts, and relevant rule/network/browser test sources.
No source/Git edits, test runs, servers or browser processes were performed. Root owns live verification; findings below follow reachable code paths and need the stated regressions.

1. **High — a sustained outage leaves the playing browser unable to reconnect.** `src/client/main.ts:82–85`, `:14`, `:57`.
   First close sets `reconnecting=true` and retries after 1.5 seconds. If that attempt also fails during a ten-second outage, the next close cannot schedule another attempt; it only unhides a button inside the still-hidden lobby.
   This violates the existing reconnect/retry contract and can turn a recoverable outage into a forfeit. Retry with bounded backoff during the grace period and expose recovery controls in the active match.
   Regression: interrupt the real browser connection, reject reconnect upgrades for ten seconds, then restore them; the same page must regain its seat and submit a paid command without reload. The existing ten-second test constructs fresh raw WebSocket clients, so it does not exercise this branch.

2. **Medium — a rejected room join prevents correcting the room code.** `src/client/main.ts:72`, `:88–91`; `src/server/app.ts:83–86`.
   “Room not found” leaves the unauthenticated socket open. Clicking Join with a corrected code then always returns “Already connected to a room”; Create/Practice are also blocked. There is no reachable lobby disconnect control.
   Keep connection state distinct from authenticated membership; reuse the open unauthenticated socket or close it safely before retrying.
   Regression: attempt a nonexistent code, correct it to a real available room, and join from the same page without reloading.

3. **Medium — valid distant construction can be permanently rejected as blocked.** `src/sim/commands.ts:17–20`, `:63`; `src/sim/navigation.ts:57–74`.
   Placement calls the incremental pathfinder once, which returns an empty route after 64 expansions even when still searching. The rejection then restores the pre-command navigation state, discarding that progress; repeating the build restarts the same search.
   With a distant selected builder and a site revealed by another owned unit, a legal route longer than one slice therefore never validates. Separate pending reachability from unreachable placement and complete its bounded validation without charging prematurely or perturbing accepted-command replay.
   Regression: reveal a legal distant site, select a builder requiring more than 64 expansions, and prove the build eventually accepts exactly one payment; retain a truly unreachable rejection and replay hash check.

4. **Medium — reconnecting after reload never activates audio.** `src/client/main.ts:90`, `:96`, `:148`; `src/client/audio.ts:61–64`.
   Only `begin()` starts Web Audio. A restored session instead uses the Reconnect button directly; its handler opens transport without `audio.start()`. All subsequent match sounds return immediately because there is no AudioContext, and production has no preview control to initialize it.
   Activate audio synchronously from the reconnect gesture using the existing startup path, including music/ambience initialization.
   Regression: start practice, reload, click Reconnect, then produce a real gather/deposit or training event and verify audio starts while retaining the same seat and treasury.

Checked without additional findings: authoritative paid enqueue/cancel paths, construction/deposit/combat call chain, end-of-tick conquest, tick-batched input ordering/disconnect arbitration, terminal replay consumption, observation-only bot interface, reference translation and filtered presentation, manifest decoding/fallback and built-server/static-asset wiring.
Limits: no runtime reproduction or acoustic/visual assessment; this does not certify performance, human play, full roster/naval/advanced mechanics, or every prior security finding. Root must adjudicate findings and run focused production-wiring regressions before claiming these paths verified.
