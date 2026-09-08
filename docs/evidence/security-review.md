# Fresh security review — development foundation

Reviewed 2026-09-08 on `ironvale/foundation`, HEAD `35f201f7484aabad18b174b57ca65f8c51dbe7f2`; application source and tests are untracked additions beyond that baseline. This is a read-only source review, not executed exploit or transport evidence. No implementation, Git state, server, browser, or shared test results were changed. The only reviewer artifact is this report.

## Findings

### S1 — High: malformed discriminator can terminate the entire server

**Locations:** `src/server/app.ts:67`, `src/protocol/decode.ts:17`.

A connection that passes the Origin check can send `{"version":1,"type":{"toString":null,"valueOf":null}}`. `String(m.type)` throws a TypeError outside the JSON parse catch and escapes the message callback. No seat is needed. The server composition root has no uncaught-exception recovery, so this terminates the process and all rooms. An authenticated order can reach the same error using an object discriminator in `command`. Origin is a browser protection, and a custom WebSocket client can supply an allowed Origin.

This violates malformed-input rejection and isolation. Require string discriminators before comparisons/coercion in both decoders, and contain unexpected handler exceptions without continuing partially mutated execution. Add real transport tests for object, array, null, and prototype-shaped discriminators; assert a bounded rejection, continued `/health`, and continued operation of another room.

### S2 — High: inherited content names can crash a live match worker

**Location:** `src/sim/commands.ts:58` (building definition lookup), reaching `:64`; `src/content/catalog.ts:18` uses `Object.fromEntries` with the normal Object prototype.

An authenticated player sends a build intention with an owned villager, `def: "__proto__"` (also `constructor` or `toString`), and an adjacent reachable coordinate such as `(7000,11000)` for the initial `(7000,10000)` villager. The protocol accepts the string. `CONTENT.buildings[c.def]` returns an inherited object/function, passing the truthiness and age checks. Undefined size makes both footprint loops skip. A successful short route reaches `pay(w,p,d.cost)` with undefined cost, throwing when `pay` reads resource fields. The uncaught worker exception interrupts the match, enabling a losing player to deny an ordinary result.

Require own-property membership for every external content ID or use prototype-free validated maps. Test all inherited property names through a real worker connection, asserting rejection, unchanged resources/entities, and subsequent successful ordinary orders. This path is established by source tracing, not an executed crash.

### S3 — Medium: cleanup deletes active reconnect reservations before grace expires

**Location:** `src/server/app.ts:104`.

Once a room is more than two minutes old, both players disconnect and the next 30-second cleanup sweep terminates its worker and deletes its room. Reconnecting even a few seconds after a disconnect can therefore return `Room not found`, inside the promised 60-second reservation. Practice has the same issue because the bot seat is excluded from the connected test. Cleanup measures room creation age rather than the last disconnect/deadline.

Track reservation expiry per seat and do not collect a room until all applicable grace periods have elapsed. Verify a room older than two minutes, disconnect immediately before cleanup, reconnect within ten seconds, and assert the same epoch/seat with continued state. This is a lifecycle correctness/security availability finding, not a remote takeover.

### S4 — Medium: reconnect resets the authenticated command rate limit

**Locations:** `src/server/app.ts:59-63`, `:79`, `:51-56`.

The 60-token burst/30-per-second bucket belongs only to a socket. A seat owner can reconnect with the same token repeatedly, replacing the old connection and getting a fresh budget each time while retaining the sequence high-water mark. That seat can enqueue more commands than the declared limit, including expensive construction/path-validation commands, without violating any individual socket bucket.

Preserve the gameplay bucket on the authenticated seat across reconnects; apply separate pre-auth connection limits as appropriate. Verify a consumed seat budget remains consumed after replacement and the opponent can still submit orders. Existing stale-socket binding removal is helpful but does not preserve rate accounting.

### S5 — Medium: disconnect forfeits bypass deterministic tick arbitration and replay

**Location:** `src/server/match-worker.ts:21` (also immediate ordinary command execution at `:19`).

Forfeit messages immediately set `world.result`; the first callback wins and subsequent forfeits are ignored. Two grace deadlines expiring in the same simulation tick cannot yield the required draw. These external outcomes are also absent from the sim command log, so a replay of a disconnect match cannot reconstruct its result. Ordinary commands likewise execute by worker callback arrival instead of a per-tick player/sequence-sorted batch.

Queue administrative inputs and gameplay commands with an effective tick, resolve simultaneous expiry together, and log the accepted deterministic inputs. Verify both same-tick expiry orders produce a draw, one expired seat produces the other winner, and replay/checkpoint results agree. The current code has no replay-download endpoint, so this is integrity/reproducibility rather than live seed disclosure.

### S6 — Medium: stale ready/rematch consent starts a game with a disconnected seat

**Locations:** `src/server/app.ts:85-86`, `:97-101`.

Player A marks ready (or accepts rematch) then disconnects. Disconnect does not clear its ready/rematch marker. Player B can subsequently ready/accept, starting the new game while A is absent. The outstanding timeout is not tied to an epoch and can forfeit A in the new game, potentially shortly after its start. This violates the specification that a disconnected player cannot be marked ready by an opponent and that rematches require both players' agreement with fresh match lifecycle state.

Require connected human seats at start and invalidate/reconcile consent on disconnect. Scope grace callbacks to the intended lifecycle. Verify ready-disconnect-ready and accept-disconnect-accept do not start a fresh match, then reconnect and consent normally.

## Checked scope and limitations

Read `src/server/**`, `src/protocol/**`, `src/sim/{index,world,types,commands,visibility,replay,combat,navigation}.ts`, and `src/client/main.ts`, with related content construction and protocol/server/visibility tests. Read the project/specification/verification/review instructions; no nested `src/AGENTS.md` was found. `docs/project.md` remains stale and is not runtime evidence.

Source tracing confirms: server-selected player IDs; 192-bit random seat tokens; occupied/third-seat rejection; token-based replacement deleting the stale binding; per-room epochs and sequence high-water marks; a 128-response duplicate cache; 16 KiB WebSocket payload limit; selection and queue bounds; sim ownership checks; target visibility checks; view-only worker serialization; own-only queue/cargo/resource fields; per-observer entity and event references; hidden mobile omission and building memory; location-filtered effects and victim-based attack alerts. The client renderer/audio receive only the player view through the reviewed caller. No replay or seed export endpoint is present. These are inspected properties, not a claim that all adversarial journeys passed.

Existing `tests/server.test.ts` covers a basic two-seat/third-seat flow, initial hidden state, one train duplicate, token reconnect, and one forged action. It does not establish the findings' fixes or cover malformed object discriminators, inherited definitions, expired duplicate cache, sequence gaps, wrong token, stale replacement socket writes, Origin denial, payload overflow, rate reconnect bypass, old-room cleanup grace, simultaneous forfeits, or rematch consent loss. No tests were executed by this reviewer, per resource-ownership brief. No dependency vulnerability, TLS deployment, production bundle, replay completeness, full game/content completion, or real two-device security assurance is claimed.
