# Release-readiness governance

## Accountability and reviewer roster

Only a named human can own or approve a production control. The implementing
agent may prepare code/evidence but cannot self-approve it.

| Role                              | Role ID                    | Named human           | Stable identity            | Phase 0 status |
| --------------------------------- | -------------------------- | --------------------- | -------------------------- | -------------- |
| Software engineering owner        | `SE-OWNER`                 | Henry Widjaja         | Henry@meco.co.id           | `APPROVED`     |
| Security owner                    | `SEC-OWNER`                | Mama Widjaja          | xdgang@meco.co.id          | `APPROVED`     |
| Database/data owner               | `DATA-OWNER`               | exedi Widjaja         | exedi_ojolpreman@gmail.com | `APPROVED`     |
| Product owner                     | `PRODUCT-OWNER`            | Evan Widjaja          | bababooey@gmail.com        | `APPROVED`     |
| Test/QA owner                     | `QA-OWNER`                 | Logang Forever        | LoganPaul@gmail.com        | `APPROVED`     |
| QA/QC business owner              | `QAQC-BUSINESS-OWNER`      | Logang Forever        | LoganPaul@gmail.com        | `APPROVED`     |
| Purchasing owner                  | `PURCHASING-OWNER`         | Jake Paulers          | Jakey@meco.co.id           | `APPROVED`     |
| Warehouse owner                   | `WAREHOUSE-OWNER`          | Jake Paulers          | Jakey@meco.co.id           | `APPROVED`     |
| Project-management owner          | `PROJECT-MGMT-OWNER`       | Henry Widjaja         | Henry@meco.co.id           | `APPROVED`     |
| Engineering-domain owner          | `ENGINEERING-DOMAIN-OWNER` | Henry Widjaja         | Henry@meco.co.id           | `APPROVED`     |
| PPIC owner                        | `PPIC-OWNER`               | Jake Paulers          | Jakey@meco.co.id           | `APPROVED`     |
| Production owner                  | `PRODUCTION-OWNER`         | Jake Paulers          | Jakey@meco.co.id           | `APPROVED`     |
| Finance-readonly owner            | `FINANCE-READONLY-OWNER`   | exedi Widjaja         | exedi_ojolpreman@gmail.com | `APPROVED`     |
| Management owner                  | `MANAGEMENT-OWNER`         | Evan Widjaja          | bababooey@gmail.com        | `APPROVED`     |
| Identity owner                    | `IDENTITY-OWNER`           | Mama Widjaja          | xdgang@meco.co.id          | `APPROVED`     |
| Cloud/platform owner              | `PLATFORM-OWNER`           | Babagang Widjaja      | Baba@gmail.com             | `APPROVED`     |
| SRE/on-call owner                 | `SRE-OWNER`                | Babagang Widjaja      | Baba@gmail.com             | `APPROVED`     |
| Privacy/compliance owner          | `PRIVACY-OWNER`            | exedi Widjaja         | exedi_ojolpreman@gmail.com | `APPROVED`     |
| Release manager                   | `REL-MANAGER`              | Mista Beast           | Beast_Gang@gmail.com       | `APPROVED`     |
| Business sponsor                  | `BUSINESS-SPONSOR`         | Evan Widjaja          | bababooey@gmail.com        | `APPROVED`     |
| Independent security reviewer     | `INDEPENDENT-SECURITY`     | Preman Malang         | Preman@gmail.com           | `APPROVED`     |
| Independent data/release reviewer | `INDEPENDENT-DATA-RELEASE` | Soepardi Asal Jakarta | Usd_xD@gmail.com           | `APPROVED`     |
| Repository administrator          | `REPO-ADMIN`               | Babagang Widjaja      | Baba@gmail.com             | `APPROVED`     |
| Procurement owner                 | `PROCUREMENT-OWNER`        | Mista Beast           | Beast_Gang@gmail.com       | `APPROVED`     |
| Accessibility reviewer            | `A11Y-REVIEWER`            | Logang Forever        | LoganPaul@gmail.com        | `APPROVED`     |
| Implementation/test operator      | `IMPLEMENTATION-OPERATOR`  | Jake Paulers          | Jakey@meco.co.id           | `APPROVED`     |

The approved Phase 0 assignment model uses ten distinct people. The business
sponsor must replace every `Unassigned` value above with a real name and stable
identity before any roster approval is valid:

