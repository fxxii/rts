# Session hardening evidence

Verified 2026-09-08 in `/Users/gram/Workspace-rts`, `ironvale/foundation`; application source remains an untracked addition to baseline `35f201f`.

Changes in `src/server/app.ts`:
- Authenticated rate budgets belong to seats and survive socket replacement. Unauthenticated sockets retain separate bounded budgets.
- Cleanup waits for every human reconnect reservation to expire, as well as minimum room retention. Production grace remains 60 seconds; retention remains two minutes; cleanup remains every 30 seconds.
- Disconnect invalidates ready/rematch consent. Starts require every human seat connected. Timeout callbacks check their captured epoch and room identity; starting a match clears old timers.
- Reconnect requests a fresh authorized worker snapshot instead of sending the cached prior broadcast.
- Duplicate sequences awaiting the worker return `status: pending`; evicted completed replies return `status: already-processed`. Neither invents an `ok` result. Detailed cached replies preserve the actual worker result.

Executed checks:
- `npm test -- tests/server.test.ts`: seven real WebSocket tests passed, using independent ephemeral server ports and real match workers (9.98 seconds).
- `npx eslint src/server/app.ts tests/server.test.ts`: passed.
- `npm run typecheck`: passed.
- The ready/disconnect regression was first run against the old lifecycle and failed because the opponent started a match; it passes after the fix.

Transport evidence covers the existing seat isolation/fog/order/reconnect journey, malformed discriminator rejection, aged practice room retention during grace and collection after expiry, consumed rate budget on replacement with unaffected opponent, rejected duplicate results before/after the 128-response cache limit, disconnected ready/rematch consent, and a new epoch continuing past the old grace deadline. Reconnect after paid training verifies the fresh view includes the deducted resources.

Limits: cleanup/retention/grace are accelerated through server construction options for lifecycle tests; this is not a real 60-second outage/soak or two-device exercise. Reply processing uses a real worker; the immediate duplicate may arrive either before or after the first worker reply, and both branches must avoid a fabricated success. Browser UI, worker deterministic tick arbitration, deployment/TLS and full product acceptance are outside this session-focused evidence. Root integration must re-run these checks after worker batching changes.
