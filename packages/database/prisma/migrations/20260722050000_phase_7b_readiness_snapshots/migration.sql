CREATE TYPE "ReadinessScopeType" AS ENUM ('PROJECT', 'WORK_PACKAGE');
CREATE TYPE "ReadinessStatus" AS ENUM ('RED', 'AMBER', 'GREEN', 'COMPLETE');

CREATE TABLE "readiness_snapshots" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "batchId" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "workPackageId" UUID,
  "scopeType" "ReadinessScopeType" NOT NULL,
  "scopeKey" VARCHAR(100) NOT NULL,
  "calculatorVersion" VARCHAR(100) NOT NULL,
  "ruleVersion" VARCHAR(100) NOT NULL,
  "materialProjectionVersion" VARCHAR(100) NOT NULL,
  "calculationDate" DATE NOT NULL,
  "inputHash" CHAR(64) NOT NULL,
  "trigger" VARCHAR(50) NOT NULL,
  "score" DECIMAL(5,2) NOT NULL,
  "status" "ReadinessStatus" NOT NULL,
  "lineCount" INTEGER NOT NULL,
  "criticalLineCount" INTEGER NOT NULL,
  "readyCriticalLineCount" INTEGER NOT NULL,
  "blockerCount" INTEGER NOT NULL,
  "inputs" JSONB NOT NULL,
  "blockers" JSONB NOT NULL,
  "reasonCodes" JSONB NOT NULL,
  "recommendedActions" JSONB NOT NULL,
  "explanation" JSONB NOT NULL,
  "calculatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "readiness_snapshots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "readiness_snapshots_scope_shape_check" CHECK (
    ("scopeType" = 'PROJECT' AND "workPackageId" IS NULL AND "scopeKey" = 'PROJECT')
    OR ("scopeType" = 'WORK_PACKAGE' AND "workPackageId" IS NOT NULL AND "scopeKey" = 'WORK_PACKAGE:' || "workPackageId"::text)
  ),
  CONSTRAINT "readiness_snapshots_score_check" CHECK ("score" >= 0 AND "score" <= 100),
  CONSTRAINT "readiness_snapshots_counts_check" CHECK (
    "lineCount" >= 0 AND "criticalLineCount" >= 0 AND
    "readyCriticalLineCount" >= 0 AND "blockerCount" >= 0 AND
    "criticalLineCount" <= "lineCount" AND
    "readyCriticalLineCount" <= "criticalLineCount"
  ),
  CONSTRAINT "readiness_snapshots_hash_check" CHECK ("inputHash" ~ '^[0-9a-f]{64}$')
);

CREATE UNIQUE INDEX "readiness_snapshots_scope_batch_key" ON "readiness_snapshots"("projectId", "scopeKey", "batchId");
CREATE INDEX "readiness_snapshots_project_scope_calculated_idx" ON "readiness_snapshots"("projectId", "scopeType", "calculatedAt" DESC);
CREATE INDEX "readiness_snapshots_work_package_calculated_idx" ON "readiness_snapshots"("workPackageId", "calculatedAt" DESC);
CREATE INDEX "readiness_snapshots_status_calculated_idx" ON "readiness_snapshots"("status", "calculatedAt" DESC);
CREATE INDEX "readiness_snapshots_input_hash_idx" ON "readiness_snapshots"("inputHash");

ALTER TABLE "readiness_snapshots" ADD CONSTRAINT "readiness_snapshots_project_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "readiness_snapshots" ADD CONSTRAINT "readiness_snapshots_work_package_fkey"
  FOREIGN KEY ("workPackageId") REFERENCES "work_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION prevent_readiness_snapshot_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'readiness snapshots are immutable';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER readiness_snapshots_immutable
  BEFORE UPDATE OR DELETE ON "readiness_snapshots"
  FOR EACH ROW EXECUTE FUNCTION prevent_readiness_snapshot_mutation();

