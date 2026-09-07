# Ironvale specification self-review

Status: self-reviewed for user review; not independent review and not implementation verification.

Reviewed against the user's full product contract, the supplied DESIGN.md, recorded approvals 001–003, project engineering/verification guidance and the installed architectural brainstorming workflow.

| Check | Finding and disposition |
|---|---|
| Approval accuracy | Renderer, language and online/practice mode are approved. “Latest” is recorded with dated source evidence. “Continue” authorizes progression but does not prove approval of separate ancient-era rulesets; specification submits that adaptation explicitly. |
| Full breadth | Retains all proposal systems/inventories and requires individual coverage. Added explicit ruleset handling for ancient rosters, rather than silently dropping them or assigning generic units. Actual reference inventory remains required implementation work and prevents completeness claims. |
| Scope | Campaigns/accounts/ladders/editor remain outside user-authorized scope. Separate ancient duel rulesets are a material proposal requiring this review. Released versus announced DLC is dated. |
| Economy invariants | Defines physical cargo, deposit credit, source/drop-off failure, atomic payments, blocked spawn retention, cancellation/destruction refunds and diminishing builders. Numerical reference data still requires sourced content acquisition. |
| Boundary consistency | Sim owns all outcomes; server owns external time/session binding. Disconnect-forfeit is recorded as an input so replay does not read a wall clock. Practice reuses server/rules. |
| Hidden-state leaks | Added per-view opaque IDs, visibility-filtered events, generic hidden-blocker rejection and post-match-only full replay export. All client presentation derives from the filtered view. |
| Lifecycle | Explicit seat/socket replacement, sequence replay protection, match epoch reset, rematch consent, passenger identity and cleanup. Server crashes are interrupted matches rather than a false reconnect guarantee. |
| Victory ambiguity | Defined completed production-capable buildings independently of current funds/pop room; passengers stay alive for elimination; simultaneous outcomes draw. |
| Navigation boundedness | Shared/coarse routes, obstacle revisions, deterministic work budgets, stable scheduling and bounded failed recovery; no terrain-crossing fallback. |
| Audio | Preserve pack, format fallback, buses, budgets, event wiring, loop transitions and source cleanup; synthetic voice status remains honest. |
| Acceptance | Each A–F gate requires integrated evidence. Production, two-client/two-device, adversarial network, performance distribution and human gates are distinct. No passing tests or runnable game claimed. |
| Process | Written draft is submitted for consolidated design/spec approval to avoid more isolated routine questions. Implementation plan follows approval. No scaffolding before the gate. |

No unresolved placeholder is presented as a working mechanic. Proposed initial numerical policy defaults are explicit and subject to this review. Content source acquisition, exact dependency selection and hardware measurement are engineering tasks with stated evidence requirements, not invented achievements.

Documents checked by read-back and local-link validation. Application tests and the PowerShell template check were not run: no application exists and PowerShell is not available on PATH. The design is ready for user review, not a claim of game completion.
