export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json(
    {
      service: "web",
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION ?? "unknown",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
