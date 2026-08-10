CREATE TYPE "ReceivingInspectionStatus" AS ENUM ('OPEN', 'FINALIZED');
CREATE TYPE "ReceivingInspectionDisposition" AS ENUM ('ACCEPTED', 'CONDITIONALLY_ACCEPTED', 'QUARANTINED', 'REJECTED');
CREATE TYPE "InspectionCheckType" AS ENUM ('CHECKLIST', 'MEASUREMENT', 'CERTIFICATE');
CREATE TYPE "CertificateReviewDecision" AS ENUM ('ACCEPTED', 'REJECTED');

ALTER TYPE "InventoryLotStatus" ADD VALUE 'ACCEPTED';
ALTER TYPE "InventoryLotStatus" ADD VALUE 'CONDITIONALLY_ACCEPTED';
ALTER TYPE "InventoryLotStatus" ADD VALUE 'QUARANTINED';
ALTER TYPE "InventoryLotStatus" ADD VALUE 'REJECTED';
ALTER TYPE "DocumentAssociationType" ADD VALUE 'RECEIVING_INSPECTION';

ALTER TABLE "inventory_lots"
  ADD COLUMN "acceptedQuantity" DECIMAL(30,6) NOT NULL DEFAULT 0,
  ADD COLUMN "rejectedQuantity" DECIMAL(30,6) NOT NULL DEFAULT 0,
  ADD COLUMN "quarantinedQuantity" DECIMAL(30,6) NOT NULL DEFAULT 0;

ALTER TABLE "inventory_lots"
  ADD CONSTRAINT "inventory_lots_disposition_quantities_check"
  CHECK (
    "acceptedQuantity" >= 0
    AND "rejectedQuantity" >= 0
    AND "quarantinedQuantity" >= 0
    AND "acceptedQuantity" + "rejectedQuantity" <= "quantity" + "quarantinedQuantity"
  );

CREATE TABLE "inspection_check_definitions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "itemId" UUID NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "description" VARCHAR(1000) NOT NULL DEFAULT '',
  "checkType" "InspectionCheckType" NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT TRUE,
  "unitOfMeasureId" UUID,
  "decimalPrecision" INTEGER,
  "minimumValue" DECIMAL(30,6),
  "maximumValue" DECIMAL(30,6),
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inspection_check_definitions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "inspection_check_definitions_text_check" CHECK (length(btrim("code")) > 0 AND length(btrim("name")) > 0),
  CONSTRAINT "inspection_check_definitions_version_check" CHECK ("version" > 0),
  CONSTRAINT "inspection_check_definitions_shape_check" CHECK (
    (
      "checkType" = 'MEASUREMENT'
      AND "decimalPrecision" BETWEEN 0 AND 6
      AND ("minimumValue" IS NULL OR round("minimumValue", "decimalPrecision") = "minimumValue")
      AND ("maximumValue" IS NULL OR round("maximumValue", "decimalPrecision") = "maximumValue")
      AND ("minimumValue" IS NULL OR "maximumValue" IS NULL OR "minimumValue" <= "maximumValue")
    )
    OR (
      "checkType" <> 'MEASUREMENT'
      AND "unitOfMeasureId" IS NULL
      AND "decimalPrecision" IS NULL
      AND "minimumValue" IS NULL
      AND "maximumValue" IS NULL
    )
  )
);

