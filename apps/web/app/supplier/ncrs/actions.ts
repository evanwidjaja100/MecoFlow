"use server";

import { revalidatePath } from "next/cache";
import { writeApi } from "../../lib/api";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitNcrResponse(formData: FormData) {
  const id = field(formData, "ncrId");
  await writeApi(`/api/v1/supplier/ncrs/${id}/responses`, {
    body: {
      correctiveAction: field(formData, "correctiveAction"),
      expectedVersion: Number(field(formData, "expectedVersion")),
      message: field(formData, "message"),
      rootCause: field(formData, "rootCause"),
    },
  });
  revalidatePath("/supplier/ncrs");
  revalidatePath(`/supplier/ncrs/${id}`);
}
