# Domain checks

Read only rows relevant to the change. Apply general implementation and verification
rules from [engineering](behavioral-guidelines.md) and [verification](verification.md).

| Trigger | Check |
|---|---|
| Multiple layers filter one signal | Assign one gate owner; preserve the information downstream consumers need. |
| Provider-specific model integration | Verify actual message/tool contracts and malformed-response handling with that provider. |
| OIDC or signing-key parsing | Exercise realistic mixed key payloads; select signing keys according to the verification contract. |
| Shared UI primitives | Reuse semantic mappings and supported variants; verify overrides in computed styles. Mount shared assets at the application shell. |
| Time-series intervals | Define deterministic tie-breaking once; preserve it in window calculations and final ordering. Exercise shuffled arrival and equal timestamps. |
| Shared metrics | Share definitions and thresholds across consumers. Check parameter order and runtime changes cannot make displayed definitions diverge from computed values. |
| Time windows and ratios | Use exact-edge and window-spanning fixtures. Include rows that each exclusion must remove; verify numerator and denominator separately. |
| Live dashboards | Distinguish connection state from data freshness. Display timestamps and stale status; preserve meaningful zero and stale positive values separately from unavailable values. |
| Cross-process data shapes | Exercise each legitimate production representation, including actual domain types and decoded wire data. |
| Authorization route changes | Identify seed, fixture, runtime check and generated inventory companions. Ship coupled artifacts together; regenerate inventories and inspect semantic changes. |
| Generated configuration | Write to the authoritative declaration consumed at startup; verify regeneration does not erase the change. |
| Database backfills | Verify equivalence, idempotence and remaining-work behavior. Avoid repeated expensive scans after completion. |
| Runtime configuration | Check effective mount sources and parent readability, including nested mounts; cached in-memory state cannot establish current config health. |
| Merge-aware scanners | If deduplicating known content, compare exact blobs against merge parents. Scan new conflict resolutions and edits. |
| Retrieval-backed answers | Check that evidence supports the answer, including refusal cases. Recalibrate after corpus changes; retrieval scores and citations alone do not establish truth. |
| Deferred feature scope | Record an owner and destination in the plan/backlog, including dependencies and the decision needed to resume. |
