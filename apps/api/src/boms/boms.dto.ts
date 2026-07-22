import {
  Equals,
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
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const mimeTypes = {
  "application/csv": "application/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv": "text/csv",
  "text/plain": "text/plain",
} as const;
const criticalities = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  LOW: "LOW",
  NORMAL: "NORMAL",
} as const;

export class CreateBomImportDto {
  @ApiProperty({
    description: "Base64 file body; decoded size is limited to 5 MiB",
    type: String,
  })
  @IsString()
  @MaxLength(7_100_000)
  @Matches(/^[A-Za-z0-9+/]*={0,2}$/)
  contentBase64!: string;

  @ApiProperty({ maxLength: 255, type: String })
  @IsString()
  @Length(1, 255)
  fileName!: string;

  @ApiProperty({ enum: mimeTypes, type: String })
  @IsEnum(mimeTypes)
  mimeType!: keyof typeof mimeTypes;

  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  workPackageId?: string;
}

export class ConfirmBomImportDto {
  @ApiProperty({
    type: Boolean,
    description: "Must be true to create a draft revision",
  })
  @IsBoolean()
  @Equals(true)
  confirmed!: true;

  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ maxLength: 200, minLength: 2, type: String })
  @IsString()
  @Length(2, 200)
  title!: string;

  @ApiPropertyOptional({ maxLength: 2000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class BomRevisionCommandDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ maxLength: 500, minLength: 5, type: String })
  @IsString()
  @Length(5, 500)
  reason!: string;
}

export class UpdateBomLineDto {
  @ApiProperty({ enum: criticalities, type: String })
  @IsEnum(criticalities)
  criticality!: keyof typeof criticalities;

  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ maxLength: 1000, type: String })
  @IsString()
  @MaxLength(1000)
  notes!: string;

  @ApiProperty({ example: "12.500", type: String })
  @IsString()
  @Matches(/^\d+(?:\.\d{1,6})?$/)
  quantity!: string;

  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  unitOfMeasureId!: string;
}

export class BomComparisonQueryDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  fromRevisionId!: string;

  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  toRevisionId!: string;
}
