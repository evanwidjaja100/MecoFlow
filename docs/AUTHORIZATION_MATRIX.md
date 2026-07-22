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
| `supplier.asn.read`                   | Read own-organization advance shipment notices       |
| `supplier.asn.write`                  | Create own-organization advance shipment notices     |
| `supplier.asn.transition`             | Submit, dispatch, or cancel own shipment notices     |

## Seeded role mapping

| Role               | Organization scope | Seeded permissions                                                                                         |
| ------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `SYSTEM_ADMIN`     | Internal           | All seeded permissions; global catalog actions still require an active internal membership and are audited |
| `MECO_MANAGEMENT`  | Internal           | Existing grants plus BOM/requisition/PO read and PO exception read                                         |
| `PROJECT_MANAGER`  | Internal           | Existing grants plus all BOM, requisition, PO, override, and exception grants                              |
| `ENGINEERING`      | Internal           | Existing grants plus BOM authoring/review and requisition/PO read                                          |
| `PPIC`             | Internal           | Existing grants plus BOM read/review, requisition/PO read, and PO exception read                           |
| `PURCHASING`       | Internal           | Requisition create/submit/cancel and PO read/write/send/cancel/exception; no approval or quantity override |
| `WAREHOUSE`        | Internal           | Existing grants plus `bom.read`                                                                            |
| `QA_QC`            | Internal           | Existing grants plus BOM/requisition/PO read and PO exception read                                         |
| `PRODUCTION`       | Internal           | Existing grants plus `bom.read`                                                                            |
| `FINANCE_READONLY` | Internal           | Existing read grants plus BOM/requisition/PO read; no procurement command permission                       |
| `AUDITOR_READONLY` | Internal           | Existing read/export/audit grants plus BOM/requisition/PO read; no procurement command permission          |
| `SUPPLIER_ADMIN`   | Own supplier       | Existing own-organization grants plus supplier PO read/acknowledge and commitment append                   |
| `SUPPLIER_USER`    | Own supplier       | Own organization/project read plus supplier PO read/acknowledge and commitment append                      |
| `CUSTOMER_VIEWER`  | Reserved           | None; no MVP application surface                                                                           |

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
