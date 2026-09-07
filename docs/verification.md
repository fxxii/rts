# Verification and completion

## Pick the smallest sufficient checks
| Change | Evidence required |
|---|---|
| Docs or low-impact config | Read back changed content, validate syntax/links and affected references |
| Behavior bug or feature | Focused behavior test, relevant regression checks and project-required gates |
| Factory / route / UI composition | Exercise production entry path; confirm wiring and capability reachability |
| Multi-task feature | Review the combined diff against original requirements, including task boundaries |
| Auth, tenancy, data loss, concurrency | Positive and negative cases, wrong-identity checks, failure/cleanup path |
| User-visible or external integration | Representative real journey on isolated runtime, or explicit unverified status |

A full suite is required when project policy requires it or broad shared behavior changed.
Do not invent a full-suite floor for a typo. Do not write tests that merely restate an edit.
Once relevant checks pass, repeat only for changed artifacts or unresolved evidence.

## Integration checklist
- Record revision/worktree and verify the runtime includes the changed code.
- Start from the app's real composition root. Do not inject wiring the app lacks.
- Enumerate all paths that can reach a guarded state: UI, API, job, retry, alternate action.
- Track resource identity through every layer; inspect factory forwarding and fake records.
- Check temporary state exits on success, error, cancel, disconnect and timeout as applicable.
- For UI replacements, compare old/new capability reachability and inspect the rendered app.
  DOM presence does not prove an icon rendered, controls fit, or a user can reach the feature.
- For high-impact conditional fixes, challenge both branches. Restore mutations before
  final verification; if tests survive the relevant mutation, repair the coverage.
  Use exact threshold values, window-spanning rows and distinct values for fields that
  might be confused. Assert the specific output/cell, not a matching value anywhere.
- For async checks, await the last effect the assertion needs, not an earlier event or
  a fixed sleep. Keep unrelated known flakes documented rather than widening the change.
- Verify test resources are disposable using [runtime-safety.md](runtime-safety.md).
  Coordinate resource ownership with reviewers before starting a suite.

## Independent review
When delegation is authorized and available, use a fresh-context reviewer for nontrivial
integrated changes, with requirements, baseline, artifacts and test commands, not the
author’s persuasive reasoning. Review the whole change, not just each task separately.
A review supplements executed checks. Resolve findings and recheck affected behavior.
Use [review-checklist.md](review-checklist.md) as the single checklist. Reviewers write
findings only; they do not apply fixes. Adjudicate each finding: accept and verify a fix,
reject with evidence, or escalate a missing decision. For a formal re-review after fixes,
start a fresh context with updated artifacts and original requirements. Reuse the
implementer, not the reviewer. An empty report without checked scope/evidence is inadequate.
For security-sensitive work, add a separate fresh security review when delegation is
authorized and available; record missing independent assurance if unavailable.
Without a reviewer, run the same checklist locally and explicitly label review as
self-review; do not manufacture an independent-review claim or block trivial work.

## Completion report
Use only claims supported by observed evidence:
- Delivered: acceptance criteria satisfied and changed paths.
- Verified: command/probe, revision/environment where relevant, decisive result.
- Limits: skipped checks, mocked boundaries, unavailable live journeys, remaining issues.

Example: "Focused tests passed; object storage was mocked. Upload code is implemented,
but real storage integration remains unverified." Avoid "everything works: 654 passed."
If an essential acceptance check cannot run, mark the task partially verified and retain
the concrete next check in HANDOVER.md; complete other authorized work meanwhile.
