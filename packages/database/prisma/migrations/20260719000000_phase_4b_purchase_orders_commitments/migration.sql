CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SENT', 'ACKNOWLEDGED', 'CANCELLED');

CREATE TABLE "purchase_orders" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "supplierOrganizationId" UUID NOT NULL,
  "purchaseOrderNumber" INTEGER NOT NULL,
  "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "currentRevisionNumber" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMPTZ(3),
  "acknowledgedAt" TIMESTAMPTZ(3),
  "cancelledAt" TIMESTAMPTZ(3),
  CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "purchase_orders_numbers_positive" CHECK ("purchaseOrderNumber" > 0 AND "currentRevisionNumber" > 0),
  CONSTRAINT "purchase_orders_version_positive" CHECK ("version" > 0)
);

CREATE TABLE "purchase_order_revisions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "purchaseOrderId" UUID NOT NULL,
  "revisionNumber" INTEGER NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "supplierMessage" VARCHAR(2000) NOT NULL DEFAULT '',
  "internalCommercialTerms" VARCHAR(4000) NOT NULL DEFAULT '',
  "internalNotes" VARCHAR(2000) NOT NULL DEFAULT '',
  "revisionReason" VARCHAR(500) NOT NULL,
  "current" BOOLEAN NOT NULL DEFAULT true,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMPTZ(3),
  CONSTRAINT "purchase_order_revisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "purchase_order_revisions_number_positive" CHECK ("revisionNumber" > 0),
  CONSTRAINT "purchase_order_revisions_reason_present" CHECK (length(btrim("revisionReason")) >= 5)
);

CREATE TABLE "purchase_order_lines" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "purchaseOrderRevisionId" UUID NOT NULL,
  "lineNumber" INTEGER NOT NULL,
  "itemId" UUID NOT NULL,
  "unitOfMeasureId" UUID NOT NULL,
  "orderedQuantity" DECIMAL(30,6) NOT NULL,
  "internalUnitPrice" DECIMAL(30,2),
  "internalLineNotes" VARCHAR(1000) NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "purchase_order_lines_positive" CHECK ("lineNumber" > 0 AND "orderedQuantity" > 0),
  CONSTRAINT "purchase_order_lines_price_nonnegative" CHECK ("internalUnitPrice" IS NULL OR "internalUnitPrice" >= 0)
);

CREATE TABLE "purchase_order_allocations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "purchaseOrderLineId" UUID NOT NULL,
  "purchaseRequisitionLineId" UUID NOT NULL,
  "quantity" DECIMAL(30,6) NOT NULL,
  "approvedQuantitySnapshot" DECIMAL(30,6) NOT NULL,
  "alreadyOrderedQuantitySnapshot" DECIMAL(30,6) NOT NULL,
  "availableQuantitySnapshot" DECIMAL(30,6) NOT NULL,
  "requiredDateSnapshot" DATE NOT NULL,
  "overOrderOverride" BOOLEAN NOT NULL DEFAULT false,
  "overrideReason" VARCHAR(500),
  "overrideAuthorizedByUserId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "purchase_order_allocations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "purchase_order_allocations_quantity_positive" CHECK ("quantity" > 0),
  CONSTRAINT "purchase_order_allocations_snapshots_valid" CHECK (
    "approvedQuantitySnapshot" > 0 AND "alreadyOrderedQuantitySnapshot" >= 0 AND "availableQuantitySnapshot" >= 0
  ),
  CONSTRAINT "purchase_order_allocations_override_complete" CHECK (
    (NOT "overOrderOverride" AND "quantity" <= "availableQuantitySnapshot" AND "overrideReason" IS NULL AND "overrideAuthorizedByUserId" IS NULL)
    OR ("overOrderOverride" AND length(btrim("overrideReason")) >= 5 AND "overrideAuthorizedByUserId" IS NOT NULL)
  )
);

