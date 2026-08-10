import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const decimalQuantity = /^-?(?:0|[1-9]\d{0,23})(?:\.\d{1,6})?$/;
const unsignedQuantity = /^(?:0|[1-9]\d{0,23})(?:\.\d{1,6})?$/;

const checkTypes = {
  CERTIFICATE: "CERTIFICATE",
  CHECKLIST: "CHECKLIST",
  MEASUREMENT: "MEASUREMENT",
} as const;

const certificateDecisions = {
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
} as const;

const dispositions = {
  ACCEPTED: "ACCEPTED",
  CONDITIONALLY_ACCEPTED: "CONDITIONALLY_ACCEPTED",
  QUARANTINED: "QUARANTINED",
  REJECTED: "REJECTED",
} as const;

const inspectionStatuses = {
  FINALIZED: "FINALIZED",
  OPEN: "OPEN",
} as const;

export class InspectionDefinitionQueryDto {
  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  itemId?: string;
}

export class InspectionQueueQueryDto {
  @ApiPropertyOptional({ enum: inspectionStatuses, type: String })
  @IsOptional()
  @IsEnum(inspectionStatuses)
  status?: keyof typeof inspectionStatuses;
}

export class InspectionCheckDefinitionDto {
  @ApiProperty({ enum: checkTypes, type: String })
  @IsEnum(checkTypes)
  checkType!: keyof typeof checkTypes;

  @ApiProperty({ maxLength: 50, minLength: 1, type: String })
  @IsString()
  @Matches(/^[A-Za-z0-9][A-Za-z0-9._-]{0,49}$/)
  code!: string;

  @ApiProperty({ maxLength: 200, minLength: 2, type: String })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional({ maxLength: 1000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

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
  decimalPrecision?: number;

  @ApiPropertyOptional({ example: "0.000", type: String })
  @IsOptional()
  @IsString()
  @Matches(decimalQuantity)
  minimumValue?: string;

  @ApiPropertyOptional({ example: "10.000", type: String })
  @IsOptional()
  @IsString()
  @Matches(decimalQuantity)
  maximumValue?: string;
}

export class UpdateInspectionCheckDefinitionDto extends InspectionCheckDefinitionDto {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  active!: boolean;

  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class InspectionResultDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  checkId!: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  checklistPassed?: boolean;

  @ApiPropertyOptional({ example: "4.250", type: String })
  @IsOptional()
  @IsString()
  @Matches(decimalQuantity)
  measuredValue?: string;

  @ApiPropertyOptional({ enum: certificateDecisions, type: String })
  @IsOptional()
  @IsEnum(certificateDecisions)
  certificateDecision?: keyof typeof certificateDecisions;

  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  evidenceDocumentId?: string;

  @ApiPropertyOptional({ maxLength: 1000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class SaveInspectionResultsDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ type: [InspectionResultDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => InspectionResultDto)
  results!: InspectionResultDto[];
}

export class FinalizeInspectionDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ enum: dispositions, type: String })
  @IsEnum(dispositions)
  disposition!: keyof typeof dispositions;

  @ApiProperty({ example: "5.000", type: String })
  @IsString()
  @Matches(unsignedQuantity)
  acceptedQuantity!: string;

  @ApiProperty({ example: "0.000", type: String })
  @IsString()
  @Matches(unsignedQuantity)
  rejectedQuantity!: string;

  @ApiProperty({ maxLength: 500, minLength: 5, type: String })
  @IsString()
  @Length(5, 500)
  reason!: string;
}
