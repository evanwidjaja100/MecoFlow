import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiCookieAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { IdentityService } from "../identity/identity.service.js";
import { requestContext } from "../request-context.js";
import {
  AssignRolesDto,
  CreateMembershipDto,
  CreateOrganizationDto,
  UpdateMembershipStatusDto,
} from "./administration.dto.js";
import { AdministrationService } from "./administration.service.js";

@ApiTags("administration")
@ApiCookieAuth("session")
@ApiForbiddenResponse({
  description: "The active principal lacks permission or internal scope",
})
@Controller("api/v1/administration")
export class AdministrationController {
  constructor(
    @Inject(AdministrationService)
    private readonly administration: AdministrationService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("organizations")
  @ApiOperation({ summary: "List organizations for internal administration" })
  @ApiOkResponse({ description: "Authorized organizations" })
  async organizations(@Req() request: Request) {
    const principal = await this.identity.principal(request);
    return {
      data: await this.administration.listOrganizations(principal),
      meta: requestContext(request),
    };
  }

  @Post("organizations")
  @ApiOperation({ summary: "Create an organization" })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  @ApiCreatedResponse({ description: "Organization created" })
  async createOrganization(
    @Req() request: Request,
    @Body() input: CreateOrganizationDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.administration.createOrganization(
      principal,
      requestContext(request),
      input,
    );
  }

  @Get("roles")
  @ApiOperation({ summary: "List seeded roles" })
  async roles(@Req() request: Request) {
    const principal = await this.identity.principal(request);
    return {
      data: await this.administration.listRoles(principal),
      meta: requestContext(request),
    };
  }

  @Get("users")
  @ApiOperation({ summary: "List synchronized user profiles" })
  async users(@Req() request: Request) {
    const principal = await this.identity.principal(request);
    return {
      data: await this.administration.listUsers(principal),
      meta: requestContext(request),
    };
  }

  @Get("organizations/:organizationId/memberships")
  @ApiOperation({
    summary: "List organization memberships and role assignments",
  })
  @ApiParam({ format: "uuid", name: "organizationId" })
  async memberships(
    @Req() request: Request,
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
  ) {
    const principal = await this.identity.principal(request);
    return {
      data: await this.administration.listMemberships(
        principal,
        organizationId,
      ),
      meta: requestContext(request),
    };
  }

  @Post("organizations/:organizationId/memberships")
  @ApiOperation({ summary: "Create an active organization membership" })
  @ApiParam({ format: "uuid", name: "organizationId" })
  @ApiBody({ type: CreateMembershipDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  async createMembership(
    @Req() request: Request,
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() input: CreateMembershipDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.administration.createMembership(
      principal,
      requestContext(request),
      organizationId,
      input.userId,
    );
  }

  @Patch("organizations/:organizationId/memberships/:membershipId/status")
  @ApiOperation({ summary: "Activate or deactivate a membership" })
  @ApiParam({ format: "uuid", name: "organizationId" })
  @ApiParam({ format: "uuid", name: "membershipId" })
  @ApiBody({ type: UpdateMembershipStatusDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  @ApiNotFoundResponse({
    description: "Resource is nonexistent or inaccessible",
  })
  async updateMembershipStatus(
    @Req() request: Request,
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Param("membershipId", new ParseUUIDPipe()) membershipId: string,
    @Body() input: UpdateMembershipStatusDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.administration.updateMembershipStatus(
      principal,
      requestContext(request),
      organizationId,
      membershipId,
      input,
    );
  }

  @Put("organizations/:organizationId/memberships/:membershipId/roles")
  @ApiOperation({ summary: "Replace membership role assignments atomically" })
  @ApiParam({ format: "uuid", name: "organizationId" })
  @ApiParam({ format: "uuid", name: "membershipId" })
  @ApiBody({ type: AssignRolesDto })
  @ApiHeader({ name: "X-CSRF-Token", required: true })
  @ApiNotFoundResponse({
    description: "Resource is nonexistent or inaccessible",
  })
  async assignRoles(
    @Req() request: Request,
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Param("membershipId", new ParseUUIDPipe()) membershipId: string,
    @Body() input: AssignRolesDto,
  ) {
    const principal = await this.identity.principal(request, true);
    return this.administration.assignRoles(
      principal,
      requestContext(request),
      organizationId,
      membershipId,
      input,
    );
  }
}