| Person slot              | Canonical role IDs                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| Executive/product        | `BUSINESS-SPONSOR`, `PRODUCT-OWNER`, `MANAGEMENT-OWNER`                                            |
| Engineering owner        | `SE-OWNER`, `PROJECT-MGMT-OWNER`, `ENGINEERING-DOMAIN-OWNER`                                       |
| Security/identity        | `SEC-OWNER`, `IDENTITY-OWNER`                                                                      |
| Platform/admin           | `PLATFORM-OWNER`, `SRE-OWNER`, `REPO-ADMIN`                                                        |
| Data/privacy             | `DATA-OWNER`, `PRIVACY-OWNER`, `FINANCE-READONLY-OWNER`                                            |
| Quality/accessibility    | `QA-OWNER`, `QAQC-BUSINESS-OWNER`, `A11Y-REVIEWER`                                                 |
| Operations/operator      | `PURCHASING-OWNER`, `WAREHOUSE-OWNER`, `PPIC-OWNER`, `PRODUCTION-OWNER`, `IMPLEMENTATION-OPERATOR` |
| Release/procurement      | `REL-MANAGER`, `PROCUREMENT-OWNER`                                                                 |
| Independent security     | `INDEPENDENT-SECURITY` only                                                                        |
| Independent data/release | `INDEPENDENT-DATA-RELEASE` only                                                                    |

Both independent slots must be non-administrator GitHub collaborators with
sufficient access to submit a counted pull-request approval and dispatch the
independent reproduction. They must be distinct from each other, the
implementation operator, the merge actor, and the primary approver of every
record they independently review.

One person may hold multiple accountable roles, but nobody may approve their
own security-, data-, or release-critical work. Approval records include name,
role, date, reviewed source SHA, scope, findings, and decision.

The canonical role IDs and role requirements are repository-derived. Named
humans and stable identities are not. A repository username, commit author,
pull-request actor, or environment administrator must not be mapped to a role
without an explicit human assignment. Accordingly, the roster remains
`BLOCKED`, and `approvals.json` remains empty.

## Operator-ready Phase 0 human handoff

Complete these steps in order; do not replace any item with an agent-authored
placeholder or an unbound chat statement.

1. The business sponsor assigns named humans and stable identities to every
   required role in the roster, including independent security and
   data/release review. Confirm that critical-work reviewers are distinct from
   implementers and primary approvers.
2. Accountable owners review the exact D-01–D-07 scope, policy, retention,
   capacity, browser/OS/deployment, and accessibility proposals in
   `decision-log.md` and `supported-versions.md`; either approve them unchanged
   or revise the typed records and restart the candidate loop.
3. Identity, platform, security, procurement, and support owners review the
   proposed D-08 RHBK and D-09 AWS S3 contracts. Record subscription/account
   and procurement evidence, evidence digests, exit strategies, and named
   operational owners before approval.
4. Platform, identity, security, application, and release owners reserve and
   validate every exact production boundary already populated in
   `endpoint-matrix.json`, including DNS zones, HTTPS origins, OIDC callbacks,
   proxy hops, service names, and the build-time API value. Record the DNS and
   change-control references before approval.
5. The repository administrator supplies authenticated candidate-bound
   evidence for branch protection, labels, visibility, and Actions restriction.
   The release manager adds independent required reviewers, self-review
   prevention, and least-privilege secrets to the `production` environment;
   administrator bypass is already disabled, but that mechanical hardening is
   not an approval.
6. After the candidate SHA and all evidence artifacts are frozen, named role
   signers create complete digest-bound records in `approvals.json`. Use a
   distinct independent reviewer and bind every record to its exact subject,
   scope, source SHA, and evidence URI.
7. Populate `phase-zero-closure.json` only from those accepted records and two
   clean, successful, candidate-identical runs: the authoritative run and a
   reviewer-operated independent reproduction with non-overlapping artifacts.
   Then run the local closure policy and authenticated remote verifier.

Known branch names, commit SHAs, diagnostic run IDs, and observed control-plane
state remain useful diagnostics in `ci-governance.md`; they are not closure
fields until candidate-bound evidence and human approval meet the schema.

## Canonical role IDs and aliases

Records use these stable IDs. Existing prose labels map to these IDs and do
not create additional unnamed roles.