CREATE TABLE "receiving_inspections" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "inventoryLotId" UUID NOT NULL,
  "status" "ReceivingInspectionStatus" NOT NULL DEFAULT 'OPEN',
  "disposition" "ReceivingInspectionDisposition",
  "version" INTEGER NOT NULL DEFAULT 1,
  "receivedQuantityAtCreation" DECIMAL(30,6) NOT NULL,
  "finalizedReceivedQuantity" DECIMAL(30,6),
  "acceptedQuantity" DECIMAL(30,6) NOT NULL DEFAULT 0,
  "rejectedQuantity" DECIMAL(30,6) NOT NULL DEFAULT 0,
  "quarantinedQuantity" DECIMAL(30,6) NOT NULL DEFAULT 0,
  "reason" VARCHAR(500) NOT NULL DEFAULT '',
  "createdByUserId" UUID NOT NULL,
  "finalizedByUserId" UUID,
  "conditionalAcceptanceAuthorizedByUserId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finalizedAt" TIMESTAMPTZ(3),
  CONSTRAINT "receiving_inspections_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "receiving_inspections_version_quantity_check" CHECK (
    "version" > 0
    AND "receivedQuantityAtCreation" > 0
    AND "acceptedQuantity" >= 0
    AND "rejectedQuantity" >= 0
    AND "quarantinedQuantity" >= 0
  ),
  CONSTRAINT "receiving_inspections_state_check" CHECK (
    (
      "status" = 'OPEN'
      AND "disposition" IS NULL
      AND "finalizedReceivedQuantity" IS NULL
      AND "acceptedQuantity" = 0
      AND "rejectedQuantity" = 0
      AND "quarantinedQuantity" = 0
      AND "reason" = ''
      AND "finalizedByUserId" IS NULL
      AND "conditionalAcceptanceAuthorizedByUserId" IS NULL
      AND "finalizedAt" IS NULL
    )
    OR (
      "status" = 'FINALIZED'
      AND "disposition" IS NOT NULL
      AND "finalizedReceivedQuantity" > 0
      AND "acceptedQuantity" + "rejectedQuantity" <= "finalizedReceivedQuantity"
      AND "quarantinedQuantity" = "finalizedReceivedQuantity" - "acceptedQuantity" - "rejectedQuantity"
      AND length(btrim("reason")) >= 5
      AND "finalizedByUserId" IS NOT NULL
      AND "finalizedAt" IS NOT NULL
      AND (("disposition" = 'CONDITIONALLY_ACCEPTED') = ("conditionalAcceptanceAuthorizedByUserId" IS NOT NULL))
      AND ("disposition" <> 'REJECTED' OR ("acceptedQuantity" = 0 AND "rejectedQuantity" = "finalizedReceivedQuantity"))
      AND ("disposition" <> 'QUARANTINED' OR "quarantinedQuantity" > 0)
      AND ("disposition" NOT IN ('ACCEPTED', 'CONDITIONALLY_ACCEPTED') OR ("acceptedQuantity" > 0 AND "quarantinedQuantity" = 0))
    )
  )
);

