# Project facts

| Field | Value |
|---|---|
| Product and user outcome | Ironvale: playable desktop-first 3D browser RTS, approved online human duel and same-rules bot practice |
| Stack and pinned versions | Approved strict TypeScript + Three.js; proposed Vite, Node/WebSocket, Vitest, Playwright; version selection pending |
| Entry points and composition roots | None; no application source or package manifest exists |
| Canonical requirements / accepted design | User product contract and recorded approvals; `docs/ironvale-spec.md` is the consolidated draft awaiting approval; original proposal preserved |
| Key invariants | Authoritative renderer-free rules; fog filters network state; deterministic same-build replay; no runtime LLM; full individually audited approved content |
| Test command and working directory | UNKNOWN; game tests not created |
| Lint / typecheck / build commands | UNKNOWN; no application configuration |
| Dev startup and readiness probe | UNKNOWN; no runnable game |
| Disposable test environment identity | None yet |
| Runtime revision / image check | No Git repository; local Node v25.6.1, npm 11.9.0 |
| Required CI gates | User requires simulation, adversarial networking, browser, production, performance and human playtest evidence |
| Non-obvious conventions | Preserve supplied audio/provenance; preserve unrelated template/backups; record proposals separately |
| Protected external systems / release policy | No paid services or destructive/material architecture changes without approval; no external release configured |

Reference selection: latest released DE as of 2026-09-07; see [reference decision](decisions/003-reference-version.md), including unresolved ancient-era DLC coverage.

Input locations, hashes, inspection evidence and unresolved decisions: [Ironvale intake](ironvale-intake.md).
Current next action: [handover](../HANDOVER.md).

Template-only check: `powershell -NoProfile -File tools/check-template.ps1` from root.
PowerShell is unavailable on PATH; this command has not been verified here and does not test gameplay.
