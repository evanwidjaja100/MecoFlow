import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
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

const statuses = {
  ACKNOWLEDGED: "ACKNOWLEDGED",
  CANCELLED: "CANCELLED",
  DRAFT: "DRAFT",
  SENT: "SENT",
} as const;

export class PurchaseOrderAllocationDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  purchaseRequisitionLineId!: string;

  @ApiProperty({ example: "4.000", type: String })
  @IsString()
  @Matches(/^(?:0|[1-9]\d{0,23})(?:\.\d{1,6})?$/)
  quantity!: string;

  @ApiPropertyOptional({ maxLength: 500, minLength: 5, type: String })
  @IsOptional()
  @IsString()
  @Length(5, 500)
  overrideReason?: string;
}

export class PurchaseOrderLineDto {
  @ApiProperty({ example: "4.000", type: String })
  @IsString()
  @Matches(/^(?:0|[1-9]\d{0,23})(?:\.\d{1,6})?$/)
  orderedQuantity!: string;

  @ApiPropertyOptional({ example: "125000.00", type: String })
  @IsOptional()
  @IsString()
  @Matches(/^(?:0|[1-9]\d{0,23})(?:\.\d{1,2})?$/)
  internalUnitPrice?: string;

  @ApiPropertyOptional({ maxLength: 1000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  internalLineNotes?: string;

  @ApiProperty({ type: [PurchaseOrderAllocationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderAllocationDto)
  allocations!: PurchaseOrderAllocationDto[];
}

export class PurchaseOrderRevisionContentDto {
  @ApiProperty({ maxLength: 200, minLength: 2, type: String })
  @IsString()
  @Length(2, 200)
  title!: string;

  @ApiPropertyOptional({ maxLength: 2000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  supplierMessage?: string;

  @ApiPropertyOptional({ maxLength: 4000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  internalCommercialTerms?: string;

  @ApiPropertyOptional({ maxLength: 2000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNotes?: string;

  @ApiProperty({ maxLength: 500, minLength: 5, type: String })
  @IsString()
  @Length(5, 500)
  revisionReason!: string;

  @ApiProperty({ type: [PurchaseOrderLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  lines!: PurchaseOrderLineDto[];
}

export class CreatePurchaseOrderDto extends PurchaseOrderRevisionContentDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  supplierOrganizationId!: string;
}

export class RevisePurchaseOrderDto extends PurchaseOrderRevisionContentDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class PurchaseOrderCommandDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ maxLength: 500, minLength: 5, type: String })
  @IsString()
  @Length(5, 500)
  reason!: string;
}

export class PurchaseOrderListQueryDto {
  @ApiPropertyOptional({ enum: statuses, type: String })
  @IsOptional()
  @IsEnum(statuses)
  status?: keyof typeof statuses;
}

export class SupplierCommitmentLineDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  purchaseOrderLineId!: string;

  @ApiProperty({ example: "2026-08-01", format: "date", type: String })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  committedDate!: string;
}

export class CreateSupplierCommitmentDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiPropertyOptional({ maxLength: 1000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ApiProperty({ type: [SupplierCommitmentLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => SupplierCommitmentLineDto)
  lines!: SupplierCommitmentLineDto[];
}
