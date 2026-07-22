CREATE TYPE "SpecificationDataType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN');

CREATE TABLE "item_categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(150) NOT NULL,
  "description" VARCHAR(500) NOT NULL DEFAULT '',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "item_categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "item_categories_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "item_categories_code_key" ON "item_categories"("code");
CREATE INDEX "item_categories_active_name_idx" ON "item_categories"("active", "name");

CREATE TABLE "units_of_measure" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(30) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "symbol" VARCHAR(20) NOT NULL,
  "decimalPrecision" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "units_of_measure_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "units_of_measure_precision_check" CHECK ("decimalPrecision" BETWEEN 0 AND 6),
  CONSTRAINT "units_of_measure_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "units_of_measure_code_key" ON "units_of_measure"("code");
CREATE INDEX "units_of_measure_active_name_idx" ON "units_of_measure"("active", "name");

CREATE TABLE "specification_attribute_definitions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "itemCategoryId" UUID NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(150) NOT NULL,
  "description" VARCHAR(500) NOT NULL DEFAULT '',
  "dataType" "SpecificationDataType" NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "unitOfMeasureId" UUID,
  "decimalPrecision" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "specification_attribute_definitions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "specification_attribute_definitions_itemCategoryId_fkey" FOREIGN KEY ("itemCategoryId") REFERENCES "item_categories"("id") ON DELETE RESTRICT,
  CONSTRAINT "specification_attribute_definitions_unitOfMeasureId_fkey" FOREIGN KEY ("unitOfMeasureId") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT,
  CONSTRAINT "specification_attribute_definitions_shape_check" CHECK (
    ("dataType" = 'NUMBER' AND "decimalPrecision" BETWEEN 0 AND 6)
    OR
    ("dataType" IN ('TEXT', 'BOOLEAN') AND "unitOfMeasureId" IS NULL AND "decimalPrecision" IS NULL)
  ),
  CONSTRAINT "specification_attribute_definitions_sort_order_check" CHECK ("sortOrder" BETWEEN 0 AND 10000),
  CONSTRAINT "specification_attribute_definitions_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "specification_attribute_definitions_itemCategoryId_code_key" ON "specification_attribute_definitions"("itemCategoryId", "code");
CREATE INDEX "specification_attribute_definitions_itemCategoryId_active_sortOrder_idx" ON "specification_attribute_definitions"("itemCategoryId", "active", "sortOrder");
CREATE INDEX "specification_attribute_definitions_unitOfMeasureId_idx" ON "specification_attribute_definitions"("unitOfMeasureId");

CREATE TABLE "items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "description" VARCHAR(2000) NOT NULL DEFAULT '',
  "itemCategoryId" UUID NOT NULL,
  "unitOfMeasureId" UUID NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "items_itemCategoryId_fkey" FOREIGN KEY ("itemCategoryId") REFERENCES "item_categories"("id") ON DELETE RESTRICT,
  CONSTRAINT "items_unitOfMeasureId_fkey" FOREIGN KEY ("unitOfMeasureId") REFERENCES "units_of_measure"("id") ON DELETE RESTRICT,
  CONSTRAINT "items_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT,
  CONSTRAINT "items_version_check" CHECK ("version" >= 1)
);
CREATE UNIQUE INDEX "items_code_key" ON "items"("code");
CREATE INDEX "items_active_code_idx" ON "items"("active", "code");
CREATE INDEX "items_itemCategoryId_active_idx" ON "items"("itemCategoryId", "active");
CREATE INDEX "items_unitOfMeasureId_active_idx" ON "items"("unitOfMeasureId", "active");

CREATE TABLE "item_specification_values" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "itemId" UUID NOT NULL,
  "attributeDefinitionId" UUID NOT NULL,
  "textValue" VARCHAR(1000),
  "numericValue" DECIMAL(30,6),
  "booleanValue" BOOLEAN,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "item_specification_values_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "item_specification_values_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT,
  CONSTRAINT "item_specification_values_attributeDefinitionId_fkey" FOREIGN KEY ("attributeDefinitionId") REFERENCES "specification_attribute_definitions"("id") ON DELETE RESTRICT,
  CONSTRAINT "item_specification_values_single_value_check" CHECK (num_nonnulls("textValue", "numericValue", "booleanValue") = 1)
);
CREATE UNIQUE INDEX "item_specification_values_itemId_attributeDefinitionId_key" ON "item_specification_values"("itemId", "attributeDefinitionId");
CREATE INDEX "item_specification_values_attributeDefinitionId_idx" ON "item_specification_values"("attributeDefinitionId");

CREATE FUNCTION validate_item_specification_value() RETURNS trigger AS $$
DECLARE
  definition_category_id UUID;
  definition_data_type "SpecificationDataType";
  item_category_id UUID;
BEGIN
  SELECT "itemCategoryId", "dataType"
    INTO definition_category_id, definition_data_type
    FROM "specification_attribute_definitions"
    WHERE "id" = NEW."attributeDefinitionId";
  SELECT "itemCategoryId"
    INTO item_category_id
    FROM "items"
    WHERE "id" = NEW."itemId";

  IF definition_category_id IS NULL OR item_category_id IS NULL OR definition_category_id <> item_category_id THEN
    RAISE EXCEPTION 'item specification definition does not belong to the item category';
  END IF;
  IF definition_data_type = 'TEXT' AND NEW."textValue" IS NULL THEN
    RAISE EXCEPTION 'item specification value type does not match TEXT definition';
  END IF;
  IF definition_data_type = 'NUMBER' AND NEW."numericValue" IS NULL THEN
    RAISE EXCEPTION 'item specification value type does not match NUMBER definition';
  END IF;
  IF definition_data_type = 'BOOLEAN' AND NEW."booleanValue" IS NULL THEN
    RAISE EXCEPTION 'item specification value type does not match BOOLEAN definition';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER item_specification_values_validate_insert BEFORE INSERT ON "item_specification_values" FOR EACH ROW EXECUTE FUNCTION validate_item_specification_value();
CREATE TRIGGER item_specification_values_validate_update BEFORE UPDATE ON "item_specification_values" FOR EACH ROW EXECUTE FUNCTION validate_item_specification_value();

CREATE FUNCTION prevent_item_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'items must be deactivated and cannot be deleted';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER items_no_hard_delete BEFORE DELETE ON "items" FOR EACH ROW EXECUTE FUNCTION prevent_item_delete();
