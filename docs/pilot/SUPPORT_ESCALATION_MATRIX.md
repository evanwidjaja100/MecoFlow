# Support escalation matrix

| Severity | Example                                                                    | Initial owner             | Acknowledge      | Escalation                                    | Workaround / rollback trigger                                             |
| -------- | -------------------------------------------------------------------------- | ------------------------- | ---------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| SEV-1    | Isolation/auth bypass, secret/audit/checksum/inventory integrity failure   | Pilot owner + security    | Immediately      | L3 engineering/security and release authority | Stop mutations; rollback/isolate immediately                              |
| SEV-2    | Critical workflow unavailable or incorrect state/quantity with containment | L2 application/operations | 30 minutes       | L3 and process owner                          | Manual controlled fallback; rollback if no safe recovery in agreed window |
| SEV-3    | Noncritical defect with safe documented workaround                         | L1 support                | 4 business hours | L2 at daily review                            | Continue only within affected-scope approval                              |
| SEV-4    | Usage/cosmetic question                                                    | L1 support                | 1 business day   | Product backlog                               | No rollback                                                               |

Replace role placeholders with named people, contact routes, coverage windows,
and deputies in the controlled go-live record. If no accountable SEV-1 owner is
reachable, the release is `NOT READY` and the pilot must not start/continue.
