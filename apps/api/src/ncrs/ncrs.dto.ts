import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from "class-validator";

const sources = {
  INVENTORY_LOT: "INVENTORY_LOT",
  PROJECT: "PROJECT",
  RECEIVING_INSPECTION: "RECEIVING_INSPECTION",
} as const;

const statuses = {
  CANCELLED: "CANCELLED",
  CLOSED: "CLOSED",
  DRAFT: "DRAFT",
  ISSUED: "ISSUED",
  SUPPLIER_RESPONDED: "SUPPLIER_RESPONDED",
} as const;

export class NcrListQueryDto {
  @ApiPropertyOptional({ enum: statuses, type: String })
  @IsOptional()
  @IsEnum(statuses)
  status?: keyof typeof statuses;
}

export class CreateNcrDto {
  @ApiProperty({ enum: sources, type: String })
  @IsEnum(sources)
  sourceType!: keyof typeof sources;

  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  receivingInspectionId?: string;

  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  inventoryLotId?: string;

  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  supplierOrganizationId?: string;

  @ApiProperty({ maxLength: 200, minLength: 3, type: String })
  @IsString()
  @Length(3, 200)
  title!: string;

  @ApiProperty({ maxLength: 4000, minLength: 5, type: String })
  @IsString()
  @Length(5, 4000)
  description!: string;

  @ApiPropertyOptional({ maxLength: 4000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  internalDispositionNotes?: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  shareInternalNotes!: boolean;
}

export class NcrCommandDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ maxLength: 500, minLength: 5, type: String })
  @IsString()
  @Length(5, 500)
  reason!: string;
}

export class CloseNcrDto extends NcrCommandDto {
  @ApiProperty({ maxLength: 4000, minLength: 5, type: String })
  @IsString()
  @Length(5, 4000)
  internalDispositionNotes!: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  shareInternalNotes!: boolean;
}

export class SubmitNcrResponseDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ maxLength: 4000, minLength: 5, type: String })
  @IsString()
  @Length(5, 4000)
  message!: string;

  @ApiPropertyOptional({ maxLength: 4000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  rootCause?: string;

  @ApiPropertyOptional({ maxLength: 4000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  correctiveAction?: string;
}
