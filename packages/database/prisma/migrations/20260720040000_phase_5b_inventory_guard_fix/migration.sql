DROP TRIGGER inventory_lot_scope_guard ON "inventory_lots";
DROP TRIGGER inventory_lot_adjustment_scope_guard ON "inventory_lot_adjustments";
DROP FUNCTION validate_inventory_effect_scope();

CREATE OR REPLACE FUNCTION validate_inventory_lot_scope() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "goods_receipts" gr JOIN "goods_receipt_lines" grl ON grl."goodsReceiptId" = gr."id"
    WHERE gr."id" = NEW."sourceGoodsReceiptId" AND gr."status" = 'POSTED' AND gr."kind" = 'RECEIPT' AND grl."id" = NEW."goodsReceiptLineId"
  ) THEN RAISE EXCEPTION 'inventory lot requires a posted original receipt line'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_inventory_lot_adjustment_scope() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "goods_receipt_lines" grl JOIN "goods_receipts" gr ON gr."id" = grl."goodsReceiptId"
    WHERE grl."id" = NEW."correctionReceiptLineId" AND gr."status" = 'POSTED' AND gr."kind" = 'CORRECTION'
  ) THEN RAISE EXCEPTION 'inventory adjustment requires a posted correction receipt line'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_lot_scope_guard
BEFORE INSERT ON "inventory_lots"
FOR EACH ROW EXECUTE FUNCTION validate_inventory_lot_scope();

CREATE TRIGGER inventory_lot_adjustment_scope_guard
BEFORE INSERT ON "inventory_lot_adjustments"
FOR EACH ROW EXECUTE FUNCTION validate_inventory_lot_adjustment_scope();
