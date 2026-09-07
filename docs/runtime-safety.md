# Runtime and shell checks

## Before tests that mutate data or start services
1. Inspect setup/teardown and identify databases, buckets, volumes and remote endpoints.
2. Verify the effective configuration selects a coherent disposable stack. A database
   suffix alone cannot prove the object store or audit volume is isolated.
3. If any target is shared, pilot, production, or unknown, do not run destructive tests
   against it. Prepare an isolated environment when authorized; run safe checks meanwhile.
4. For a new worktree, verify ignored mount inputs, secrets provision, certificates,
   seed data, ports and volumes. A new checkout does not inherit runtime readiness.
5. Verify running revision/image contents, then readiness and one real round trip.
   Recreating a container does not rebuild its image; a healthy process may still be cold.
6. Clean up only resources this task owns, after checking their resolved identity.

Give each disposable database/bucket/volume one active test owner. Reviewer tests and
scratch seed/mutation scripts also count: serialize them with the suite, or provision
separate resources. A run overlapped by another process's cleanup is invalid evidence,
not a flaky test. Put resource ownership in the brief and release it when the run ends.

## Secrets and Windows
- Never print raw secret-bearing files, rendered secret configs, connection strings,
  or their diffs. Inspect key names and report equality/change booleans. Keep comparison
  hashes local; hashes of low-entropy secrets can also leak information.
- Preserve file encoding and newline contracts. PowerShell 5.1's UTF-8 writer adds a BOM.
  For a BOM-free file use .NET UTF8Encoding(false); verify bytes without revealing values.
- Use the active shell end-to-end. On Windows use literal resolved paths for file actions.
  Before recursive move/delete, verify the absolute target is inside the intended root.
  Never pass enumerated PowerShell paths into cmd/batch deletion commands.
- Treat shell command strings as code. JSON serialization is not shell escaping.
  Use literal here-strings or files for long text; avoid interpolating untrusted content.
  For scoped queries, prefer process argument arrays; require a nonempty variable/field
  name and reject a missing selector before executing any command that defaults to a dump.
  Redact output at the source, not only in the final report. If exposure occurs, stop the
  command shape, report where values landed without repeating them, and follow the
  project's credential incident/rotation procedure within existing authorization.
- If using Git Bash, test container-path conversion in arguments AND environment values.
- Use one background mechanism. Track the actual process/tool session to completion.
  Terminal quietness, accepted input, or a wrapper's exit is not proof the job finished.

## Hard limits
Instructions are not access controls. If a project requires enforced commit, deployment,
or data boundaries, configure appropriate sandbox permissions, separate credentials and
CI/server controls. A local hook is helpful but bypassable. Do not describe this template
as enforcing controls it does not install.
