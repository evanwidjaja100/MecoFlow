import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Req,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { IdentityService } from "../identity/identity.service.js";
import { MaterialRequirementStatusResponseDto } from "./requirement-status.dto.js";
import { RequirementStatusService } from "./requirement-status.service.js";

@ApiTags("Material requirement status")
@ApiCookieAuth("session")
@ApiForbiddenResponse({
  description: "The principal lacks BOM permission or project scope",
})
@Controller("api/v1")
export class RequirementStatusController {
  constructor(
    @Inject(RequirementStatusService)
    private readonly requirementStatus: RequirementStatusService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("projects/:projectId/material-requirement-status")
  @ApiOperation({
    summary: "Project deterministic status for every current released BOM line",
  })
  @ApiParam({ format: "uuid", name: "projectId", type: String })
  @ApiOkResponse({ type: MaterialRequirementStatusResponseDto })
  async project(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    const principal = await this.identity.principal(request);
    return this.requirementStatus.projectStatus(principal, projectId);
  }
}
