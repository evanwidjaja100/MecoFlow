import type { AddressInfo } from "node:net";
import type { INestApplication } from "@nestjs/common";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApplication } from "../bootstrap.js";

describe.sequential("private operational metrics", () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const created = await createApplication();
    app = created.app;
    await app.listen(0, "127.0.0.1");
    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("exposes private scrape output without authentication data or dynamic identifiers", async () => {
    const protectedId = "018f65aa-aaaa-4bbb-8ccc-123456789abc";
    await fetch(`${baseUrl}/api/v1/projects/${protectedId}`);

    const response = await fetch(`${baseUrl}/metrics`);
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(response.headers.get("content-type")).toContain("version=0.0.4");
    expect(body).toContain("# TYPE mecoflow_http_requests_total counter");
    expect(body).toContain("mecoflow_dependency_up");
    expect(body).toContain("mecoflow_monitoring_collection_success");
    expect(body).not.toContain(protectedId);
    expect(body).not.toContain(process.env.DATABASE_URL ?? "never-present");
    expect(body).not.toContain(process.env.SESSION_SECRET ?? "never-present");
  });
});
