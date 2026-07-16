# Authorization matrix

## Phase 1 decision model

Every protected API operation requires a valid opaque server-side session, an active `UserProfile`, at least one active membership in an active organization, the required permission, and the applicable organization/object policy. A role grants permissions but never scope by itself. The API denies by default; web navigation is presentation only.

`SYSTEM_ADMIN` may administer organizations through an active internal membership. It is not exempt from authentication, active-state, CSRF, optimistic-concurrency, or audit controls. Supplier memberships never satisfy the internal-administration policy.

Project permissions are seeded for forward compatibility, but Phase 1 exposes only `ProjectScopeResolver` and `ProjectScopePolicy` interfaces. There are no project records, routes, or screens before Phase 2.

## Seeded permission catalog

| Permission                   | Phase 1 meaning                                     |
| ---------------------------- | --------------------------------------------------- |
| `administration.access`      | Enter internal identity/organization administration |
| `organization.read`          | Read organizations through internal administration  |
| `organization.write`         | Create or change organizations                      |
| `membership.read`            | Read organization memberships                       |
| `membership.write`           | Create, activate, or deactivate memberships         |
| `role.read`                  | Read roles and assignments                          |
| `role.assign`                | Replace membership role assignments                 |
| `user.read`                  | Read authorized synchronized profiles               |
| `audit.read`                 | Reserved read access to authorized audit history    |
| `supplier.organization.read` | Read the principal's supplier organization          |
| `supplier.membership.read`   | Reserved own-supplier membership read               |
| `supplier.membership.write`  | Reserved own-supplier membership administration     |
| `project.read`               | Phase 2 interface grant; no Phase 1 project surface |
| `project.write`              | Phase 2 interface grant; no Phase 1 project surface |
| `project.membership.manage`  | Phase 2 interface grant; no Phase 1 project surface |

## Seeded role mapping

| Role               | Organization scope | Phase 1 permissions                                                                                                            |
| ------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `SYSTEM_ADMIN`     | Internal           | All seeded permissions; cross-organization administration remains policy-controlled and audited                                |
| `MECO_MANAGEMENT`  | Internal           | `organization.read`, `user.read`, `project.read`, `audit.read`                                                                 |
| `PROJECT_MANAGER`  | Internal           | `project.read`, `project.write`, `project.membership.manage`                                                                   |
| `ENGINEERING`      | Internal           | `project.read`, `project.write`                                                                                                |
| `PPIC`             | Internal           | `project.read`, `project.write`                                                                                                |
| `PURCHASING`       | Internal           | `project.read`, `project.write`                                                                                                |
| `WAREHOUSE`        | Internal           | `project.read`, `project.write`                                                                                                |
| `QA_QC`            | Internal           | `project.read`, `project.write`                                                                                                |
| `PRODUCTION`       | Internal           | `project.read`                                                                                                                 |
| `FINANCE_READONLY` | Internal           | `project.read`; no write permission                                                                                            |
| `AUDITOR_READONLY` | Internal           | `project.read`, `audit.read`; no write permission                                                                              |
| `SUPPLIER_ADMIN`   | Own supplier       | `supplier.organization.read`, `supplier.membership.read`, `supplier.membership.write`, `project.read`; no internal admin grant |
| `SUPPLIER_USER`    | Own supplier       | `supplier.organization.read`, `project.read`; no internal admin grant                                                          |
| `CUSTOMER_VIEWER`  | Reserved           | None; no MVP application surface                                                                                               |

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

Automated authorization tests cover unauthenticated/inactive principals, inactive memberships, supplier internal-administration denial, read-only write denial, organization identifier manipulation, CSRF enforcement through all write paths, project-policy deny-capable interfaces, and immutable audit persistence for role changes. Phase 2 must add Supplier A/B project-object tests when project resources exist; Phase 1 does not create placeholder project data.
