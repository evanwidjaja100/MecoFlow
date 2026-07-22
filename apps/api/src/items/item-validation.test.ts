import { describe, expect, it } from "vitest";
import { validateSpecificationValues } from "./item-validation.js";

const categoryId = "10000000-0000-4000-8000-000000000001";
const unitId = "20000000-0000-4000-8000-000000000001";

const definitions = [
  {
    active: true,
    code: "MATERIAL",
    dataType: "TEXT" as const,
    decimalPrecision: null,
    id: "30000000-0000-4000-8000-000000000001",
    itemCategoryId: categoryId,
    required: true,
    unitOfMeasureId: null,
  },
  {
    active: true,
    code: "THICKNESS",
    dataType: "NUMBER" as const,
    decimalPrecision: 2,
    id: "30000000-0000-4000-8000-000000000002",
    itemCategoryId: categoryId,
    required: true,
    unitOfMeasureId: unitId,
  },
  {
    active: true,
    code: "COATED",
    dataType: "BOOLEAN" as const,
    decimalPrecision: null,
    id: "30000000-0000-4000-8000-000000000003",
    itemCategoryId: categoryId,
    required: false,
    unitOfMeasureId: null,
  },
];

describe("structured item specification values", () => {
  it("accepts values of the declared types", () => {
    expect(() =>
      validateSpecificationValues(definitions, [
        {
          attributeDefinitionId: definitions[0]!.id,
          value: "ASTM A240 316L",
        },
        { attributeDefinitionId: definitions[1]!.id, value: "12.34" },
        { attributeDefinitionId: definitions[2]!.id, value: true },
      ]),
    ).not.toThrow();
  });

  it("requires every required specification attribute", () => {
    expect(() =>
      validateSpecificationValues(definitions, [
        {
          attributeDefinitionId: definitions[0]!.id,
          value: "ASTM A240 316L",
        },
      ]),
    ).toThrow();
  });

  it.each(["12.345", "12.", "1e3", "not-a-number"])(
    "rejects invalid or over-precision NUMBER value %s",
    (value) => {
      expect(() =>
        validateSpecificationValues(definitions, [
          {
            attributeDefinitionId: definitions[0]!.id,
            value: "ASTM A240 316L",
          },
          { attributeDefinitionId: definitions[1]!.id, value },
        ]),
      ).toThrow();
    },
  );

  it.each([
    { attributeDefinitionId: definitions[0]!.id, value: true },
    { attributeDefinitionId: definitions[1]!.id, value: false },
    { attributeDefinitionId: definitions[2]!.id, value: "true" },
  ])("rejects a value with the wrong declared type", (invalidValue) => {
    const values = [
      {
        attributeDefinitionId: definitions[0]!.id,
        value: "ASTM A240 316L",
      },
      { attributeDefinitionId: definitions[1]!.id, value: "12.34" },
      invalidValue,
    ].filter(
      (value) =>
        value.attributeDefinitionId !== invalidValue.attributeDefinitionId,
    );
    values.push(invalidValue);

    expect(() => validateSpecificationValues(definitions, values)).toThrow();
  });

  it("rejects inactive definitions", () => {
    const inactiveDefinitions = definitions.map((definition, index) =>
      index === 1 ? { ...definition, active: false } : definition,
    );
    expect(() =>
      validateSpecificationValues(inactiveDefinitions, [
        {
          attributeDefinitionId: definitions[0]!.id,
          value: "ASTM A240 316L",
        },
        { attributeDefinitionId: definitions[1]!.id, value: "12.34" },
      ]),
    ).toThrow();
  });

  it("rejects unknown and duplicate definition identifiers", () => {
    expect(() =>
      validateSpecificationValues(definitions, [
        {
          attributeDefinitionId: definitions[0]!.id,
          value: "ASTM A240 316L",
        },
        { attributeDefinitionId: definitions[1]!.id, value: "12.34" },
        {
          attributeDefinitionId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
          value: "unknown",
        },
      ]),
    ).toThrow();

    expect(() =>
      validateSpecificationValues(definitions, [
        {
          attributeDefinitionId: definitions[0]!.id,
          value: "ASTM A240 316L",
        },
        {
          attributeDefinitionId: definitions[0]!.id,
          value: "duplicate",
        },
        { attributeDefinitionId: definitions[1]!.id, value: "12.34" },
      ]),
    ).toThrow();
  });

  it("rejects blank required text", () => {
    expect(() =>
      validateSpecificationValues(definitions, [
        { attributeDefinitionId: definitions[0]!.id, value: "   " },
        { attributeDefinitionId: definitions[1]!.id, value: "12.34" },
      ]),
    ).toThrow();
  });
});
