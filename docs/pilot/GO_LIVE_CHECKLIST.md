# Controlled-pilot go-live checklist

## Candidate evidence

- [ ] Version, revision, build date, image digests, and schema migrations recorded.
- [ ] `pnpm verify`, authorization, OpenAPI, browser, artifact, and pilot acceptance
      commands pass; every exception is classified and approved.
- [ ] Clean-environment backup restore is verified with checksums, authentication,
      permissions, readiness, and isolation.
- [ ] Security review has no unresolved critical/high issue; external TLS/secrets,
      scanner, storage protection, logging, and access controls are approved for
      the pilot environment.

## Operational readiness

- [ ] Scope, dates, 3-5 selected projects, approximately 10 suppliers, and owners approved.
- [ ] Users are trained, least-privilege access approved, and negative isolation checked.
- [ ] Pilot dataset and BOM template validated; no uncontrolled personal/real secret data.
- [ ] Incident, correction, support, daily review, backup, rollback, and manual fallback rehearsed.
- [ ] KPI baseline owners/evidence sources agreed; acceptance record signed.
- [ ] Previous compatible images/config and verified backup identifier are available.

Decision: NOT READY / READY WITH CONDITIONS / READY FOR CONTROLLED PILOT

Conditions (owner, due point, workaround, rollback trigger): ____

Pilot owner: ____ Security: ____ Operations: ____ Business owner: ____ UTC time: ____
