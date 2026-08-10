# Incident-reporting procedure

## Report and contain

Report immediately in the approved support channel with timestamp/timezone,
reporter/contact, environment/version, role/organization/project, observed vs
expected behavior, request/correlation ID, affected records, screenshots/log
references, and whether data or credentials may be exposed. Do not include
passwords, tokens, secret files, document contents, or unnecessary personal data.

- Severity 1: cross-tenant disclosure, auth bypass, secret exposure, audit loss,
  critical integrity/checksum failure, or unrecoverable service. Stop pilot
  mutations, preserve evidence, notify security/pilot owner, invoke rollback.
- Severity 2: blocked critical workflow or material quantity/state error with a
  safe workaround. Freeze affected scope and engage Level 2/3.
- Severity 3: noncritical defect with a documented workaround. Track and review daily.
- Severity 4: question/cosmetic issue. Route to Level 1 backlog.

Record incident ID, severity, owner, containment, user impact, decisions,
corrective action, verification, closure approver, and linked rollback/change.
