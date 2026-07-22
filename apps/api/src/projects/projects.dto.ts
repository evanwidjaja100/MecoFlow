import {
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
import { projectStates, type ProjectState } from "./project-state.js";

const projectStateEnum = Object.fromEntries(
  projectStates.map((state) => [state, state]),
) as Record<ProjectState, ProjectState>;
const projectMemberRoles = {
  CONTRIBUTOR: "CONTRIBUTOR",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  SUPPLIER: "SUPPLIER",
  VIEWER: "VIEWER",
} as const;
const projectMemberStatuses = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
const projectSortFields = {
  code: "code",
  name: "name",
  plannedStartDate: "plannedStartDate",
  state: "state",
  updatedAt: "updatedAt",
} as const;
const sortDirections = { asc: "asc", desc: "desc" } as const;
const codePattern = /^[A-Z0-9][A-Z0-9._-]*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export class CreateProductCategoryDto {
  @ApiProperty({ example: "PROCESS-EQUIPMENT", maxLength: 50, type: String })
  @IsString()
  @Length(2, 50)
  @Matches(codePattern)
  code!: string;

  @ApiProperty({ maxLength: 150, type: String })
  @IsString()
  @Length(2, 150)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateProductCategoryDto extends CreateProductCategoryDto {
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  active!: boolean;

  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class ListProjectsQueryDto {
  @ApiPropertyOptional({ format: "uuid", type: String })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: "1", type: String })
  @IsOptional()
  @Matches(/^\d{1,6}$/)
  page?: string;

  @ApiPropertyOptional({ example: "20", type: String })
  @IsOptional()
  @Matches(/^\d{1,3}$/)
  pageSize?: string;

  @ApiPropertyOptional({ maxLength: 100, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: projectSortFields, type: String })
  @IsOptional()
  @IsEnum(projectSortFields)
  sort?: keyof typeof projectSortFields;

  @ApiPropertyOptional({ enum: sortDirections, type: String })
  @IsOptional()
  @IsEnum(sortDirections)
  direction?: "asc" | "desc";

  @ApiPropertyOptional({ enum: projectStateEnum, type: String })
  @IsOptional()
  @IsEnum(projectStateEnum)
  state?: ProjectState;
}

export class ProjectDetailsDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  productCategoryId!: string;

  @ApiProperty({ example: "PRJ-2026-001", maxLength: 50, type: String })
  @IsString()
  @Length(2, 50)
  @Matches(codePattern)
  code!: string;

  @ApiProperty({ maxLength: 200, type: String })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional({ maxLength: 2000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: "2026-08-03", type: String })
  @Matches(datePattern)
  plannedStartDate!: string;

  @ApiProperty({ example: "2026-11-27", type: String })
  @Matches(datePattern)
  plannedEndDate!: string;
}

export class CreateProjectDto extends ProjectDetailsDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  organizationId!: string;
}

export class UpdateProjectDto extends ProjectDetailsDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class TransitionProjectDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ maxLength: 500, minLength: 5, type: String })
  @IsString()
  @Length(5, 500)
  reason!: string;

  @ApiProperty({ enum: projectStateEnum, type: String })
  @IsEnum(projectStateEnum)
  targetState!: ProjectState;
}

export class AddProjectMemberDto {
  @ApiProperty({ format: "uuid", type: String })
  @IsUUID()
  membershipId!: string;

  @ApiProperty({ enum: projectMemberRoles, type: String })
  @IsEnum(projectMemberRoles)
  role!: keyof typeof projectMemberRoles;
}

export class UpdateProjectMemberDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;

  @ApiProperty({ enum: projectMemberRoles, type: String })
  @IsEnum(projectMemberRoles)
  role!: keyof typeof projectMemberRoles;

  @ApiProperty({ enum: projectMemberStatuses, type: String })
  @IsEnum(projectMemberStatuses)
  status!: keyof typeof projectMemberStatuses;
}

export class MilestoneDetailsDto {
  @ApiProperty({ maxLength: 50, type: String })
  @IsString()
  @Length(1, 50)
  @Matches(codePattern)
  code!: string;

  @ApiProperty({ maxLength: 200, type: String })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional({ maxLength: 1000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: "2026-09-14", type: String })
  @Matches(datePattern)
  targetDate!: string;
}

export class CreateMilestoneDto extends MilestoneDetailsDto {}

export class UpdateMilestoneDto extends MilestoneDetailsDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class WorkPackageDetailsDto {
  @ApiProperty({ maxLength: 50, type: String })
  @IsString()
  @Length(1, 50)
  @Matches(codePattern)
  code!: string;

  @ApiProperty({ maxLength: 200, type: String })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional({ maxLength: 1000, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ format: "uuid", nullable: true, type: String })
  @IsOptional()
  @IsUUID()
  milestoneId?: string;

  @ApiProperty({ example: "2026-08-03", type: String })
  @Matches(datePattern)
  plannedStartDate!: string;

  @ApiProperty({ example: "2026-09-11", type: String })
  @Matches(datePattern)
  plannedEndDate!: string;
}

export class CreateWorkPackageDto extends WorkPackageDetailsDto {}

export class UpdateWorkPackageDto extends WorkPackageDetailsDto {
  @ApiProperty({ minimum: 1, type: Number })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}
