# Evidence index

## Source baseline

- Entry branch: `main`
- Entry HEAD: `434a89cf1c88d3c84bf22211eba863ef19768122`
- Candidate branch: `codex/phase-zero-candidate`
- Historical source-affecting Phase 0 candidate SHA: `6d91208a6d5912508178f981f575ff4345e34430`
- Pre-repair candidate-branch head: `c919ab1b5e86d9e12f75d4fdf6155a1ceab59f12`
- Current source-affecting contract-repair SHA: `78f1ea454c113387a580d95fcaed426ea3594500`
- Final protected-`main` Phase 0 candidate SHA: pending
- Candidate pull request: `https://github.com/evanwidjaja100/MecoFlow/pull/1`
- Remote: `origin https://github.com/evanwidjaja100/MecoFlow.git`
- Entry worktree: dirty; see `worktree-reconciliation.md`
- Lockfile SHA-256: `99CA92F59DC8DC6F441CBD300A549AE7990F9DB081B775B4A7610B43A840B1BB`
- Current candidate lockfile SHA-256: `29DB96073723127C2BCD75D5FA4D7FD72CD96D6280F6A11C7FD86A72770AECCA` (B-01 fix 2026-08-30, 0 High)
- Current candidate container policy SHA-256: `B77783DCE84A639610833BA07DB5BDB6D7FFB51FC962F2E695E705AABCD99C06` (Keycloak 26.7.2)
- Container policy SHA-256: `46CB9E3E22256C60FF4047C0C1F0D6B0AD4355C1796D3E705EC0A2844B296EDC`
- Migration head: `20260728030000_phase_9b_readiness_query_index`
- Migration provider: PostgreSQL
- Local tools: Node `24.18.0`, pnpm `11.13.0`, Docker CLI `29.6.1`, Compose
  `5.2.0`, Git `2.55.0.windows.2`, GitHub CLI `2.97.0`, ripgrep `15.1.0`;
  `psql` unavailable and Docker daemon unavailable at entry.

The entry SHA identifies the pre-Phase-0 `main` source. The historical
source-affecting candidate, later evidence-only updates, and the current
contract-repair checkpoint are committed. None is the final protected-`main`
candidate. No revision is owner-approved or merged and no successful
authoritative or independent reproduction run exists.

## Diagnostic run log

Diagnostic results from a dirty worktree or a non-passing, cancelled, or
incomplete clean CI run help find defects but are not immutable closure
evidence.

