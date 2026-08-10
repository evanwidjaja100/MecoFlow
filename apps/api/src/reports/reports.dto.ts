import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsUUID, Matches, MaxLength } from "class-validator";

export enum ReportFormat {
  CSV = "csv",
  XLSX = "xlsx",
}

export class ReportPeriodQueryDto {
  @ApiProperty({ example: "2026-01-01", type: String })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from!: string;

  @ApiProperty({ example: "2026-06-30", type: String })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to!: string;

  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  projectId?: string;
}

export class ProjectReadinessReportQueryDto extends ReportPeriodQueryDto {
  @ApiPropertyOptional({
    enum: ["RED", "AMBER", "GREEN", "COMPLETE"],
    type: String,
  })
  @IsIn(["RED", "AMBER", "GREEN", "COMPLETE"])
  @IsOptional()
  status?: "AMBER" | "COMPLETE" | "GREEN" | "RED";
}

export class MaterialExceptionsReportQueryDto extends ReportPeriodQueryDto {
  @ApiPropertyOptional({ maxLength: 100, type: String })
  @IsOptional()
  @MaxLength(100)
  blockerType?: string;

  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  itemCategoryId?: string;

  @ApiPropertyOptional({ maxLength: 100, type: String })
  @IsOptional()
  @MaxLength(100)
  item?: string;

  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  workPackageId?: string;
}

export class SupplierPerformanceReportQueryDto extends ReportPeriodQueryDto {
  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  supplierOrganizationId?: string;
}

export class ReportRateMetricDto {
  @ApiProperty({ type: String })
  denominator!: string;

  @ApiProperty({ type: String })
  numerator!: string;

  @ApiProperty({ nullable: true, type: Number })
  percentage!: number | null;

  @ApiProperty({ enum: ["COUNT", "QUANTITY"], type: String })
  unit!: "COUNT" | "QUANTITY";
}
