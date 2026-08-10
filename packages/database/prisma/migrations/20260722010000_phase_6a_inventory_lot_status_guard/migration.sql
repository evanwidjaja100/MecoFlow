ALTER TABLE "inventory_lots" DROP CONSTRAINT "inventory_lots_positive_check";
ALTER TABLE "inventory_lots"
  ADD CONSTRAINT "inventory_lots_positive_check"
  CHECK ("lotNumber" > 0 AND "quantity" > 0);
