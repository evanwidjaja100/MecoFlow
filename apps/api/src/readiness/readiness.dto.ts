import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, Matches } from "class-validator";
import {
  READINESS_REASON_CODES,
  READINESS_STATUSES,
} from "@mecoflow/readiness";

class ReadinessProjectDto {
  @ApiProperty({ format: "uuid", type: String })
  id!: string;

  @ApiProperty({ example: "DEMO-2026", type: String })
  code!: string;

  @ApiProperty({ example: "Demo process equipment project", type: String })
  name!: string;
}

class ReadinessWorkPackageDto {
  @ApiProperty({ format: "uuid", type: String })
  id!: string;

  @ApiProperty({ example: "WP-01", type: String })
  code!: string;

  @ApiProperty({ example: "Fabrication", type: String })
  name!: string;
}

class ReadinessBlockerDto {
  @ApiProperty({ format: "uuid", nullable: true, type: String })
  bomLineId!: string | null;

  @ApiProperty({ example: "CERTIFICATE_INCOMPLETE", type: String })
  code!: string;

  @ApiProperty({ type: String })
  explanation!: string;
}

class ReadinessRecommendedActionDto {
  @ApiProperty({ format: "uuid", nullable: true, type: String })
  bomLineId!: string | null;

  @ApiProperty({ example: "COMPLETE_CERTIFICATE_REVIEW", type: String })
  code!: string;

  @ApiProperty({ type: String })
  action!: string;
}

export class ReadinessSnapshotDto {
  @ApiProperty({ format: "uuid", type: String })
  id!: string;

  @ApiProperty({ format: "uuid", type: String })
  batchId!: string;

  @ApiProperty({ type: () => ReadinessProjectDto })
  project!: ReadinessProjectDto;

  @ApiProperty({ nullable: true, type: () => ReadinessWorkPackageDto })
  workPackage!: ReadinessWorkPackageDto | null;

  @ApiProperty({ enum: ["PROJECT", "WORK_PACKAGE"], type: String })
  scopeType!: "PROJECT" | "WORK_PACKAGE";

  @ApiProperty({ enum: READINESS_STATUSES, type: String })
  status!: (typeof READINESS_STATUSES)[number];

  @ApiProperty({ maximum: 100, minimum: 0, type: Number })
  score!: number;

  @ApiProperty({ type: Number })
  lineCount!: number;

  @ApiProperty({ type: Number })
  criticalLineCount!: number;

  @ApiProperty({ type: Number })
  readyCriticalLineCount!: number;

  @ApiProperty({ type: Number })
  blockerCount!: number;

  @ApiProperty({ isArray: true, type: () => ReadinessBlockerDto })
  blockers!: ReadinessBlockerDto[];

  @ApiProperty({ enum: READINESS_REASON_CODES, isArray: true, type: String })
  reasonCodes!: Array<(typeof READINESS_REASON_CODES)[number]>;

  @ApiProperty({ isArray: true, type: () => ReadinessRecommendedActionDto })
  recommendedActions!: ReadinessRecommendedActionDto[];

  @ApiProperty({ type: String })
  explanation!: string;

  @ApiProperty({ example: "readiness-calculator-v1", type: String })
  calculatorVersion!: string;

  @ApiProperty({ example: "readiness-rules-v1", type: String })
  ruleVersion!: string;

  @ApiProperty({ example: "material-requirement-status-v1", type: String })
  materialProjectionVersion!: string;

  @ApiProperty({ example: "2026-07-22", type: String })
  calculationDate!: string;

  @ApiProperty({ format: "date-time", type: String })
  calculatedAt!: string;

  @ApiProperty({ enum: ["EVENT", "SCHEDULED"], type: String })
  trigger!: "EVENT" | "SCHEDULED";

  @ApiProperty({ example: "a".repeat(64), type: String })
  inputHash!: string;
}

export class ReadinessManagementResponseDto {
  @ApiProperty({ isArray: true, type: () => ReadinessSnapshotDto })
  data!: ReadinessSnapshotDto[];

