ALTER TABLE "inventory_lots"
  DROP CONSTRAINT "inventory_lots_disposition_quantities_check";
ALTER TABLE "inventory_lots"
  ADD CONSTRAINT "inventory_lots_disposition_quantities_check"
  CHECK (
    "acceptedQuantity" >= 0
    AND "rejectedQuantity" >= 0
    AND "quarantinedQuantity" >= 0
  );
