# Authorization matrix

## Phase 1 decision model

Every protected API operation requires a valid opaque server-side session, an active `UserProfile`, at least one active membership in an active organization, the required permission, and the applicable organization/object policy. A role grants permissions but never scope by itself. The API denies by default; web navigation is presentation only.

`SYSTEM_ADMIN` may administer organizations through an active internal membership. It is not exempt from authentication, active-state, CSRF, optimistic-concurrency, or audit controls. Supplier memberships never satisfy the internal-administration policy.

Project and item-master permissions are retained in the cumulative seed catalog, but Phase 1 itself exposes no project or item records, routes, or screens.

## Seeded permission catalog

| Permission                            | Current meaning                                      |
| ------------------------------------- | ---------------------------------------------------- |
| `administration.access`               | Enter internal identity/organization administration  |
| `organization.read`                   | Read organizations through internal administration   |
| `organization.write`                  | Create or change organizations                       |
| `membership.read`                     | Read organization memberships                        |
| `membership.write`                    | Create, activate, or deactivate memberships          |
| `role.read`                           | Read roles and assignments                           |
| `role.assign`                         | Replace membership role assignments                  |
| `user.read`                           | Read authorized synchronized profiles                |
| `audit.read`                          | Read authorized audit history                        |
| `supplier.organization.read`          | Read the principal's supplier organization           |
| `supplier.membership.read`            | Reserved own-supplier membership read                |
| `supplier.membership.write`           | Reserved own-supplier membership administration      |
| `project.read`                        | Read projects allowed by project policy              |
| `project.write`                       | Change projects allowed by project policy            |
| `project.membership.manage`           | Manage explicit project scope                        |
| `readiness.read`                      | Read authorized readiness snapshots and explanations |
| `report.read`                         | Read authorized Phase 8B operational reports         |
| `report.export`                       | Export authorized Phase 8B operational reports       |
| `scorecard.read`                      | Read authorized internal supplier scorecards         |
| `item.read`                           | Read the global internal item master                 |
| `item.write`                          | Create or change internal item-master records        |
| `item.export`                         | Export filtered internal item-master records         |
| `bom.read`                            | Read authorized BOM revisions and import results     |
| `bom.write`                           | Correct authorized draft BOM revisions               |
| `bom.import`                          | Upload, validate, and confirm authorized BOM imports |
| `bom.review`                          | Review and cancel authorized BOM revisions           |
| `bom.release`                         | Release and supersede authorized BOM revisions       |
| `requisition.read`                    | Read scoped requisitions and released-need coverage  |
| `requisition.write`                   | Create scoped draft requisitions                     |
| `requisition.submit`                  | Submit scoped draft requisitions                     |
| `requisition.approve`                 | Approve or reject scoped submitted requisitions      |
| `requisition.cancel`                  | Cancel scoped active requisitions                    |
| `requisition.override`                | Authorize and attribute quantities above need        |
| `purchase-order.read`                 | Read scoped internal purchase orders                 |
| `purchase-order.write`                | Create and revise scoped purchase orders             |
| `purchase-order.send`                 | Send current scoped PO revisions                     |
| `purchase-order.cancel`               | Cancel active scoped purchase orders                 |
| `purchase-order.override`             | Authorize quantity above approved availability       |
| `purchase-order.exception.read`       | Read late supplier commitment exceptions             |
| `supplier.purchase-order.read`        | Read own-organization addressed purchase orders      |
| `supplier.purchase-order.acknowledge` | Acknowledge own-organization PO revisions            |
| `supplier.commitment.write`           | Append own-organization supplier commitments         |
| `document.read`                       | Read authorized project document metadata            |
| `document.upload`                     | Upload project document versions                     |
| `document.review`                     | Submit/review clean project document versions        |
| `document.approve`                    | Approve or reject reviewed document versions         |
| `supplier.document.read`              | Read own-organization project documents              |
| `supplier.document.upload`            | Upload own-organization project document versions    |
| `shipment.read`                       | Read project advance shipment notices                |
| `shipment.arrive`                     | Record arrival of in-transit shipments               |
| `receiving.read`                      | Read project receipts and awaiting-inspection lots   |
| `receiving.write`                     | Create project draft goods receipts                  |
| `receiving.post`                      | Idempotently post project goods receipts             |
| `receiving.correct`                   | Create separate project correcting receipt entries   |
| `inspection.read`                     | Read scoped inspections and their work queue         |
| `inspection.configure`                | Configure item inspection check definitions          |
| `inspection.create`                   | Explicitly create a required lot inspection          |
| `inspection.write`                    | Record scoped inspection results                     |
| `inspection.finalize`                 | Finalize a scoped inspection and lot disposition     |
| `inspection.conditional-accept`       | Authorize and attribute conditional acceptance       |
| `ncr.read`                            | Read scoped internal NCRs                            |
| `ncr.create`                          | Create scoped NCR drafts                             |
| `ncr.issue`                           | Issue scoped NCRs to their supplier                  |
| `ncr.close`                           | Close or cancel scoped NCRs                          |
| `supplier.ncr.read`                   | Read issued own-organization NCRs                    |
| `supplier.ncr.respond`                | Append own-organization NCR responses                |
| `allocation.read`                     | Read scoped material allocations                     |
| `allocation.create`                   | Allocate accepted lots to released BOM lines         |
| `allocation.release`                  | Release active material allocations                  |
| `allocation.consume`                  | Consume active material allocations                  |
| `allocation.conditional-use`          | Authorize conditionally accepted material use        |
| `supplier.asn.read`                   | Read own-organization advance shipment notices       |
| `supplier.asn.write`                  | Create own-organization advance shipment notices     |
| `supplier.asn.transition`             | Submit, dispatch, or cancel own shipment notices     |
| `supplier.scorecard.read`             | Read the own-organization supplier scorecard         |
| `supplier.scorecard.export`           | Export the own-organization supplier scorecard       |

