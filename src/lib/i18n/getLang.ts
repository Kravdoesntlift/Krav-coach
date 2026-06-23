import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";

export async function getLang(): Promise<Lang> {
  const jar = await cookies();
  const val = jar.get("krav_lang")?.value;
  if (val === "en" || val === "pt") return val;
  return "pt";
}
