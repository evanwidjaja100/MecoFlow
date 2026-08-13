# Evidence index

## Source baseline

- Entry branch: `main`
- Entry HEAD: `434a89cf1c88d3c84bf22211eba863ef19768122`
- Candidate branch: `codex/phase-zero-candidate`
- Latest committed candidate SHA: `e7db0eb03ba184dbed1e3d35d294c583153867d7`
- Candidate pull request: `https://github.com/evanwidjaja100/MecoFlow/pull/1`
- Remote: `origin https://github.com/evanwidjaja100/MecoFlow.git`
- Entry worktree: dirty; see `worktree-reconciliation.md`
- Lockfile SHA-256: `99CA92F59DC8DC6F441CBD300A549AE7990F9DB081B775B4A7610B43A840B1BB`
- Container policy SHA-256: `46CB9E3E22256C60FF4047C0C1F0D6B0AD4355C1796D3E705EC0A2844B296EDC`
- Migration head: `20260728030000_phase_9b_readiness_query_index`
- Migration provider: PostgreSQL
- Local tools: Node `24.18.0`, pnpm `11.13.0`, Docker CLI `29.6.1`, Compose
  `5.2.0`, Git `2.55.0.windows.2`, GitHub CLI `2.97.0`, ripgrep `15.1.0`;
  `psql` unavailable and Docker daemon unavailable at entry.

The entry SHA identifies the pre-Phase-0 `main` source. The Phase 0 candidate is
committed, but is not owner-approved or merged and has no successful
authoritative or independent reproduction run.

## Diagnostic run log

Diagnostic results from a dirty worktree or a non-passing, cancelled, or
incomplete clean CI run help find defects but are not immutable closure
evidence.