## Seeded role mapping

| Role               | Organization scope | Seeded permissions                                                                                         |
| ------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `SYSTEM_ADMIN`     | Internal           | All seeded permissions; global catalog actions still require an active internal membership and are audited |
| `MECO_MANAGEMENT`  | Internal           | Existing grants plus BOM/procurement/receiving/inspection/NCR/allocation read and PO exception read        |
| `PROJECT_MANAGER`  | Internal           | Inspection, NCR, and ordinary allocation commands; no configuration, conditional acceptance/use            |
| `ENGINEERING`      | Internal           | Existing grants plus BOM authoring/review and requisition/PO read                                          |
| `PPIC`             | Internal           | Existing reads plus ordinary allocation create/release                                                     |
| `PURCHASING`       | Internal           | Procurement grants plus NCR commands and allocation read; no quantity/conditional override                 |
| `WAREHOUSE`        | Internal           | Receiving/inspection read-create plus ordinary allocation create/release                                   |
| `QA_QC`            | Internal           | All inspection, NCR, and allocation grants, including both conditional authorities                         |
| `PRODUCTION`       | Internal           | Existing reads plus allocation consumption                                                                 |
| `FINANCE_READONLY` | Internal           | Existing read grants plus inspection/NCR/allocation read                                                   |
| `AUDITOR_READONLY` | Internal           | Existing read/export/audit grants plus inspection/NCR/allocation read                                      |
| `SUPPLIER_ADMIN`   | Own supplier       | Existing own-organization collaboration plus NCR read/respond                                              |
| `SUPPLIER_USER`    | Own supplier       | Existing own-organization collaboration plus NCR read/respond                                              |
| `CUSTOMER_VIEWER`  | Reserved           | None; no MVP application surface                                                                           |

Phase 8B grants `report.read` to seeded internal roles already holding readiness/BOM visibility. Export is limited to system administration, management, project management, purchasing, QA/QC, finance-readonly, and auditor-readonly. The same roles receive internal `scorecard.read`. Both supplier roles receive own-scorecard read/export only.

## Phase 1 endpoint policy

| API surface                                                              | Required policy                                                           |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `GET /api/v1/me`                                                         | Authenticated, active user, active membership, active organization        |
| `GET /api/v1/administration/organizations`                               | Internal administration + `organization.read`                             |
| `POST /api/v1/administration/organizations`                              | Internal administration + `organization.write` + CSRF                     |
| `GET /api/v1/administration/users`                                       | Internal administration + `user.read`                                     |
| `GET /api/v1/administration/roles`                                       | Internal administration + `role.read`                                     |
| `GET /api/v1/administration/organizations/{organizationId}/memberships`  | Internal administration + `membership.read` + organization scope          |
| `POST /api/v1/administration/organizations/{organizationId}/memberships` | Internal administration + `membership.write` + organization scope + CSRF  |
| `PATCH .../memberships/{membershipId}/status`                            | Internal administration + `membership.write` + scoped object ID + CSRF    |
| `PUT .../memberships/{membershipId}/roles`                               | Internal administration + `role.assign` + scoped object ID + CSRF + audit |

