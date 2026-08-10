import "reflect-metadata";
import { resolve } from "node:path";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { parseServiceEnvironment } from "@mecoflow/config";
import { config as loadEnvironment } from "dotenv";
import type { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { AppModule } from "./app.module.js";
import { JsonLogger } from "./logger.js";
import { MetricsRegistry } from "./monitoring/metrics-registry.js";
import { requestLogging } from "./request-logging.js";
import { SafeApiExceptionFilter } from "./safe-api-exception.filter.js";

export async function createApplication() {
  loadEnvironment({
    path: resolve(process.cwd(), "../../.env"),
    quiet: true,
  });
  const environment = parseServiceEnvironment(process.env);
  const logger = new JsonLogger(
    "api",
    environment.APP_ENV,
    environment.LOG_LEVEL,
  );
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.register(environment),
    {
      bufferLogs: true,
      logger,
    },
  );

  app.set("trust proxy", environment.TRUST_PROXY_HOPS);
  app.use(helmet());
  app.useBodyParser("json", { limit: "8mb" });
  app.use(
    "/api/v1",
    (_request: Request, response: Response, next: NextFunction) => {
      response.setHeader("Cache-Control", "private, no-store");
      response.setHeader("Pragma", "no-cache");
      next();
    },
  );

  app.use(requestLogging(logger, app.get(MetricsRegistry)));
  app.enableCors({
    credentials: true,
    methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH"],
    origin: environment.CORS_ORIGINS.split(",").map((origin) => origin.trim()),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: false,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new SafeApiExceptionFilter());

  const openApiConfig = new DocumentBuilder()
    .setTitle("MECO Flow API")
    .setDescription("Versioned operational API for MECO Flow")
    .setVersion(environment.APP_VERSION)
    .addCookieAuth(
      "mecoflow_session",
      { in: "cookie", type: "apiKey" },
      "session",
    )
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);
  if (environment.NODE_ENV !== "production")
    SwaggerModule.setup("api/docs", app, openApiDocument);

  return { app, environment, openApiDocument };
}
