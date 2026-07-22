CREATE TYPE "AdvanceShipmentNoticeStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_TRANSIT', 'ARRIVED', 'CANCELLED');
CREATE TYPE "GoodsReceiptStatus" AS ENUM ('DRAFT', 'POSTED');
CREATE TYPE "GoodsReceiptKind" AS ENUM ('RECEIPT', 'CORRECTION');
CREATE TYPE "InventoryLotStatus" AS ENUM ('AWAITING_INSPECTION');

ALTER TYPE "DocumentAssociationType" ADD VALUE 'ADVANCE_SHIPMENT_NOTICE';
ALTER TYPE "DocumentAssociationType" ADD VALUE 'GOODS_RECEIPT';

CREATE TABLE "advance_shipment_notices" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "purchaseOrderId" UUID NOT NULL,
  "purchaseOrderRevisionId" UUID NOT NULL,
  "supplierOrganizationId" UUID NOT NULL,
  "supplierReference" VARCHAR(100) NOT NULL,
  "status" "AdvanceShipmentNoticeStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "carrier" VARCHAR(200) NOT NULL DEFAULT '',
  "trackingNumber" VARCHAR(200) NOT NULL DEFAULT '',
  "estimatedArrivalDate" DATE,
  "notes" VARCHAR(2000) NOT NULL DEFAULT '',
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMPTZ(3),
  "departedAt" TIMESTAMPTZ(3),
  "arrivedAt" TIMESTAMPTZ(3),
  "cancelledAt" TIMESTAMPTZ(3),
  CONSTRAINT "advance_shipment_notices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "advance_shipment_notices_version_check" CHECK ("version" > 0),
  CONSTRAINT "advance_shipment_notices_reference_check" CHECK (length(btrim("supplierReference")) > 0)
);

CREATE TABLE "advance_shipment_notice_lines" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "advanceShipmentNoticeId" UUID NOT NULL,
  "purchaseOrderRevisionId" UUID NOT NULL,
  "purchaseOrderLineId" UUID NOT NULL,
  "lineNumber" INTEGER NOT NULL,
  "shippedQuantity" DECIMAL(30,6) NOT NULL,
  "packageReference" VARCHAR(200) NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "advance_shipment_notice_lines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "advance_shipment_notice_lines_positive_check" CHECK ("lineNumber" > 0 AND "shippedQuantity" > 0)
);

CREATE TABLE "advance_shipment_notice_transitions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "advanceShipmentNoticeId" UUID NOT NULL,
  "actorUserId" UUID NOT NULL,
  "sourceStatus" "AdvanceShipmentNoticeStatus" NOT NULL,
  "targetStatus" "AdvanceShipmentNoticeStatus" NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "advance_shipment_notice_transitions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "advance_shipment_notice_transitions_reason_check" CHECK (length(btrim("reason")) >= 5)
);

CREATE TABLE "goods_receipts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "advanceShipmentNoticeId" UUID NOT NULL,
  "receiptNumber" INTEGER NOT NULL,
  "kind" "GoodsReceiptKind" NOT NULL DEFAULT 'RECEIPT',
  "correctsReceiptId" UUID,
  "status" "GoodsReceiptStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "receivedAt" TIMESTAMPTZ(3) NOT NULL,
  "warehouseLocation" VARCHAR(200) NOT NULL,
  "notes" VARCHAR(2000) NOT NULL DEFAULT '',
  "correctionReason" VARCHAR(500),
  "createdByUserId" UUID NOT NULL,
  "postedByUserId" UUID,
  "postingIdempotencyKey" VARCHAR(128),
  "postingRequestHash" CHAR(64),
  "postedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "goods_receipts_numbers_version_check" CHECK ("receiptNumber" > 0 AND "version" > 0),
  CONSTRAINT "goods_receipts_location_check" CHECK (length(btrim("warehouseLocation")) > 0),
  CONSTRAINT "goods_receipts_kind_check" CHECK (
    ("kind" = 'RECEIPT' AND "correctsReceiptId" IS NULL AND "correctionReason" IS NULL)
    OR ("kind" = 'CORRECTION' AND "correctsReceiptId" IS NOT NULL AND length(btrim("correctionReason")) >= 5)
  ),
  CONSTRAINT "goods_receipts_posting_check" CHECK (
    ("status" = 'DRAFT' AND "postedByUserId" IS NULL AND "postingIdempotencyKey" IS NULL AND "postingRequestHash" IS NULL AND "postedAt" IS NULL)
    OR ("status" = 'POSTED' AND "postedByUserId" IS NOT NULL AND length("postingIdempotencyKey") >= 8 AND "postingRequestHash" ~ '^[0-9a-f]{64}$' AND "postedAt" IS NOT NULL)
  )
);

