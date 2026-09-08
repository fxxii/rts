# Review resolutions — 2026-09-08

Independent reviews are preserved as findings at the time of review. The following resolutions are integrator decisions, not reviewer approval of the full game.

| Finding | Decision and repair | Executed evidence |
|---|---|---|
| Security S1 malformed discriminant crash | Accepted; require string discriminants in transport/command decoder | Protocol red TypeError reproduced; focused protocol/real-WebSocket rejection passed |
| Security S2 inherited content names | Accepted; own-property build definition lookup | Prototype-shaped build IDs reject with unchanged complete-state hash |
| Security S3 reconnect reservation cleanup | Accepted; seat reservation deadlines precede room collection | Aged-room accelerated lifecycle transport test passed |
| Security S4 reconnect resets rate bucket | Accepted; authenticated bucket belongs to seat | Replacement cannot reset consumed budget; opponent unaffected |
| Security S5 callback-order forfeit/replay | Accepted; queued per-tick player/sequence ordering; simultaneous expiry draw; external inputs logged | Inputs/replay tests passed including terminal tick and reversed expiry arrival |
| Security S6 stale ready/rematch consent | Accepted; connected humans required, clear consent on disconnect, epoch-bound grace | Ready/disconnect and rematch/disconnect tests passed |
| Integration1 browser retry exhaustion | Accepted; repeated retries within grace, visible active-match recovery | Original production browser failed ten-second outage; repaired development browser passed and accepted another paid command |
| Integration2 corrected room join blocked | Accepted; bound membership separate from open socket; safe socket replacement | Invalid code then real code in same-page duel journey passed |
| Integration3 long construction route rejected | Accepted; read-only reachability capped at4096cells per construction command | Distant/detoured payment and enclosed unchanged-state regressions passed |
| Integration4 audio after reload | Accepted; reconnect gesture initializes actual audio | Real practice harvest/production playback and reload/reconnect audio passed |

Follow-up validation found a wall-clock/simulation-time assertion mismatch: ten wall-clock seconds can end a few ticks before a ten-simulation-second production queue. The outage test retains the actual ten-second interval and now awaits authoritative completion before asserting exactly four workers. It does not substitute an approximate count or an extra production command.

Current replay records include server-private seed, content version, accepted tick inputs, hashes every200ticks and final hash. They are retained only in room memory until rematch/collection; durable replay export and a precise executable-build fingerprint remain open release work. No live client gets those records.

No findings were waived by compiling alone. Human/real-device/full-content/long-session acceptance remains open.
