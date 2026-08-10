CREATE TYPE "NcrStatus" AS ENUM ('DRAFT', 'ISSUED', 'SUPPLIER_RESPONDED', 'CLOSED', 'CANCELLED');
CREATE TYPE "NcrSourceType" AS ENUM ('PROJECT', 'INVENTORY_LOT', 'RECEIVING_INSPECTION');
CREATE TYPE "MaterialAllocationStatus" AS ENUM ('ALLOCATED', 'RELEASED', 'CONSUMED');

CREATE TABLE "ncrs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "supplierOrganizationId" UUID NOT NULL,
  "sourceType" "NcrSourceType" NOT NULL,
  "receivingInspectionId" UUID,
  "inventoryLotId" UUID,
  "ncrNumber" INTEGER NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" VARCHAR(4000) NOT NULL,
  "internalDispositionNotes" VARCHAR(4000) NOT NULL DEFAULT '',
  "shareInternalNotes" BOOLEAN NOT NULL DEFAULT FALSE,
  "status" "NcrStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" UUID NOT NULL,
  "issuedByUserId" UUID,
  "closedByUserId" UUID,
  "cancelledByUserId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "issuedAt" TIMESTAMPTZ(3),
  "closedAt" TIMESTAMPTZ(3),
  "cancelledAt" TIMESTAMPTZ(3),
  CONSTRAINT "ncrs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ncrs_text_version_check" CHECK (
    "ncrNumber" > 0 AND "version" > 0
    AND length(btrim("title")) >= 3
    AND length(btrim("description")) >= 5
  ),
  CONSTRAINT "ncrs_source_shape_check" CHECK (
    ("sourceType" = 'PROJECT' AND "receivingInspectionId" IS NULL AND "inventoryLotId" IS NULL)
    OR ("sourceType" = 'INVENTORY_LOT' AND "receivingInspectionId" IS NULL AND "inventoryLotId" IS NOT NULL)
    OR ("sourceType" = 'RECEIVING_INSPECTION' AND "receivingInspectionId" IS NOT NULL AND "inventoryLotId" IS NULL)
  ),
  CONSTRAINT "ncrs_state_shape_check" CHECK (
    ("status" = 'DRAFT' AND "issuedByUserId" IS NULL AND "issuedAt" IS NULL AND "closedByUserId" IS NULL AND "closedAt" IS NULL AND "cancelledByUserId" IS NULL AND "cancelledAt" IS NULL)
    OR ("status" IN ('ISSUED', 'SUPPLIER_RESPONDED') AND "issuedByUserId" IS NOT NULL AND "issuedAt" IS NOT NULL AND "closedByUserId" IS NULL AND "closedAt" IS NULL AND "cancelledByUserId" IS NULL AND "cancelledAt" IS NULL)
    OR ("status" = 'CLOSED' AND "issuedByUserId" IS NOT NULL AND "issuedAt" IS NOT NULL AND "closedByUserId" IS NOT NULL AND "closedAt" IS NOT NULL AND "cancelledByUserId" IS NULL AND "cancelledAt" IS NULL)
    OR ("status" = 'CANCELLED' AND "closedByUserId" IS NULL AND "closedAt" IS NULL AND "cancelledByUserId" IS NOT NULL AND "cancelledAt" IS NOT NULL)
  )
);

CREATE TABLE "ncr_supplier_responses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ncrId" UUID NOT NULL,
  "revisionNumber" INTEGER NOT NULL,
  "message" VARCHAR(4000) NOT NULL,
  "rootCause" VARCHAR(4000) NOT NULL DEFAULT '',
  "correctiveAction" VARCHAR(4000) NOT NULL DEFAULT '',
  "submittedByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ncr_supplier_responses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ncr_supplier_responses_content_check" CHECK (
    "revisionNumber" > 0 AND length(btrim("message")) >= 5
  )
);

CREATE TABLE "ncr_transitions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ncrId" UUID NOT NULL,
  "actorUserId" UUID NOT NULL,
  "sourceStatus" "NcrStatus" NOT NULL,
  "targetStatus" "NcrStatus" NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ncr_transitions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ncr_transitions_reason_check" CHECK (length(btrim("reason")) >= 5)
);

