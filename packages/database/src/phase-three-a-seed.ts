import type { PrismaClient } from "../generated/prisma/client.js";
import { localFixtures, shouldSeedLocalFixtures } from "./phase-one-seed.js";

const phaseThreeAFixtures = {
  demoItemCategoryId: "90000000-0000-4000-8000-000000000001",
  eachUnitId: "90000000-0000-4000-8000-000000000002",
  millimetreUnitId: "90000000-0000-4000-8000-000000000003",
  gradeAttributeId: "90000000-0000-4000-8000-000000000004",
  thicknessAttributeId: "90000000-0000-4000-8000-000000000005",
  demoItemId: "90000000-0000-4000-8000-000000000006",
  gradeValueId: "90000000-0000-4000-8000-000000000007",
  thicknessValueId: "90000000-0000-4000-8000-000000000008",
} as const;

export async function applyPhaseThreeASeed(
  database: PrismaClient,
): Promise<void> {
  if (!shouldSeedLocalFixtures(process.env.APP_ENV)) return;

  await database.$transaction(async (transaction) => {
    await transaction.itemCategory.createMany({
      data: {
        code: "RAW-MATERIAL",
        description: "Fictional local raw-material item category",
        id: phaseThreeAFixtures.demoItemCategoryId,
        name: "Raw material",
      },
      skipDuplicates: true,
    });
    await transaction.itemCategory.updateMany({
      data: {
        active: true,
        description: "Fictional local raw-material item category",
        name: "Raw material",
      },
      where: {
        id: phaseThreeAFixtures.demoItemCategoryId,
        OR: [
          { active: false },
          {
            description: { not: "Fictional local raw-material item category" },
          },
          { name: { not: "Raw material" } },
        ],
      },
    });

    await transaction.unitOfMeasure.createMany({
      data: [
        {
          code: "EA",
          decimalPrecision: 0,
          id: phaseThreeAFixtures.eachUnitId,
          name: "Each",
          symbol: "ea",
        },
        {
          code: "MM",
          decimalPrecision: 3,
          id: phaseThreeAFixtures.millimetreUnitId,
          name: "Millimetre",
          symbol: "mm",
        },
      ],
      skipDuplicates: true,
    });
    await transaction.unitOfMeasure.updateMany({
      data: { active: true, decimalPrecision: 0, name: "Each", symbol: "ea" },
      where: {
        id: phaseThreeAFixtures.eachUnitId,
        OR: [
          { active: false },
          { decimalPrecision: { not: 0 } },
          { name: { not: "Each" } },
          { symbol: { not: "ea" } },
        ],
      },
    });
    await transaction.unitOfMeasure.updateMany({
      data: {
        active: true,
        decimalPrecision: 3,
        name: "Millimetre",
        symbol: "mm",
      },
      where: {
        id: phaseThreeAFixtures.millimetreUnitId,
        OR: [
          { active: false },
          { decimalPrecision: { not: 3 } },
          { name: { not: "Millimetre" } },
          { symbol: { not: "mm" } },
        ],
      },
    });

    await transaction.specificationAttributeDefinition.createMany({
      data: [
        {
          code: "GRADE",
          dataType: "TEXT",
          description: "Material grade or alloy designation",
          id: phaseThreeAFixtures.gradeAttributeId,
          itemCategoryId: phaseThreeAFixtures.demoItemCategoryId,
          name: "Grade",
          required: true,
          sortOrder: 10,
        },
        {
          code: "THICKNESS",
          dataType: "NUMBER",
          decimalPrecision: 3,
          description: "Nominal material thickness",
          id: phaseThreeAFixtures.thicknessAttributeId,
          itemCategoryId: phaseThreeAFixtures.demoItemCategoryId,
          name: "Thickness",
          required: true,
          sortOrder: 20,
          unitOfMeasureId: phaseThreeAFixtures.millimetreUnitId,
        },
      ],
      skipDuplicates: true,
    });
    await transaction.specificationAttributeDefinition.updateMany({
      data: {
        active: true,
        description: "Material grade or alloy designation",
        name: "Grade",
        required: true,
        sortOrder: 10,
      },
      where: {
        id: phaseThreeAFixtures.gradeAttributeId,
        OR: [
          { active: false },
          { description: { not: "Material grade or alloy designation" } },
          { name: { not: "Grade" } },
          { required: false },
          { sortOrder: { not: 10 } },
        ],
      },
    });
    await transaction.specificationAttributeDefinition.updateMany({
      data: {
        active: true,
        decimalPrecision: 3,
        description: "Nominal material thickness",
        name: "Thickness",
        required: true,
        sortOrder: 20,
        unitOfMeasureId: phaseThreeAFixtures.millimetreUnitId,
      },
      where: {
        id: phaseThreeAFixtures.thicknessAttributeId,
        OR: [
          { active: false },
          { decimalPrecision: { not: 3 } },
          { description: { not: "Nominal material thickness" } },
          { name: { not: "Thickness" } },
          { required: false },
          { sortOrder: { not: 20 } },
          { unitOfMeasureId: { not: phaseThreeAFixtures.millimetreUnitId } },
        ],
      },
    });

    await transaction.item.createMany({
      data: {
        code: "PLATE-SS304-6MM",
        createdByUserId: localFixtures.internalAdminUserId,
        description: "Fictional local item-master fixture",
        id: phaseThreeAFixtures.demoItemId,
        itemCategoryId: phaseThreeAFixtures.demoItemCategoryId,
        name: "Stainless steel plate 304, 6 mm",
        unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
      },
      skipDuplicates: true,
    });
    await transaction.item.updateMany({
      data: {
        active: true,
        description: "Fictional local item-master fixture",
        itemCategoryId: phaseThreeAFixtures.demoItemCategoryId,
        name: "Stainless steel plate 304, 6 mm",
        unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
      },
      where: {
        id: phaseThreeAFixtures.demoItemId,
        OR: [
          { active: false },
          { description: { not: "Fictional local item-master fixture" } },
          { itemCategoryId: { not: phaseThreeAFixtures.demoItemCategoryId } },
          { name: { not: "Stainless steel plate 304, 6 mm" } },
          { unitOfMeasureId: { not: phaseThreeAFixtures.eachUnitId } },
        ],
      },
    });
    await transaction.itemSpecificationValue.createMany({
      data: {
        attributeDefinitionId: phaseThreeAFixtures.gradeAttributeId,
        id: phaseThreeAFixtures.gradeValueId,
        itemId: phaseThreeAFixtures.demoItemId,
        textValue: "SS304",
      },
      skipDuplicates: true,
    });
    await transaction.itemSpecificationValue.updateMany({
      data: {
        booleanValue: null,
        numericValue: null,
        textValue: "SS304",
      },
      where: {
        attributeDefinitionId: phaseThreeAFixtures.gradeAttributeId,
        itemId: phaseThreeAFixtures.demoItemId,
        OR: [
          { booleanValue: { not: null } },
          { numericValue: { not: null } },
          { textValue: { not: "SS304" } },
        ],
      },
    });
    await transaction.itemSpecificationValue.createMany({
      data: {
        attributeDefinitionId: phaseThreeAFixtures.thicknessAttributeId,
        id: phaseThreeAFixtures.thicknessValueId,
        itemId: phaseThreeAFixtures.demoItemId,
        numericValue: "6.000",
      },
      skipDuplicates: true,
    });
    await transaction.itemSpecificationValue.updateMany({
      data: {
        booleanValue: null,
        numericValue: "6.000",
        textValue: null,
      },
      where: {
        attributeDefinitionId: phaseThreeAFixtures.thicknessAttributeId,
        itemId: phaseThreeAFixtures.demoItemId,
        OR: [
          { booleanValue: { not: null } },
          { numericValue: { not: "6.000" } },
          { textValue: { not: null } },
        ],
      },
    });

    await transaction.systemMetadata.updateMany({
      data: { value: "phase-3a", version: { increment: 1 } },
      where: { key: "seed.version", NOT: { value: "phase-3a" } },
    });
  });
}

export { phaseThreeAFixtures };
