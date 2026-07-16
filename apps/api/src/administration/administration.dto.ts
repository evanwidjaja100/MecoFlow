import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  Min,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

const organizationTypes = {
  INTERNAL: "INTERNAL",
  SUPPLIER: "SUPPLIER",
} as const;
const membershipStatuses = { ACTIVE: "ACTIVE", INACTIVE: "INACTIVE" } as const;

export class CreateOrganizationDto {
  @ApiProperty({ example: "SUPPLIER-ABC", maxLength: 50, type: String })
  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Z0-9-]+$/)
  code!: string;

  @ApiProperty({ example: "Supplier ABC", maxLength: 200, type: String })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiProperty({ enum: organizationTypes, type: String })
  @IsEnum(organizationTypes)
  type!: "INTERNAL" | "SUPPLIER";
}

export class CreateMembershipDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  userId!: string;
}

export class UpdateMembershipStatusDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ enum: membershipStatuses, type: String })
  @IsEnum(membershipStatuses)
  status!: "ACTIVE" | "INACTIVE";
}

export class AssignRolesDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ example: ["FINANCE_READONLY"], maxItems: 14, type: [String] })
  @IsArray()
  @ArrayMaxSize(14)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  roleCodes!: string[];
}
