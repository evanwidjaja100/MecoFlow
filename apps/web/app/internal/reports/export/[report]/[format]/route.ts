import type { NextRequest } from "next/server";
import { apiRequest } from "../../../../../lib/api";

const reports = new Set([
  "project-readiness",
  "material-exceptions",
  "supplier-performance",
]);
const formats = new Set(["csv", "xlsx"]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ format: string; report: string }> },
): Promise<Response> {
  const { format, report } = await context.params;
  if (!reports.has(report) || !formats.has(format))
    return new Response("Report export is unavailable", { status: 404 });
  const upstream = await apiRequest(
    `/api/v1/reports/${report}/export/${format}${request.nextUrl.search}`,
  );
  if (upstream.status === 401)
    return Response.redirect(new URL("/login", request.url));
  if ([403, 404].includes(upstream.status))
    return Response.redirect(new URL("/access-denied", request.url));
  if (!upstream.ok)
    return new Response("Report export is unavailable", {
      headers: { "content-type": "text/plain; charset=utf-8" },
      status: upstream.status >= 500 ? 502 : upstream.status,
    });
  return new Response(upstream.body, {
    headers: {
      "cache-control": "private, no-store",
      "content-disposition":
        upstream.headers.get("content-disposition") ??
        `attachment; filename="${report}.${format}"`,
      "content-type":
        upstream.headers.get("content-type") ?? "application/octet-stream",
      "x-content-type-options": "nosniff",
    },
  });
}
