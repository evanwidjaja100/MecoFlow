# Pilot project-selection criteria

Score every candidate yes/no and retain the approver and evidence link outside
Git. Select three to five projects only when all mandatory criteria pass.

## Mandatory

- Owner, project manager, procurement, warehouse, and QA/QC participants named.
- BOM is bounded, reviewable, and contains both critical and noncritical lines.
- At least one participating supplier is trained and explicitly assigned.
- Planned dates cover the pilot window and do not depend on unsupported features.
- Partial delivery, certificate/inspection, readiness, and exception scenarios
  can be exercised without disrupting real production.
- Source data is approved, classified, and free of uncontrolled personal data.
- Manual fallback and rollback owner are available throughout the pilot.

## Exclusions

Exclude safety-critical live work, projects with unresolved legal/data-residency
constraints, unverified identities, unreviewable BOM sources, unsupported units,
or a dependency whose outage would remove the manual operational fallback.

## Selection record

Record: project code, sponsor, data owner, supplier set, critical-line count,
planned scenario, risk rating, mandatory-result, approval, and date.
