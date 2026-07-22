CREATE TYPE "PurchaseRequisitionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "purchase_requisitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL,
    "requisitionNumber" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "notes" VARCHAR(2000) NOT NULL DEFAULT '',
    "status" "PurchaseRequisitionStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "requesterUserId" UUID NOT NULL,
    "approverUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMPTZ(3),
    "approvedAt" TIMESTAMPTZ(3),
    "rejectedAt" TIMESTAMPTZ(3),
    "cancelledAt" TIMESTAMPTZ(3),
    CONSTRAINT "purchase_requisitions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "purchase_requisitions_number_positive" CHECK ("requisitionNumber" > 0),
    CONSTRAINT "purchase_requisitions_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "purchase_requisition_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchaseRequisitionId" UUID NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "bomLineId" UUID NOT NULL,
    "quantity" DECIMAL(30,6) NOT NULL,
    "requiredQuantitySnapshot" DECIMAL(30,6) NOT NULL,
    "coveredQuantitySnapshot" DECIMAL(30,6) NOT NULL,
    "outstandingQuantitySnapshot" DECIMAL(30,6) NOT NULL,
    "overNeedOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" VARCHAR(500),
    "overrideAuthorizedByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_requisition_lines_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "purchase_requisition_lines_line_positive" CHECK ("lineNumber" > 0),
    CONSTRAINT "purchase_requisition_lines_quantity_positive" CHECK ("quantity" > 0),
    CONSTRAINT "purchase_requisition_lines_snapshots_nonnegative" CHECK ("requiredQuantitySnapshot" > 0 AND "coveredQuantitySnapshot" >= 0 AND "outstandingQuantitySnapshot" >= 0),
    CONSTRAINT "purchase_requisition_lines_override_complete" CHECK (
      (NOT "overNeedOverride" AND "overrideReason" IS NULL AND "overrideAuthorizedByUserId" IS NULL)
      OR ("overNeedOverride" AND length(btrim("overrideReason")) >= 5 AND "overrideAuthorizedByUserId" IS NOT NULL)
    )
);

CREATE TABLE "purchase_requisition_transitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchaseRequisitionId" UUID NOT NULL,
    "actorUserId" UUID NOT NULL,
    "sourceStatus" "PurchaseRequisitionStatus" NOT NULL,
    "targetStatus" "PurchaseRequisitionStatus" NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_requisition_transitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "purchase_requisitions_projectId_requisitionNumber_key" ON "purchase_requisitions"("projectId", "requisitionNumber");
CREATE INDEX "purchase_requisitions_projectId_status_updatedAt_idx" ON "purchase_requisitions"("projectId", "status", "updatedAt");
CREATE UNIQUE INDEX "purchase_requisition_lines_requisition_line_key" ON "purchase_requisition_lines"("purchaseRequisitionId", "lineNumber");
CREATE UNIQUE INDEX "purchase_requisition_lines_requisition_bom_line_key" ON "purchase_requisition_lines"("purchaseRequisitionId", "bomLineId");
CREATE INDEX "purchase_requisition_lines_bomLineId_idx" ON "purchase_requisition_lines"("bomLineId");
CREATE INDEX "purchase_requisition_transitions_requisition_occurred_idx" ON "purchase_requisition_transitions"("purchaseRequisitionId", "occurredAt");

ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_requisition_lines" ADD CONSTRAINT "purchase_requisition_lines_purchaseRequisitionId_fkey" FOREIGN KEY ("purchaseRequisitionId") REFERENCES "purchase_requisitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_requisition_lines" ADD CONSTRAINT "purchase_requisition_lines_bomLineId_fkey" FOREIGN KEY ("bomLineId") REFERENCES "bom_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_requisition_lines" ADD CONSTRAINT "purchase_requisition_lines_overrideAuthorizedByUserId_fkey" FOREIGN KEY ("overrideAuthorizedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_requisition_transitions" ADD CONSTRAINT "purchase_requisition_transitions_purchaseRequisitionId_fkey" FOREIGN KEY ("purchaseRequisitionId") REFERENCES "purchase_requisitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_requisition_transitions" ADD CONSTRAINT "purchase_requisition_transitions_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION prevent_purchase_requisition_line_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'purchase requisition lines are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER purchase_requisition_lines_immutable
BEFORE UPDATE OR DELETE ON "purchase_requisition_lines"
FOR EACH ROW EXECUTE FUNCTION prevent_purchase_requisition_line_mutation();

CREATE OR REPLACE FUNCTION prevent_purchase_requisition_transition_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'purchase requisition transitions are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER purchase_requisition_transitions_immutable
BEFORE UPDATE OR DELETE ON "purchase_requisition_transitions"
FOR EACH ROW EXECUTE FUNCTION prevent_purchase_requisition_transition_mutation();

CREATE OR REPLACE FUNCTION guard_purchase_requisition_update() RETURNS trigger AS $$
BEGIN
  IF OLD."requesterUserId" <> NEW."requesterUserId" THEN
    RAISE EXCEPTION 'purchase requisition requester is immutable';
  END IF;
  IF OLD."approverUserId" IS NOT NULL AND OLD."approverUserId" IS DISTINCT FROM NEW."approverUserId" THEN
    RAISE EXCEPTION 'purchase requisition approver is immutable';
  END IF;
  IF OLD."status" <> NEW."status" AND NOT (
    (OLD."status" = 'DRAFT' AND NEW."status" IN ('SUBMITTED', 'CANCELLED')) OR
    (OLD."status" = 'SUBMITTED' AND NEW."status" IN ('APPROVED', 'REJECTED', 'CANCELLED')) OR
    (OLD."status" = 'APPROVED' AND NEW."status" = 'CANCELLED')
  ) THEN
    RAISE EXCEPTION 'invalid purchase requisition transition';
  END IF;
  IF NEW."status" = 'APPROVED' AND (NEW."approverUserId" IS NULL OR NEW."approvedAt" IS NULL) THEN
    RAISE EXCEPTION 'approved purchase requisition requires approver attribution';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER purchase_requisition_update_guard
BEFORE UPDATE ON "purchase_requisitions"
FOR EACH ROW EXECUTE FUNCTION guard_purchase_requisition_update();

CREATE OR REPLACE FUNCTION prevent_purchase_requisition_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'purchase requisitions are retained';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER purchase_requisitions_no_delete
BEFORE DELETE ON "purchase_requisitions"
FOR EACH ROW EXECUTE FUNCTION prevent_purchase_requisition_delete();