Membership object queries include both membership and organization identifiers. Supplier attempts against real own, real foreign, and nonexistent identifiers return the same safe denial. Internal scoped lookups return generic not-found responses for nonexistent/inaccessible protected objects.

## Mandatory negative evidence

Automated authorization tests cover unauthenticated/inactive principals, inactive memberships, supplier internal-administration denial, read-only write denial, organization identifier manipulation, CSRF enforcement through all write paths, project-policy deny-capable interfaces, and immutable audit persistence for role changes. Phase 2 adds Supplier A/B project-object tests; Phase 3A adds supplier item-master denial plus permission-specific read/write/export evidence.

## Phase 2 project decision model

Project permissions remain necessary but never create project scope. `SYSTEM_ADMIN` can access internal projects for authenticated oversight. `MECO_MANAGEMENT` can read projects in its internal organization. Other internal roles require an active explicit `ProjectMember` assignment. Supplier roles require an active explicit supplier project-member assignment and remain read-only. Inactive assignments, inactive organization memberships, and inactive organizations grant no scope.

| API surface                           | Required policy                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `GET /api/v1/product-categories`      | Active principal + `project.read`; supplier-only results are active-only                       |
| Category `POST`/`PATCH`               | Active internal membership + `project.write` + CSRF + expected version on edit                 |
| `GET /api/v1/projects`                | `project.read` + repository-scoped result query                                                |
| `POST /api/v1/projects`               | Active internal membership in requested organization + `project.write` + CSRF                  |
| Project `GET`                         | `project.read` + project scope; supplier response field filtering                              |
| Project details `PATCH`               | `project.write` + writable project scope + nonterminal state + CSRF + expected version         |
| `POST .../transitions`                | `project.write` + writable project scope + allowed transition + CSRF + expected version        |
| Member candidate/read/write routes    | `project.membership.manage` + writable project scope; CSRF and expected version for changes    |
| Milestone/work-package `POST`/`PATCH` | `project.write` + writable project scope + nonterminal state + CSRF + expected version on edit |

Project identifiers outside scope and nonexistent project identifiers both return generic not-found responses for principals that otherwise hold `project.read`. Supplier responses never expose project member identities or transition history. Browser route visibility remains presentation only.

## Phase 3A item-master decision model

The item master is one global catalog shared across active internal organizations. Organization identity does not partition item/category/unit records; it supplies the actor scope attached to audit events. Every route requires an active internal membership plus the specific item permission. Supplier and customer roles receive no item permission and are denied before item data is disclosed. Web navigation and hidden controls remain presentation only.

| API surface                                                      | Required policy                                                                                      |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `GET /api/v1/item-categories` and `GET /api/v1/units-of-measure` | Active internal membership + `item.read`                                                             |
| Category/unit `POST`                                             | Active internal membership + `item.write` + CSRF + same-transaction audit                            |
| Category/unit `PATCH`                                            | Active internal membership + `item.write` + CSRF + expected version + reference-integrity validation |
| Specification-attribute `POST`                                   | Active internal membership + `item.write` + CSRF + active category/unit validation                   |
| Specification-attribute `PATCH`                                  | Active internal membership + `item.write` + CSRF + expected version + structural-integrity checks    |
| `GET /api/v1/items` and `GET /api/v1/items/{itemId}`             | Active internal membership + `item.read`                                                             |
| `POST /api/v1/items`                                             | Active internal membership + `item.write` + CSRF + typed specification validation                    |
| `PATCH /api/v1/items/{itemId}`                                   | Active internal membership + `item.write` + CSRF + expected version + active item                    |
| `POST /api/v1/items/{itemId}/deactivate`                         | Active internal membership + `item.write` + CSRF + expected version + reason                         |
| `GET /api/v1/items/export.csv`                                   | Active internal membership + `item.export` + bounded filters + export audit                          |
| `DELETE /api/v1/items/{itemId}`                                  | Not implemented; database deletion is rejected                                                       |

