# Decision rubrics

Apply only the relevant row. Positive examples show using the rule; counterexamples
show a misuse. These checks support judgment; they do not resolve taste by voting.

| Decision | Executable criterion | Positive example | Counterexample |
|---|---|---|---|
| Escalate reasoning | Same failure persists after evidence-led attempts, or competing causal explanations survive a probe. Pass the failure trail; observe dispatch retry cap. | Race moves between layers: isolate ordering and seek fresh review. | Upgrade models for a missing executable before checking PATH. |
| Complete: scope | Match every requested outcome to an artifact and observed acceptance evidence. | Email and phone validation each exercised. | Phone assumed correct because email passed. |
| Complete: execution | Confirm the final artifact/revision and actual command result; include blind spots. | Runtime probe uses new image; live storage remains explicitly unverified. | Agent said done, so feature works. |
| Complete: integration | For cross-layer work, check seams, reachable capabilities and alternate writers. | Both UI close actions enforce disposition through common service. | New endpoint passes; old close action unexamined. |
| Ask the user | After available investigation, the answer changes product intent, irreversible effects, external authority or meaningful tradeoffs. Continue independent work. | Retention period has two conflicting business requirements; request a decision. | Ask which existing formatter to use when config already specifies it. |
| Carry authorization | Check current and earlier user instructions before adding a permission stop. Prepare reviewable work first. | User requested route changes: update the required code and docs. | Ask again to edit docs already covered by the request. |
| Change direction | Evidence contradicts the premise, retries repeat, or a proposed fix disables a safeguard. | Mock loses resource ID: repair the fake and trace the real target. | Increase timeout repeatedly without checking whether work was delivered. |
| Quality floor | Choose a check able to fail for the plausible defect. Check both sides of critical boundaries. | Authorized tenant succeeds and wrong tenant fails; fake records tenant ID. | Test counts rise but fake discards tenant ID. |
| Bound scope | A fix needs another file on the actual data path: update the brief within authorized scope. | Factory must forward the new dependency; include it. | Add a new field to an unused type to satisfy a mistaken brief. |
| Unresolved taste | Supply concrete alternatives and a recommendation; ask for preference when the choice materially changes the result. | Show two interaction flows with tradeoffs. | Three agents prefer an option, therefore it is objectively correct. |

## Done checklist
All requested artifacts exist; acceptance is checked; final-state evidence is recorded;
unresolved essentials are explicitly named; the report separates implemented, tested,
live-verified and unverified. An unavailable essential check means partially verified,
not an invented pass. Save the next executable step in HANDOVER.md for unfinished work.

See [verification](verification.md), [dispatch retry mechanics](model-dispatch.md),
and [maintenance](maintenance-protocol.md) for operational detail.
