import { createApplication } from "./bootstrap.js";

const { app, environment } = await createApplication();
await app.listen(environment.API_PORT, "0.0.0.0");
