# Backup and restore

The planned policy is configurable daily PostgreSQL and object-storage backups, 30 daily restore points, longer monthly retention, encrypted off-host copies, Keycloak realm/configuration backup without exposed secrets, and quarterly restore drills. Owners and recovery objectives require business approval.

A valid recovery run restores PostgreSQL into an isolated instance, restores object objects and metadata consistently, imports Keycloak configuration with replacement secrets, runs migrations, verifies checksums and application readiness, and records evidence. A backup is never called successful solely because an archive was produced. Phase 0 documents the procedure boundary; production scripts and a witnessed rehearsal belong to Phase 9.