Supplier attempts against real and nonexistent item identifiers return the same safe denial. Permitted readers receive the generic not-found contract for a nonexistent item. Authorization tests separately prove that read does not imply write or export, export does not imply write, missing CSRF denies every unsafe route, and failed commands do not leave business or success-audit state.

## Phase 3B BOM decision model

BOM permissions never create project scope. Every route first requires an active internal membership with the operation-specific permission and then applies the existing project policy. Read routes require project-read scope. Upload, confirmation, draft correction, and lifecycle commands also require project-write scope. Suppliers and reserved customers receive no BOM permissions and are denied before a BOM/import/revision identifier is resolved.

| API surface                                                  | Required policy                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Project BOM/import list and import/revision/comparison reads | `bom.read` + project-read scope                                                            |
| CSV/XLSX templates and upload                                | `bom.import` + project-write scope; CSRF on upload                                         |
| Import confirmation                                          | `bom.import` + project-write scope + CSRF + expected import version + literal confirmation |
| Draft line correction                                        | `bom.write` + project-write scope + CSRF + expected line version + draft state             |
| Review/cancel                                                | `bom.review` + project-write scope + CSRF + expected revision version + valid transition   |
| Release/supersede                                            | `bom.release` + project-write scope + CSRF + expected revision version + valid transition  |

Supplier real/nonexistent project attempts return the same safe denial. An internal principal with `bom.read` but without project assignment receives generic not-found for both an unassigned real project and a nonexistent project. Missing CSRF is denied before an upload object is written. Release permission is intentionally limited to project managers and system administrators in the Phase 3B seed; engineering may import, correct, and review but cannot release.

## Phase 4A purchase requisition decision model

Requisition permissions never create project scope. Every route first requires an active internal membership with the operation-specific permission and then applies existing project read/write policy. Suppliers and reserved customers receive no requisition permission. Detail and command routes check the required permission before protected object resolution, then re-scope the resolved project.

| API surface                                | Required policy                                                                                           |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Released requirement and requisition lists | `requisition.read` + project-read scope                                                                   |
| Requisition detail                         | `requisition.read` + resolved project-read scope                                                          |
| Draft creation                             | `requisition.write` + project-write scope + CSRF + released BOM-line scope + transactional quantity check |
| Quantity above need                        | All creation checks + separate `requisition.override` + reason + immutable authorizer and audit evidence  |
| Submit                                     | `requisition.submit` + project-write scope + CSRF + expected version + valid transition + reason          |
| Approve/reject                             | `requisition.approve` + project-write scope + CSRF + expected version + valid transition + reason         |
| Cancel                                     | `requisition.cancel` + project-write scope + CSRF + expected version + valid transition + reason          |

`SYSTEM_ADMIN` receives the complete permission catalog but remains subject to active internal membership, CSRF, project policy, version, quantity, and audit controls. `PROJECT_MANAGER` receives all requisition permissions. `PURCHASING` may read, create, submit, and cancel but cannot approve or override. Management, engineering, PPIC, QA/QC, finance-readonly, and auditor-readonly mappings are read-only for requisitions; warehouse and production receive no Phase 4A requisition grant. Supplier real/nonexistent attempts are equivalent forbidden responses, while a permissioned but unassigned internal user receives equivalent not-found responses.

## Phase 4B purchase order and commitment decision model

Internal PO permissions never create project scope. Every internal route requires an active internal membership with the operation permission and then existing project read/write policy. PO creation additionally validates an active supplier organization with an active project assignment. Supplier permissions never grant internal PO detail: supplier routes require an active supplier membership, exact addressed organization, and that same membership's active project assignment. Inaccessible and nonexistent supplier PO identifiers are equivalent not-found responses.

| API surface                                               | Required policy                                                                                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Approved-to-order projection and internal register/detail | `purchase-order.read` plus project-read scope                                                                                         |
| Draft creation and retained revision append               | `purchase-order.write` plus project-write scope, CSRF, approved requisition-line scope, quantity locks, expected version for revise   |
| Quantity above approved availability                      | Creation/revision checks plus separate `purchase-order.override`, reason, authorizer and audit evidence                               |
| Send current revision                                     | `purchase-order.send` plus project-write scope, CSRF, expected version, valid transition and reason                                   |
| Cancel active PO                                          | `purchase-order.cancel` plus project-write scope, CSRF, expected version, valid transition and reason                                 |
| Internal late-commitment exceptions                       | `purchase-order.exception.read` plus project-read scope                                                                               |
| Supplier PO list/detail                                   | `supplier.purchase-order.read` plus own addressed organization and exact active project assignment; supplier-safe field allowlist     |
| Supplier acknowledgement                                  | `supplier.purchase-order.acknowledge` plus supplier object scope, CSRF, expected version, sent current revision and reason            |
| Supplier commitment append                                | `supplier.commitment.write` plus supplier object scope, CSRF, expected version, acknowledged current revision and current PO-line IDs |