| Date       | Command                                     | SHA/worktree                      | Environment/prerequisites                                            | Exit         | Count/notes                                                                                                                                                                                                                                                    | Evidence location                                                                                 |
| ---------- | ------------------------------------------- | --------------------------------- | -------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 2026-08-10 | GitHub Actions run `31388229140`            | clean committed `434a89c`         | GitHub-hosted runner; pre-Phase-0 workflow                           | 1            | Verify failed during seed and skipped subsequent gates; container scan failed; zero retained artifacts                                                                                                                                                         | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31388229140`; historical diagnostic only |
| 2026-08-11 | `pnpm governance:test`                      | `434a89c` + dirty Phase 0 tree    | Windows; Node/pnpm available                                         | 0            | Latest run: 58 tests passed; 0 failed/skipped/todo                                                                                                                                                                                                             | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `pnpm governance:check`                     | `434a89c` + dirty Phase 0 tree    | Required repository files present                                    | 0            | In-repository checks passed                                                                                                                                                                                                                                    | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | GitHub control-plane read                   | remote `main` at repository state | Authenticated `gh`; read-only                                        | blocked      | protection/rulesets HTTP 403; 0 environments; Actions default read                                                                                                                                                                                             | `ci-governance.md`; immutable API output still required                                           |
| 2026-08-11 | Docker prerequisite probe                   | local workstation                 | Docker CLI installed                                                 | blocked      | daemon pipe unavailable                                                                                                                                                                                                                                        | Current task tool output                                                                          |
| 2026-08-11 | Missing-DB negative probe                   | `434a89c` + dirty Phase 0 tree    | `DATABASE_URL` removed                                               | 1 (expected) | Integration command prerequisite failed before Vitest                                                                                                                                                                                                          | Current task tool output                                                                          |
| 2026-08-11 | `pnpm security:image-scan:test`             | `434a89c` + dirty Phase 0 tree    | Node/policy files                                                    | 0            | Latest run: 7 passed; zero failed/skipped/todo                                                                                                                                                                                                                 | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | Production/operations/capacity policy tests | `434a89c` + dirty Phase 0 tree    | Local policy fixtures                                                | 0            | 8 + 6 + 6 passed; zero skipped/todo                                                                                                                                                                                                                            | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `git diff --check`                          | `434a89c` + dirty Phase 0 tree    | Git available                                                        | 0            | No whitespace errors after correction                                                                                                                                                                                                                          | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `pnpm format:check`                         | `434a89c` + dirty Phase 0 tree    | Installed workspace dependencies                                     | 0            | All matched files passed Prettier                                                                                                                                                                                                                              | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `TURBO_FORCE=true pnpm lint`                | `434a89c` + dirty Phase 0 tree    | Installed workspace dependencies                                     | 0            | 9/9 tasks passed; 0 cached                                                                                                                                                                                                                                     | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `TURBO_FORCE=true pnpm typecheck`           | `434a89c` + dirty Phase 0 tree    | Prisma generation available                                          | 0            | 9/9 tasks passed; 0 cached; Prisma Client 7.9.0 generated                                                                                                                                                                                                      | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `TURBO_FORCE=true pnpm test`                | `434a89c` + dirty Phase 0 tree    | Unit manifest prerequisite passed                                    | 0            | Latest run: 14/14 tasks, 44 files/233 tests passed; 0 cached and no skipped/todo                                                                                                                                                                               | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `pnpm openapi:check`                        | `434a89c` + dirty Phase 0 tree    | OpenAPI generator available                                          | 0            | Generated contract matched the checked-in contract                                                                                                                                                                                                             | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-11 | `TURBO_FORCE=true pnpm build`               | `434a89c` + dirty Phase 0 tree    | Local build-time configuration                                       | 0            | 9/9 tasks passed; 0 cached                                                                                                                                                                                                                                     | Current task tool output; must rerun with approved values from committed SHA                      |
| 2026-08-11 | Required DB-backed suite commands           | `434a89c` + dirty Phase 0 tree    | `DATABASE_URL` deliberately absent                                   | 1 (expected) | Integration, authorization, and E2E each failed before their required suite                                                                                                                                                                                    | Current task tool output; proves fail-closed guard only                                           |
| 2026-08-11 | DB migrate/seed (`…_b`)                     | `434a89c` + dirty Phase 0 tree    | Fresh Docker PostgreSQL database                                     | 0            | All 22 migrations and authoritative seed completed; database retained                                                                                                                                                                                          | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `pnpm test:integration` (`…_b`)             | `434a89c` + dirty Phase 0 tree    | Incorrect `APP_ENV=test`                                             | 1 (invalid)  | Throttle suite intentionally skipped by that app mode; attempt rejected                                                                                                                                                                                        | Current task tool output; retained diagnostic database                                            |
| 2026-08-11 | DB migrate/seed (`…_c`)                     | `434a89c` + dirty Phase 0 tree    | Fresh Docker PostgreSQL database                                     | 0            | All 22 migrations and authoritative seed completed; database retained                                                                                                                                                                                          | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `TURBO_FORCE=true pnpm test:integration`    | `434a89c` + dirty Phase 0 tree    | `APP_ENV=ci`; isolated DB `…_c`                                      | 0            | 09:34:09–09:37:16 +07; 14/14 tasks, 0 cached; 29 files/116 tests passed                                                                                                                                                                                        | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-11 | `TURBO_FORCE=true pnpm test:authorization`  | `434a89c` + dirty Phase 0 tree    | `APP_ENV=ci`; isolated DB `…_c`                                      | 0            | 09:37:33–09:39:12 +07; 6/6 tasks, 0 cached; 14 files/53 tests passed                                                                                                                                                                                           | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-11 | `pnpm test:e2e` default-port attempt        | `434a89c` + dirty Phase 0 tree    | Isolated DB `…_c`; port 3001 busy                                    | 1 (expected) | Playwright refused process reuse before tests; user process left untouched                                                                                                                                                                                     | Current task tool output; isolation diagnostic                                                    |
| 2026-08-11 | `pnpm test:e2e` changed-issuer attempt      | `434a89c` + dirty Phase 0 tree    | Isolated DB `…_c`; issuer moved                                      | 1 (invalid)  | 15/15 failed login because seeded issuer identity is fixed; database retained                                                                                                                                                                                  | Current task tool output; rejected configuration diagnostic                                       |
| 2026-08-11 | DB migrate/seed (`…_d`)                     | `434a89c` + dirty Phase 0 tree    | Fresh Docker PostgreSQL database                                     | 0            | All 22 migrations and authoritative seed completed; database retained                                                                                                                                                                                          | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `pnpm test:e2e`                             | `434a89c` + dirty Phase 0 tree    | DB `…_d`; API 3101/web 3100/OIDC 4310                                | 0            | 10:00:47–10:02:27 +07; 15/15 passed using one worker                                                                                                                                                                                                           | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-11 | `pnpm security:audit`                       | `434a89c` + dirty Phase 0 tree    | Lockfile SHA-256 `99CA92F5…840B1BB`                                  | 1            | Exact four High GHSAs recorded in `blockers.md`; Phase 2 remediation remains locked                                                                                                                                                                            | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `pnpm phase0:closure`                       | `434a89c` + dirty Phase 0 tree    | Structured closure records                                           | 1 (expected) | Rejected dirty source, absent candidate evidence, missing approvals/owner inputs, open Phase 0 records, and remote controls                                                                                                                                    | Current task tool output; fail-closed diagnostic only                                             |
| 2026-08-11 | `APP_VERSION=ci pnpm security:image-scan`   | `434a89c` + dirty Phase 0 tree    | Docker; exact 14-image policy                                        | 1            | 5/14 resolved: Redis 0; Keycloak 17, Prometheus 28, Alertmanager 48, Blackbox 30 blockers; 9 project images absent                                                                                                                                             | `.runtime/security-scans/2026-08-11T03-10-02.334Z/summary.json`; ignored diagnostic               |
| 2026-08-11 | DB migrate/seed (`phase0_final`)            | `434a89c` + dirty Phase 0 tree    | Fresh Docker PostgreSQL database                                     | 0            | All 22 migrations and authoritative seed completed; database retained                                                                                                                                                                                          | Current task tool output; diagnostic only                                                         |
| 2026-08-11 | `TURBO_FORCE=true pnpm test:integration`    | `434a89c` + dirty Phase 0 tree    | `APP_ENV=ci`; isolated DB `phase0_final`; explicit loopback Redis/S3 | 0            | 29 files/116 tests passed; 0 cached and no skipped/todo                                                                                                                                                                                                        | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-11 | `TURBO_FORCE=true pnpm test:authorization`  | `434a89c` + dirty Phase 0 tree    | `APP_ENV=ci`; isolated DB `phase0_final`                             | 0            | 14 files/53 tests passed; 0 cached and no skipped/todo                                                                                                                                                                                                         | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-11 | `pnpm test:e2e` (`phase0_final`)            | `434a89c` + dirty Phase 0 tree    | API 3101/web 3100/OIDC 4310; isolated DB                             | 0            | Web rebuilt for test endpoint; 15/15 Chromium scenarios passed with one worker                                                                                                                                                                                 | Current task tool output; dirty-worktree diagnostic                                               |
| 2026-08-13 | GitHub control-plane pre-mutation read      | public remote `main` at `434a89c` | Authenticated `gh`; read-only                                        | blocked      | Branch protection 404/unprotected; empty rulesets/environments; one administrator; unrestricted Actions; nine default labels                                                                                                                                   | Historical diagnostic; superseded by the post-mutation read below                                 |
| 2026-08-20 | Governance inventory revalidation           | `434a89c` + current 112-path tree | Row-specific classification and secret/inventory checks              | 0            | Every path has an explicit classification, including the topology ADR and canonical GitHub projection module/tests; focused and full governance checks must be rerun after integration                                                                         | Current task tool output; must rerun from committed SHA                                           |
| 2026-08-13 | GitHub Actions run `31707913394`            | candidate `d6587a8`               | GitHub-hosted pull-request runner                                    | 1            | All three required checks failed; dependency graph unavailable and verify/container evidence validation incomplete                                                                                                                                             | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31707913394`; diagnostic only            |
| 2026-08-13 | GitHub Actions run `31712296742`            | candidate `22d0abe`               | GitHub-hosted pull-request runner                                    | 1            | Dependency review passed; E2E server startup, endpoint/application-image, and container evidence failed; container verifier threw an undefined-variable exception                                                                                              | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31712296742`; diagnostic only            |
| 2026-08-13 | GitHub Actions run `31713053533`            | candidate `cc2b56c`               | GitHub-hosted pull-request runner                                    | 1            | Dependency review passed; retained E2E server diagnostics confirmed startup failure; endpoint/application-image and container evidence failed                                                                                                                  | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31713053533`; diagnostic only            |
| 2026-08-13 | GitHub Actions run `31713790180`            | candidate `354ccd6`               | GitHub-hosted pull-request runner                                    | 1            | Dependency review passed; all 15 E2E scenarios failed authentication/navigation; unapproved endpoint blocked project-image builds; container verifier still threw                                                                                              | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31713790180`; diagnostic only            |
| 2026-08-13 | GitHub Actions run `31716612512`            | candidate `db503f3`               | GitHub-hosted pull-request runner; superseded by `e7db0eb`           | cancelled    | Dependency review passed and container security failed; verify was cancelled after the replacement commit superseded this run                                                                                                                                  | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31716612512`; diagnostic only            |
| 2026-08-13 | GitHub Actions run `31717030980`            | candidate `e7db0eb`               | GitHub-hosted pull-request runner                                    | 1            | Dependency review, governance 81/81, unit 236, integration 151, authorization 53, E2E 15/15, build/policies/Compose/cleanliness passed; endpoint/images and 14 scans failed                                                                                    | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31717030980`; diagnostic only            |
| 2026-08-13 | Post-run scan-parser regression checks      | committed candidate follow-up     | Local Node/pnpm; three existing inventory paths modified             | 0            | Governance 82/82 and container policy 14/14 passed; identity errors remain incomplete diagnostics instead of false Trivy reports                                                                                                                               | Current task tool output; committed but not accepted remote evidence                              |
| 2026-08-13 | GitHub Actions run `31718073882`            | candidate `e443e5b`               | GitHub-hosted pull-request runner                                    | 1            | Dependency review and every executable verify gate passed, including E2E 15/15; endpoint/images and 14 scans failed; zero false Trivy-format errors                                                                                                            | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31718073882`; diagnostic only            |
| 2026-08-14 | GitHub control-plane mutation verification  | public remote; candidate PR #1    | Authenticated `gh`; approved mutations                               | blocked      | `main` protected with three strict checks; dependency graph/alerts enabled with 633-package SBOM readback; labels exist; `production` is branch-limited with admin bypass disabled but lacks required reviewers and a least-privilege secret; Actions deferred | `ci-governance.md`; authenticated candidate-bound approval/evidence still required                |
| 2026-08-20 | GitHub Actions restriction readback         | public remote; pre-freeze branch  | Authenticated `gh`; mechanical repository hardening                  | blocked      | Actions selected-only; exact four patterns; SHA pinning required; broad GitHub-owned/verified toggles false; workflow defaults read-only and cannot approve PRs                                                                                                | Canonical candidate-bound digest and named approval still required                                |
| 2026-08-14 | GitHub Actions run `31759036677`            | candidate `6d91208`               | GitHub-hosted pull-request runner                                    | 1            | Dependency review and all executable verify gates passed: governance 82, unit 236, integration 151, authorization 53, E2E 15; endpoint/images and 14 identities failed closed; zero skips/todos                                                                | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31759036677`; diagnostic only            |
| 2026-08-14 | GitHub Actions run `31759673383`            | evidence-only head `1f83021`      | GitHub-hosted pull-request runner                                    | 1            | Dependency review and executable verify baseline passed; endpoint/application images and 14 identities failed closed                                                                                                                                           | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31759673383`; diagnostic only            |
| 2026-08-14 | GitHub Actions run `31760236777`            | evidence-only head `96f3120`      | GitHub-hosted pull-request runner                                    | 1            | Dependency review and executable verify baseline passed; endpoint/application images and 14 identities failed closed                                                                                                                                           | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31760236777`; diagnostic only            |
| 2026-08-14 | GitHub Actions run `31760932202`            | evidence-only head `c919ab1`      | GitHub-hosted pull-request runner                                    | 1            | Dependency review and executable verify baseline passed; endpoint/application images and 14 identities failed closed                                                                                                                                           | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/31760932202`; diagnostic only            |
| 2026-08-20 | GitHub Actions run `32382576019`            | evidence-only head `8e93fed`      | GitHub-hosted pull-request runner under restricted Actions           | 1            | Dependency review and all application/governance suites passed; the strict audit baseline detected a fifth registry advisory; endpoint/application images and 14 identities also failed closed                                                                 | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/32382576019`; diagnostic only            |
| 2026-08-20 | GitHub Actions run `32383852323`            | source checkpoint `d345afd`       | GitHub-hosted pull-request runner under restricted Actions           | 1            | Refreshed five-advisory baseline, dependency review, governance 113, unit 236, integration 151, authorization 53, E2E 15, build, policies, Compose, and cleanliness passed; only endpoint/application images and dependent 14 identities failed closed         | `https://github.com/evanwidjaja100/MecoFlow/actions/runs/32383852323`; diagnostic only            |

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
Final implementation run `31718073882` retained verify artifact ID
`9188301637` (SHA-256
`6aa960d00a45c7b7fc0432138547eca871002daae830195e683dabbde6276942`)
and container artifact ID `9188110510` (SHA-256
`c801679c0094b974f365567fbffb2c5d7aefef1369f5105f56a05bd83e7108b6`).
Downloaded diagnostic contents hash to verify manifest
`4f9a4ac225d83a0828149a61d8ef49e495da402e43ab0aae21f87c755fdda6b6`,
verify steps
`c8a068cba9a6be4c7f374c6d6cf2beb060aa1f95ef648064b3c68491449b7ad1`,
container manifest
`a75a8570768ea2bb1cd1fbb7fbc1727444b379d2b23769d94c02f47040ebb849`,
container steps
`d6ee699b8c1ed9ec7e9c5c36115e07dda6dcaf9fed58cebf73da6e70f1556084`,
and scan summary
`c6690e09ce01c710a14227484fe6d9046308b8c7311e06d59d2e60ccc75249de`.
Run `31759036677` retained verify artifact ID `9203966129` (SHA-256
`11b407939a951e65c21a39b786563715688897eeecdec5b1b6caca9964dd05a2`)
and container artifact ID `9203865443` (SHA-256
`131c2334c70e94e47211e90f037121f489d968b93bd68114b95d4ed41d4dc967`).
Downloaded diagnostic contents hash to verify manifest
`d6c09651c2c34b24fe75fff855788ccda76150df4d45ba97581d511ea016d895`,
verify steps
`0a0e412acadfa5ec61d8b7bce11c1f68242639a043f198cd51521dc01dd2601f`,
container manifest
`14bb4ecfa622727392529851fad53fdf4f20ce23625046245c11e23729d5f8b2`,
container steps
`8f62955ec5c9a1fcf46cad6eaa51f29b77a0691f110701fe3751fceb64f6e615`,
and scan summary
`b178bfc1837a2acc912eb6a4763f0be07dc82a19440f523a8654557949ed6388`.
The later evidence-only diagnostic runs retained these artifact pairs:

