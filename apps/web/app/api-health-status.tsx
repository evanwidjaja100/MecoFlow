"use client";

import { useEffect, useState } from "react";
import { healthResponseSchema } from "@mecoflow/contracts";
import { ServiceStatus } from "@mecoflow/ui";

type Status = "checking" | "available" | "unavailable";

export function ApiHealthStatus() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const controller = new AbortController();
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

    void fetch(`${baseUrl}/health/live`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("API health response was not successful");
        healthResponseSchema.parse(await response.json());
        setStatus("available");
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          setStatus("unavailable");
      });

    return () => controller.abort();
  }, []);

  return <ServiceStatus label="API health" state={status} />;
}
