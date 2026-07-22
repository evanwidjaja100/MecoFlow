import { UnprocessableEntityException } from "@nestjs/common";

export type SpecificationDataType = "TEXT" | "NUMBER" | "BOOLEAN";

export interface SpecificationDefinitionForValidation {
  active: boolean;
  dataType: SpecificationDataType;
  decimalPrecision: number | null;
  id: string;
  itemCategoryId: string;
  required: boolean;
}

export interface SpecificationValueInput {
  attributeDefinitionId: string;
  value: boolean | string;
}

export interface ValidatedSpecificationValue {
  attributeDefinitionId: string;
  booleanValue?: boolean;
  numericValue?: string;
  textValue?: string;
}

const decimalPattern = /^-?(?:0|[1-9]\d{0,23})(?:\.\d{1,6})?$/;

function invalid(message = "Invalid specification values"): never {
  throw new UnprocessableEntityException(message);
}

export function isDecimalPrecision(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}

export function validateSpecificationDefinition(input: {
  dataType: SpecificationDataType;
  decimalPrecision?: number;
  unitDecimalPrecision?: number;
  unitOfMeasureId?: string;
}): void {
  if (input.dataType !== "NUMBER") {
    if (
      input.decimalPrecision !== undefined ||
      input.unitOfMeasureId !== undefined
    )
      invalid("Text and boolean attributes cannot define a unit or precision");
    return;
  }
  if (
    input.decimalPrecision === undefined ||
    !isDecimalPrecision(input.decimalPrecision)
  )
    invalid("Numeric attributes require decimal precision from 0 to 6");
  if (
    input.unitDecimalPrecision !== undefined &&
    input.decimalPrecision > input.unitDecimalPrecision
  )
    invalid("Attribute precision exceeds its unit precision");
}

export function validateSpecificationValues(
  definitions: readonly SpecificationDefinitionForValidation[],
  values: readonly SpecificationValueInput[],
): ValidatedSpecificationValue[] {
  const activeDefinitions = new Map(
    definitions
      .filter(({ active }) => active)
      .map((definition) => [definition.id, definition]),
  );
  const seen = new Set<string>();
  const validated = values.map((input): ValidatedSpecificationValue => {
    if (seen.has(input.attributeDefinitionId))
      invalid("Duplicate specification attribute");
    seen.add(input.attributeDefinitionId);
    const definition = activeDefinitions.get(input.attributeDefinitionId);
    if (!definition) invalid("Specification attribute is unavailable");

    if (definition.dataType === "BOOLEAN") {
      if (typeof input.value !== "boolean")
        invalid("Boolean specification value expected");
      return {
        attributeDefinitionId: definition.id,
        booleanValue: input.value,
      };
    }
    if (typeof input.value !== "string")
      invalid("Text specification value expected");
    const value = input.value.trim();
    if (!value) invalid("Specification values cannot be empty");

    if (definition.dataType === "TEXT") {
      if (value.length > 1000) invalid("Specification value is too long");
      return { attributeDefinitionId: definition.id, textValue: value };
    }

    if (!decimalPattern.test(value))
      invalid("Numeric specification value is invalid");
    const precision = value.includes(".") ? value.split(".")[1]!.length : 0;
    if (
      definition.decimalPrecision === null ||
      precision > definition.decimalPrecision
    )
      invalid("Numeric specification value exceeds decimal precision");
    return { attributeDefinitionId: definition.id, numericValue: value };
  });

  const missingRequired = definitions.some(
    ({ active, id, required }) => active && required && !seen.has(id),
  );
  if (missingRequired) invalid("Required specification value is missing");
  return validated;
}
