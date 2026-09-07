# Fresh review checklist

For authorized independent reviews; also usable as explicitly labelled self-review.
Read original requirements, exact baseline/target and relevant changed code/callers.
Write findings only to the agreed report. No source edits or fixes. Read-only git
inspection is allowed when the brief permits it; never infer permission to commit.
Tests need explicit disposable-resource ownership and allowed artifact paths.

## Correctness pass
1. Map each requested behavior to reachable code and evidence; check untouched callers.
2. Inspect contracts across process/type boundaries, dependency factories and shared rules.
3. Challenge alternate writers, error/timeout/cancel cleanup, and wrong-resource actions.
4. Check preserved UI capabilities, real composition, computed styles and asset wiring.
5. Ask which plausible defect each test can detect. Use distinct field values, boundary
   inputs and both conditional arms; note skipped suites and mocked dependencies.
6. Compare artifacts against the supplied baseline, including pre-existing changes.
   A changed path is not proof this worker authored it. Do not discard unrelated work.
7. State exactly what you checked. No findings without coverage evidence is incomplete.

## Separate security pass when relevant
Trace attacker-controlled input through actual reachable code to the operation.
Check authorization and tenant identity at the resource, injection/path handling,
session boundaries, sensitive output, and audit-before-side-effect where required.
Exercise allowed and denied cases, including wrong tenant/resource; distinguish
unproven suspicion from a demonstrated defect. Check dependency advisories against
current primary sources if making a vulnerability claim.

## Report and adjudication
For each finding: severity, file:line, concrete failure/attack path, violated requirement,
smallest fix suggestion and a check that would catch it. Include checked scope and limits.
The parent records accept / reject with evidence / escalate, then executes acceptance
checks. Formal re-review gets a new context; implementation fix rounds reuse the coder.
A lifecycle monitor can report completion and artifact location, never approve findings.
