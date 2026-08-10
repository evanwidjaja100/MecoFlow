import { ApiProperty } from "@nestjs/swagger";
import {
  MATERIAL_REQUIREMENT_BLOCKERS,
  MATERIAL_REQUIREMENT_STAGES,
} from "./material-requirement-status.js";

class RequirementStatusItemDto {
  @ApiProperty({ format: "uuid", type: String })
  id!: string;

  @ApiProperty({ example: "PLATE-304", type: String })
  code!: string;

  @ApiProperty({ example: "Stainless steel plate", type: String })
  name!: string;
}

class RequirementStatusUnitDto {
  @ApiProperty({ format: "uuid", type: String })
  id!: string;

  @ApiProperty({ example: "EA", type: String })
  code!: string;

  @ApiProperty({ example: "Each", type: String })
  name!: string;

  @ApiProperty({ example: "ea", type: String })
  symbol!: string;

  @ApiProperty({ maximum: 6, minimum: 0, type: Number })
  decimalPrecision!: number;
}

class RequirementStatusWorkPackageDto {
  @ApiProperty({ format: "uuid", type: String })
  id!: string;

  @ApiProperty({ example: "WP-01", type: String })
  code!: string;

  @ApiProperty({ example: "Fabrication", type: String })
  name!: string;
}

export class MaterialRequirementStatusLineDto {
  @ApiProperty({ format: "uuid", type: String })
  bomLineId!: string;

  @ApiProperty({ format: "uuid", type: String })
  bomId!: string;

  @ApiProperty({ format: "uuid", type: String })
  bomRevisionId!: string;

  @ApiProperty({ minimum: 1, type: Number })
  bomRevisionNumber!: number;

  @ApiProperty({ minimum: 1, type: Number })
  lineNumber!: number;

  @ApiProperty({ enum: ["CRITICAL", "HIGH", "NORMAL", "LOW"], type: String })
  criticality!: "CRITICAL" | "HIGH" | "LOW" | "NORMAL";

  @ApiProperty({ type: () => RequirementStatusItemDto })
  item!: RequirementStatusItemDto;

  @ApiProperty({ type: () => RequirementStatusUnitDto })
  unitOfMeasure!: RequirementStatusUnitDto;

  @ApiProperty({
    nullable: true,
    type: () => RequirementStatusWorkPackageDto,
  })
  workPackage!: RequirementStatusWorkPackageDto | null;

  @ApiProperty({ example: "10.5", type: String })
  requiredQuantity!: string;

  @ApiProperty({ example: "10.5", type: String })
  requisitionedQuantity!: string;

  @ApiProperty({ example: "10.5", type: String })
  orderedQuantity!: string;

  @ApiProperty({ example: "10.5", type: String })
  confirmedQuantity!: string;

  @ApiProperty({ example: "8", type: String })
  shippedQuantity!: string;

  @ApiProperty({ example: "6", type: String })
  receivedQuantity!: string;

  @ApiProperty({ example: "5", type: String })
  acceptedQuantity!: string;

  @ApiProperty({ example: "3", type: String })
  allocatedQuantity!: string;

  @ApiProperty({ example: "5", type: String })
  certificateCompleteQuantity!: string;

  @ApiProperty({ example: "7.5", type: String })
  shortage!: string;

  @ApiProperty({ example: "2026-08-31", nullable: true, type: String })
  operativeCommitmentDate!: string | null;

  @ApiProperty({ enum: MATERIAL_REQUIREMENT_STAGES, type: String })
  currentStage!: (typeof MATERIAL_REQUIREMENT_STAGES)[number];

  @ApiProperty({
    enum: MATERIAL_REQUIREMENT_BLOCKERS,
    nullable: true,
    type: String,
  })
  blockerReason!: (typeof MATERIAL_REQUIREMENT_BLOCKERS)[number] | null;
}

export class MaterialRequirementStatusResponseDto {
  @ApiProperty({
    example: "material-requirement-status-v1",
    type: String,
  })
  modelVersion!: string;

  @ApiProperty({ isArray: true, type: () => MaterialRequirementStatusLineDto })
  data!: MaterialRequirementStatusLineDto[];
}