- run `31759673383`: verify ID `9204200366`, SHA-256
  `7376bb542d79e512f58fd559be039a8bf01ac24c454905f51ca0062ac8371794`;
  container ID `9204101654`, SHA-256
  `ca34686d4d59cd5b6cac27160a2e6ca9535f9ff0af793db7d66a57bde8c6fdf2`;
- run `31760236777`: verify ID `9204401617`, SHA-256
  `d5f81d8ee70a97296ef3ecc0e13c1fd962972de7605fdc109f0f58377ec7692e`;
  container ID `9204308809`, SHA-256
  `bdbc81a69a0175106232ae6ccd8b3b9675d5ab636fb88125f7f13cc347f27256`;
- run `31760932202`: verify ID `9204654001`, SHA-256
  `3475e2fdaf6239ee4c63b5fa1eff001c8a655b632b4e4411c3ffeadd916efab0`;
  container ID `9204550945`, SHA-256
  `6d7b794781b5409bb7f06db847e79b3a75b9a8bf3494770ad2298313e8f80320`.

The restricted-Actions contract and dependency-baseline repair runs retained:

- run `32382576019`: verify ID `9411791914`, SHA-256
  `b0a4404d7e8c8f02920daef24a75755d1a83322290788b94155d2ad607b5cb1d`;
  container ID `9411609584`, SHA-256
  `bffbb89938640da3a631745c05d39b457cbb229e7d7fc8b0e7de2b09d02bac26`;
- run `32383852323`: verify ID `9412281311`, SHA-256
  `7add7c60c0db9fb43517a643014b7ca49a8b1fa433468644c19c54cc214e7921`;
  container ID `9412095959`, SHA-256
  `25e40257b7b6dcd4f49a6418f49d064c8daedc9c7ce21fba35bf98092873a47b`.

Downloaded run `32383852323` contents hash to verify manifest
`03c6b489b8579b18c83f864b3b008e45c7add2a47ef774f813aa4cec439eb834`,
verify steps
`fbb3b1666f1a07465b739d22f26b1047d9342eae51e1c0cf91c140371c1d6399`,
container manifest
`c0a56d329b3530d156e5ae0ff701f639dbbcc59791ba1d665529e01faae13270`,
container steps
`1f5a282194bc71043d0cd4fb12a24059dc0a629b90d6935ed2e5cef1f8a4601e`,
and scan summary
`6732244f9c657df7e195f2d2fc8dac9416da531b723e4ed6757966e1b08004f9`.

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
