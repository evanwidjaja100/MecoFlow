import "reflect-metadata";
import { resolve } from "node:path";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { parseServiceEnvironment } from "@mecoflow/config";
import { config as loadEnvironment } from "dotenv";
import { AppModule } from "./app.module.js";
import { JsonLogger } from "./logger.js";
import { requestLogging } from "./request-logging.js";

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
  const app = await NestFactory.create(AppModule.register(environment), {
    bufferLogs: true,
    logger,
  });

  app.use(requestLogging(logger));
  app.enableCors({
    credentials: true,
    methods: ["GET", "HEAD", "OPTIONS"],
    origin: environment.CORS_ORIGINS.split(",").map((origin) => origin.trim()),
  });
  app.useGlobalPipes(
    new ValidationPipe({ forbidUnknownValues: true, transform: false }),
  );

  const openApiConfig = new DocumentBuilder()
    .setTitle("MECO Flow API")
    .setDescription("Versioned operational API for MECO Flow")
    .setVersion(environment.APP_VERSION)
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);
  if (environment.NODE_ENV !== "production")
    SwaggerModule.setup("api/docs", app, openApiDocument);

  return { app, environment, openApiDocument };
}
