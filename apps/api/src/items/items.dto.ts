import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const codePattern = /^[A-Z0-9][A-Z0-9._-]*$/;
const specificationDataTypes = {
  BOOLEAN: "BOOLEAN",
  NUMBER: "NUMBER",
  TEXT: "TEXT",
} as const;
const itemSortFields = {
  code: "code",
  name: "name",
  updatedAt: "updatedAt",
} as const;
const sortDirections = { asc: "asc", desc: "desc" } as const;
const activeValues = { false: "false", true: "true" } as const;

export class CreateItemCategoryDto {
  @ApiProperty({ example: "RAW-MATERIAL", maxLength: 50, type: String })
  @IsString()
  @Length(2, 50)
  @Matches(codePattern)
  code!: string;

  @ApiProperty({ maxLength: 150, type: String })
  @IsString()
  @Length(2, 150)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateItemCategoryDto extends CreateItemCategoryDto {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  active!: boolean;

  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class CreateUnitOfMeasureDto {
  @ApiProperty({ example: "MM", maxLength: 30, type: String })
  @IsString()
  @Length(1, 30)
  @Matches(codePattern)
  code!: string;

  @ApiProperty({ maxLength: 100, type: String })
  @IsString()
  @Length(2, 100)
  name!: string;

  @ApiProperty({ maxLength: 20, type: String })
  @IsString()
  @Length(1, 20)
  symbol!: string;

  @ApiProperty({ maximum: 6, minimum: 0, type: Number })
  @IsInt()
  @Min(0)
  @Max(6)
  decimalPrecision!: number;
}

export class UpdateUnitOfMeasureDto extends CreateUnitOfMeasureDto {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  active!: boolean;

  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class SpecificationAttributeDetailsDto {
  @ApiProperty({ example: "THICKNESS", maxLength: 50, type: String })
  @IsString()
  @Length(1, 50)
  @Matches(codePattern)
  code!: string;

  @ApiProperty({ maxLength: 150, type: String })
  @IsString()
  @Length(2, 150)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: specificationDataTypes, type: String })
  @IsEnum(specificationDataTypes)
  dataType!: keyof typeof specificationDataTypes;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  required!: boolean;

  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  unitOfMeasureId?: string;

  @ApiPropertyOptional({ maximum: 6, minimum: 0, type: Number })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  decimalPrecision?: number;

  @ApiProperty({ maximum: 10000, minimum: 0, type: Number })
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder!: number;
}

export class CreateSpecificationAttributeDto extends SpecificationAttributeDetailsDto {}

export class UpdateSpecificationAttributeDto extends SpecificationAttributeDetailsDto {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  active!: boolean;

  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class SpecificationValueDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  attributeDefinitionId!: string;

  @ApiProperty({
    oneOf: [{ type: "string" }, { type: "boolean" }],
    type: Array,
  })
  @IsDefined()
  value!: boolean | string;
}

export class ItemDetailsDto {
  @ApiProperty({ example: "PLATE-SS304-6MM", maxLength: 50, type: String })
  @IsString()
  @Length(2, 50)
  @Matches(codePattern)
  code!: string;

  @ApiProperty({ maxLength: 200, type: String })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional({ maxLength: 2000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  unitOfMeasureId!: string;

  @ApiProperty({ type: [SpecificationValueDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SpecificationValueDto)
  specificationValues!: SpecificationValueDto[];
}

export class CreateItemDto extends ItemDetailsDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  itemCategoryId!: string;
}

export class UpdateItemDto extends ItemDetailsDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class DeactivateItemDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ maxLength: 500, minLength: 5, type: String })
  @IsString()
  @Length(5, 500)
  reason!: string;
}

export class ItemFiltersQueryDto {
  @ApiPropertyOptional({ enum: activeValues, type: String })
  @IsOptional()
  @IsEnum(activeValues)
  active?: "false" | "true";

  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ maxLength: 100, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  unitOfMeasureId?: string;

  @ApiPropertyOptional({ enum: itemSortFields, type: String })
  @IsOptional()
  @IsEnum(itemSortFields)
  sort?: keyof typeof itemSortFields;

  @ApiPropertyOptional({ enum: sortDirections, type: String })
  @IsOptional()
  @IsEnum(sortDirections)
  direction?: "asc" | "desc";
}

export class ListItemsQueryDto extends ItemFiltersQueryDto {
  @ApiPropertyOptional({ example: "1", type: String })
  @IsOptional()
  @Matches(/^\d{1,6}$/)
  page?: string;

  @ApiPropertyOptional({ example: "20", type: String })
  @IsOptional()
  @Matches(/^\d{1,3}$/)
  pageSize?: string;
}

export class ExportItemsQueryDto extends ItemFiltersQueryDto {}
