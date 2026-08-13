# Release-readiness governance

## Accountability and reviewer roster

Only a named human can own or approve a production control. The implementing
agent may prepare code/evidence but cannot self-approve it.

| Role                              | Role ID                    | Named human | Stable identity | Phase 0 status |
| --------------------------------- | -------------------------- | ----------- | --------------- | -------------- |
| Software engineering owner        | `SE-OWNER`                 | Unassigned  | Unassigned      | `BLOCKED`      |
| Security owner                    | `SEC-OWNER`                | Unassigned  | Unassigned      | `BLOCKED`      |
| Database/data owner               | `DATA-OWNER`               | Unassigned  | Unassigned      | `BLOCKED`      |
| Product owner                     | `PRODUCT-OWNER`            | Unassigned  | Unassigned      | `BLOCKED`      |
| Test/QA owner                     | `QA-OWNER`                 | Unassigned  | Unassigned      | `BLOCKED`      |
| QA/QC business owner              | `QAQC-BUSINESS-OWNER`      | Unassigned  | Unassigned      | `BLOCKED`      |
| Purchasing owner                  | `PURCHASING-OWNER`         | Unassigned  | Unassigned      | `BLOCKED`      |
| Warehouse owner                   | `WAREHOUSE-OWNER`          | Unassigned  | Unassigned      | `BLOCKED`      |
| Project-management owner          | `PROJECT-MGMT-OWNER`       | Unassigned  | Unassigned      | `BLOCKED`      |
| Engineering-domain owner          | `ENGINEERING-DOMAIN-OWNER` | Unassigned  | Unassigned      | `BLOCKED`      |
| PPIC owner                        | `PPIC-OWNER`               | Unassigned  | Unassigned      | `BLOCKED`      |
| Production owner                  | `PRODUCTION-OWNER`         | Unassigned  | Unassigned      | `BLOCKED`      |
| Finance-readonly owner            | `FINANCE-READONLY-OWNER`   | Unassigned  | Unassigned      | `BLOCKED`      |
| Management owner                  | `MANAGEMENT-OWNER`         | Unassigned  | Unassigned      | `BLOCKED`      |
| Identity owner                    | `IDENTITY-OWNER`           | Unassigned  | Unassigned      | `BLOCKED`      |
| Cloud/platform owner              | `PLATFORM-OWNER`           | Unassigned  | Unassigned      | `BLOCKED`      |
| SRE/on-call owner                 | `SRE-OWNER`                | Unassigned  | Unassigned      | `BLOCKED`      |
| Privacy/compliance owner          | `PRIVACY-OWNER`            | Unassigned  | Unassigned      | `BLOCKED`      |
| Release manager                   | `REL-MANAGER`              | Unassigned  | Unassigned      | `BLOCKED`      |
| Business sponsor                  | `BUSINESS-SPONSOR`         | Unassigned  | Unassigned      | `BLOCKED`      |
| Independent security reviewer     | `INDEPENDENT-SECURITY`     | Unassigned  | Unassigned      | `BLOCKED`      |
| Independent data/release reviewer | `INDEPENDENT-DATA-RELEASE` | Unassigned  | Unassigned      | `BLOCKED`      |
| Repository administrator          | `REPO-ADMIN`               | Unassigned  | Unassigned      | `BLOCKED`      |
| Procurement owner                 | `PROCUREMENT-OWNER`        | Unassigned  | Unassigned      | `BLOCKED`      |
| Accessibility reviewer            | `A11Y-REVIEWER`            | Unassigned  | Unassigned      | `BLOCKED`      |
| Implementation/test operator      | `IMPLEMENTATION-OPERATOR`  | Unassigned  | Unassigned      | `BLOCKED`      |

One person may hold multiple accountable roles, but nobody may approve their
own security-, data-, or release-critical work. Approval records include name,
role, date, reviewed source SHA, scope, findings, and decision.

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
