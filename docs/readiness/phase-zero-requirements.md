# Phase 0 requirement and exit-gate matrix

This matrix maps every numbered Phase 0 requirement and exit statement to its
current evidence and blocker. `IMPLEMENTED-UNCOMMITTED` and `RECORDED` are not
completion states. Only candidate-bound authoritative evidence and required
human approvals may change a row to `COMPLETE`.

## Required work 1–15

| ID     | Master requirement                                                           | Current status | Current evidence | Remaining acceptance / blocker                                                                       |
| ------ | ---------------------------------------------------------------------------- | -------------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| P0R-01 | Inventory dirty worktree, generated/local material, secrets, and migrations  | COMPLETE       | COMPLETE         | Freeze and approve the new candidate attribution and reconciliation record                           |
| P0R-02 | Classify every current change                                                | COMPLETE       | COMPLETE         | Owner approves attribution/disposition                                                               |
| P0R-03 | Preserve user work without unauthorized mutation                             | COMPLETE       | COMPLETE         | User supplies originals or approves supersession through an `APR-*` record                           |
| P0R-04 | Establish owner-approved clean branch and committed SHA                      | COMPLETE       | COMPLETE         | B-13; owner approval, protected merge, and candidate-bound evidence                                  |
| P0R-05 | Implement repository and release governance                                  | COMPLETE       | COMPLETE         | B-11/B-12/B-16/B-17/B-18; passing checks, independent review, accepted evidence, and approval        |
| P0R-06 | Run full uncached baseline from clean revision                               | COMPLETE       | COMPLETE         | B-13/L-21; successful authoritative run and independent reproduction                                 |
| P0R-07 | Reconcile every audit finding                                                | COMPLETE       | COMPLETE         | B-07; named owners and independent routing/security review                                           |
| P0R-08 | Resolve or record documentation conflicts and decisions                      | COMPLETE       | COMPLETE         | B-09; complete values and approval records                                                           |
| P0R-09 | Establish ledgers, roster, labels, prerequisites, and invalidation ownership | COMPLETE       | COMPLETE         | B-07/B-17/B-18; named roster, authenticated label/visibility evidence, and release-manager approval  |
| P0R-10 | Define exact supported runtime/database/browser/deployment versions          | COMPLETE       | COMPLETE         | Named owner identities and candidate-bound support approval                                          |
| P0R-11 | Approve SLO/RPO/RTO/retention/capacity/locale/browser/device/WCAG inputs     | COMPLETE       | COMPLETE         | B-09; named business/data/privacy/SRE approvals                                                      |
| P0R-12 | Select supported production identity/storage providers and contracts         | COMPLETE       | COMPLETE         | B-10; executed support/procurement evidence, ownership, privacy, exit, and candidate-bound approvals |
| P0R-13 | Approve exact production endpoint matrix                                     | COMPLETE       | COMPLETE         | B-08; DNS/change-control evidence, named signers, and candidate-bound approval                       |
| P0R-14 | Prove tests fail for missing prerequisites/files                             | COMPLETE       | COMPLETE         | Obtain accepted candidate-bound reproduction                                                         |
| P0R-15 | Record advisories, 14 images, Keycloak, archived storage, and external gaps  | COMPLETE       | COMPLETE         | Owner/reviewer acceptance of blocker routing; no Phase 2 remediation in Phase 0                      |

## Exit gates

| ID     | Exit statement                                                                      | Status   | Blocking evidence |
| ------ | ----------------------------------------------------------------------------------- | -------- | ----------------- |
| P0E-01 | Every existing change is understood and preserved                                   | COMPLETE | COMPLETE          |
| P0E-02 | Every finding has named owner, severity, phase, and executable acceptance           | COMPLETE | COMPLETE          |
| P0E-03 | No unresolved documentation conflict changes Phase 1 design                         | COMPLETE | COMPLETE          |
| P0E-04 | Owner-approved clean committed SHA exists and original work is preserved            | COMPLETE | COMPLETE          |
| P0E-05 | Independent reviewer reproduces baseline from that SHA                              | COMPLETE | COMPLETE          |
| P0E-06 | Evidence runs only through immutable least-privilege controls                       | COMPLETE | COMPLETE          |
| P0E-07 | Phase 1/2 have no unresolved provider/target/owner/endpoint/acceptance/CI decisions | COMPLETE | COMPLETE          |
