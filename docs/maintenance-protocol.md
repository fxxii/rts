# Maintain the harness

Current user authorization applies to harness edits too. This protocol does not create
extra approval rounds for work the user already requested.

## Scope and authority
- Within the requested task, update project facts, broken links, examples, lessons,
  obsolete tool guidance, and duplicated rules autonomously. Report material policy changes.
- Ask only for missing user decisions or consequential external actions outside existing
  authorization. Permission restrictions from the host remain binding.
- Before changing an existing harness file, preserve a backup copy outside active routing
  (or an explicitly agreed versioned equivalent). Never overwrite an uncommitted original.
  Backups may contain private material: keep local, exclude from exports and version control.

## One fact, one home
| Content | Location |
|---|---|
| Project facts, commands, runtime identity references | [project.md](project.md) |
| Current objective, verified progress, jobs, next step | [../HANDOVER.md](../HANDOVER.md) |
| New surprising failure and reusable prevention | [learnings.md](learnings.md) |
| Reusable domain checks | [domain-checks.md](domain-checks.md) |
| Durable architectural or policy choice | New numbered file in decisions/ |
| Tool/model facts and dated official sources | [astra-harness.md](astra-harness.md) |

Learning entry: date + trigger + evidence (file/revision or issue) + failure mechanism +
next-time action + scope/expiry. Keep each entry around 100 words. Record facts, not
credentials, transcripts, user-specific contact data, or undocumented model folklore.
ADR: status, context, decision, alternatives, consequences, evidence, supersession link.

## Prune when touching a file
- AGENTS.md: aim <=60 lines and <=700 words. Keep only frequently needed rules/routes.
- Each operational guide: aim <=150 lines. Split optional reference material by trigger.
- learnings.md: at 20 entries or 2,000 words, promote recurring patterns into the relevant
  guide, archive raw history outside startup routing, and retain provenance.
- HANDOVER.md: current state only, aim <=100 lines; archive completed task history.
- Keep stable lesson IDs and historical ADRs; mark superseded, do not silently rewrite history.
Keep active guides action-oriented. Put incident narratives, migration reports and source-project
provenance outside the reusable template; retain the resulting checks in the relevant guide.
These are editorial budgets, not model context limits.

## Validate the change
1. Re-read edited content; check rules for contradiction and executable examples.
2. Update README and incoming links when routes or files change.
3. Run the template checker and any affected project-specific checks.
4. For a substantive policy rewrite, request a fresh-context review when authorized and
   available. Without it, explicitly label local review and its limitation.
5. Report what changed, why, evidence, and any remaining adoption work.
No mandatory plugins or slash commands are needed to write a lesson or ADR.