CREATE TABLE "material_allocations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "inventoryLotId" UUID NOT NULL,
  "bomLineId" UUID NOT NULL,
  "quantity" DECIMAL(30,6) NOT NULL,
  "status" "MaterialAllocationStatus" NOT NULL DEFAULT 'ALLOCATED',
  "version" INTEGER NOT NULL DEFAULT 1,
  "conditionalUseReason" VARCHAR(500),
  "conditionalUseAuthorizedByUserId" UUID,
  "createdByUserId" UUID NOT NULL,
  "releasedByUserId" UUID,
  "consumedByUserId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "releasedAt" TIMESTAMPTZ(3),
  "consumedAt" TIMESTAMPTZ(3),
  CONSTRAINT "material_allocations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "material_allocations_quantity_version_check" CHECK ("quantity" > 0 AND "version" > 0),
  CONSTRAINT "material_allocations_conditional_shape_check" CHECK (
    ("conditionalUseReason" IS NULL AND "conditionalUseAuthorizedByUserId" IS NULL)
    OR (length(btrim("conditionalUseReason")) >= 5 AND "conditionalUseAuthorizedByUserId" IS NOT NULL)
  ),
  CONSTRAINT "material_allocations_state_shape_check" CHECK (
    ("status" = 'ALLOCATED' AND "releasedByUserId" IS NULL AND "releasedAt" IS NULL AND "consumedByUserId" IS NULL AND "consumedAt" IS NULL)
    OR ("status" = 'RELEASED' AND "releasedByUserId" IS NOT NULL AND "releasedAt" IS NOT NULL AND "consumedByUserId" IS NULL AND "consumedAt" IS NULL)
    OR ("status" = 'CONSUMED' AND "releasedByUserId" IS NULL AND "releasedAt" IS NULL AND "consumedByUserId" IS NOT NULL AND "consumedAt" IS NOT NULL)
  )
);

CREATE TABLE "material_allocation_transitions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "materialAllocationId" UUID NOT NULL,
  "actorUserId" UUID NOT NULL,
  "sourceStatus" "MaterialAllocationStatus" NOT NULL,
  "targetStatus" "MaterialAllocationStatus" NOT NULL,
  "quantitySnapshot" DECIMAL(30,6) NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "material_allocation_transitions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "material_allocation_transitions_shape_check" CHECK ("quantitySnapshot" > 0 AND length(btrim("reason")) >= 5)
);