CREATE TABLE "goods_receipt_lines" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "goodsReceiptId" UUID NOT NULL,
  "advanceShipmentNoticeId" UUID NOT NULL,
  "advanceShipmentNoticeLineId" UUID NOT NULL,
  "correctsReceiptLineId" UUID,
  "lineNumber" INTEGER NOT NULL,
  "quantityDelta" DECIMAL(30,6) NOT NULL,
  "heatNumber" VARCHAR(200) NOT NULL DEFAULT '',
  "batchNumber" VARCHAR(200) NOT NULL DEFAULT '',
  "manufacturer" VARCHAR(200) NOT NULL DEFAULT '',
  "packageReference" VARCHAR(200) NOT NULL DEFAULT '',
  "notes" VARCHAR(1000) NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "goods_receipt_lines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "goods_receipt_lines_quantity_check" CHECK ("lineNumber" > 0 AND "quantityDelta" <> 0)
);

CREATE TABLE "inventory_lots" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "sourceGoodsReceiptId" UUID NOT NULL,
  "goodsReceiptLineId" UUID NOT NULL,
  "advanceShipmentNoticeLineId" UUID NOT NULL,
  "itemId" UUID NOT NULL,
  "unitOfMeasureId" UUID NOT NULL,
  "lotNumber" INTEGER NOT NULL,
  "quantity" DECIMAL(30,6) NOT NULL,
  "status" "InventoryLotStatus" NOT NULL DEFAULT 'AWAITING_INSPECTION',
  "heatNumber" VARCHAR(200) NOT NULL DEFAULT '',
  "batchNumber" VARCHAR(200) NOT NULL DEFAULT '',
  "manufacturer" VARCHAR(200) NOT NULL DEFAULT '',
  "packageReference" VARCHAR(200) NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_lots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "inventory_lots_positive_check" CHECK ("lotNumber" > 0 AND "quantity" > 0 AND "status" = 'AWAITING_INSPECTION')
);

CREATE TABLE "inventory_lot_adjustments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "inventoryLotId" UUID NOT NULL,
  "correctionReceiptLineId" UUID NOT NULL,
  "quantityDelta" DECIMAL(30,6) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_lot_adjustments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "inventory_lot_adjustments_nonzero_check" CHECK ("quantityDelta" <> 0)
);

CREATE UNIQUE INDEX "advance_shipment_notices_supplier_reference_key" ON "advance_shipment_notices"("supplierOrganizationId", "supplierReference");
CREATE INDEX "advance_shipment_notices_project_status_idx" ON "advance_shipment_notices"("projectId", "status", "updatedAt");
CREATE INDEX "advance_shipment_notices_po_status_idx" ON "advance_shipment_notices"("purchaseOrderId", "status");
CREATE INDEX "advance_shipment_notices_supplier_status_idx" ON "advance_shipment_notices"("supplierOrganizationId", "status", "updatedAt");
CREATE UNIQUE INDEX "advance_shipment_notice_lines_number_key" ON "advance_shipment_notice_lines"("advanceShipmentNoticeId", "lineNumber");
CREATE UNIQUE INDEX "advance_shipment_notice_lines_po_line_key" ON "advance_shipment_notice_lines"("advanceShipmentNoticeId", "purchaseOrderLineId");
CREATE UNIQUE INDEX "advance_shipment_notice_lines_id_asn_key" ON "advance_shipment_notice_lines"("id", "advanceShipmentNoticeId");
CREATE INDEX "advance_shipment_notice_lines_po_line_idx" ON "advance_shipment_notice_lines"("purchaseOrderLineId");
CREATE INDEX "advance_shipment_notice_transitions_asn_time_idx" ON "advance_shipment_notice_transitions"("advanceShipmentNoticeId", "occurredAt");
CREATE UNIQUE INDEX "goods_receipts_project_number_key" ON "goods_receipts"("projectId", "receiptNumber");
CREATE UNIQUE INDEX "goods_receipts_posting_key" ON "goods_receipts"("postingIdempotencyKey");
CREATE INDEX "goods_receipts_project_status_idx" ON "goods_receipts"("projectId", "status", "createdAt");
CREATE INDEX "goods_receipts_asn_status_idx" ON "goods_receipts"("advanceShipmentNoticeId", "status");
CREATE INDEX "goods_receipts_correction_idx" ON "goods_receipts"("correctsReceiptId");
CREATE UNIQUE INDEX "goods_receipt_lines_number_key" ON "goods_receipt_lines"("goodsReceiptId", "lineNumber");
CREATE UNIQUE INDEX "goods_receipt_lines_asn_line_key" ON "goods_receipt_lines"("goodsReceiptId", "advanceShipmentNoticeLineId");
CREATE INDEX "goods_receipt_lines_asn_line_idx" ON "goods_receipt_lines"("advanceShipmentNoticeLineId");
CREATE INDEX "goods_receipt_lines_correction_idx" ON "goods_receipt_lines"("correctsReceiptLineId");
CREATE UNIQUE INDEX "inventory_lots_receipt_line_key" ON "inventory_lots"("goodsReceiptLineId");
CREATE UNIQUE INDEX "inventory_lots_project_number_key" ON "inventory_lots"("projectId", "lotNumber");
CREATE INDEX "inventory_lots_project_status_idx" ON "inventory_lots"("projectId", "status", "createdAt");
CREATE INDEX "inventory_lots_asn_line_idx" ON "inventory_lots"("advanceShipmentNoticeLineId");
CREATE UNIQUE INDEX "inventory_lot_adjustments_correction_line_key" ON "inventory_lot_adjustments"("correctionReceiptLineId");
CREATE INDEX "inventory_lot_adjustments_lot_time_idx" ON "inventory_lot_adjustments"("inventoryLotId", "createdAt");

