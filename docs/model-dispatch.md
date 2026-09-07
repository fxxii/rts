# Codex dispatch

## 1. Decide whether to delegate
Use native subagents only when current instructions authorize delegation and the live
tool supports it. This guide does not grant blanket delegation permission.
Delegate a bounded independent investigation, implementation slice, or fresh review
when it can improve quality or run alongside useful parent work.
Do known-path edits, small lookups and sequential debugging locally. File count alone
is not a reason to spawn. Batch independent tool reads without agents where sufficient.
If agents are unavailable or forbidden, work locally; record a missing independent review.

## 2. Brief before spawn
Read [delegation-templates.md](delegation-templates.md). Supply goal and motivation,
verified inputs/baseline, acceptance checks, owned paths, permitted actions and report
format. Confirm referenced types and files exist. Split by file ownership and dependency;
two agents must not edit the same file concurrently. Shared workspace is not isolation.
The parent retains requirements, integration, acceptance and user communication.

## 3. Model and effort
Inherit the user's Astra model and effort. For authorized new-worker selection:
- Implementation or task review: low.
- Final whole-change/pre-merge review: medium.
- Unresolved causal failure: consider higher effort with evidence and authorization.

Check model IDs, effort values, context inheritance and override rules in the live
schema before dispatch. Use a fresh context for reviewers. If overrides are unavailable,
omit them and record "inherited". Follow [Astra setup](astra-harness.md).

## 4. Return and lifecycle contract
Return status, conclusions, file:line evidence, checks with results, and remaining gaps.
Keep the final report around 30 lines; put long deliverables at the agreed artifact path.
Save completed units incrementally. For long work maintain a task ledger with baseline,
owned files, completed/remaining units, failures and exact next step.
Use the native tool's completion status, then inspect artifacts. A completed agent can
still have failed acceptance. A quiet terminal or marker alone proves neither correctness
nor completion of child processes.

Use the live tool's resume/follow-up mechanism for an idle worker. Reuse the implementer
for fixes; use a fresh context for independent review.
On interruption, inspect disk, diffs and active jobs first. Resume only missing work.
Do not launch duplicate writers because a notification said "failed."

## 5. Escalation with a bounded retry budget
One attempt plus at most TWO retries for the same subtask/hypothesis; changing models
counts as a retry. Keep exact failure, attempted fix, result, and ruled-out assumptions.
If a deliberately selected small model fails once, move to the authorized stronger tier.
If a mid-tier model fails twice, escalate with the full trail within the remaining budget.
On Astra, improve the brief, isolate the failure, or seek a fresh opinion before assuming
more effort helps. If effort changes are unavailable, say so and keep working with evidence.
After the cap, stop repeating the approach: reassess the cause, split the problem, or
surface the missing decision/access. Continue independent work; do not abandon the goal.
Do not reset the counter by renaming the same hypothesis.
Once a pattern is verified, apply it with a script or authorized lower-cost worker.
User-selected Astra remains the default unless the user accepts another model.

## 6. Review
Use [verification.md](verification.md). An independent reviewer sees requirements,
baseline and artifacts, not a transcript telling it why the author is right.
High-risk ambiguity can merit a second independent opinion. Agreement is not evidence;
require a discriminating test or surface the unresolved tradeoff to the user.