CREATE TABLE "receiving_inspection_checks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "receivingInspectionId" UUID NOT NULL,
  "definitionId" UUID NOT NULL,
  "lineNumber" INTEGER NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "description" VARCHAR(1000) NOT NULL DEFAULT '',
  "checkType" "InspectionCheckType" NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT TRUE,
  "unitOfMeasureId" UUID,
  "decimalPrecision" INTEGER,
  "minimumValue" DECIMAL(30,6),
  "maximumValue" DECIMAL(30,6),
  "checklistPassed" BOOLEAN,
  "measuredValue" DECIMAL(30,6),
  "certificateDecision" "CertificateReviewDecision",
  "evidenceDocumentId" UUID,
  "conforming" BOOLEAN,
  "notes" VARCHAR(1000) NOT NULL DEFAULT '',
  "completedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "receiving_inspection_checks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "receiving_inspection_checks_number_check" CHECK ("lineNumber" > 0),
  CONSTRAINT "receiving_inspection_checks_snapshot_shape_check" CHECK (
    (
      "checkType" = 'MEASUREMENT'
      AND "decimalPrecision" BETWEEN 0 AND 6
      AND ("minimumValue" IS NULL OR round("minimumValue", "decimalPrecision") = "minimumValue")
      AND ("maximumValue" IS NULL OR round("maximumValue", "decimalPrecision") = "maximumValue")
      AND ("minimumValue" IS NULL OR "maximumValue" IS NULL OR "minimumValue" <= "maximumValue")
    )
    OR (
      "checkType" <> 'MEASUREMENT'
      AND "unitOfMeasureId" IS NULL
      AND "decimalPrecision" IS NULL
      AND "minimumValue" IS NULL
      AND "maximumValue" IS NULL
    )
  ),
  CONSTRAINT "receiving_inspection_checks_result_shape_check" CHECK (
    (
      "completedAt" IS NULL
      AND "checklistPassed" IS NULL
      AND "measuredValue" IS NULL
      AND "certificateDecision" IS NULL
      AND "evidenceDocumentId" IS NULL
      AND "conforming" IS NULL
    )
    OR (
      "completedAt" IS NOT NULL
      AND (
        ("checkType" = 'CHECKLIST' AND "checklistPassed" IS NOT NULL AND "measuredValue" IS NULL AND "certificateDecision" IS NULL AND "evidenceDocumentId" IS NULL AND "conforming" = "checklistPassed")
        OR ("checkType" = 'MEASUREMENT' AND "checklistPassed" IS NULL AND "measuredValue" IS NOT NULL AND round("measuredValue", "decimalPrecision") = "measuredValue" AND "certificateDecision" IS NULL AND "evidenceDocumentId" IS NULL AND "conforming" IS NOT NULL)
        OR ("checkType" = 'CERTIFICATE' AND "checklistPassed" IS NULL AND "measuredValue" IS NULL AND "certificateDecision" IS NOT NULL AND "evidenceDocumentId" IS NOT NULL AND "conforming" = ("certificateDecision" = 'ACCEPTED'))
      )
    )
  )
);

CREATE UNIQUE INDEX "inspection_check_definitions_item_code_key" ON "inspection_check_definitions"("itemId", "code");
CREATE INDEX "inspection_check_definitions_item_active_idx" ON "inspection_check_definitions"("itemId", "active", "code");
CREATE INDEX "inspection_check_definitions_unit_idx" ON "inspection_check_definitions"("unitOfMeasureId");
CREATE UNIQUE INDEX "receiving_inspections_lot_key" ON "receiving_inspections"("inventoryLotId");
CREATE INDEX "receiving_inspections_project_status_idx" ON "receiving_inspections"("projectId", "status", "createdAt");
CREATE UNIQUE INDEX "receiving_inspection_checks_number_key" ON "receiving_inspection_checks"("receivingInspectionId", "lineNumber");
CREATE UNIQUE INDEX "receiving_inspection_checks_definition_key" ON "receiving_inspection_checks"("receivingInspectionId", "definitionId");
CREATE INDEX "receiving_inspection_checks_definition_idx" ON "receiving_inspection_checks"("definitionId");
CREATE INDEX "receiving_inspection_checks_evidence_idx" ON "receiving_inspection_checks"("evidenceDocumentId");

