import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
} from "class-validator";

const quantity = /^(?:0|[1-9]\d{0,23})(?:\.\d{1,6})?$/;
const statuses = {
  ALLOCATED: "ALLOCATED",
  CONSUMED: "CONSUMED",
  RELEASED: "RELEASED",
} as const;

export class AllocationListQueryDto {
  @ApiPropertyOptional({ enum: statuses, type: String })
  @IsOptional()
  @IsEnum(statuses)
  status?: keyof typeof statuses;
}

export class CreateMaterialAllocationDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  inventoryLotId!: string;

  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  bomLineId!: string;

  @ApiProperty({ example: "5.000", type: String })
  @IsString()
  @Matches(quantity)
  quantity!: string;

  @ApiPropertyOptional({ maxLength: 500, minLength: 5, type: String })
  @IsOptional()
  @IsString()
  @Length(5, 500)
  conditionalUseReason?: string;
}

export class MaterialAllocationCommandDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ maxLength: 500, minLength: 5, type: String })
  @IsString()
  @Length(5, 500)
  reason!: string;
}
