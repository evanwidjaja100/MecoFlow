import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { HealthResponse, ReadinessResponse } from "@mecoflow/contracts";
import { HealthService } from "./health.service.js";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    @Inject(HealthService) private readonly healthService: HealthService,
  ) {}

  @Get("live")
  @ApiOperation({ summary: "Process liveness probe" })
  @ApiOkResponse({ description: "The API process is alive." })
  live(): HealthResponse {
    return this.healthService.liveness();
  }

  @Get("ready")
  @ApiOperation({ summary: "Required dependency readiness probe" })
  @ApiOkResponse({ description: "Required dependencies are available." })
  @ApiServiceUnavailableResponse({
    description: "At least one required dependency is unavailable.",
  })
  async ready(): Promise<ReadinessResponse> {
    const readiness = await this.healthService.readiness();
    if (readiness.status === "not_ready")
      throw new ServiceUnavailableException(readiness);
    return readiness;
  }
}