ALTER TABLE "inspection_check_definitions" ADD CONSTRAINT "inspection_check_definitions_item_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inspection_check_definitions" ADD CONSTRAINT "inspection_check_definitions_unit_fkey" FOREIGN KEY ("unitOfMeasureId") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inspection_check_definitions" ADD CONSTRAINT "inspection_check_definitions_creator_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receiving_inspections" ADD CONSTRAINT "receiving_inspections_project_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receiving_inspections" ADD CONSTRAINT "receiving_inspections_lot_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receiving_inspections" ADD CONSTRAINT "receiving_inspections_creator_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receiving_inspections" ADD CONSTRAINT "receiving_inspections_finalizer_fkey" FOREIGN KEY ("finalizedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receiving_inspections" ADD CONSTRAINT "receiving_inspections_conditional_authorizer_fkey" FOREIGN KEY ("conditionalAcceptanceAuthorizedByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receiving_inspection_checks" ADD CONSTRAINT "receiving_inspection_checks_inspection_fkey" FOREIGN KEY ("receivingInspectionId") REFERENCES "receiving_inspections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receiving_inspection_checks" ADD CONSTRAINT "receiving_inspection_checks_definition_fkey" FOREIGN KEY ("definitionId") REFERENCES "inspection_check_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receiving_inspection_checks" ADD CONSTRAINT "receiving_inspection_checks_unit_fkey" FOREIGN KEY ("unitOfMeasureId") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receiving_inspection_checks" ADD CONSTRAINT "receiving_inspection_checks_evidence_fkey" FOREIGN KEY ("evidenceDocumentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION guard_inspection_check_definition_update() RETURNS trigger AS $$
BEGIN
  IF ROW(OLD."itemId", OLD."code", OLD."createdByUserId", OLD."createdAt")
     IS DISTINCT FROM ROW(NEW."itemId", NEW."code", NEW."createdByUserId", NEW."createdAt") THEN
    RAISE EXCEPTION 'inspection check definition identity is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER inspection_check_definitions_update_guard BEFORE UPDATE ON "inspection_check_definitions" FOR EACH ROW EXECUTE FUNCTION guard_inspection_check_definition_update();

CREATE OR REPLACE FUNCTION guard_receiving_inspection_update() RETURNS trigger AS $$
BEGIN
  IF ROW(OLD."projectId", OLD."inventoryLotId", OLD."receivedQuantityAtCreation", OLD."createdByUserId", OLD."createdAt")
     IS DISTINCT FROM ROW(NEW."projectId", NEW."inventoryLotId", NEW."receivedQuantityAtCreation", NEW."createdByUserId", NEW."createdAt") THEN
    RAISE EXCEPTION 'receiving inspection identity is immutable';
  END IF;
  IF OLD."status" = 'FINALIZED' THEN RAISE EXCEPTION 'finalized receiving inspections are immutable'; END IF;
  IF OLD."status" <> NEW."status" AND NOT (OLD."status" = 'OPEN' AND NEW."status" = 'FINALIZED') THEN
    RAISE EXCEPTION 'invalid receiving inspection transition';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER receiving_inspections_update_guard BEFORE UPDATE ON "receiving_inspections" FOR EACH ROW EXECUTE FUNCTION guard_receiving_inspection_update();

CREATE OR REPLACE FUNCTION guard_receiving_inspection_check_update() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "receiving_inspections" WHERE "id" = OLD."receivingInspectionId" AND "status" = 'OPEN') THEN
    RAISE EXCEPTION 'finalized receiving inspection checks are immutable';
  END IF;
  IF ROW(OLD."receivingInspectionId", OLD."definitionId", OLD."lineNumber", OLD."code", OLD."name", OLD."description", OLD."checkType", OLD."required", OLD."unitOfMeasureId", OLD."decimalPrecision", OLD."minimumValue", OLD."maximumValue", OLD."createdAt")
     IS DISTINCT FROM ROW(NEW."receivingInspectionId", NEW."definitionId", NEW."lineNumber", NEW."code", NEW."name", NEW."description", NEW."checkType", NEW."required", NEW."unitOfMeasureId", NEW."decimalPrecision", NEW."minimumValue", NEW."maximumValue", NEW."createdAt") THEN
    RAISE EXCEPTION 'receiving inspection check definition snapshot is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER receiving_inspection_checks_update_guard BEFORE UPDATE ON "receiving_inspection_checks" FOR EACH ROW EXECUTE FUNCTION guard_receiving_inspection_check_update();