| Role ID                    | Roster role                       | Accepted aliases                                         |
| -------------------------- | --------------------------------- | -------------------------------------------------------- |
| `SE-OWNER`                 | Software engineering owner        | application owner, repository owner for application code |
| `SEC-OWNER`                | Security owner                    | security/release owner when paired with `REL-MANAGER`    |
| `DATA-OWNER`               | Database/data owner               | database owner, data owner                               |
| `PRODUCT-OWNER`            | Product owner                     | product owner                                            |
| `QA-OWNER`                 | Test/QA owner                     | test owner, QA owner                                     |
| `QAQC-BUSINESS-OWNER`      | QA/QC business owner              | QA/QC process owner                                      |
| `PURCHASING-OWNER`         | Purchasing owner                  | purchasing process owner                                 |
| `WAREHOUSE-OWNER`          | Warehouse owner                   | warehouse process owner                                  |
| `PROJECT-MGMT-OWNER`       | Project-management owner          | project-management process owner                         |
| `ENGINEERING-DOMAIN-OWNER` | Engineering-domain owner          | engineering process owner                                |
| `PPIC-OWNER`               | PPIC owner                        | production planning and inventory control owner          |
| `PRODUCTION-OWNER`         | Production owner                  | production process owner                                 |
| `FINANCE-READONLY-OWNER`   | Finance-readonly owner            | finance reporting owner                                  |
| `MANAGEMENT-OWNER`         | Management owner                  | management reporting owner                               |
| `IDENTITY-OWNER`           | Identity owner                    | identity owner                                           |
| `PLATFORM-OWNER`           | Cloud/platform owner              | platform owner, storage owner                            |
| `SRE-OWNER`                | SRE/on-call owner                 | operations owner, on-call owner                          |
| `PRIVACY-OWNER`            | Privacy/compliance owner          | privacy owner, compliance owner                          |
| `REL-MANAGER`              | Release manager                   | release owner                                            |
| `BUSINESS-SPONSOR`         | Business sponsor                  | business owner                                           |
| `REPO-ADMIN`               | Repository administrator          | repository administrator                                 |
| `PROCUREMENT-OWNER`        | Procurement owner                 | procurement owner                                        |
| `A11Y-REVIEWER`            | Accessibility reviewer            | accessibility reviewer                                   |
| `IMPLEMENTATION-OPERATOR`  | Implementation/test operator      | implementation operator                                  |
| `INDEPENDENT-SECURITY`     | Independent security reviewer     | security reviewer                                        |
| `INDEPENDENT-DATA-RELEASE` | Independent data/release reviewer | data reviewer, release reviewer                          |

## Approval record schema

Every accepted decision, risk, endpoint matrix, source baseline, or critical
control must reference a record with these fields. Blank values never imply
approval.

Each JSON record contains a primary `approver`, all required named
`roleApprovals`, and an `independentReviewer`. Every person entry includes a
canonical role ID and stable corporate/GitHub identity. The evidence URI is
bound by `evidenceSha256`; a display name or unverified role list cannot stand
in for an approval.

`approvals.json` is the machine-validated authoritative approval registry.
Markdown tables remain the human-readable index. A referenced approval is valid
only when its JSON record contains every schema field, is bound to the Phase 0
candidate SHA, names an independent reviewer distinct from the approver, and
has decision `APPROVED`.

## Program records

- `decision-log.md`: Phase 0 design inputs and approvals.
- `defect-ledger.md`: every scoped discovery and disposition.
- `risk-register.md`: residual risk, compensating control, review, expiry, and approval.
- `traceability.md`: exactly-one-primary-phase finding routing.
- `blockers.md`: current release and phase blockers.
- `command-prerequisites.md`: fail-closed execution contract.
- `evidence-index.md`: source/evidence identity and invalidation ownership.
- `ci-governance.md`: repository and GitHub control-plane evidence.
- `endpoint-matrix.md`: exact production boundary values.
- `supported-versions.md`: frozen runtime/tool/image baseline.

## Defect and release labels

- `BLOCKER`: must close before its phase gate.
- `CRITICAL` / `HIGH`: security or integrity severity; never overridden by
  convenience or an undocumented exception.
- `LATER-PHASE`: one named primary phase, owner, executable acceptance test,
  rationale, security review, and proof it does not invalidate the current
  phase.
- `IMPLEMENTED-UNCOMMITTED`: working-tree implementation that is not accepted
  until committed, reviewed, and reproduced cleanly.

These are repository labels, not prose-only categories. Phase 0 closure
requires candidate-bound GitHub API evidence that all five exact labels exist
with descriptions preserving these meanings. The five labels now exist, but
label establishment remains blocked until authenticated evidence and approval
are bound to the candidate.

## Evidence acceptance and invalidation

Evidence is accepted only from an owner-approved clean committed SHA through
the immutable least-privilege controls in `ci-governance.md`, with all fields
required by `command-prerequisites.md`. The release manager applies master-plan
section 9 after every change and reopens invalidated phases. Current Phase 0
evidence remains diagnostic because source controls, owners, review, and the
committed SHA are incomplete.
