import type { NextRequest } from "next/server";
import { apiRequest } from "../../../lib/api";

export async function GET(request: NextRequest): Promise<Response> {
  const upstream = await apiRequest(
    `/api/v1/items/export.csv${request.nextUrl.search}`,
  );
  if (upstream.status === 401) {
    return Response.redirect(new URL("/login", request.url));
  }
  if (upstream.status === 403) {
    return Response.redirect(new URL("/access-denied", request.url));
  }
  if (!upstream.ok) {
    return new Response("Item export is unavailable", {
      headers: { "content-type": "text/plain; charset=utf-8" },
      status: upstream.status >= 500 ? 502 : upstream.status,
    });
  }

  const headers = new Headers({
    "cache-control": "private, no-store",
    "content-disposition":
      upstream.headers.get("content-disposition") ??
      'attachment; filename="items.csv"',
    "content-type":
      upstream.headers.get("content-type") ?? "text/csv; charset=utf-8",
    "x-content-type-options": "nosniff",
  });
  return new Response(upstream.body, { headers, status: upstream.status });
}