ALTER TABLE "advance_shipment_notices" ADD CONSTRAINT "advance_shipment_notices_project_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "advance_shipment_notices" ADD CONSTRAINT "advance_shipment_notices_po_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "advance_shipment_notices" ADD CONSTRAINT "advance_shipment_notices_revision_fkey" FOREIGN KEY ("purchaseOrderRevisionId", "purchaseOrderId") REFERENCES "purchase_order_revisions"("id", "purchaseOrderId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "advance_shipment_notices" ADD CONSTRAINT "advance_shipment_notices_supplier_fkey" FOREIGN KEY ("supplierOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "advance_shipment_notices" ADD CONSTRAINT "advance_shipment_notices_creator_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "advance_shipment_notice_lines" ADD CONSTRAINT "advance_shipment_notice_lines_asn_fkey" FOREIGN KEY ("advanceShipmentNoticeId") REFERENCES "advance_shipment_notices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "advance_shipment_notice_lines" ADD CONSTRAINT "advance_shipment_notice_lines_po_line_fkey" FOREIGN KEY ("purchaseOrderLineId", "purchaseOrderRevisionId") REFERENCES "purchase_order_lines"("id", "purchaseOrderRevisionId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "advance_shipment_notice_transitions" ADD CONSTRAINT "advance_shipment_notice_transitions_asn_fkey" FOREIGN KEY ("advanceShipmentNoticeId") REFERENCES "advance_shipment_notices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "advance_shipment_notice_transitions" ADD CONSTRAINT "advance_shipment_notice_transitions_actor_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_project_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_asn_fkey" FOREIGN KEY ("advanceShipmentNoticeId") REFERENCES "advance_shipment_notices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_correction_fkey" FOREIGN KEY ("correctsReceiptId") REFERENCES "goods_receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_creator_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_poster_fkey" FOREIGN KEY ("postedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_receipt_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "goods_receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_asn_line_fkey" FOREIGN KEY ("advanceShipmentNoticeLineId", "advanceShipmentNoticeId") REFERENCES "advance_shipment_notice_lines"("id", "advanceShipmentNoticeId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_correction_fkey" FOREIGN KEY ("correctsReceiptLineId") REFERENCES "goods_receipt_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_project_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_receipt_fkey" FOREIGN KEY ("sourceGoodsReceiptId") REFERENCES "goods_receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_receipt_line_fkey" FOREIGN KEY ("goodsReceiptLineId") REFERENCES "goods_receipt_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_asn_line_fkey" FOREIGN KEY ("advanceShipmentNoticeLineId") REFERENCES "advance_shipment_notice_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_item_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_unit_fkey" FOREIGN KEY ("unitOfMeasureId") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_lot_adjustments" ADD CONSTRAINT "inventory_lot_adjustments_lot_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_lot_adjustments" ADD CONSTRAINT "inventory_lot_adjustments_correction_line_fkey" FOREIGN KEY ("correctionReceiptLineId") REFERENCES "goods_receipt_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION validate_advance_shipment_notice_scope() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "purchase_orders" po
    JOIN "purchase_order_revisions" por ON por."purchaseOrderId" = po."id"
    WHERE po."id" = NEW."purchaseOrderId"
      AND po."projectId" = NEW."projectId"
      AND po."supplierOrganizationId" = NEW."supplierOrganizationId"
      AND po."status" = 'ACKNOWLEDGED'
      AND por."id" = NEW."purchaseOrderRevisionId"
      AND por."current"
  ) THEN RAISE EXCEPTION 'shipment notice must use the addressed current acknowledged purchase order revision'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER advance_shipment_notice_scope_guard BEFORE INSERT ON "advance_shipment_notices" FOR EACH ROW EXECUTE FUNCTION validate_advance_shipment_notice_scope();

CREATE OR REPLACE FUNCTION validate_advance_shipment_notice_line_scope() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "advance_shipment_notices" asn
    WHERE asn."id" = NEW."advanceShipmentNoticeId" AND asn."purchaseOrderRevisionId" = NEW."purchaseOrderRevisionId"
  ) THEN RAISE EXCEPTION 'shipment notice line is outside the purchase order revision'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER advance_shipment_notice_line_scope_guard BEFORE INSERT ON "advance_shipment_notice_lines" FOR EACH ROW EXECUTE FUNCTION validate_advance_shipment_notice_line_scope();

CREATE OR REPLACE FUNCTION guard_advance_shipment_notice_update() RETURNS trigger AS $$
BEGIN
  IF ROW(OLD."projectId", OLD."purchaseOrderId", OLD."purchaseOrderRevisionId", OLD."supplierOrganizationId", OLD."supplierReference", OLD."carrier", OLD."trackingNumber", OLD."estimatedArrivalDate", OLD."notes", OLD."createdByUserId", OLD."createdAt")
     IS DISTINCT FROM ROW(NEW."projectId", NEW."purchaseOrderId", NEW."purchaseOrderRevisionId", NEW."supplierOrganizationId", NEW."supplierReference", NEW."carrier", NEW."trackingNumber", NEW."estimatedArrivalDate", NEW."notes", NEW."createdByUserId", NEW."createdAt") THEN
    RAISE EXCEPTION 'shipment notice content is immutable';
  END IF;
  IF OLD."status" <> NEW."status" AND NOT (
    (OLD."status" = 'DRAFT' AND NEW."status" IN ('SUBMITTED', 'CANCELLED')) OR
    (OLD."status" = 'SUBMITTED' AND NEW."status" IN ('IN_TRANSIT', 'CANCELLED')) OR
    (OLD."status" = 'IN_TRANSIT' AND NEW."status" = 'ARRIVED')
  ) THEN RAISE EXCEPTION 'invalid shipment notice transition'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER advance_shipment_notices_update_guard BEFORE UPDATE ON "advance_shipment_notices" FOR EACH ROW EXECUTE FUNCTION guard_advance_shipment_notice_update();

CREATE OR REPLACE FUNCTION validate_goods_receipt_scope() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "advance_shipment_notices" WHERE "id" = NEW."advanceShipmentNoticeId" AND "projectId" = NEW."projectId" AND "status" = 'ARRIVED') THEN
    RAISE EXCEPTION 'goods receipt requires an arrived shipment notice in the same project';
  END IF;
  IF NEW."kind" = 'CORRECTION' AND NOT EXISTS (
    SELECT 1 FROM "goods_receipts" gr WHERE gr."id" = NEW."correctsReceiptId" AND gr."projectId" = NEW."projectId" AND gr."advanceShipmentNoticeId" = NEW."advanceShipmentNoticeId" AND gr."kind" = 'RECEIPT' AND gr."status" = 'POSTED'
  ) THEN RAISE EXCEPTION 'correction must reference a posted original receipt'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER goods_receipt_scope_guard BEFORE INSERT ON "goods_receipts" FOR EACH ROW EXECUTE FUNCTION validate_goods_receipt_scope();

