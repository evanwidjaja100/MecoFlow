CREATE OR REPLACE FUNCTION validate_inventory_lot_adjustment_scope() RETURNS trigger AS $$
DECLARE lot_status "InventoryLotStatus";
BEGIN
  SELECT "status" INTO lot_status
  FROM "inventory_lots"
  WHERE "id" = NEW."inventoryLotId"
  FOR UPDATE;

  IF lot_status IS NULL OR lot_status <> 'AWAITING_INSPECTION' THEN
    RAISE EXCEPTION 'inventory adjustment requires an awaiting-inspection lot';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM "goods_receipt_lines" grl
    JOIN "goods_receipts" gr ON gr."id" = grl."goodsReceiptId"
    WHERE grl."id" = NEW."correctionReceiptLineId"
      AND gr."status" = 'POSTED'
      AND gr."kind" = 'CORRECTION'
  ) THEN
    RAISE EXCEPTION 'inventory adjustment requires a posted correction';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
