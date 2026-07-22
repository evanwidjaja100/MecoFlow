import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
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
  APPROVED: "APPROVED",
  CANCELLED: "CANCELLED",
  DRAFT: "DRAFT",
  REJECTED: "REJECTED",
  SUBMITTED: "SUBMITTED",
} as const;

export class CreateRequisitionLineDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  bomLineId!: string;

  @ApiProperty({ example: "12.500", type: String })
  @IsString()
  @Matches(/^(?:0|[1-9]\d{0,23})(?:\.\d{1,6})?$/)
  quantity!: string;

  @ApiPropertyOptional({ maxLength: 500, minLength: 5, type: String })
  @IsOptional()
  @IsString()
  @Length(5, 500)
  overrideReason?: string;
}

export class CreateRequisitionDto {
  @ApiProperty({ maxLength: 200, minLength: 2, type: String })
  @IsString()
  @Length(2, 200)
  title!: string;

  @ApiPropertyOptional({ maxLength: 2000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({ type: [CreateRequisitionLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateRequisitionLineDto)
  lines!: CreateRequisitionLineDto[];
}

export class RequisitionCommandDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ maxLength: 500, minLength: 5, type: String })
  @IsString()
  @Length(5, 500)
  reason!: string;
}

export class RequisitionListQueryDto {
  @ApiPropertyOptional({ enum: statuses, type: String })
  @IsOptional()
  @IsEnum(statuses)
  status?: keyof typeof statuses;
}
