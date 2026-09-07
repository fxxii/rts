# Codex + Astra project starter

## Start a project

1. Copy AGENTS.md, README.md, HANDOVER.md, docs/, tools/ and .gitignore into the project.
   Merge existing instructions and ignore rules; preserve a backup before overwriting.
2. Open Codex at the project root with Astra selected. Confirm loaded instructions.
3. Fill [project facts](docs/project.md) from actual code and configuration.
4. Give a concrete outcome: "Implement <outcome>. Follow docs/workflow.md and verify
   the user journey." Small edits need only acceptance, implementation and checks.
5. Run `powershell -NoProfile -File tools/check-template.ps1`, then project checks.
   The template checker requires PowerShell and validates documentation structure.
6. Keep current work in [HANDOVER.md](HANDOVER.md) and record reusable lessons in
   [docs/learnings.md](docs/learnings.md).

## Working guides

Use [AGENTS.md](AGENTS.md) to load only the guide relevant to the task.

| Need | Guide |
|---|---|
| Deliver a feature | [Workflow](docs/workflow.md), [plan template](docs/work-plan-template.md) |
| Implement or debug | [Engineering](docs/behavioral-guidelines.md), [domain checks](docs/domain-checks.md) |
| Verify and review | [Verification](docs/verification.md), [review checklist](docs/review-checklist.md) |
| Delegate authorized work | [Dispatch](docs/model-dispatch.md), [brief templates](docs/delegation-templates.md) |
| Resolve uncertainty | [Decision rubrics](docs/judgment-rubrics.md) |
| Run services or data tests | [Runtime safety](docs/runtime-safety.md) |
| Configure Astra or maintain guidance | [Astra setup](docs/astra-harness.md), [maintenance](docs/maintenance-protocol.md) |
