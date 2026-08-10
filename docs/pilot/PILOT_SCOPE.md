# Pilot scope

## Purpose and boundary

The pilot validates MECO Flow with four fictional fabrication projects and ten
representative suppliers in the production-oriented staging deployment. It is
limited to authentication, project membership, item/BOM control, requisition,
purchase order and supplier commitments, ASN/partial receiving, documents,
inspection, quarantine/NCR, allocation, readiness, reports, notifications, and
audit evidence already implemented through Phase 9C.

Out of scope: production cutover, real commercial commitments, bulk legacy
migration, new workflows, mobile native clients, cross-supplier comparison,
production monitoring/on-call, or acceptance of unresolved security controls.

## Participants and duration

- Pilot owner: named before go-live; accountable for the daily decision.
- Product/process owner: validates workflow meaning and accepts data corrections.
- Administrator: provisions least privilege and performs access review.
- Internal users: project manager/procurement, warehouse, QA/QC, and management.
- Supplier users: two interactive representative organizations; eight additional
  fictional organizations provide scale/reference coverage.
- Support: Level 1 triage, Level 2 application/operations, Level 3 engineering/security.

Run for a time-box approved on the go-live record. Start/end dates and named
participants belong in the pilot-user list and go-live checklist, not source.

## Success and stop rules

Success requires the acceptance script, backup restoration, supplier isolation,
critical data-integrity checks, daily checklist, and agreed KPI baseline to have
traceable evidence. Stop intake immediately for suspected cross-organization
disclosure, authentication bypass, audit loss, checksum mismatch, duplicate or
incorrect inventory quantity, uncontrolled workflow state, or unavailable
rollback/restore. Follow `ROLLBACK_CRITERIA.md` and `INCIDENT_REPORTING.md`.
