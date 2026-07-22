import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
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

const associationTypes = {
  ADVANCE_SHIPMENT_NOTICE: "ADVANCE_SHIPMENT_NOTICE",
  BOM: "BOM",
  GOODS_RECEIPT: "GOODS_RECEIPT",
  PROJECT: "PROJECT",
  PURCHASE_ORDER: "PURCHASE_ORDER",
  PURCHASE_REQUISITION: "PURCHASE_REQUISITION",
  WORK_PACKAGE: "WORK_PACKAGE",
} as const;

export class DocumentAssociationDto {
  @ApiProperty({ enum: associationTypes, type: String })
  @IsEnum(associationTypes)
  entityType!: keyof typeof associationTypes;

  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  entityId!: string;
}

export class DocumentUploadMetadataDto {
  @ApiProperty({ maximum: 10485760, minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024)
  byteSize!: number;

  @ApiProperty({ maxLength: 255, type: String })
  @IsString()
  @Length(1, 255)
  fileName!: string;

  @ApiProperty({ maxLength: 150, type: String })
  @IsString()
  @Length(1, 150)
  mimeType!: string;

  @ApiProperty({ pattern: "^[0-9a-f]{64}$", type: String })
  @IsString()
  @Matches(/^[0-9a-f]{64}$/)
  sha256!: string;
}

export class CreateDocumentUploadDto extends DocumentUploadMetadataDto {
  @ApiProperty({ maxLength: 200, minLength: 2, type: String })
  @IsString()
  @Length(2, 200)
  title!: string;

  @ApiProperty({ maxLength: 100, minLength: 2, type: String })
  @IsString()
  @Length(2, 100)
  category!: string;

  @ApiPropertyOptional({ maxLength: 2000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ type: [DocumentAssociationDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => DocumentAssociationDto)
  associations?: DocumentAssociationDto[];
}

export class SupersedeDocumentDto extends DocumentUploadMetadataDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedDocumentVersion!: number;

  @ApiProperty({ maxLength: 500, minLength: 5, type: String })
  @IsString()
  @Length(5, 500)
  reason!: string;
}

export class CompleteDocumentUploadDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class DocumentCommandDto extends CompleteDocumentUploadDto {
  @ApiProperty({ maxLength: 500, minLength: 5, type: String })
  @IsString()
  @Length(5, 500)
  reason!: string;
}
