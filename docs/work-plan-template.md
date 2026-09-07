# Work plan template

Copy to docs/plans/<task>.md only for work that benefits from a persistent plan.
Replace fields with verified facts; one canonical plan per task.

## Objective and baseline
- User outcome / acceptance:
- Scope and explicit non-goals:
- Workspace / revision / existing changes:
- Canonical requirements / accepted decisions:
- Runtime and disposable resources:
- Exclusive test-resource owner / release point:
- Unknowns requiring investigation or user choice:

## Requirement coverage
| Requirement / invariant | Producer / writer | Consumer / reachable entry | Owner / slice | Acceptance evidence |
|---|---|---|---|---|
| Fill one row per outcome, including existing capability parity | | | | |

## Slice ledger
| ID | Deliverable / owned paths | Dependencies | Status | Evidence / artifact | Next step |
|---|---|---|---|---|---|
| S1 | | | planned | | |

Statuses: planned, implementing, review, partially verified, complete, blocked.
Complete requires the listed acceptance evidence; attach limitations to partial results.

## Per-slice brief
Goal and why:
Exact inputs / types / signatures verified at baseline:
Allowed changes / file ownership:
Required config, deployment or migration companions:
Acceptance cases and commands:
Model / effort / agent handle if delegated:
Artifact and recovery ledger:
Known contradictions / escape-hatch decision:

## Failure trail
Attempt / hypothesis / exact safe error / evidence / ruled out / next action.
One initial attempt + at most two retries of the same subtask/hypothesis.

## Final integration and delivery
- Whole-change review against requirement rows:
- Finding adjudication: accepted / rejected with evidence / needs decision:
- Real user journey, runtime revision and environment:
- Negative cases, all writers, cleanup and capability parity:
- Required gates / unverified boundaries:
- Authorized commit or release action, if any:
- New lesson / ADR / handover updates:
