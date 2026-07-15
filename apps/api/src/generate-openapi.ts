import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createApplication } from "./bootstrap.js";

const { app, openApiDocument } = await createApplication();
const outputDirectory = resolve(process.cwd(), "../../docs/generated");
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  resolve(outputDirectory, "openapi.json"),
  `${JSON.stringify(openApiDocument, null, 2)}\n`,
);
await app.close();