CREATE UNIQUE INDEX "ncrs_project_number_key" ON "ncrs"("projectId", "ncrNumber");
CREATE INDEX "ncrs_project_status_idx" ON "ncrs"("projectId", "status", "updatedAt");
CREATE INDEX "ncrs_supplier_status_idx" ON "ncrs"("supplierOrganizationId", "status", "updatedAt");
CREATE INDEX "ncrs_inspection_idx" ON "ncrs"("receivingInspectionId");
CREATE INDEX "ncrs_lot_idx" ON "ncrs"("inventoryLotId");
CREATE UNIQUE INDEX "ncr_supplier_responses_revision_key" ON "ncr_supplier_responses"("ncrId", "revisionNumber");
CREATE INDEX "ncr_supplier_responses_created_idx" ON "ncr_supplier_responses"("ncrId", "createdAt");
CREATE INDEX "ncr_transitions_created_idx" ON "ncr_transitions"("ncrId", "occurredAt");
CREATE INDEX "material_allocations_project_status_idx" ON "material_allocations"("projectId", "status", "updatedAt");
CREATE INDEX "material_allocations_lot_status_idx" ON "material_allocations"("inventoryLotId", "status");
CREATE INDEX "material_allocations_bom_line_status_idx" ON "material_allocations"("bomLineId", "status");
CREATE INDEX "material_allocation_transitions_created_idx" ON "material_allocation_transitions"("materialAllocationId", "occurredAt");

ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_project_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_supplier_fkey" FOREIGN KEY ("supplierOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_inspection_fkey" FOREIGN KEY ("receivingInspectionId") REFERENCES "receiving_inspections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_lot_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_creator_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_issuer_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_closer_fkey" FOREIGN KEY ("closedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ncrs" ADD CONSTRAINT "ncrs_canceller_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ncr_supplier_responses" ADD CONSTRAINT "ncr_supplier_responses_ncr_fkey" FOREIGN KEY ("ncrId") REFERENCES "ncrs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ncr_supplier_responses" ADD CONSTRAINT "ncr_supplier_responses_submitter_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ncr_transitions" ADD CONSTRAINT "ncr_transitions_ncr_fkey" FOREIGN KEY ("ncrId") REFERENCES "ncrs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ncr_transitions" ADD CONSTRAINT "ncr_transitions_actor_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_allocations" ADD CONSTRAINT "material_allocations_project_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_allocations" ADD CONSTRAINT "material_allocations_lot_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_allocations" ADD CONSTRAINT "material_allocations_bom_line_fkey" FOREIGN KEY ("bomLineId") REFERENCES "bom_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_allocations" ADD CONSTRAINT "material_allocations_conditional_authorizer_fkey" FOREIGN KEY ("conditionalUseAuthorizedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_allocations" ADD CONSTRAINT "material_allocations_creator_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_allocations" ADD CONSTRAINT "material_allocations_releaser_fkey" FOREIGN KEY ("releasedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_allocations" ADD CONSTRAINT "material_allocations_consumer_fkey" FOREIGN KEY ("consumedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_allocation_transitions" ADD CONSTRAINT "material_allocation_transitions_allocation_fkey" FOREIGN KEY ("materialAllocationId") REFERENCES "material_allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "material_allocation_transitions" ADD CONSTRAINT "material_allocation_transitions_actor_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION guard_ncr_update() RETURNS trigger AS $$
BEGIN
  IF ROW(OLD."projectId", OLD."supplierOrganizationId", OLD."sourceType", OLD."receivingInspectionId", OLD."inventoryLotId", OLD."ncrNumber", OLD."createdByUserId", OLD."createdAt")
     IS DISTINCT FROM ROW(NEW."projectId", NEW."supplierOrganizationId", NEW."sourceType", NEW."receivingInspectionId", NEW."inventoryLotId", NEW."ncrNumber", NEW."createdByUserId", NEW."createdAt") THEN
    RAISE EXCEPTION 'NCR identity and source are immutable';
  END IF;
  IF OLD."status" <> NEW."status" AND NOT (
    (OLD."status" = 'DRAFT' AND NEW."status" IN ('ISSUED', 'CANCELLED'))
    OR (OLD."status" = 'ISSUED' AND NEW."status" IN ('SUPPLIER_RESPONDED', 'CLOSED', 'CANCELLED'))
    OR (OLD."status" = 'SUPPLIER_RESPONDED' AND NEW."status" = 'CLOSED')
  ) THEN RAISE EXCEPTION 'invalid NCR transition'; END IF;
  IF OLD."status" IN ('CLOSED', 'CANCELLED') THEN RAISE EXCEPTION 'terminal NCRs are immutable'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER ncrs_update_guard BEFORE UPDATE ON "ncrs" FOR EACH ROW EXECUTE FUNCTION guard_ncr_update();

CREATE OR REPLACE FUNCTION validate_material_allocation_insert() RETURNS trigger AS $$
DECLARE
  lot_record RECORD;
  unit_precision INTEGER;
  committed_quantity DECIMAL(30,6);
