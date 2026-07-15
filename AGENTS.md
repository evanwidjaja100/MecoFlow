# MECO Flow repository guide

Before changing code, read `docs/PRODUCT_REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_MODEL.md`, `docs/SECURITY_MODEL.md`, `docs/AUTHORIZATION_MATRIX.md`, `docs/API_CONVENTIONS.md`, `docs/TEST_STRATEGY.md`, `docs/IMPLEMENTATION_STATUS.md`, applicable accepted ADRs, and any nested `AGENTS.md`.

- Use TypeScript strict mode and preserve the modular-monolith boundaries.
- Controllers call application services; application services call policies/domain services and repositories; only repositories access Prisma.
- Validate every trust boundary. Enforce authorization server-side and deny by default.
- Never bypass guards, directly set workflow states, delete audit events, expose secrets, or weaken tests.
- Do not add a dependency without documenting necessity, security, and maintenance impact.
- Add or update tests for every behavior change. Use repository scripts for verification and report commands exactly.
- Update affected documentation and `docs/IMPLEMENTATION_STATUS.md` after meaningful work.
- Report assumptions, security implications, unresolved risks, and limitations.
- Do not begin a later implementation phase unless the user explicitly requests it.

When documentation conflicts, the latest accepted ADR governs architecture, `PRODUCT_REQUIREMENTS.md` governs behavior, and the security model plus authorization matrix govern access control. Report unresolved conflicts.
