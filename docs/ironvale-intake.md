# Ironvale input audit

Status: inspection complete; design approval pending. No game implementation started.

## Inputs and workspace

- Root: `/Users/gram/Workspace-rts`. Existing project guidance, backups, tools and design/audio pack preserved.
- `git status --short`: exit 128, not a Git repository. No branch, HEAD or tracked-change baseline exists.
- Bounded `rg --files --hidden` inventory: no application package manifest, lockfile, source tree or game tests found. Existing `tools/check-template.ps1` checks documentation only.
- Read root AGENTS.md, project facts, workflow, handover, README, maintenance guidance, installed brainstorming workflow and its Codex adaptation. No nested instructions in the supplied pack.
- Read `plan/ironvale_design_pack/DESIGN.md`, README.md, manifest metadata/event and asset records, VALIDATION.json results, and both audio tools. DESIGN.md is explicitly a proposal.
- ZIP: `/Users/gram/Downloads/ironvale_design_and_audio.zip`.
- ZIP SHA-256: `5121016fb257d5f908c89f8ff56f36b1ec2a17a5d5706b4add31300443a35a98`.
- Checked archive names for traversal, absolute paths, duplicate paths and symlinks; bounded expanded size to 512 MiB. Python zipfile.testzip() returned None (CRC check passed).
- Safely extracted into new `temp/ironvale-input-audit-o6y15zhn/`; 288 entries, 45,887,421 bytes. All 288 files match existing plan files by SHA-256. Nothing overwritten.
- `ironvale_game_design.md` and `Pasted markdown(7).md` not found in workspace or accessible Downloads/Documents search. Desktop search denied by OS. Neither is inside the ZIP; DESIGN.md supplies the game proposal. Installed brainstorming skill used, without claiming it is the missing pasted file.

## Audio evidence

- Python standard-library audit checked both encodings of all 139 manifest assets: 278 existing files, zero SHA-256 mismatches. All 79 event mappings have variants and refer to existing asset IDs.
- Manifest SHA-256: `dc568e15646fb15cb9f02db79d8aa8ab679a50bf886f09c3d28be725b3bc5251`.
- Supplied VALIDATION.json reports PASS and 278 decoded files. This is supplied evidence, not a fresh decoder run.
- Local Python has numpy/scipy but lacks soundfile; full supplied validator not rerun. Assets and original validation report unchanged; generator not run.
- Browser decoding, listening, loop playback, mixing and in-game event wiring remain unverified.
- Provenance: procedural synthesis with seed 739174; 20 eSpeak synthetic placeholder voices remain honestly labeled. Preserve source/provenance on integration.

## Decision register

Renderer and match-mode approvals are recorded below. Other interpretations remain proposals.

1. APPROVED: Three.js with strict TypeScript for “web.js”. User replied “approve” to the explicit renderer question. See decisions/001-renderer.md. This does not approve the remaining design decisions.
2. APPROVED: two humans online plus one-human-versus-bot practice using identical rules. User replied “yes” to the explicit match-mode question. See decisions/002-match-mode.md.
3. Content: preserve every requested system and individually map every approved unit, building, technology and civilization distinction. User selected “latest”. Resolved to latest released DE PC reference as of 2026-09-07; latest numbered official notes found: 177723. Separate ancient-era duel rulesets are now proposed in the consolidated specification, awaiting approval. See decisions/003-reference-version.md; family tables do not establish full coverage.
4. Trade: supplied proposal permits vulnerable routes to eligible opponent-owned markets/docks, prohibits own-to-own routes and adds no neutral market. Approval and reference verification pending.
5. Supplied defaults for victory, reconnect grace and performance hardware remain proposals; human enjoyment and real two-device gates remain required.

User contract fixes the delivery order A–F, simulation/content/protocol/server/client/bot boundaries, server authority, fog as a network boundary, original assets, no runtime model dependencies, and explicit human playtesting. Earlier milestones never reduce final scope.

## Next steps and gates

Obtain material decisions one at a time using the existing proposal; review the resulting design, save and self-review its written specification, obtain written-spec approval, then use writing-plans for an executable implementation plan. No scaffolding before approval.

Before API/dependency selection, check current official documentation and pin compatible versions. Node v25.6.1 and npm 11.9.0 are available. PowerShell, ffmpeg and ffprobe were not found on PATH. Build/typecheck/lint/game/browser tests do not exist yet and were not run. No runnable game or checkpoint A–F completion is claimed.

## Consolidated design review

User directed “continue” after the ancient-era scope question. A concrete [specification](ironvale-spec.md) and [self-review](ironvale-spec-review.md) now combine the remaining content, trade, lifecycle and architecture proposals for one review. No additional approval is inferred. No implementation scaffold exists. Next gate: approve the written specification, then writing-plans and implementation.