BEGIN
  SELECT lot.*, u."decimalPrecision" INTO lot_record
  FROM "inventory_lots" lot
  JOIN "units_of_measure" u ON u."id" = lot."unitOfMeasureId"
  WHERE lot."id" = NEW."inventoryLotId"
  FOR UPDATE OF lot;
  IF NOT FOUND THEN RAISE EXCEPTION 'inventory lot does not exist'; END IF;
  unit_precision := lot_record."decimalPrecision";
  IF NEW."projectId" <> lot_record."projectId" OR round(NEW."quantity", unit_precision) <> NEW."quantity" THEN
    RAISE EXCEPTION 'material allocation project or precision is invalid';
  END IF;
  IF lot_record."status" NOT IN ('ACCEPTED', 'CONDITIONALLY_ACCEPTED') THEN
    RAISE EXCEPTION 'material allocation requires accepted material';
  END IF;
  IF (lot_record."status" = 'CONDITIONALLY_ACCEPTED') <> (NEW."conditionalUseAuthorizedByUserId" IS NOT NULL) THEN
    RAISE EXCEPTION 'conditional material requires explicit authorization';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "bom_lines" line
    JOIN "bom_revisions" revision ON revision."id" = line."bomRevisionId"
    JOIN "boms" bom ON bom."id" = revision."bomId"
    WHERE line."id" = NEW."bomLineId"
      AND revision."status" = 'RELEASED'
      AND bom."projectId" = NEW."projectId"
      AND line."itemId" = lot_record."itemId"
      AND line."unitOfMeasureId" = lot_record."unitOfMeasureId"
  ) THEN RAISE EXCEPTION 'material allocation requires a matching released BOM line'; END IF;
  SELECT COALESCE(sum("quantity"), 0) INTO committed_quantity
  FROM "material_allocations"
  WHERE "inventoryLotId" = NEW."inventoryLotId" AND "status" IN ('ALLOCATED', 'CONSUMED');
  IF committed_quantity + NEW."quantity" > lot_record."acceptedQuantity" THEN
    RAISE EXCEPTION 'material allocation exceeds accepted available quantity';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER material_allocations_insert_guard BEFORE INSERT ON "material_allocations" FOR EACH ROW EXECUTE FUNCTION validate_material_allocation_insert();

CREATE OR REPLACE FUNCTION guard_material_allocation_update() RETURNS trigger AS $$
BEGIN
  IF ROW(OLD."projectId", OLD."inventoryLotId", OLD."bomLineId", OLD."quantity", OLD."conditionalUseReason", OLD."conditionalUseAuthorizedByUserId", OLD."createdByUserId", OLD."createdAt")
     IS DISTINCT FROM ROW(NEW."projectId", NEW."inventoryLotId", NEW."bomLineId", NEW."quantity", NEW."conditionalUseReason", NEW."conditionalUseAuthorizedByUserId", NEW."createdByUserId", NEW."createdAt") THEN
    RAISE EXCEPTION 'material allocation quantity and source history are immutable';
  END IF;
  IF OLD."status" <> 'ALLOCATED' OR NEW."status" NOT IN ('RELEASED', 'CONSUMED') THEN
    RAISE EXCEPTION 'invalid material allocation transition';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER material_allocations_update_guard BEFORE UPDATE ON "material_allocations" FOR EACH ROW EXECUTE FUNCTION guard_material_allocation_update();

CREATE OR REPLACE FUNCTION prevent_phase_six_b_history_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'Phase 6B quality and allocation history is immutable'; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER ncrs_no_delete BEFORE DELETE ON "ncrs" FOR EACH ROW EXECUTE FUNCTION prevent_phase_six_b_history_mutation();
CREATE TRIGGER ncr_supplier_responses_immutable BEFORE UPDATE OR DELETE ON "ncr_supplier_responses" FOR EACH ROW EXECUTE FUNCTION prevent_phase_six_b_history_mutation();
CREATE TRIGGER ncr_transitions_immutable BEFORE UPDATE OR DELETE ON "ncr_transitions" FOR EACH ROW EXECUTE FUNCTION prevent_phase_six_b_history_mutation();
CREATE TRIGGER material_allocations_no_delete BEFORE DELETE ON "material_allocations" FOR EACH ROW EXECUTE FUNCTION prevent_phase_six_b_history_mutation();
CREATE TRIGGER material_allocation_transitions_immutable BEFORE UPDATE OR DELETE ON "material_allocation_transitions" FOR EACH ROW EXECUTE FUNCTION prevent_phase_six_b_history_mutation();
