# Administrator guide

## Before access

Verify IdP identity, organization type, named approver, role, project list,
training, and expiry/review date. Use the administration UI and least-privilege
roles; do not edit database memberships. A supplier gets an active supplier
membership and explicit project assignment only. Run the cross-supplier
negative check after every supplier access change.

## Daily controls

- Review active pilot users, project assignments, failed logins, safe-error and
  authorization-denial logs, outbox/dead-letter state, storage/DB/Redis health,
  pending scans, open inspections/NCRs, and readiness freshness.
- Confirm API/web/worker version metadata agrees with the approved candidate.
- Store secrets only in the deployment secret mechanism and keep runtime files
  outside Git with deployment-only ACLs.
- Retain audit events; never mutate/delete history or manually set workflow state.

## Offboarding

Deactivate the project membership or organization membership, verify access is
denied, record who approved the removal, and retain the audit reference. Rotate
credentials when compromise is suspected; follow the incident procedure.
