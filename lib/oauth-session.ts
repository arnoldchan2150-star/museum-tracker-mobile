import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { notifyAuthChanged } from "@/lib/auth-events";

function decodeUser(encoded: string) {
  const decoded = typeof atob === "function" ? atob(encoded) : Buffer.from(encoded, "base64").toString("utf-8");
  return JSON.parse(decoded) as { id?: number; openId?: string; name?: string | null; email?: string | null; loginMethod?: string | null; lastSignedIn?: string };
}

export async function completeOAuthCallback(url: string) {
  const parsed = new URL(url);
  const sessionToken = parsed.searchParams.get("sessionToken");
  const encodedUser = parsed.searchParams.get("user");
  let user: { id?: number; openId?: string; name?: string | null; email?: string | null; loginMethod?: string | null; lastSignedIn?: string } | null = null;

  if (encodedUser) {
    try {
      user = decodeUser(encodedUser);
    } catch {
      user = null;
    }
  }

  if (sessionToken) {
    await Auth.setSessionToken(sessionToken);
  } else {
    const code = parsed.searchParams.get("code");
    const state = parsed.searchParams.get("state");
    if (!code || !state) throw new Error("OAuth callback is missing code or state.");
    const result = await Api.exchangeOAuthCode(code, state);
    await Auth.setSessionToken(result.sessionToken);
    user = result.user;
  }

  if (user?.openId) {
    await Auth.setUserInfo({
      id: user.id ?? 0,
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? "manus",
      lastSignedIn: new Date(user.lastSignedIn || Date.now()),
    });
  }
  notifyAuthChanged();
}