  @ApiProperty({
    example: { page: 1, pageSize: 20, total: 42, totalPages: 3 },
    type: Object,
  })
  pagination!: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export class ListReadinessManagementQueryDto {
  @ApiPropertyOptional({ example: "1", type: String })
  @IsOptional()
  @Matches(/^\d{1,6}$/)
  page?: string;

  @ApiPropertyOptional({ example: "20", type: String })
  @IsOptional()
  @Matches(/^\d{1,3}$/)
  pageSize?: string;
}

export class ReadinessOverviewResponseDto {
  @ApiProperty({ nullable: true, type: () => ReadinessSnapshotDto })
  latest!: ReadinessSnapshotDto | null;

  @ApiProperty({ isArray: true, type: () => ReadinessSnapshotDto })
  workPackages!: ReadinessSnapshotDto[];
}

class ReadinessMaterialLineDto {
  @ApiProperty({ format: "uuid", type: String })
  bomLineId!: string;

  @ApiProperty({ type: Number })
  lineNumber!: number;

  @ApiProperty({ type: String })
  itemCode!: string;

  @ApiProperty({ type: String })
  itemName!: string;

  @ApiProperty({ type: String })
  criticality!: string;

  @ApiProperty({ type: String })
  currentStage!: string;

  @ApiProperty({ nullable: true, type: String })
  blockerReason!: string | null;

  @ApiProperty({ type: String })
  requiredQuantity!: string;

  @ApiProperty({ type: String })
  requisitionedQuantity!: string;

  @ApiProperty({ type: String })
  orderedQuantity!: string;

  @ApiProperty({ type: String })
  confirmedQuantity!: string;

  @ApiProperty({ type: String })
  shippedQuantity!: string;

  @ApiProperty({ type: String })
  receivedQuantity!: string;

  @ApiProperty({ type: String })
  acceptedQuantity!: string;

  @ApiProperty({ type: String })
  allocatedQuantity!: string;

  @ApiProperty({ type: String })
  certificateCompleteQuantity!: string;

  @ApiProperty({ type: String })
  shortage!: string;

  @ApiProperty({ type: String })
  requiredDate!: string;

  @ApiProperty({ nullable: true, type: String })
  operativeCommitmentDate!: string | null;

  @ApiProperty({ nullable: true, type: String })
  workPackageCode!: string | null;

  @ApiProperty({ format: "uuid", nullable: true, type: String })
  workPackageId!: string | null;

  @ApiProperty({ nullable: true, type: String })
  workPackageName!: string | null;

  @ApiProperty({ type: String })
  unitCode!: string;

  @ApiProperty({ type: String })
  unitSymbol!: string;

  @ApiProperty({ type: Number })
  openNcrCount!: number;

  @ApiProperty({ type: Boolean })
  certificateRequired!: boolean;
}

class ReadinessLineExplanationDto {
  @ApiProperty({ format: "uuid", type: String })
  bomLineId!: string;

  @ApiProperty({ type: String })
  criticality!: string;

  @ApiProperty({ type: String })
  currentStage!: string;

  @ApiProperty({ type: String })
  itemCode!: string;

  @ApiProperty({ type: Number })
  lineNumber!: number;

  @ApiProperty({ isArray: true, type: String })
  blockerCodes!: string[];

  @ApiProperty({ enum: READINESS_REASON_CODES, isArray: true, type: String })
  reasonCodes!: string[];

  @ApiProperty({ type: Number })
  stageScore!: number;

  @ApiProperty({ type: Number })
  weightedPoints!: number;
}

export class ReadinessMaterialsResponseDto {
  @ApiProperty({ nullable: true, type: () => ReadinessSnapshotDto })
  latest!: ReadinessSnapshotDto | null;

  @ApiProperty({ isArray: true, type: () => ReadinessMaterialLineDto })
  lines!: ReadinessMaterialLineDto[];

  @ApiProperty({ isArray: true, type: () => ReadinessLineExplanationDto })
  lineExplanations!: ReadinessLineExplanationDto[];
}

export class ReadinessHistoryResponseDto {
  @ApiProperty({ isArray: true, type: () => ReadinessSnapshotDto })
  data!: ReadinessSnapshotDto[];
}
