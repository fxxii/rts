# Delivery workflow

Use for nontrivial features, cross-layer fixes, and multi-session work. Small changes
can use acceptance -> edit -> check -> report inline without creating plan files.
This workflow needs only files and normal Codex tools; no orchestration plugin is required.

## 1. Orient and establish the baseline
Read project facts and current handover; inspect branch/revision and existing changes.
Confirm the canonical requirement, reachable entry points and actual types before planning.
Compare plan status with the current ledger, working tree and evidence; none alone proves
completion. Record uncommitted source documents as well as HEAD when importing guidance.
Check necessary tools, test environment and deployment wiring early. Use a current code
index if available and useful, then read cited code; a stale graph is not evidence.
Follow the project's branch and worktree policy.

## 2. Design and slice
For a material design choice, record the decision and tradeoffs in an ADR.
Create one plan-of-record from [work-plan-template.md](work-plan-template.md). Map
every requirement to producer, consumer and verification; no boundary may be ownerless.
Each slice must deliver a coherent capability, including necessary config, deployment,
schema/permission consumers and tests. Put environment preparation first when later
verification depends on it. Plans stay subordinate to current user intent and live code.

## 3. Brief
Use the shared brief and implementation/refactor section in
[delegation-templates.md](delegation-templates.md), even for complex local work.
Reference the plan's acceptance criteria without paraphrasing away constraints.
Check named files, fields and signatures on the current baseline. Record owned paths
and dependencies plus exclusive test-resource ownership. Do not fence out a file required
by the brief's own data path. Execute risky embedded SQL/formulas on disposable fixtures
before prescribing them; reuse one definition across consumers instead of copying it.

## 4. Implement
Work locally by default. If delegation is authorized and valuable, use
[model-dispatch.md](model-dispatch.md): one worker context per coherent slice,
reuse it for task follow-ups and fixes, start fresh for an unrelated slice.
Keep parent ownership of the plan, integration, acceptance and any authorized git actions.
Workers own their code/tests, not shared policy or unrequested commits.
Use native lifecycle events and verify completed artifacts by read-back.

## 5. Review -> verify -> fix
Compare artifacts with the brief: correctness, scope, conventions and acceptance.
Execute relevant checks; do not accept a worker's unsupported success claim.
Use independent review for substantial changes when authorized and available; otherwise
label self-review. Send actionable findings back to the same worker. Apply the two-retry
cap in dispatch. A newly discovered brief contradiction is a brief-repair event, not
proof of coder failure; repeated identical BLOCKED reports still require a new approach.
Follow [review-checklist.md](review-checklist.md); adjudicate each finding as accepted,
rejected with evidence, or awaiting a decision. Every formal re-review is fresh; the
implementer keeps its context. A status monitor reports lifecycle only, not correctness.
Security-sensitive changes get a separate security review when authorized/available.
Serialize suite/reviewer/scratch writes to shared disposable resources.
Never restore from HEAD to undo a test mutation over uncommitted work: restore the exact
pre-mutation copy and verify it. Never revert another worker's changes automatically.

## 6. Integrate and exercise the user journey
Review the whole slice/branch against original requirements after task reviews.
Check interfaces between slices, old capability reachability, all invariant write paths,
and temporary-state cleanup. Run the relevant real journey in an isolated environment.
A passed task gate does not waive a failed integrated check. Record containment separately
from root-cause resolution; a known pre-existing defect is not automatically a release waiver.
Apply [verification.md](verification.md), including mock and live-environment blind spots.

## 7. Record and deliver
Record evidence/status in the plan, add only new reusable lessons, update HANDOVER.md.
When commits are authorized, inspect/stage only the intended changes after checks and review;
preserve unrelated work. Merge, push or release only within the user's existing authority
and the project's actual gates. No default automatic deployment or fabricated attribution.
Report delivered behavior, verification and remaining gaps. A live failure keeps that
acceptance criterion open even when all automated tests pass.

## Recovery
On quota loss, interruption or context pressure, save complete units and the ledger.
Inspect artifacts and active jobs before resuming. Preserve accepted steering and ownership.
Do not restart a whole slice, downgrade the selected model, or re-derive a failed terminal
completion heuristic. If an essential user decision remains, ask it while doing other work.
