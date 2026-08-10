import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
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
import {
  ListReadinessManagementQueryDto,
  ReadinessHistoryResponseDto,
  ReadinessManagementResponseDto,
  ReadinessMaterialsResponseDto,
  ReadinessOverviewResponseDto,
} from "./readiness.dto.js";
import { ReadinessService } from "./readiness.service.js";

@ApiTags("Readiness")
@ApiCookieAuth("session")
@ApiForbiddenResponse({
  description: "The principal lacks readiness permission or project scope",
})
@Controller("api/v1")
export class ReadinessController {
  constructor(
    @Inject(ReadinessService) private readonly readiness: ReadinessService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("readiness/management")
  @ApiOperation({
    summary: "Latest project readiness for the authorized management portfolio",
  })
  @ApiOkResponse({ type: ReadinessManagementResponseDto })
  async management(
    @Req() request: Request,
    @Query() query: ListReadinessManagementQueryDto,
  ) {
    const result = await this.readiness.management(
      await this.identity.principal(request),
      query,
    );
    const page = Number(query.page ?? "1");
    const pageSize = Number(query.pageSize ?? "20");
    return {
      data: result.data,
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      },
    };
  }

  @Get("projects/:projectId/readiness")
  @ApiOperation({
    summary: "Latest project and work-package readiness snapshots",
  })
  @ApiParam({ format: "uuid", name: "projectId", type: String })
  @ApiOkResponse({ type: ReadinessOverviewResponseDto })
  async overview(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    return this.readiness.overview(
      await this.identity.principal(request),
      projectId,
    );
  }

  @Get("projects/:projectId/readiness/materials")
  @ApiOperation({
    summary: "Latest material-readiness board with line explanations",
  })
  @ApiParam({ format: "uuid", name: "projectId", type: String })
  @ApiOkResponse({ type: ReadinessMaterialsResponseDto })
  async materials(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    return this.readiness.materials(
      await this.identity.principal(request),
      projectId,
    );
  }

  @Get("projects/:projectId/readiness/history")
  @ApiOperation({
    summary: "Immutable project and work-package readiness history",
  })
  @ApiParam({ format: "uuid", name: "projectId", type: String })
  @ApiOkResponse({ type: ReadinessHistoryResponseDto })
  async history(
    @Req() request: Request,
    @Param("projectId", new ParseUUIDPipe()) projectId: string,
  ) {
    return this.readiness.history(
      await this.identity.principal(request),
      projectId,
    );
  }
}
