import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
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

const positiveQuantity = /^(?:0|[1-9]\d{0,23})(?:\.\d{1,6})?$/;
const signedQuantity = /^-?(?:0|[1-9]\d{0,23})(?:\.\d{1,6})?$/;

export class AdvanceShipmentNoticeLineDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  purchaseOrderLineId!: string;

  @ApiProperty({ example: "4.000", type: String })
  @IsString()
  @Matches(positiveQuantity)
  shippedQuantity!: string;

  @ApiPropertyOptional({ maxLength: 200, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  packageReference?: string;
}

export class CreateAdvanceShipmentNoticeDto {
  @ApiProperty({ maxLength: 100, minLength: 1, type: String })
  @IsString()
  @Length(1, 100)
  supplierReference!: string;

  @ApiPropertyOptional({ maxLength: 200, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  carrier?: string;

  @ApiPropertyOptional({ maxLength: 200, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  trackingNumber?: string;

  @ApiPropertyOptional({ example: "2026-08-20", format: "date", type: String })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  estimatedArrivalDate?: string;

  @ApiPropertyOptional({ maxLength: 2000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({ type: [AdvanceShipmentNoticeLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => AdvanceShipmentNoticeLineDto)
  lines!: AdvanceShipmentNoticeLineDto[];
}

export class ShipmentCommandDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ maxLength: 500, minLength: 5, type: String })
  @IsString()
  @Length(5, 500)
  reason!: string;
}

export class GoodsReceiptLineDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  advanceShipmentNoticeLineId!: string;

  @ApiProperty({ example: "4.000", type: String })
  @IsString()
  @Matches(positiveQuantity)
  receivedQuantity!: string;

  @ApiPropertyOptional({ maxLength: 200, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  heatNumber?: string;

  @ApiPropertyOptional({ maxLength: 200, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  batchNumber?: string;

  @ApiPropertyOptional({ maxLength: 200, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  manufacturer?: string;

  @ApiPropertyOptional({ maxLength: 200, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  packageReference?: string;

  @ApiPropertyOptional({ maxLength: 1000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateGoodsReceiptDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  advanceShipmentNoticeId!: string;

  @ApiProperty({ format: "date-time", type: String })
  @IsDateString()
  receivedAt!: string;

  @ApiProperty({ maxLength: 200, minLength: 1, type: String })
  @IsString()
  @Length(1, 200)
  warehouseLocation!: string;

  @ApiPropertyOptional({ maxLength: 2000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({ type: [GoodsReceiptLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptLineDto)
  lines!: GoodsReceiptLineDto[];
}

export class GoodsReceiptCorrectionLineDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  goodsReceiptLineId!: string;

  @ApiProperty({ example: "-1.000", type: String })
  @IsString()
  @Matches(signedQuantity)
  quantityDelta!: string;

  @ApiPropertyOptional({ maxLength: 200, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  heatNumber?: string;

  @ApiPropertyOptional({ maxLength: 200, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  batchNumber?: string;

  @ApiPropertyOptional({ maxLength: 200, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  manufacturer?: string;

  @ApiPropertyOptional({ maxLength: 200, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  packageReference?: string;

  @ApiPropertyOptional({ maxLength: 1000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateGoodsReceiptCorrectionDto {
  @ApiProperty({ maxLength: 500, minLength: 5, type: String })
  @IsString()
  @Length(5, 500)
  reason!: string;

  @ApiProperty({ format: "date-time", type: String })
  @IsDateString()
  receivedAt!: string;

  @ApiProperty({ maxLength: 200, minLength: 1, type: String })
  @IsString()
  @Length(1, 200)
  warehouseLocation!: string;

  @ApiPropertyOptional({ maxLength: 2000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({ type: [GoodsReceiptCorrectionLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptCorrectionLineDto)
  lines!: GoodsReceiptCorrectionLineDto[];
}

export class PostGoodsReceiptDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}