`SYSTEM_ADMIN` remains subject to active membership, project scope, CSRF, versions, quantity and audit controls. `PROJECT_MANAGER` has all internal PO permissions including override. `PURCHASING` can create/revise/send/cancel and read exceptions but cannot override approved quantity. Management, engineering, PPIC, QA/QC, finance-readonly, and auditor-readonly receive the documented read grants; warehouse and production receive none. Supplier roles can read/acknowledge/commit only within their own addressed objects and never receive internal PO permissions or fields.

## Phase 5A document decision model

Document permissions never create project scope. Internal routes compose the operation permission with project read/write policy. Supplier routes require the supplier-specific permission, exact active project assignment, and owner organization; supplier purchase-order associations additionally require the PO addressee to equal that organization. Permission preflight precedes protected identifier resolution, and repository queries apply owner scope rather than filtering unscoped results in the application.

| API surface                      | Required policy                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project document list and detail | Internal `document.read` plus project read, or `supplier.document.read` plus exact assignment and owner organization                                                                            |
| Upload initiation/completion     | Internal `document.upload` plus project write, or `supplier.document.upload` plus exact project assignment; CSRF, owner organization, validated metadata/object, expected version on completion |
| Review submission                | Upload policy plus owner organization, clean current draft, CSRF, expected version                                                                                                              |
| Review download                  | Internal `document.review` plus project write, clean current review state, CSRF                                                                                                                 |
| Approval/rejection               | Internal `document.approve` plus project write, clean current review state, CSRF, expected version                                                                                              |
| Approved download                | Document read policy, clean approved state, CSRF, audited short-lived URL                                                                                                                       |
| Supersede                        | Upload policy plus owner organization, current approved version, CSRF, expected document version; creates a new version                                                                         |

`SYSTEM_ADMIN` receives all document grants but remains subject to active membership, owner/project policy, CSRF, versions, scan state, and audit. `PROJECT_MANAGER` can read/upload/review/approve. `ENGINEERING` can read/upload/review. `PPIC` can read/review. `PURCHASING` and `WAREHOUSE` can read/upload. `QA_QC` can read/upload/review/approve. Management, production, finance-readonly, and auditor-readonly are read-only. Supplier roles can read/upload only their own assigned-organization documents and cannot approve. Cross-supplier and real/nonexistent denial are automated.

## Phase 5B ASN and receiving decision model

Supplier ASN permissions never grant internal shipment or receipt access. Supplier routes require an active supplier membership, exact addressed organization, an active exact project assignment, and current acknowledged PO scope. Internal shipment/receipt permissions never create project scope and are composed with the existing internal project policy. Permission checks precede protected object resolution.

| API surface                      | Required policy                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Supplier ASN list/detail         | `supplier.asn.read`, own organization, exact active project assignment, supplier-safe fields                       |
| Supplier ASN creation            | `supplier.asn.write`, own current acknowledged PO revision/lines, CSRF, quantity locks                             |
| Supplier submit/dispatch/cancel  | `supplier.asn.transition`, own ASN scope, CSRF, expected version, valid transition                                 |
| Internal project ASN list/detail | `shipment.read` plus project-read scope                                                                            |
| Internal ASN arrival             | `shipment.arrive` plus project-write scope, CSRF, expected version, in-transit state                               |
| Receipt list/detail              | `receiving.read` plus project-read scope                                                                           |
| Draft receipt creation           | `receiving.write` plus project-write scope, CSRF, arrived ASN-line scope                                           |
| Receipt posting                  | `receiving.post` plus project-write scope, CSRF, expected version, `Idempotency-Key`, transactional quantity check |
| Correction creation              | `receiving.correct` plus project-write scope, CSRF, posted original receipt and line scope                         |