CREATE OR REPLACE FUNCTION validate_goods_receipt_line_scope() RETURNS trigger AS $$
DECLARE receipt_kind "GoodsReceiptKind"; receipt_asn UUID; corrected_receipt UUID;
BEGIN
  SELECT "kind", "advanceShipmentNoticeId", "correctsReceiptId" INTO receipt_kind, receipt_asn, corrected_receipt FROM "goods_receipts" WHERE "id" = NEW."goodsReceiptId";
  IF receipt_asn IS DISTINCT FROM NEW."advanceShipmentNoticeId" THEN RAISE EXCEPTION 'receipt line is outside the shipment notice'; END IF;
  IF receipt_kind = 'RECEIPT' AND (NEW."correctsReceiptLineId" IS NOT NULL OR NEW."quantityDelta" <= 0) THEN RAISE EXCEPTION 'original receipt lines require positive quantity'; END IF;
  IF receipt_kind = 'CORRECTION' AND NOT EXISTS (
    SELECT 1 FROM "goods_receipt_lines" grl WHERE grl."id" = NEW."correctsReceiptLineId" AND grl."goodsReceiptId" = corrected_receipt AND grl."advanceShipmentNoticeLineId" = NEW."advanceShipmentNoticeLineId"
  ) THEN RAISE EXCEPTION 'correction line must reference the matching original receipt line'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER goods_receipt_line_scope_guard BEFORE INSERT ON "goods_receipt_lines" FOR EACH ROW EXECUTE FUNCTION validate_goods_receipt_line_scope();

