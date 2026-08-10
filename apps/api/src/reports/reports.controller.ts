import {
  Controller,
  Get,
  Inject,
  Param,
  ParseEnumPipe,
  Query,
  Req,
  StreamableFile,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { IdentityService } from "../identity/identity.service.js";
import { requestContext } from "../request-context.js";
import {
  MaterialExceptionsReportQueryDto,
  ProjectReadinessReportQueryDto,
  ReportFormat,
  SupplierPerformanceReportQueryDto,
} from "./reports.dto.js";
import { ReportsService } from "./reports.service.js";

@ApiTags("Reports and scorecards")
@ApiCookieAuth("session")
@ApiForbiddenResponse({
  description: "The principal lacks report permission or object scope",
})
@Controller("api/v1")
export class ReportsController {
  constructor(
    @Inject(ReportsService) private readonly reports: ReportsService,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Get("reports/project-readiness")
  @ApiOperation({ summary: "Read the authorized project-readiness report" })
  projectReadiness(
    @Req() request: Request,
    @Query() query: ProjectReadinessReportQueryDto,
  ) {
    return this.identity
      .principal(request)
      .then((principal) => this.reports.projectReadiness(principal, query));
  }

  @Get("reports/material-exceptions")
  @ApiOperation({ summary: "Read current authorized material exceptions" })
  materialExceptions(
    @Req() request: Request,
    @Query() query: MaterialExceptionsReportQueryDto,
  ) {
    return this.identity
      .principal(request)
      .then((principal) => this.reports.materialExceptions(principal, query));
  }

  @Get("reports/supplier-performance")
  @ApiOperation({ summary: "Read authorized supplier KPI scorecards" })
  supplierPerformance(
    @Req() request: Request,
    @Query() query: SupplierPerformanceReportQueryDto,
  ) {
    return this.identity
      .principal(request)
      .then((principal) => this.reports.supplierPerformance(principal, query));
  }

  @Get("supplier/scorecard")
  @ApiOperation({ summary: "Read the authenticated supplier's own scorecard" })
  ownSupplierScorecard(
    @Req() request: Request,
    @Query() query: SupplierPerformanceReportQueryDto,
  ) {
    return this.identity
      .principal(request)
      .then((principal) => this.reports.ownSupplierScorecard(principal, query));
  }

  @Get("reports/project-readiness/export/:format")
  @ApiOperation({ summary: "Export authorized project readiness" })
  @ApiParam({ enum: ReportFormat, name: "format" })
  @ApiProduces(
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  )
  async exportProjectReadiness(
    @Req() request: Request,
    @Query() query: ProjectReadinessReportQueryDto,
    @Param("format", new ParseEnumPipe(ReportFormat)) format: ReportFormat,
  ) {
    return this.stream(
      await this.reports.exportProjectReadiness(
        await this.identity.principal(request),
        requestContext(request),
        query,
        format,
      ),
    );
  }

  @Get("reports/material-exceptions/export/:format")
  @ApiOperation({ summary: "Export authorized material exceptions" })
  @ApiParam({ enum: ReportFormat, name: "format" })
  @ApiProduces(
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  )
  async exportMaterialExceptions(
    @Req() request: Request,
    @Query() query: MaterialExceptionsReportQueryDto,
    @Param("format", new ParseEnumPipe(ReportFormat)) format: ReportFormat,
  ) {
    return this.stream(
      await this.reports.exportMaterialExceptions(
        await this.identity.principal(request),
        requestContext(request),
        query,
        format,
      ),
    );
  }

  @Get("reports/supplier-performance/export/:format")
  @ApiOperation({ summary: "Export authorized supplier scorecards" })
  @ApiParam({ enum: ReportFormat, name: "format" })
  @ApiProduces(
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  )
  async exportSupplierPerformance(
    @Req() request: Request,
    @Query() query: SupplierPerformanceReportQueryDto,
    @Param("format", new ParseEnumPipe(ReportFormat)) format: ReportFormat,
  ) {
    return this.stream(
      await this.reports.exportSupplierPerformance(
        await this.identity.principal(request),
        requestContext(request),
        query,
        format,
      ),
    );
  }

  @Get("supplier/scorecard/export/:format")
  @ApiOperation({
    summary: "Export the authenticated supplier's own scorecard",
  })
  @ApiParam({ enum: ReportFormat, name: "format" })
  @ApiProduces(
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  )
  async exportOwnSupplierScorecard(
    @Req() request: Request,
    @Query() query: SupplierPerformanceReportQueryDto,
    @Param("format", new ParseEnumPipe(ReportFormat)) format: ReportFormat,
  ) {
    return this.stream(
      await this.reports.exportOwnSupplierScorecard(
        await this.identity.principal(request),
        requestContext(request),
        query,
        format,
      ),
    );
  }

  private stream(file: {
    buffer: Buffer;
    contentType: string;
    filename: string;
  }) {
    return new StreamableFile(file.buffer, {
      disposition: `attachment; filename="${file.filename}"`,
      type: file.contentType,
    });
  }
}
