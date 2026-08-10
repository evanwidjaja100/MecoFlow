"use server";

import { revalidatePath } from "next/cache";
import { writeApi } from "../../lib/api";
import type { NotificationType } from "./data";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function markNotificationRead(formData: FormData) {
  await writeApi(
    `/api/v1/notifications/${field(formData, "notificationId")}/read`,
  );
  revalidatePath("/internal/notifications");
}

export async function updateNotificationPreference(formData: FormData) {
  const type = field(formData, "type") as NotificationType;
  await writeApi(`/api/v1/notification-preferences/${type}`, {
    body: {
      emailEnabled: formData.get("emailEnabled") === "on",
      expectedVersion: Number(field(formData, "expectedVersion")),
      inAppEnabled: formData.get("inAppEnabled") === "on",
    },
    method: "PUT",
  });
  revalidatePath("/internal/notifications");
}
