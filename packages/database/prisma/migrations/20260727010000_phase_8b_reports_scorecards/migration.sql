INSERT INTO "permissions" ("code", "description")
VALUES
  ('report.read', 'Read authorized Phase 8B operational reports'),
  ('report.export', 'Export authorized Phase 8B operational reports'),
  ('scorecard.read', 'Read authorized internal supplier scorecards'),
  ('supplier.scorecard.read', 'Read the own-organization supplier scorecard'),
  ('supplier.scorecard.export', 'Export the own-organization supplier scorecard')
ON CONFLICT ("code") DO UPDATE SET "description" = EXCLUDED."description";

INSERT INTO "role_permissions" ("roleCode", "permissionCode")
SELECT grants.role_code, grants.permission_code
FROM (
  VALUES
    ('SYSTEM_ADMIN', 'report.read'),
    ('SYSTEM_ADMIN', 'report.export'),
    ('SYSTEM_ADMIN', 'scorecard.read'),
    ('SYSTEM_ADMIN', 'supplier.scorecard.read'),
    ('SYSTEM_ADMIN', 'supplier.scorecard.export'),
    ('MECO_MANAGEMENT', 'report.read'),
    ('MECO_MANAGEMENT', 'report.export'),
    ('MECO_MANAGEMENT', 'scorecard.read'),
    ('PROJECT_MANAGER', 'report.read'),
    ('PROJECT_MANAGER', 'report.export'),
    ('PROJECT_MANAGER', 'scorecard.read'),
    ('ENGINEERING', 'report.read'),
    ('PPIC', 'report.read'),
    ('PURCHASING', 'report.read'),
    ('PURCHASING', 'report.export'),
    ('PURCHASING', 'scorecard.read'),
    ('WAREHOUSE', 'report.read'),
    ('QA_QC', 'report.read'),
    ('QA_QC', 'report.export'),
    ('QA_QC', 'scorecard.read'),
    ('PRODUCTION', 'report.read'),
    ('FINANCE_READONLY', 'report.read'),
    ('FINANCE_READONLY', 'report.export'),
    ('FINANCE_READONLY', 'scorecard.read'),
    ('AUDITOR_READONLY', 'report.read'),
    ('AUDITOR_READONLY', 'report.export'),
    ('AUDITOR_READONLY', 'scorecard.read'),
    ('SUPPLIER_ADMIN', 'supplier.scorecard.read'),
    ('SUPPLIER_ADMIN', 'supplier.scorecard.export'),
    ('SUPPLIER_USER', 'supplier.scorecard.read'),
    ('SUPPLIER_USER', 'supplier.scorecard.export')
) AS grants(role_code, permission_code)
INNER JOIN "roles" AS role
  ON role."code" = grants.role_code
ON CONFLICT ("roleCode", "permissionCode") DO NOTHING;