| Date       | Command                                     | SHA/worktree                      | Environment/prerequisites                                            | Exit         | Count/notes                                                                                                                                                                                     | Evidence location                                                                                 |
| ---------- | ------------------------------------------- | --------------------------------- | -------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 2026-08-10 | GitHub Actions run `31388229140`            | clean committed `434a89c`         | GitHub-hosted runner; pre-Phase-0 workflow                           | 1            | Verify failed during seed and skipped subsequent gates; container scan failed; zero retained artifacts                                                                                          | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31388229140`; historical diagnostic only |
| 2026-08-11 | `pnpm governance:test`                      | `434a89c` + dirty Phase 0 tree    | Windows; Node/pnpm available                                         | 0            | Latest run: 58 tests passed; 0 failed/skipped/todo                                                                                                                                              | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `pnpm governance:check`                     | `434a89c` + dirty Phase 0 tree    | Required repository files present                                    | 0            | In-repository checks passed                                                                                                                                                                     | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | GitHub control-plane read                   | remote `main` at repository state | Authenticated `gh`; read-only                                        | blocked      | protection/rulesets HTTP 403; 0 environments; Actions default read                                                                                                                              | `ci-governance.md`; immutable API output still required                                           |
| 2026-08-11 | Docker prerequisite probe                   | local workstation                 | Docker CLI installed                                                 | blocked      | daemon pipe unavailable                                                                                                                                                                         | Current task tool output                                                                          |
| 2026-08-11 | Missing-DB negative probe                   | `434a89c` + dirty Phase 0 tree    | `DATABASE_URL` removed                                               | 1 (expected) | Integration command prerequisite failed before Vitest                                                                                                                                           | Current task tool output                                                                          |
| 2026-08-11 | `pnpm security:image-scan:test`             | `434a89c` + dirty Phase 0 tree    | Node/policy files                                                    | 0            | Latest run: 7 passed; zero failed/skipped/todo                                                                                                                                                  | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | Production/operations/capacity policy tests | `434a89c` + dirty Phase 0 tree    | Local policy fixtures                                                | 0            | 8 + 6 + 6 passed; zero skipped/todo                                                                                                                                                             | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `git diff --check`                          | `434a89c` + dirty Phase 0 tree    | Git available                                                        | 0            | No whitespace errors after correction                                                                                                                                                           | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `pnpm format:check`                         | `434a89c` + dirty Phase 0 tree    | Installed workspace dependencies                                     | 0            | All matched files passed Prettier                                                                                                                                                               | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `TURBO_FORCE=true pnpm lint`                | `434a89c` + dirty Phase 0 tree    | Installed workspace dependencies                                     | 0            | 9/9 tasks passed; 0 cached                                                                                                                                                                      | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `TURBO_FORCE=true pnpm typecheck`           | `434a89c` + dirty Phase 0 tree    | Prisma generation available                                          | 0            | 9/9 tasks passed; 0 cached; Prisma Client 7.9.0 generated                                                                                                                                       | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `TURBO_FORCE=true pnpm test`                | `434a89c` + dirty Phase 0 tree    | Unit manifest prerequisite passed                                    | 0            | Latest run: 14/14 tasks, 44 files/233 tests passed; 0 cached and no skipped/todo                                                                                                                | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `pnpm openapi:check`                        | `434a89c` + dirty Phase 0 tree    | OpenAPI generator available                                          | 0            | Generated contract matched the checked-in contract                                                                                                                                              | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `TURBO_FORCE=true pnpm build`               | `434a89c` + dirty Phase 0 tree    | Local build-time configuration                                       | 0            | 9/9 tasks passed; 0 cached                                                                                                                                                                      | Current task tool output; must rerun with approved values from committed SHA                      |
| 2026-08-11 | Required DB-backed suite commands           | `434a89c` + dirty Phase 0 tree    | `DATABASE_URL` deliberately absent                                   | 1 (expected) | Integration, authorization, and E2E each failed before their required suite                                                                                                                     | Current task tool output; proves fail-closed guard only                                           |
| 2026-08-11 | DB migrate/seed (`…_b`)                     | `434a89c` + dirty Phase 0 tree    | Fresh Docker PostgreSQL database                                     | 0            | All 22 migrations and authoritative seed completed; database retained                                                                                                                           | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `pnpm test:integration` (`…_b`)             | `434a89c` + dirty Phase 0 tree    | Incorrect `APP_ENV=test`                                             | 1 (invalid)  | Throttle suite intentionally skipped by that app mode; attempt rejected                                                                                                                         | Current task tool output; retained diagnostic database                                            |
| 2026-08-11 | DB migrate/seed (`…_c`)                     | `434a89c` + dirty Phase 0 tree    | Fresh Docker PostgreSQL database                                     | 0            | All 22 migrations and authoritative seed completed; database retained                                                                                                                           | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `TURBO_FORCE=true pnpm test:integration`    | `434a89c` + dirty Phase 0 tree    | `APP_ENV=ci`; isolated DB `…_c`                                      | 0            | 09:34:09–09:37:16 +07; 14/14 tasks, 0 cached; 29 files/116 tests passed                                                                                                                         | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-11 | `TURBO_FORCE=true pnpm test:authorization`  | `434a89c` + dirty Phase 0 tree    | `APP_ENV=ci`; isolated DB `…_c`                                      | 0            | 09:37:33–09:39:12 +07; 6/6 tasks, 0 cached; 14 files/53 tests passed                                                                                                                            | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-11 | `pnpm test:e2e` default-port attempt        | `434a89c` + dirty Phase 0 tree    | Isolated DB `…_c`; port 3001 busy                                    | 1 (expected) | Playwright refused process reuse before tests; user process left untouched                                                                                                                      | Current task tool output; isolation diagnostic                                                    |
| 2026-08-11 | `pnpm test:e2e` changed-issuer attempt      | `434a89c` + dirty Phase 0 tree    | Isolated DB `…_c`; issuer moved                                      | 1 (invalid)  | 15/15 failed login because seeded issuer identity is fixed; database retained                                                                                                                   | Current task tool output; rejected configuration diagnostic                                       |
| 2026-08-11 | DB migrate/seed (`…_d`)                     | `434a89c` + dirty Phase 0 tree    | Fresh Docker PostgreSQL database                                     | 0            | All 22 migrations and authoritative seed completed; database retained                                                                                                                           | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `pnpm test:e2e`                             | `434a89c` + dirty Phase 0 tree    | DB `…_d`; API 3101/web 3100/OIDC 4310                                | 0            | 10:00:47–10:02:27 +07; 15/15 passed using one worker                                                                                                                                            | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-11 | `pnpm security:audit`                       | `434a89c` + dirty Phase 0 tree    | Lockfile SHA-256 `99CA92F5…840B1BB`                                  | 1            | Exact four High GHSAs recorded in `blockers.md`; Phase 2 remediation remains locked                                                                                                             | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `pnpm phase0:closure`                       | `434a89c` + dirty Phase 0 tree    | Structured closure records                                           | 1 (expected) | Rejected dirty source, absent candidate evidence, missing approvals/owner inputs, open Phase 0 records, and remote controls                                                                     | Current task tool output; fail-closed diagnostic only                                             |
| 2026-08-11 | `APP_VERSION=ci pnpm security:image-scan`   | `434a89c` + dirty Phase 0 tree    | Docker; exact 14-image policy                                        | 1            | 5/14 resolved: Redis 0; Keycloak 17, Prometheus 28, Alertmanager 48, Blackbox 30 blockers; 9 project images absent                                                                              | `.runtime/security-scans/2026-08-11T03-10-02.334Z/summary.json`; ignored diagnostic               |
| 2026-08-11 | DB migrate/seed (`phase0_final`)            | `434a89c` + dirty Phase 0 tree    | Fresh Docker PostgreSQL database                                     | 0            | All 22 migrations and authoritative seed completed; database retained                                                                                                                           | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `TURBO_FORCE=true pnpm test:integration`    | `434a89c` + dirty Phase 0 tree    | `APP_ENV=ci`; isolated DB `phase0_final`; explicit loopback Redis/S3 | 0            | 29 files/116 tests passed; 0 cached and no skipped/todo                                                                                                                                         | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-11 | `TURBO_FORCE=true pnpm test:authorization`  | `434a89c` + dirty Phase 0 tree    | `APP_ENV=ci`; isolated DB `phase0_final`                             | 0            | 14 files/53 tests passed; 0 cached and no skipped/todo                                                                                                                                          | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-11 | `pnpm test:e2e` (`phase0_final`)            | `434a89c` + dirty Phase 0 tree    | API 3101/web 3100/OIDC 4310; isolated DB                             | 0            | Web rebuilt for test endpoint; 15/15 Chromium scenarios passed with one worker                                                                                                                  | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-13 | GitHub control-plane pre-mutation read      | public remote `main` at `434a89c` | Authenticated `gh`; read-only                                        | blocked      | Branch protection 404/unprotected; empty rulesets/environments; one administrator; unrestricted Actions; nine default labels                                                                    | Historical diagnostic; superseded by the post-mutation read below                                 |
| 2026-08-13 | Governance inventory revalidation           | `434a89c` + dirty 96-path tree    | Row-specific classification and secret/inventory checks              | 0            | Every executable path has its own allowed classification; focused governance, repository, and formatting checks passed                                                                          | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-13 | GitHub Actions run `31707913394`            | candidate `d6587a8`               | GitHub-hosted pull-request runner                                    | 1            | All three required checks failed; dependency graph unavailable and verify/container evidence validation incomplete                                                                              | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31707913394`; diagnostic only            |
| 2026-08-13 | GitHub Actions run `31712296742`            | candidate `22d0abe`               | GitHub-hosted pull-request runner                                    | 1            | Dependency review passed; E2E server startup, endpoint/application-image, and container evidence failed; container verifier threw an undefined-variable exception                               | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31712296742`; diagnostic only            |
| 2026-08-13 | GitHub Actions run `31713053533`            | candidate `cc2b56c`               | GitHub-hosted pull-request runner                                    | 1            | Dependency review passed; retained E2E server diagnostics confirmed startup failure; endpoint/application-image and container evidence failed                                                   | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31713053533`; diagnostic only            |
| 2026-08-13 | GitHub Actions run `31713790180`            | candidate `354ccd6`               | GitHub-hosted pull-request runner                                    | 1            | Dependency review passed; all 15 E2E scenarios failed authentication/navigation; unapproved endpoint blocked project-image builds; container verifier still threw                               | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31713790180`; diagnostic only            |
| 2026-08-13 | GitHub Actions run `31716612512`            | candidate `db503f3`               | GitHub-hosted pull-request runner; superseded by `e7db0eb`           | cancelled    | Dependency review passed and container security failed; verify was cancelled after the replacement commit superseded this run                                                                   | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31716612512`; diagnostic only            |
| 2026-08-13 | GitHub Actions run `31717030980`            | candidate `e7db0eb`               | GitHub-hosted pull-request runner                                    | 1            | Dependency review, governance 81/81, unit 236, integration 151, authorization 53, E2E 15/15, build/policies/Compose/cleanliness passed; endpoint/images and 14 scans failed                     | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31717030980`; diagnostic only            |
| 2026-08-13 | Post-run scan-parser regression checks      | `e7db0eb` + dirty follow-up       | Local Node/pnpm; three existing inventory paths modified             | 0            | Governance 82/82 and container policy 14/14 passed; identity errors remain incomplete diagnostics instead of false Trivy reports                                                                | Current task tool output; uncommitted and not remote evidence                                     |
| 2026-08-13 | GitHub control-plane mutation verification  | public remote; candidate PR #1    | Authenticated `gh`; approved mutations                               | blocked      | `main` protected with three strict checks; dependency graph/alerts enabled with 633-package SBOM readback; labels exist; `production` lacks reviewers and allows admin bypass; Actions deferred | `ci-governance.md`; authenticated candidate-bound approval/evidence still required                |

Run `31707913394` retained diagnostic artifacts
`phase-zero-verify-31707913394-1` (artifact ID `9184116059`, SHA-256
`48ea904885e70849397239d746c418a5b02ba70bdfeefd9c0e637fd0b0a12408`) and
`phase-zero-container-31707913394-1` (artifact ID `9183960646`, SHA-256
`220fd71d6331dbce7d448f6d16d0726e8e86feb2395f6162e9fb54b2f64ae36d`).
Their retention does not convert the failing run into accepted evidence.

Runs `31712296742`, `31713053533`, and `31713790180` retained these additional
failing diagnostic artifact pairs:

- `phase-zero-verify-31712296742-1`: ID `9185921997`, SHA-256
  `be76f58fe462786137ee3a3bd2c8aab2fa49a7e9856470bbee7ab2e9a4605602`;
  `phase-zero-container-31712296742-1`: ID `9185769735`, SHA-256
  `59ff0971430f3082a2e13e059155b07e2311b33b15f7824d19881686d3e146c1`.
- `phase-zero-verify-31713053533-1`: ID `9186224873`, SHA-256
  `c8b5380c4c18fce8fdadfce5e570614d21fd251e8f1ddec33c51b497dd103fce`;
  `phase-zero-container-31713053533-1`: ID `9186065055`, SHA-256
  `4147ca44185c5a019651c2c70237dcc123ae1f8e452b4644d70937c9c53254e8`.
- `phase-zero-verify-31713790180-1`: ID `9187252660`, SHA-256
  `08427c164cf56741c058e06817e4fadb44e5b33f1bb5b574912536a7d2b22f91`;
  `phase-zero-container-31713790180-1`: ID `9186359491`, SHA-256
  `fbe4548db1d2e513ae1ce9c12aab1dda58b80ec4d0f19b4741db0cc5bf87b761`.

Superseded run `31716612512` retained verify artifact ID `9187691378`
(SHA-256 `1fec0c959c1ba5078fc3cff994de30f59a24c9e47bda3b425cfb8d9e207efd79`)
and container artifact ID `9187525269` (SHA-256
`90ba7c7799528145b7207bff78472d25d6ef37a510fbfa423823d47a36be5f7a`).
Replacement run `31717030980` retained verify artifact ID `9187865157`
(SHA-256 `61a85b49a159cea7f669151542086f062964e38fe00e64afc52c2f053f6d2611`)
and container artifact ID `9187682437` (SHA-256
`771586a5f39bd0fdd87952292c575d2fdc7d0fd4ee2ea13fcf30578ac1e646b4`).
Cancelled, incomplete, or failing artifacts are never authoritative evidence.

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
