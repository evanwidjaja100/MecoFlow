# Phase 1 — Defect ledger

| ID     | Module             | Severity | Status | Description                                                                                                                                  | Fix commit |
| ------ | ------------------ | -------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| P1D-01 | authorization      | HIGH     | FIXED  | Flattened supplier predicates (independent IN) allowed cross-leakage                                                                         | 9e19de1    |
| P1D-02 | authorization      | HIGH     | FIXED  | SYSTEM_ADMIN union bypass allowed permission escalation                                                                                      | 9e19de1    |
| P1D-03 | boms/items/ncrs/po | MEDIUM   | FIXED  | First-match find() order-dependent                                                                                                           | 9e19de1    |
| P1D-04 | repositories       | HIGH     | FIXED  | No atomic membership ACTIVE revalidation                                                                                                     | ad16498    |
| P1D-05 | audit              | HIGH     | FIXED  | AuditEvent missing actorMembershipId/systemPrincipal                                                                                         | 9e19de1    |
| P1D-06 | worker             | MEDIUM   | FIXED  | Worker no system principal                                                                                                                   | 9e19de1    |
| P1D-07 | admin              | MEDIUM   | FIXED  | createOrganization not transactional with audit                                                                                              | 9e19de1    |
| P1D-08 | tests              | LOW      | FIXED  | Canonical 14-case expansion (disabled, IDOR, field filter, permutes, concurrent, system principal) plus tuple-OR fixes for po/receiving/ncrs | 2026-09-02 |
