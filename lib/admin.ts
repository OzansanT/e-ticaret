import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getRuntimeEnv } from "@/db";

async function configuredAdminEmails() {
  const env = await getRuntimeEnv();
  const value = typeof env.ADMIN_EMAILS === "string" ? env.ADMIN_EMAILS : "";
  return value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdminApi() {
  const user = await getChatGPTUser();
  const allowed = await configuredAdminEmails();
  if (!user || !allowed.includes(user.email.toLowerCase())) return null;
  return user;
}

export async function isCurrentUserAdmin() {
  return Boolean(await requireAdminApi());
}