DROP TRIGGER inventory_lots_immutable ON "inventory_lots";
CREATE OR REPLACE FUNCTION guard_inventory_lot_inspection_update() RETURNS trigger AS $$
DECLARE effective_received DECIMAL(30,6); unit_precision INTEGER;
BEGIN
  IF ROW(OLD."projectId", OLD."sourceGoodsReceiptId", OLD."goodsReceiptLineId", OLD."advanceShipmentNoticeLineId", OLD."itemId", OLD."unitOfMeasureId", OLD."lotNumber", OLD."quantity", OLD."heatNumber", OLD."batchNumber", OLD."manufacturer", OLD."packageReference", OLD."createdAt")
     IS DISTINCT FROM ROW(NEW."projectId", NEW."sourceGoodsReceiptId", NEW."goodsReceiptLineId", NEW."advanceShipmentNoticeLineId", NEW."itemId", NEW."unitOfMeasureId", NEW."lotNumber", NEW."quantity", NEW."heatNumber", NEW."batchNumber", NEW."manufacturer", NEW."packageReference", NEW."createdAt") THEN
    RAISE EXCEPTION 'inventory lot receipt history is immutable';
  END IF;
  IF OLD."status" <> 'AWAITING_INSPECTION' OR NEW."status" = 'AWAITING_INSPECTION' THEN
    RAISE EXCEPTION 'inventory lot disposition can be finalized only once';
  END IF;
  SELECT OLD."quantity" + COALESCE(sum(a."quantityDelta"), 0) INTO effective_received
    FROM "inventory_lot_adjustments" a WHERE a."inventoryLotId" = OLD."id";
  SELECT "decimalPrecision" INTO unit_precision FROM "units_of_measure" WHERE "id" = OLD."unitOfMeasureId";
  IF round(NEW."acceptedQuantity", unit_precision) <> NEW."acceptedQuantity"
     OR round(NEW."rejectedQuantity", unit_precision) <> NEW."rejectedQuantity"
     OR round(NEW."quarantinedQuantity", unit_precision) <> NEW."quarantinedQuantity"
     OR NEW."acceptedQuantity" + NEW."rejectedQuantity" > effective_received
     OR NEW."quarantinedQuantity" <> effective_received - NEW."acceptedQuantity" - NEW."rejectedQuantity" THEN
    RAISE EXCEPTION 'inventory lot disposition quantities are invalid';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM "receiving_inspections" inspection
    WHERE inspection."inventoryLotId" = OLD."id"
      AND inspection."status" = 'FINALIZED'
      AND inspection."disposition"::text = NEW."status"::text
      AND inspection."acceptedQuantity" = NEW."acceptedQuantity"
      AND inspection."rejectedQuantity" = NEW."rejectedQuantity"
      AND inspection."quarantinedQuantity" = NEW."quarantinedQuantity"
  ) THEN RAISE EXCEPTION 'inventory lot disposition requires the matching finalized inspection'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER inventory_lots_inspection_update_guard BEFORE UPDATE ON "inventory_lots" FOR EACH ROW EXECUTE FUNCTION guard_inventory_lot_inspection_update();

CREATE OR REPLACE FUNCTION validate_inventory_lot_adjustment_scope() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "goods_receipt_lines" grl
    JOIN "goods_receipts" gr ON gr."id" = grl."goodsReceiptId"
    JOIN "inventory_lots" lot ON lot."id" = NEW."inventoryLotId"
    WHERE grl."id" = NEW."correctionReceiptLineId"
      AND gr."status" = 'POSTED'
      AND gr."kind" = 'CORRECTION'
      AND lot."status" = 'AWAITING_INSPECTION'
  ) THEN RAISE EXCEPTION 'inventory adjustment requires a posted correction for an awaiting-inspection lot'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_phase_six_a_history_mutation() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'Phase 6A inspection history is immutable'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER inspection_check_definitions_no_delete BEFORE DELETE ON "inspection_check_definitions" FOR EACH ROW EXECUTE FUNCTION prevent_phase_six_a_history_mutation();
CREATE TRIGGER receiving_inspections_no_delete BEFORE DELETE ON "receiving_inspections" FOR EACH ROW EXECUTE FUNCTION prevent_phase_six_a_history_mutation();
CREATE TRIGGER receiving_inspection_checks_no_delete BEFORE DELETE ON "receiving_inspection_checks" FOR EACH ROW EXECUTE FUNCTION prevent_phase_six_a_history_mutation();