CREATE TABLE "purchase_order_transitions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "purchaseOrderId" UUID NOT NULL,
  "actorUserId" UUID NOT NULL,
  "sourceStatus" "PurchaseOrderStatus" NOT NULL,
  "targetStatus" "PurchaseOrderStatus" NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "purchase_order_transitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supplier_commitment_revisions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "purchaseOrderRevisionId" UUID NOT NULL,
  "revisionNumber" INTEGER NOT NULL,
  "supplierOrganizationId" UUID NOT NULL,
  "submittedByUserId" UUID NOT NULL,
  "note" VARCHAR(1000) NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "supplier_commitment_revisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "supplier_commitment_revisions_number_positive" CHECK ("revisionNumber" > 0)
);

CREATE TABLE "supplier_commitment_lines" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "supplierCommitmentRevisionId" UUID NOT NULL,
  "purchaseOrderRevisionId" UUID NOT NULL,
  "purchaseOrderLineId" UUID NOT NULL,
  "committedDate" DATE NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "supplier_commitment_lines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "purchase_orders_project_number_key" ON "purchase_orders"("projectId", "purchaseOrderNumber");
CREATE INDEX "purchase_orders_project_status_updated_idx" ON "purchase_orders"("projectId", "status", "updatedAt");
CREATE INDEX "purchase_orders_supplier_status_updated_idx" ON "purchase_orders"("supplierOrganizationId", "status", "updatedAt");
CREATE UNIQUE INDEX "purchase_order_revisions_po_number_key" ON "purchase_order_revisions"("purchaseOrderId", "revisionNumber");
CREATE UNIQUE INDEX "purchase_order_revisions_id_po_key" ON "purchase_order_revisions"("id", "purchaseOrderId");
CREATE UNIQUE INDEX "purchase_order_revisions_one_current" ON "purchase_order_revisions"("purchaseOrderId") WHERE "current";
CREATE INDEX "purchase_order_revisions_po_current_idx" ON "purchase_order_revisions"("purchaseOrderId", "current");
CREATE UNIQUE INDEX "purchase_order_lines_revision_line_key" ON "purchase_order_lines"("purchaseOrderRevisionId", "lineNumber");
CREATE UNIQUE INDEX "purchase_order_lines_id_revision_key" ON "purchase_order_lines"("id", "purchaseOrderRevisionId");
CREATE INDEX "purchase_order_lines_item_revision_idx" ON "purchase_order_lines"("itemId", "purchaseOrderRevisionId");
CREATE UNIQUE INDEX "purchase_order_allocations_line_requisition_key" ON "purchase_order_allocations"("purchaseOrderLineId", "purchaseRequisitionLineId");
CREATE INDEX "purchase_order_allocations_requisition_idx" ON "purchase_order_allocations"("purchaseRequisitionLineId");
CREATE INDEX "purchase_order_transitions_po_occurred_idx" ON "purchase_order_transitions"("purchaseOrderId", "occurredAt");
CREATE UNIQUE INDEX "supplier_commitment_revisions_po_revision_number_key" ON "supplier_commitment_revisions"("purchaseOrderRevisionId", "revisionNumber");
CREATE UNIQUE INDEX "supplier_commitment_revisions_id_po_revision_key" ON "supplier_commitment_revisions"("id", "purchaseOrderRevisionId");
CREATE INDEX "supplier_commitment_revisions_supplier_created_idx" ON "supplier_commitment_revisions"("supplierOrganizationId", "createdAt");
CREATE UNIQUE INDEX "supplier_commitment_lines_revision_line_key" ON "supplier_commitment_lines"("supplierCommitmentRevisionId", "purchaseOrderLineId");
CREATE INDEX "supplier_commitment_lines_po_line_created_idx" ON "supplier_commitment_lines"("purchaseOrderLineId", "createdAt");

ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_project_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_fkey" FOREIGN KEY ("supplierOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_creator_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order_revisions" ADD CONSTRAINT "purchase_order_revisions_po_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order_revisions" ADD CONSTRAINT "purchase_order_revisions_creator_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_revision_fkey" FOREIGN KEY ("purchaseOrderRevisionId") REFERENCES "purchase_order_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_item_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_unit_fkey" FOREIGN KEY ("unitOfMeasureId") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order_allocations" ADD CONSTRAINT "purchase_order_allocations_line_fkey" FOREIGN KEY ("purchaseOrderLineId") REFERENCES "purchase_order_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order_allocations" ADD CONSTRAINT "purchase_order_allocations_requisition_fkey" FOREIGN KEY ("purchaseRequisitionLineId") REFERENCES "purchase_requisition_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order_allocations" ADD CONSTRAINT "purchase_order_allocations_authorizer_fkey" FOREIGN KEY ("overrideAuthorizedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order_transitions" ADD CONSTRAINT "purchase_order_transitions_po_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order_transitions" ADD CONSTRAINT "purchase_order_transitions_actor_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_commitment_revisions" ADD CONSTRAINT "supplier_commitment_revisions_po_revision_fkey" FOREIGN KEY ("purchaseOrderRevisionId") REFERENCES "purchase_order_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_commitment_revisions" ADD CONSTRAINT "supplier_commitment_revisions_supplier_fkey" FOREIGN KEY ("supplierOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_commitment_revisions" ADD CONSTRAINT "supplier_commitment_revisions_submitter_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_commitment_lines" ADD CONSTRAINT "supplier_commitment_lines_commitment_fkey" FOREIGN KEY ("supplierCommitmentRevisionId", "purchaseOrderRevisionId") REFERENCES "supplier_commitment_revisions"("id", "purchaseOrderRevisionId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "supplier_commitment_lines" ADD CONSTRAINT "supplier_commitment_lines_po_line_fkey" FOREIGN KEY ("purchaseOrderLineId", "purchaseOrderRevisionId") REFERENCES "purchase_order_lines"("id", "purchaseOrderRevisionId") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION validate_purchase_order_supplier_scope() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "organizations" WHERE "id" = NEW."supplierOrganizationId" AND "type" = 'SUPPLIER' AND "active") THEN
    RAISE EXCEPTION 'purchase order supplier must be an active supplier organization';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "project_members" pm
    JOIN "memberships" m ON m."id" = pm."membershipId" AND m."status" = 'ACTIVE'
    JOIN "organizations" o ON o."id" = m."organizationId" AND o."active"
    WHERE pm."projectId" = NEW."projectId" AND pm."status" = 'ACTIVE' AND o."id" = NEW."supplierOrganizationId"
  ) THEN
    RAISE EXCEPTION 'purchase order supplier is not assigned to the project';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER purchase_order_supplier_scope_guard BEFORE INSERT ON "purchase_orders" FOR EACH ROW EXECUTE FUNCTION validate_purchase_order_supplier_scope();

CREATE OR REPLACE FUNCTION guard_purchase_order_update() RETURNS trigger AS $$
BEGIN
  IF OLD."projectId" <> NEW."projectId" OR OLD."supplierOrganizationId" <> NEW."supplierOrganizationId" OR OLD."createdByUserId" <> NEW."createdByUserId" OR OLD."purchaseOrderNumber" <> NEW."purchaseOrderNumber" THEN
    RAISE EXCEPTION 'purchase order identity fields are immutable';
  END IF;
  IF OLD."status" <> NEW."status" AND NOT (
    (OLD."status" = 'DRAFT' AND NEW."status" IN ('SENT', 'CANCELLED')) OR
    (OLD."status" = 'SENT' AND NEW."status" IN ('ACKNOWLEDGED', 'DRAFT', 'CANCELLED')) OR
    (OLD."status" = 'ACKNOWLEDGED' AND NEW."status" IN ('DRAFT', 'CANCELLED'))
  ) THEN RAISE EXCEPTION 'invalid purchase order transition'; END IF;
  IF NEW."currentRevisionNumber" < OLD."currentRevisionNumber" OR NEW."currentRevisionNumber" > OLD."currentRevisionNumber" + 1 THEN
    RAISE EXCEPTION 'invalid purchase order revision sequence';
  END IF;
  IF NEW."status" = 'SENT' AND NEW."sentAt" IS NULL THEN RAISE EXCEPTION 'sent purchase order requires sent timestamp'; END IF;
  IF NEW."status" = 'ACKNOWLEDGED' AND NEW."acknowledgedAt" IS NULL THEN RAISE EXCEPTION 'acknowledged purchase order requires timestamp'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER purchase_orders_update_guard BEFORE UPDATE ON "purchase_orders" FOR EACH ROW EXECUTE FUNCTION guard_purchase_order_update();

CREATE OR REPLACE FUNCTION guard_purchase_order_revision_update() RETURNS trigger AS $$
BEGIN
  IF ROW(OLD."purchaseOrderId", OLD."revisionNumber", OLD."title", OLD."supplierMessage", OLD."internalCommercialTerms", OLD."internalNotes", OLD."revisionReason", OLD."createdByUserId", OLD."createdAt")
     IS DISTINCT FROM ROW(NEW."purchaseOrderId", NEW."revisionNumber", NEW."title", NEW."supplierMessage", NEW."internalCommercialTerms", NEW."internalNotes", NEW."revisionReason", NEW."createdByUserId", NEW."createdAt") THEN
    RAISE EXCEPTION 'purchase order revision content is immutable';
  END IF;
  IF NOT OLD."current" AND NEW."current" THEN RAISE EXCEPTION 'superseded purchase order revision cannot become current'; END IF;
  IF OLD."sentAt" IS NOT NULL AND OLD."sentAt" IS DISTINCT FROM NEW."sentAt" THEN RAISE EXCEPTION 'purchase order revision sent timestamp is immutable'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER purchase_order_revisions_update_guard BEFORE UPDATE ON "purchase_order_revisions" FOR EACH ROW EXECUTE FUNCTION guard_purchase_order_revision_update();

CREATE OR REPLACE FUNCTION validate_purchase_order_line_allocations() RETURNS trigger AS $$
DECLARE target_line UUID; expected DECIMAL(30,6); allocated DECIMAL(30,6);
BEGIN
  target_line := COALESCE(NEW."purchaseOrderLineId", OLD."purchaseOrderLineId");
  SELECT "orderedQuantity" INTO expected FROM "purchase_order_lines" WHERE "id" = target_line;
  SELECT COALESCE(SUM("quantity"), 0) INTO allocated FROM "purchase_order_allocations" WHERE "purchaseOrderLineId" = target_line;
  IF expected IS DISTINCT FROM allocated THEN RAISE EXCEPTION 'purchase order line quantity must equal allocated quantity'; END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER purchase_order_allocation_total_guard AFTER INSERT OR UPDATE OR DELETE ON "purchase_order_allocations" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_purchase_order_line_allocations();

CREATE OR REPLACE FUNCTION prevent_phase_four_b_history_mutation() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'Phase 4B history is append-only'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER purchase_order_lines_immutable BEFORE UPDATE OR DELETE ON "purchase_order_lines" FOR EACH ROW EXECUTE FUNCTION prevent_phase_four_b_history_mutation();
CREATE TRIGGER purchase_order_allocations_immutable BEFORE UPDATE OR DELETE ON "purchase_order_allocations" FOR EACH ROW EXECUTE FUNCTION prevent_phase_four_b_history_mutation();
CREATE TRIGGER purchase_order_transitions_immutable BEFORE UPDATE OR DELETE ON "purchase_order_transitions" FOR EACH ROW EXECUTE FUNCTION prevent_phase_four_b_history_mutation();
CREATE TRIGGER supplier_commitment_revisions_immutable BEFORE UPDATE OR DELETE ON "supplier_commitment_revisions" FOR EACH ROW EXECUTE FUNCTION prevent_phase_four_b_history_mutation();
CREATE TRIGGER supplier_commitment_lines_immutable BEFORE UPDATE OR DELETE ON "supplier_commitment_lines" FOR EACH ROW EXECUTE FUNCTION prevent_phase_four_b_history_mutation();
CREATE TRIGGER purchase_order_revisions_no_delete BEFORE DELETE ON "purchase_order_revisions" FOR EACH ROW EXECUTE FUNCTION prevent_phase_four_b_history_mutation();
CREATE TRIGGER purchase_orders_no_delete BEFORE DELETE ON "purchase_orders" FOR EACH ROW EXECUTE FUNCTION prevent_phase_four_b_history_mutation();
