import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { IdentityService } from "../identity/identity.service.js";
import { requestContext } from "../request-context.js";
import {
  AddProjectMemberDto,
  CreateMilestoneDto,
  CreateProductCategoryDto,
  CreateProjectDto,
  CreateWorkPackageDto,
  ListProjectsQueryDto,
  TransitionProjectDto,
  UpdateMilestoneDto,
  UpdateProductCategoryDto,
  UpdateProjectDto,
  UpdateProjectMemberDto,
  UpdateWorkPackageDto,
} from "./projects.dto.js";
import { ProjectsService } from "./projects.service.js";

@ApiTags("projects")
@ApiCookieAuth("session")
@ApiForbiddenResponse({ description: "The principal lacks project permission" })
@Controller("api/v1")
export class ProjectsController {
  constructor(
    @Inject(ProjectsService) private readonly projects: ProjectsService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("product-categories")
  @ApiOperation({ summary: "List product categories" })
  async productCategories(@Req() request: Request) {
    const principal = await this.identity.principal(request);
    const supplierOnly = principal.memberships.every(
      (membership) => membership.organization.type === "SUPPLIER",
    );
    return {
      data: await this.projects.listProductCategories(principal, supplierOnly),
      meta: requestContext(request),
    };
  }

  @Post("product-categories")
  @ApiOperation({ summary: "Create a product category" })
  @ApiBody({ type: CreateProductCategoryDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createProductCategory(
    @Req() request: Request,
    @Body() input: CreateProductCategoryDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.createProductCategory(
      principal,
      requestContext(request),
      input,
    );
  }

  @Patch("product-categories/:categoryId")
  @ApiOperation({ summary: "Edit a product category with an expected version" })
  @ApiParam({ format: "uuid", name: "categoryId" })
  @ApiBody({ type: UpdateProductCategoryDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateProductCategory(
    @Req() request: Request,
    @Param("categoryId", new ParseUUIDPipe()) categoryId: string,
    @Body() input: UpdateProductCategoryDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.updateProductCategory(
      principal,
      requestContext(request),
      categoryId,
      input,
    );
  }

  @Get("projects")
  @ApiOperation({
    summary: "List authorized projects with filtering, sorting, and pagination",
  })
  @ApiQuery({
    name: "categoryId",
    required: false,
    type: String,
    format: "uuid",
  })
  @ApiQuery({ name: "direction", required: false, enum: ["asc", "desc"] })
  @ApiQuery({ name: "page", required: false, type: Number, minimum: 1 })
  @ApiQuery({
    name: "pageSize",
    required: false,
    type: Number,
    minimum: 1,
    maximum: 100,
  })
  @ApiQuery({ name: "q", required: false, type: String, maxLength: 100 })
  @ApiQuery({
    name: "sort",
    required: false,
    enum: ["code", "name", "plannedStartDate", "state", "updatedAt"],
  })
  @ApiQuery({
    name: "state",
    required: false,
    enum: ["DRAFT", "PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"],
  })
  async listProjects(
    @Req() request: Request,
    @Query() query: ListProjectsQueryDto,
  ) {
    const principal = await this.identity.principal(request);
    const result = await this.projects.listProjects(principal, query);
    const page = Number(query.page ?? "1");
    const pageSize = Number(query.pageSize ?? "20");
    return {
      data: result.data,
      meta: requestContext(request),
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    };
  }

  @Post("projects")
  @ApiOperation({
    summary: "Create a draft project and assign its creator as project manager",
  })
  @ApiBody({ type: CreateProjectDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createProject(
    @Req() request: Request,
    @Body() input: CreateProjectDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.createProject(
      principal,
      requestContext(request),
      input,
    );
  }

  @Get("projects/:projectId")
  @ApiOperation({ summary: "Read an authorized project overview" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiNotFoundResponse({
    description: "Project is nonexistent or inaccessible",
  })
  async projectOverview(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.projects.projectOverview(principal, projectId);
  }

  @Patch("projects/:projectId")
  @ApiOperation({ summary: "Edit project details; state is not patchable" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiBody({ type: UpdateProjectDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateProject(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() input: UpdateProjectDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.updateProject(
      principal,
      requestContext(request),
      projectId,
      input,
    );
  }

  @Post("projects/:projectId/transitions")
  @ApiOperation({ summary: "Execute an explicit project-state transition" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiBody({ type: TransitionProjectDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async transitionProject(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() input: TransitionProjectDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.transitionProject(
      principal,
      requestContext(request),
      projectId,
      input,
    );
  }

  @Get("projects/:projectId/member-candidates")
  @ApiOperation({
    summary: "List active memberships eligible for project assignment",
  })
  @ApiParam({ format: "uuid", name: "projectId" })
  async memberCandidates(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    const principal = await this.identity.principal(request);
    return {
      data: await this.projects.memberCandidates(principal, projectId),
      meta: requestContext(request),
    };
  }

  @Post("projects/:projectId/members")
  @ApiOperation({ summary: "Add an explicit project member" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiBody({ type: AddProjectMemberDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async addProjectMember(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() input: AddProjectMemberDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.addProjectMember(
      principal,
      requestContext(request),
      projectId,
      input,
    );
  }

  @Patch("projects/:projectId/members/:memberId")
  @ApiOperation({ summary: "Change a project member role or active status" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiParam({ format: "uuid", name: "memberId" })
  @ApiBody({ type: UpdateProjectMemberDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateProjectMember(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Param("memberId", new ParseUUIDPipe()) memberId: string,
    @Body() input: UpdateProjectMemberDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.updateProjectMember(
      principal,
      requestContext(request),
      projectId,
      memberId,
      input,
    );
  }

  @Post("projects/:projectId/milestones")
  @ApiOperation({ summary: "Create a project milestone" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiBody({ type: CreateMilestoneDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createMilestone(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() input: CreateMilestoneDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.createMilestone(
      principal,
      requestContext(request),
      projectId,
      input,
    );
  }

  @Patch("projects/:projectId/milestones/:milestoneId")
  @ApiOperation({ summary: "Edit a project milestone" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiParam({ format: "uuid", name: "milestoneId" })
  @ApiBody({ type: UpdateMilestoneDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateMilestone(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Param("milestoneId", new ParseUUIDPipe()) milestoneId: string,
    @Body() input: UpdateMilestoneDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.updateMilestone(
      principal,
      requestContext(request),
      projectId,
      milestoneId,
      input,
    );
  }

  @Post("projects/:projectId/work-packages")
  @ApiOperation({ summary: "Create a project work package" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiBody({ type: CreateWorkPackageDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createWorkPackage(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Body() input: CreateWorkPackageDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.createWorkPackage(
      principal,
      requestContext(request),
      projectId,
      input,
    );
  }

  @Patch("projects/:projectId/work-packages/:workPackageId")
  @ApiOperation({ summary: "Edit a project work package" })
  @ApiParam({ format: "uuid", name: "projectId" })
  @ApiParam({ format: "uuid", name: "workPackageId" })
  @ApiBody({ type: UpdateWorkPackageDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async updateWorkPackage(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
    @Param("workPackageId", new ParseUUIDPipe()) workPackageId: string,
    @Body() input: UpdateWorkPackageDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.projects.updateWorkPackage(
      principal,
      requestContext(request),
      projectId,
      workPackageId,
      input,
    );
  }
}