CREATE OR REPLACE FUNCTION enqueue_readiness_recalculation(
  target_project_id UUID,
  source_table TEXT,
  source_entity_id TEXT
) RETURNS void AS $$
BEGIN
  IF target_project_id IS NULL THEN RETURN; END IF;
  INSERT INTO "outbox_events" (
    "eventType", "aggregateType", "aggregateId", "payload"
  ) VALUES (
    'READINESS_RECALCULATION_REQUESTED',
    'Project',
    target_project_id::text,
    jsonb_build_object(
      'projectId', target_project_id,
      'sourceTable', source_table,
      'sourceEntityId', source_entity_id
    )
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enqueue_readiness_from_direct_project() RETURNS trigger AS $$
DECLARE
  row_data JSONB;
  project_id UUID;
BEGIN
  row_data := to_jsonb(NEW);
  IF TG_ARGV[0] = 'id' THEN
    project_id := (row_data->>'id')::uuid;
  ELSE
    project_id := (row_data->>'projectId')::uuid;
  END IF;
  PERFORM enqueue_readiness_recalculation(project_id, TG_TABLE_NAME, row_data->>'id');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enqueue_readiness_from_bom_revision() RETURNS trigger AS $$
DECLARE
  row_data JSONB;
  project_id UUID;
BEGIN
  row_data := to_jsonb(NEW);
  SELECT "projectId" INTO project_id FROM "boms" WHERE "id" = (row_data->>'bomId')::uuid;
  PERFORM enqueue_readiness_recalculation(project_id, TG_TABLE_NAME, row_data->>'id');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER readiness_project_event AFTER INSERT OR UPDATE ON "projects"
  FOR EACH ROW EXECUTE FUNCTION enqueue_readiness_from_direct_project('id');
CREATE TRIGGER readiness_work_package_event AFTER INSERT OR UPDATE ON "work_packages"
  FOR EACH ROW EXECUTE FUNCTION enqueue_readiness_from_direct_project('projectId');
CREATE TRIGGER readiness_bom_revision_event AFTER INSERT OR UPDATE ON "bom_revisions"
  FOR EACH ROW EXECUTE FUNCTION enqueue_readiness_from_bom_revision();
CREATE TRIGGER readiness_requisition_event AFTER INSERT OR UPDATE ON "purchase_requisitions"
  FOR EACH ROW EXECUTE FUNCTION enqueue_readiness_from_direct_project('projectId');
CREATE TRIGGER readiness_purchase_order_event AFTER INSERT OR UPDATE ON "purchase_orders"
  FOR EACH ROW EXECUTE FUNCTION enqueue_readiness_from_direct_project('projectId');
CREATE TRIGGER readiness_asn_event AFTER INSERT OR UPDATE ON "advance_shipment_notices"
  FOR EACH ROW EXECUTE FUNCTION enqueue_readiness_from_direct_project('projectId');
CREATE TRIGGER readiness_receipt_event AFTER INSERT OR UPDATE ON "goods_receipts"
  FOR EACH ROW EXECUTE FUNCTION enqueue_readiness_from_direct_project('projectId');
CREATE TRIGGER readiness_inspection_event AFTER INSERT OR UPDATE ON "receiving_inspections"
  FOR EACH ROW EXECUTE FUNCTION enqueue_readiness_from_direct_project('projectId');
CREATE TRIGGER readiness_ncr_event AFTER INSERT OR UPDATE ON "ncrs"
  FOR EACH ROW EXECUTE FUNCTION enqueue_readiness_from_direct_project('projectId');
CREATE TRIGGER readiness_allocation_event AFTER INSERT OR UPDATE ON "material_allocations"
  FOR EACH ROW EXECUTE FUNCTION enqueue_readiness_from_direct_project('projectId');

INSERT INTO "permissions" ("code", "description")
VALUES ('readiness.read', 'Read authorized readiness snapshots and explanations')
ON CONFLICT ("code") DO UPDATE SET "description" = EXCLUDED."description";

INSERT INTO "role_permissions" ("roleCode", "permissionCode")
SELECT "code", 'readiness.read' FROM "roles" WHERE "scope" = 'INTERNAL'
ON CONFLICT ("roleCode", "permissionCode") DO NOTHING;
