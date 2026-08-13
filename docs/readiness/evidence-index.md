# Evidence index

## Source baseline

- Branch: `main`
- Entry HEAD: `434a89cf1c88d3c84bf22211eba863ef19768122`
- Remote: `origin https://github.com/evanwidjaja100/MecoFlow.git`
- Entry worktree: dirty; see `worktree-reconciliation.md`
- Lockfile SHA-256: `99CA92F59DC8DC6F441CBD300A549AE7990F9DB081B775B4A7610B43A840B1BB`
- Container policy SHA-256: `46CB9E3E22256C60FF4047C0C1F0D6B0AD4355C1796D3E705EC0A2844B296EDC`
- Migration head: `20260728030000_phase_9b_readiness_query_index`
- Migration provider: PostgreSQL
- Local tools: Node `24.18.0`, pnpm `11.13.0`, Docker CLI `29.6.1`, Compose
  `5.2.0`, Git `2.55.0.windows.2`, GitHub CLI `2.97.0`, ripgrep `15.1.0`;
  `psql` unavailable and Docker daemon unavailable at entry.

The entry SHA identifies the last committed source, not the current Phase 0
implementation. No owner-approved Phase 0 committed SHA exists yet.

## Diagnostic run log

Diagnostic results from a dirty worktree help find defects but are not
immutable closure evidence.

