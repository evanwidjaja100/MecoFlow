import { createApplication } from "./bootstrap.js";

const { app, environment } = await createApplication();
await app.listen(environment.API_PORT, "0.0.0.0");

const shutdown = async (signal: string) => {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}, shutting down gracefully...`);
  const timeout = setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error("Shutdown timed out, forced exit");
    process.exit(1);
  }, 10_000);
  await app.close();
  clearTimeout(timeout);
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
