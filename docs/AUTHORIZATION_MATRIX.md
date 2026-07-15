# Authorization matrix

## Decision model

A role grants permissions but never scope by itself. Active membership, organization scope, project assignment, object policy, state policy, and field filtering are additional mandatory checks. `SYSTEM_ADMIN` is still authenticated, active, audited, and subject to explicit policy.

## Planned role families

| Role             | Intended scope                     | Write focus                                              |
| ---------------- | ---------------------------------- | -------------------------------------------------------- |
| SYSTEM_ADMIN     | Platform administration            | Organizations, memberships, roles, configuration         |
| MECO_MANAGEMENT  | Internal cross-project read        | Management oversight and approved exceptions             |
| PROJECT_MANAGER  | Assigned projects                  | Project lifecycle and membership                         |
| ENGINEERING      | Assigned projects                  | Items and BOM preparation/release permissions as granted |
| PPIC             | Assigned projects                  | Planning, readiness, allocation coordination             |
| PURCHASING       | Assigned/internal procurement      | Requisitions, POs, supplier follow-up                    |
| WAREHOUSE        | Authorized receipts/locations      | Receipt capture and correction commands                  |
| QA_QC            | Authorized inspections             | Inspection and NCR commands                              |
| PRODUCTION       | Assigned projects                  | Readiness and authorized consumption views/actions       |
| FINANCE_READONLY | Internal permitted commercial view | None                                                     |
| AUDITOR_READONLY | Authorized audit scope             | None                                                     |
| SUPPLIER_ADMIN   | Own supplier organization          | Supplier membership and collaboration as granted         |
| SUPPLIER_USER    | Own supplier organization          | Commitments, ASN, shared documents, NCR responses        |
| CUSTOMER_VIEWER  | No MVP application surface         | None                                                     |

The exact granular role-to-permission mapping will be implemented and tested in Phase 1. Representative permission namespaces are organization, user, project, milestone, work_package, item, bom, requisition, purchase_order, supplier_commitment, shipment, receipt, inspection, ncr, document, material, readiness, report, audit, notification, and administration.

## Mandatory negative tests

Each supplier resource proves Supplier A cannot read or mutate Supplier B's resource by identifier manipulation. Additional coverage includes unauthenticated and inactive principals, inactive memberships, internal cross-function denial, project isolation, private field removal, readonly mutation denial, customer route denial, and inaccessible/not-found equivalence.

## Phase 0

Only public, non-sensitive liveness/readiness endpoints exist. They disclose a status and opaque dependency names only. No business authorization is implemented or bypassed in Phase 0.