CREATE OR REPLACE FUNCTION guard_goods_receipt_update() RETURNS trigger AS $$
BEGIN
  IF OLD."status" = 'POSTED' THEN RAISE EXCEPTION 'posted goods receipts are immutable'; END IF;
  IF ROW(OLD."projectId", OLD."advanceShipmentNoticeId", OLD."receiptNumber", OLD."kind", OLD."correctsReceiptId", OLD."receivedAt", OLD."warehouseLocation", OLD."notes", OLD."correctionReason", OLD."createdByUserId", OLD."createdAt")
     IS DISTINCT FROM ROW(NEW."projectId", NEW."advanceShipmentNoticeId", NEW."receiptNumber", NEW."kind", NEW."correctsReceiptId", NEW."receivedAt", NEW."warehouseLocation", NEW."notes", NEW."correctionReason", NEW."createdByUserId", NEW."createdAt") THEN
    RAISE EXCEPTION 'goods receipt draft content is immutable';
  END IF;
  IF OLD."status" <> NEW."status" AND NOT (OLD."status" = 'DRAFT' AND NEW."status" = 'POSTED') THEN RAISE EXCEPTION 'invalid goods receipt transition'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER goods_receipts_update_guard BEFORE UPDATE ON "goods_receipts" FOR EACH ROW EXECUTE FUNCTION guard_goods_receipt_update();

CREATE OR REPLACE FUNCTION prevent_phase_five_b_history_mutation() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'Phase 5B operational history is immutable'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER advance_shipment_notices_no_delete BEFORE DELETE ON "advance_shipment_notices" FOR EACH ROW EXECUTE FUNCTION prevent_phase_five_b_history_mutation();
CREATE TRIGGER advance_shipment_notice_lines_immutable BEFORE UPDATE OR DELETE ON "advance_shipment_notice_lines" FOR EACH ROW EXECUTE FUNCTION prevent_phase_five_b_history_mutation();
CREATE TRIGGER advance_shipment_notice_transitions_immutable BEFORE UPDATE OR DELETE ON "advance_shipment_notice_transitions" FOR EACH ROW EXECUTE FUNCTION prevent_phase_five_b_history_mutation();
CREATE TRIGGER goods_receipts_no_delete BEFORE DELETE ON "goods_receipts" FOR EACH ROW EXECUTE FUNCTION prevent_phase_five_b_history_mutation();
CREATE TRIGGER goods_receipt_lines_immutable BEFORE UPDATE OR DELETE ON "goods_receipt_lines" FOR EACH ROW EXECUTE FUNCTION prevent_phase_five_b_history_mutation();
CREATE TRIGGER inventory_lots_immutable BEFORE UPDATE OR DELETE ON "inventory_lots" FOR EACH ROW EXECUTE FUNCTION prevent_phase_five_b_history_mutation();
CREATE TRIGGER inventory_lot_adjustments_immutable BEFORE UPDATE OR DELETE ON "inventory_lot_adjustments" FOR EACH ROW EXECUTE FUNCTION prevent_phase_five_b_history_mutation();
