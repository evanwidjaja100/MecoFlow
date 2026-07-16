import { redirect } from "next/navigation";
import { requireMe } from "./lib/api";

export default async function HomePage() {
  const me = await requireMe();
  redirect(me.shell === "INTERNAL" ? "/internal" : "/supplier");
}
