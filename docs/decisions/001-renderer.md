# 001 — Three.js with strict TypeScript

Status: approved by user, 7 September 2026.

Context: “web.js” was ambiguous. The supplied design recommended Three.js with TypeScript and considered Babylon.js as an alternative.

Decision: use Three.js with strict TypeScript. User replied “approve” to the explicit question approving that interpretation.

Consequences: rendering stays in client; authoritative simulation remains renderer-free. Exact dependency versions and APIs require current official-documentation checks before selection. No dependencies installed yet.

Tradeoff: Three.js fits the proposed browser presentation; RTS rules and navigation remain separately implemented systems under the supplied design. Babylon.js was considered but is not selected.

Scope: this approves the renderer/language interpretation only. Match mode, reference edition/patch/DLC, remaining material rules and final written specification still await review.

Evidence: conversation approval; plan/ironvale_design_pack/DESIGN.md sections 1–2. No superseding decision.
