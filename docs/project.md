# Project facts

Ironvale is an approved desktop-first Three.js/TypeScript RTS. The complete contract lives in [the approved specification](ironvale-spec.md), with decisions in `docs/decisions/`. The current implementation is a **development slice**, not the full approved game.

- Branch: `ironvale/foundation`; original inputs and approval preserved in baseline commit `35f201f`.
- Runtime: npm scripts use the pinned local Node 24.13.0. Strict TypeScript 5.9.3, Three.js 0.185.1, Vite 8.2.2, ws 8.21.3; all versions and lockfile in package files.
- Entry points: `src/server/index.ts` starts HTTP/WebSocket rooms; `src/server/match-worker.ts` owns each match; `src/client/main.ts` composes renderer, HUD, input and Web Audio.
- Rules: `src/sim` is renderer-free; `src/content` typed development catalog; `src/protocol` intention validation and permitted views; `src/bot` consumes only those views.
- Start: `npm ci`, `npm run dev`, open `http://127.0.0.1:5173`. Health: `http://127.0.0.1:3001/health`.
- Verification: `npm run typecheck`, `npm run lint`, `npm test`, `npm run validate:assets`, `npm run headless`, `npm run test:browser`, `npm run build`. Chromium install: `npm exec -- playwright install chromium`.
- Production: `npm run build`, then `npm start`, open `http://127.0.0.1:3001`. Build verifies/copies original audio before bundling.
- Test environments: in-memory matches, ephemeral loopback server tests, disposable Chromium contexts. No accounts, cloud credentials, databases, paid services or LLM runtime.
- Inputs: original pack in `plan/ironvale_design_pack`; ZIP inspection/hashes and missing inputs in [intake](ironvale-intake.md). Served audio is an ignored, reproducible verified copy in `public/audio`; predev/prebuild synchronizes it from the canonical pack.
- Coverage: `docs/content/coverage.json` contains 1,466 separate reference records; records are not proof of implementation. Full roster, naval/ancient rulesets and other A–F acceptance remain open.
- Evidence: `docs/evidence`; next task and actual check status in [handover](../HANDOVER.md). Preserve unrelated guidance/backups.

Human playtests, real two-device networking and the reference-machine performance targets remain unverified. No A–F completion is claimed.
