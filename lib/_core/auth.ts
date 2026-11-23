import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { requireSupabase, supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export type User = {
  /** Supabase auth user id (uuid). */
  id: string;
  /** Kept for the account-scoped storage keys; equals `id`. */
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: Date;
};

export function toAppUser(user: SupabaseUser): User {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name = (meta.full_name as string) || (meta.name as string) || null;
  return {
    id: user.id,
    openId: user.id,
    name,
    email: user.email ?? null,
    loginMethod: (user.app_metadata?.provider as string) ?? null,
    lastSignedIn: new Date(user.last_sign_in_at ?? Date.now()),
  };
}

/** Reads the locally persisted session (no network). */
export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch (error) {
    console.warn("[Auth] getSession failed", error);
    return null;
  }
}

export async function getUserInfo(): Promise<User | null> {
  const session = await getSession();
  return session?.user ? toAppUser(session.user) : null;
}

/** Deep link the auth provider returns to, e.g. wanderstamp://auth/callback */
export function getAuthRedirectUrl(next?: "reset"): string {
  return Linking.createURL("/auth/callback", next ? { queryParams: { next } } : undefined);
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await requireSupabase().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(translateAuthError(error.message));
}

/** Returns true when the account needs email confirmation before first login. */
export async function signUpWithEmail(email: string, password: string, newsletterOptIn: boolean): Promise<{ needsConfirmation: boolean }> {
  const { data, error } = await requireSupabase().auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
      data: { newsletter_opt_in: newsletterOptIn, newsletter_consent_at: newsletterOptIn ? new Date().toISOString() : null },
    },
  });
  if (error) throw new Error(translateAuthError(error.message));
  return { needsConfirmation: !data.session };
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email.trim(), { redirectTo: getAuthRedirectUrl("reset") });
  if (error) throw new Error(translateAuthError(error.message));
}

export async function signInWithGoogle(): Promise<boolean> {
  const client = requireSupabase();
  const redirectTo = Platform.OS === "web" && typeof window !== "undefined" ? window.location.origin : getAuthRedirectUrl();
  const { data, error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: Platform.OS !== "web" } });
  if (error) throw new Error(translateAuthError(error.message));
  if (Platform.OS === "web") return false; // browser redirects; session is picked up from the URL on return

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return false;
  return completeAuthFromUrl(result.url);
}

/** Handles wanderstamp://auth/callback?code=... (PKCE) after OAuth, email confirmation or password reset links. */
export async function completeAuthFromUrl(url: string): Promise<boolean> {
  const client = requireSupabase();
  const { queryParams } = Linking.parse(url);
  const hash = url.includes("#") ? new URLSearchParams(url.split("#")[1]) : null;
  const errorDescription = (queryParams?.error_description as string) || hash?.get("error_description");
  if (errorDescription) throw new Error(errorDescription);

  const code = queryParams?.code as string | undefined;
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw new Error(translateAuthError(error.message));
    return true;
  }
  const accessToken = hash?.get("access_token");
  const refreshToken = hash?.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) throw new Error(translateAuthError(error.message));
    return true;
  }
  return false;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await requireSupabase().auth.updateUser({ password });
  if (error) throw new Error(translateAuthError(error.message));
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) console.warn("[Auth] signOut failed", error.message);
}

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "Email 或密碼不正確。";
  if (lower.includes("email not confirmed")) return "請先到信箱點擊確認連結，再登入。";
  if (lower.includes("already registered")) return "這個 Email 已經註冊，請直接登入。";
  if (lower.includes("password should be at least")) return "密碼至少需要 6 個字元。";
  if (lower.includes("rate limit")) return "嘗試次數太多，請稍後再試。";
  if (lower.includes("network")) return "網路連線失敗，請確認網路後再試。";
  return message;
}