| Date       | Command                                     | SHA/worktree                      | Environment/prerequisites                                            | Exit         | Count/notes                                                                                                                  | Evidence location                                                                                 |
| ---------- | ------------------------------------------- | --------------------------------- | -------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 2026-08-10 | GitHub Actions run `31388229140`            | clean committed `434a89c`         | GitHub-hosted runner; pre-Phase-0 workflow                           | 1            | Verify failed during seed and skipped subsequent gates; container scan failed; zero retained artifacts                       | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31388229140`; historical diagnostic only |
| 2026-08-11 | `pnpm governance:test`                      | `434a89c` + dirty Phase 0 tree    | Windows; Node/pnpm available                                         | 0            | Latest run: 58 tests passed; 0 failed/skipped/todo                                                                           | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `pnpm governance:check`                     | `434a89c` + dirty Phase 0 tree    | Required repository files present                                    | 0            | In-repository checks passed                                                                                                  | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | GitHub control-plane read                   | remote `main` at repository state | Authenticated `gh`; read-only                                        | blocked      | protection/rulesets HTTP 403; 0 environments; Actions default read                                                           | `ci-governance.md`; immutable API output still required                                           |
| 2026-08-11 | Docker prerequisite probe                   | local workstation                 | Docker CLI installed                                                 | blocked      | daemon pipe unavailable                                                                                                      | Current task tool output                                                                          |
| 2026-08-11 | Missing-DB negative probe                   | `434a89c` + dirty Phase 0 tree    | `DATABASE_URL` removed                                               | 1 (expected) | Integration command prerequisite failed before Vitest                                                                        | Current task tool output                                                                          |
| 2026-08-11 | `pnpm security:image-scan:test`             | `434a89c` + dirty Phase 0 tree    | Node/policy files                                                    | 0            | Latest run: 7 passed; zero failed/skipped/todo                                                                               | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | Production/operations/capacity policy tests | `434a89c` + dirty Phase 0 tree    | Local policy fixtures                                                | 0            | 8 + 6 + 6 passed; zero skipped/todo                                                                                          | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `git diff --check`                          | `434a89c` + dirty Phase 0 tree    | Git available                                                        | 0            | No whitespace errors after correction                                                                                        | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `pnpm format:check`                         | `434a89c` + dirty Phase 0 tree    | Installed workspace dependencies                                     | 0            | All matched files passed Prettier                                                                                            | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `TURBO_FORCE=true pnpm lint`                | `434a89c` + dirty Phase 0 tree    | Installed workspace dependencies                                     | 0            | 9/9 tasks passed; 0 cached                                                                                                   | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `TURBO_FORCE=true pnpm typecheck`           | `434a89c` + dirty Phase 0 tree    | Prisma generation available                                          | 0            | 9/9 tasks passed; 0 cached; Prisma Client 7.9.0 generated                                                                    | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `TURBO_FORCE=true pnpm test`                | `434a89c` + dirty Phase 0 tree    | Unit manifest prerequisite passed                                    | 0            | Latest run: 14/14 tasks, 44 files/233 tests passed; 0 cached and no skipped/todo                                             | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `pnpm openapi:check`                        | `434a89c` + dirty Phase 0 tree    | OpenAPI generator available                                          | 0            | Generated contract matched the checked-in contract                                                                           | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `TURBO_FORCE=true pnpm build`               | `434a89c` + dirty Phase 0 tree    | Local build-time configuration                                       | 0            | 9/9 tasks passed; 0 cached                                                                                                   | Current task tool output; must rerun with approved values from committed SHA                      |
| 2026-08-11 | Required DB-backed suite commands           | `434a89c` + dirty Phase 0 tree    | `DATABASE_URL` deliberately absent                                   | 1 (expected) | Integration, authorization, and E2E each failed before their required suite                                                  | Current task tool output; proves fail-closed guard only                                           |
| 2026-08-11 | DB migrate/seed (`…_b`)                     | `434a89c` + dirty Phase 0 tree    | Fresh Docker PostgreSQL database                                     | 0            | All 22 migrations and authoritative seed completed; database retained                                                        | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `pnpm test:integration` (`…_b`)             | `434a89c` + dirty Phase 0 tree    | Incorrect `APP_ENV=test`                                             | 1 (invalid)  | Throttle suite intentionally skipped by that app mode; attempt rejected                                                      | Current task tool output; retained diagnostic database                                            |
| 2026-08-11 | DB migrate/seed (`…_c`)                     | `434a89c` + dirty Phase 0 tree    | Fresh Docker PostgreSQL database                                     | 0            | All 22 migrations and authoritative seed completed; database retained                                                        | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `TURBO_FORCE=true pnpm test:integration`    | `434a89c` + dirty Phase 0 tree    | `APP_ENV=ci`; isolated DB `…_c`                                      | 0            | 09:34:09–09:37:16 +07; 14/14 tasks, 0 cached; 29 files/116 tests passed                                                      | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-11 | `TURBO_FORCE=true pnpm test:authorization`  | `434a89c` + dirty Phase 0 tree    | `APP_ENV=ci`; isolated DB `…_c`                                      | 0            | 09:37:33–09:39:12 +07; 6/6 tasks, 0 cached; 14 files/53 tests passed                                                         | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-11 | `pnpm test:e2e` default-port attempt        | `434a89c` + dirty Phase 0 tree    | Isolated DB `…_c`; port 3001 busy                                    | 1 (expected) | Playwright refused process reuse before tests; user process left untouched                                                   | Current task tool output; isolation diagnostic                                                    |
| 2026-08-11 | `pnpm test:e2e` changed-issuer attempt      | `434a89c` + dirty Phase 0 tree    | Isolated DB `…_c`; issuer moved                                      | 1 (invalid)  | 15/15 failed login because seeded issuer identity is fixed; database retained                                                | Current task tool output; rejected configuration diagnostic                                       |
| 2026-08-11 | DB migrate/seed (`…_d`)                     | `434a89c` + dirty Phase 0 tree    | Fresh Docker PostgreSQL database                                     | 0            | All 22 migrations and authoritative seed completed; database retained                                                        | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `pnpm test:e2e`                             | `434a89c` + dirty Phase 0 tree    | DB `…_d`; API 3101/web 3100/OIDC 4310                                | 0            | 10:00:47–10:02:27 +07; 15/15 passed using one worker                                                                         | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-11 | `pnpm security:audit`                       | `434a89c` + dirty Phase 0 tree    | Lockfile SHA-256 `99CA92F5…840B1BB`                                  | 1            | Exact four High GHSAs recorded in `blockers.md`; Phase 2 remediation remains locked                                          | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `pnpm phase0:closure`                       | `434a89c` + dirty Phase 0 tree    | Structured closure records                                           | 1 (expected) | Rejected dirty source, absent candidate evidence, missing approvals/owner inputs, open Phase 0 records, and remote controls  | Current task tool output; fail-closed diagnostic only                                             |
| 2026-08-11 | `APP_VERSION=ci pnpm security:image-scan`   | `434a89c` + dirty Phase 0 tree    | Docker; exact 14-image policy                                        | 1            | 5/14 resolved: Redis 0; Keycloak 17, Prometheus 28, Alertmanager 48, Blackbox 30 blockers; 9 project images absent           | `.runtime/security-scans/2026-08-11T03-10-02.334Z/summary.json`; ignored diagnostic               |
| 2026-08-11 | DB migrate/seed (`phase0_final`)            | `434a89c` + dirty Phase 0 tree    | Fresh Docker PostgreSQL database                                     | 0            | All 22 migrations and authoritative seed completed; database retained                                                        | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `TURBO_FORCE=true pnpm test:integration`    | `434a89c` + dirty Phase 0 tree    | `APP_ENV=ci`; isolated DB `phase0_final`; explicit loopback Redis/S3 | 0            | 29 files/116 tests passed; 0 cached and no skipped/todo                                                                      | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-11 | `TURBO_FORCE=true pnpm test:authorization`  | `434a89c` + dirty Phase 0 tree    | `APP_ENV=ci`; isolated DB `phase0_final`                             | 0            | 14 files/53 tests passed; 0 cached and no skipped/todo                                                                       | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-11 | `pnpm test:e2e` (`phase0_final`)            | `434a89c` + dirty Phase 0 tree    | API 3101/web 3100/OIDC 4310; isolated DB                             | 0            | Web rebuilt for test endpoint; 15/15 Chromium scenarios passed with one worker                                               | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-13 | GitHub control-plane read                   | public remote `main` at `434a89c` | Authenticated `gh`; read-only                                        | blocked      | Branch protection 404/unprotected; empty rulesets/environments; one administrator; unrestricted Actions; nine default labels | `ci-governance.md`; candidate-bound immutable API output still required                           |
| 2026-08-13 | Governance inventory revalidation           | `434a89c` + dirty 96-path tree    | Row-specific classification and secret/inventory checks              | 0            | Every executable path has its own allowed classification; focused governance, repository, and formatting checks passed       | Current task tool output; must rerun from committed SHA                                           |

## Authoritative Phase 0 run log

No authoritative row exists. Each future row must record command, committed
source SHA, clean worktree, lockfile digest, relevant image digests,
environment, prerequisites, start/end timestamps, duration, exit code, test
count and exclusions, and immutable retained output URI.

| Command                                     | Committed SHA | Images | Environment | Start/end | Exit/count/exclusions | Immutable output URI | Independent reviewer |
| ------------------------------------------- | ------------- | ------ | ----------- | --------- | --------------------- | -------------------- | -------------------- |
| _Pending owner-approved committed baseline_ |               |        |             |           |                       |                      |                      |

## Independent reproduction run log

The independent reproduction must be a second successful GitHub Actions run
from the same candidate SHA and source ref, operated by an approved
`INDEPENDENT-SECURITY` or `INDEPENDENT-DATA-RELEASE` roster identity. It must
use the same lockfile and container-policy digests but have a different run URI
and non-overlapping verify/container artifact IDs. A signature over the
authoritative run alone does not satisfy this requirement.

| Committed SHA                               | Run URI | Actor role/identity | Lockfile/policy SHA-256 | Verify artifact ID/digests | Container artifact ID/digests | Approval record |
| ------------------------------------------- | ------- | ------------------- | ----------------------- | -------------------------- | ----------------------------- | --------------- |
| _Pending owner-approved committed baseline_ |         |                     |                         |                            |                               |                 |

## Invalidation ownership

The named release manager (currently unassigned) owns the master-plan section
9 matrix and rejects stale evidence. Authorization/identity, schema/data,
workflow/UI, source/dependency/image, provider/storage, IaC/topology,
secret/TLS/KMS, operations, and release-procedure changes invalidate the exact
upstream and downstream gates listed there. Until a release manager is named,
evidence cannot receive final acceptance.
