# Astra setup

1. Open Codex at the project root with Astra selected. Confirm loaded instruction
   sources and inspect conflicting global or nested overrides when necessary.
2. Fill [project.md](project.md) from actual manifests and commands.
3. Preserve the user's model/effort selection. Check the live tool schema before
   overriding worker settings; follow [dispatch](model-dispatch.md).
4. Use only available tools and skills. Configure permissions and external integrations
   for the project's actual needs.
5. Restart the session after entry-file changes to verify instruction discovery.

Keep instructions explicit about follow-through, conflicting guidance, concise output,
selective delegation and proportional verification. Load reference guides by task.
Use HANDOVER.md for durable state across context loss.

The runtime schema governs callable tools; API documentation governs API parameters.
Verify supported values before changing settings; do not infer API parameters from
host labels. Codex instruction layers may include AGENTS.override.md. Linked reference
files require reading when routed to.

References:
- [Astra guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [Astra model](https://developers.openai.com/api/docs/models/gpt-6-astra)
- [Instruction discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