`SYSTEM_ADMIN` and `PROJECT_MANAGER` receive all internal Phase 5B grants. `WAREHOUSE` receives shipment read/arrival and receipt read/write/post/correct. Management, PPIC, QA/QC, production, finance-readonly, and auditor-readonly receive the documented read grants; engineering and purchasing receive shipment read. Supplier roles receive ASN read/write/transition only for their organization. Supplier B, cross-line, inactive assignment, real/nonexistent, CSRF, and field-filtering negative evidence is automated.

## Phase 6A receiving-inspection decision model

Inspection permissions never create project scope and supplier roles receive none. Every inspection route composes the operation permission with internal project scope; checks, lots, documents, and definitions are re-scoped through their parent objects before data is returned or changed. Permission preflight precedes protected identifier resolution.

| API surface                            | Required policy                                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Inspection work queue/detail           | `inspection.read` plus project-read scope                                                                                 |
| Check-definition list/create/update    | `inspection.configure`; unsafe commands also require CSRF, active item/UOM references, and expected version on update     |
| Explicit inspection creation           | `inspection.create` plus project-write scope, CSRF, an awaiting lot, active definitions, and no existing inspection       |
| Checklist/measurement/certificate save | `inspection.write` plus project-write scope, CSRF, expected version, and evidence-document approval/association checks    |
| Ordinary finalization                  | `inspection.finalize` plus project-write scope, CSRF, expected version, complete required checks, and quantity invariants |
| Conditional acceptance                 | Ordinary finalization plus independent `inspection.conditional-accept`; the authorizer and dedicated audit are retained   |

`SYSTEM_ADMIN` receives all inspection grants but remains subject to active membership, project scope, CSRF, versions, evidence, quantity, and audit controls. `QA_QC` receives all operational inspection grants. `PROJECT_MANAGER` can read/create/record/finalize but cannot configure checks or conditionally accept. `WAREHOUSE` can read and explicitly create an inspection. Management, PPIC, production, finance-readonly, and auditor-readonly can read only. Suppliers, engineering, and purchasing receive no inspection grant. Authorization tests cover real/nonexistent supplier denial, project-manager conditional-acceptance denial, CSRF, and successful independently authorized conditional acceptance with audit evidence.

## Phase 6B NCR and material-allocation decision model

NCR permissions never create project scope. Internal list/detail and commands compose `ncr.*` with existing project policy. Supplier permissions grant no internal NCR view and require an active exact supplier organization/project assignment in repository queries. Allocation permissions are internal-only and compose with project scope. Conditional use is independent of ordinary creation permission.

| API surface                     | Required policy                                                                                                                         |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Internal NCR list/detail        | `ncr.read` plus project-read scope                                                                                                      |
| NCR creation                    | `ncr.create` plus project-write scope, CSRF, valid source, derived/assigned active project supplier                                     |
| NCR issue                       | `ncr.issue` plus project-write scope, CSRF, expected version, draft state, reason                                                       |
| NCR close/cancel                | `ncr.close` plus project-write scope, CSRF, expected version, valid transition, reason                                                  |
| Supplier NCR list/detail        | `supplier.ncr.read`, exact organization, exact active project assignment, issued/responded/closed state, supplier-safe allowlist        |
| Supplier response append        | `supplier.ncr.respond`, supplier object scope, CSRF, expected version, open supplier-response state                                     |
| Allocation list/detail/options  | `allocation.read` plus project-read scope                                                                                               |
| Allocation creation             | `allocation.create` plus project-write scope, CSRF, accepted lot, current released matching BOM line, precision and locked availability |
| Conditional material allocation | Ordinary creation plus independent `allocation.conditional-use`, retained disposition authority, reason, authorizer and dedicated audit |
| Allocation release              | `allocation.release` plus project-write scope, CSRF, expected version, active allocation, reason                                        |
| Allocation consumption          | `allocation.consume` plus project-write scope, CSRF, expected version, active allocation, reason                                        |

`SYSTEM_ADMIN` remains subject to all scope/state/concurrency/audit controls. `QA_QC` receives all NCR/allocation grants including conditional use. `PROJECT_MANAGER` receives NCR and ordinary allocation commands but not conditional use. `PURCHASING` receives NCR commands and allocation read; `WAREHOUSE` and `PPIC` can create/release ordinary allocations; `PRODUCTION` can consume. Read-only roles receive only the mapped reads. Both supplier roles receive own-organization NCR read/respond only. Supplier A/B, missing-object equivalence, field absence, CSRF, project-manager conditional-use denial, and successful independently authorized use are automated.

