# 002 — Online human duel and bot practice

Status: approved by user, 7 September 2026.

Context: “1v1” could mean human PvP or human-versus-bot only. The supplied proposal recommends online PvP with practice.

Decision: support two human players online and one-human-versus-bot practice using the same authoritative rules. User replied “yes” to the explicit match-mode approval question.

Consequences: retain two authenticated player slots, authoritative commands, reconnect, results and rematch. The bot receives only permitted observations and submits normal commands, with no free resources or hidden-state access. Local bot matches do not establish online multiplayer acceptance. Networking is delivered by checkpoint C.

Alternatives and tradeoffs: bot-only practice would omit the approved online duel. Online-only would omit the approved practice mode. Both modes share simulation/content rules to avoid divergent mechanics.

Scope: reference edition/patch/DLC, other material rule choices and final written specification remain pending. Renderer approval is recorded separately in 001-renderer.md.

Evidence: conversation approval; plan/ironvale_design_pack/DESIGN.md sections 1 and 6. No superseding decision.
