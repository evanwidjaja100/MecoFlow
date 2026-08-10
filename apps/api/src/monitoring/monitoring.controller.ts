import { Controller, Get, Header, Inject } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { ApiExcludeController } from "@nestjs/swagger";
import { MonitoringService } from "./monitoring.service.js";

@ApiExcludeController()
@SkipThrottle()
@Controller("metrics")
export class MonitoringController {
  constructor(
    @Inject(MonitoringService)
    private readonly monitoringService: MonitoringService,
  ) {}

  @Get()
  @Header("Cache-Control", "no-store")
  @Header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
  metrics(): Promise<string> {
    return this.monitoringService.metrics();
  }
}
