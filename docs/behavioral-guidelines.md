# Engineering workflow

Read for code changes. Start with project commands in [project.md](project.md).

1. Translate the request into observable behavior and a small acceptance list.
   For a multi-task feature, map each requirement to producer, consumer, and check.
2. Trace the actual entry point, factories, direct callers, data shape, and state owner.
   Read before writing. A plan's types and paths are hypotheses until checked on this revision.
3. Preserve existing capabilities when replacing a route, component, or composition root.
   List what the old path exposed; confirm each required capability remains reachable.
4. Put a shared invariant at the common boundary where possible. Find alternate writers,
   background jobs, retries, and admin paths; validating only the new endpoint is insufficient.
5. Give temporary state an owner, resource identity, expiry, and cleanup on success,
   failure, cancellation, disconnect, and restart. Check paired acquire/release operations.
6. Prefer existing helpers and conventions. Implement the smallest complete change.
   Simplicity never removes trust-boundary validation, error handling, or accessibility.
7. Reproduce behavior bugs with a focused regression when feasible. Fakes should preserve
   arguments affecting ownership, ordering, destination, or authorization.
   For critical conditionals, verify both arms; a targeted mutation can expose a weak test.
8. Verify with [verification.md](verification.md). Search the affected area for the same
   root cause; fix in-scope instances. Record unrelated findings without expanding the task.
9. On a surprising failure, record evidence and a reusable prevention rule in
   [learnings.md](learnings.md). Do not write a diary of routine commands.

If the brief names a nonexistent field or excludes a necessary file, report the exact
contradiction and repair the brief within scope. Do not invent a parallel data path.