## Phase 7A material-requirement status decision model

Phase 7A adds no permission key. The projection reuses the established internal `bom.read` grant because it is a released-BOM read model, and composes it with existing project-read scope. Every seeded internal role already holding `bom.read` retains its existing project-scope rules. Supplier roles do not hold `bom.read`, so supplier project assignment alone cannot expose the projection.

| API surface                                                    | Required policy                                                       |
| -------------------------------------------------------------- | --------------------------------------------------------------------- |
| `GET /api/v1/projects/{projectId}/material-requirement-status` | Active internal membership + `bom.read` + existing project-read scope |

The endpoint is read-only and requires no CSRF token. It exposes no supplier-specific representation.

## Phase 7B readiness decision model

Readiness permission never creates project scope. Every route requires an active internal membership with `readiness.read` and `project.read`; project routes additionally apply the existing project-read policy. The management route applies the same system-administrator, same-organization management, and active explicit assignment predicates in its repository query. Supplier and customer roles receive no readiness grant.

| API surface                    | Required policy                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| Management readiness dashboard | Internal `readiness.read` + `project.read`; repository-scoped authorized projects  |
| Project/work-package overview  | Internal `readiness.read` + project-read scope                                     |
| Material-readiness board       | Internal `readiness.read` + project-read scope; minimized persisted inputs         |
| Readiness history              | Internal `readiness.read` + project-read scope; immutable snapshot representations |

All seeded internal roles receive `readiness.read` because their existing duties already include released-BOM visibility; ordinary roles still require active project assignment. Supplier real/nonexistent project attempts are equivalent forbidden responses. There is no readiness write route or supplier representation.

## Phase 8A notification decision model

Notification inbox and preference operations are authenticated-user self-service and add no role grant. Notification creation never broadens project scope: only active internal users on an active exact project-member assignment are recipients, and inbox reads recheck that assignment. Supplier users receive no Phase 8A readiness notification.

| API surface                                        | Required policy                                                                                             |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/notifications`                        | Active authenticated principal; own user ID; current active project assignment on every returned row        |
| `POST /api/v1/notifications/{notificationId}/read` | Active authenticated principal; own notification; current active project assignment; CSRF                   |
| `GET /api/v1/notification-preferences`             | Active authenticated principal; own user ID                                                                 |
| `PUT /api/v1/notification-preferences/{type}`      | Active authenticated principal; own user ID; supported type; CSRF; expected version; same-transaction audit |

Inaccessible and nonexistent notification identifiers return the same not-found response. A request cannot supply a user ID, email address, project ID, delivery status, or source event.

## Phase 8B report and supplier-scorecard decision model

Report permissions never create project or source-object scope. Internal routes require the Phase 8B permission plus existing `project.read`, `readiness.read`, and `bom.read`; supplier performance additionally requires purchase-order, shipment, inspection, and NCR reads. Repository predicates apply the existing system-administrator, same-organization management, or active explicit project-member rules before rows are loaded.

| API surface                            | Required policy                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Project Readiness Report               | Internal `report.read` + `project.read` + `readiness.read` + `bom.read` + authorized project predicate                   |
| Material Exceptions Report             | Internal report policy plus current released-material/readiness scope                                                    |
| Internal Supplier Performance Report   | Internal report policy + `scorecard.read` + PO/shipment/inspection/NCR reads + authorized project/supplier filters       |
| Internal CSV/XLSX export               | Corresponding read policy + `report.export` + bounded rows + formula sanitization + immutable export audit               |
| Own Supplier Scorecard                 | `supplier.scorecard.read` + exact active supplier membership + active exact project assignment; aggregate allowlist only |
| Own Supplier Scorecard CSV/XLSX export | Own-scorecard policy + `supplier.scorecard.export` + bounded rows + formula sanitization + immutable export audit        |

Supplier requests cannot provide `supplierOrganizationId`; it is derived from the authenticated membership. Supplier A cannot access Supplier B scorecards, rows, filters, trends, or underlying objects. Supplier real-foreign and nonexistent identifiers are equivalent because no supplier identifier lookup surface exists. Browser route visibility is presentation only.
