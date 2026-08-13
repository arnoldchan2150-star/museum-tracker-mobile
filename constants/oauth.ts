import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import * as ReactNative from "react-native";
import { buildOAuthUrl } from "@/lib/oauth-url";

// Extract scheme from bundle ID (last segment timestamp, prefixed with "manus")
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const bundleId = "com.app.museumtrackermobile";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  portal: process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL || process.env.VITE_OAUTH_PORTAL_URL || "",
  server: process.env.EXPO_PUBLIC_OAUTH_SERVER_URL || process.env.OAUTH_SERVER_URL || "",
  appId: process.env.EXPO_PUBLIC_APP_ID || process.env.VITE_APP_ID || "",
  ownerId: process.env.EXPO_PUBLIC_OWNER_OPEN_ID || process.env.OWNER_OPEN_ID || "",
  ownerName: process.env.EXPO_PUBLIC_OWNER_NAME || process.env.OWNER_NAME || "",
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "",
  deepLinkScheme: schemeFromBundleId,
};

export const OAUTH_PORTAL_URL = env.portal;
export const OAUTH_SERVER_URL = env.server;
export const APP_ID = env.appId;
export const OWNER_OPEN_ID = env.ownerId;
export const OWNER_NAME = env.ownerName;
export const API_BASE_URL = env.apiBaseUrl;

/**
 * Get the API base URL, deriving from current hostname if not set.
 * Metro runs on 8081, API server runs on 3000.
 * URL pattern: https://PORT-sandboxid.region.domain
 */
export function getApiBaseUrl(): string {
  // If API_BASE_URL is set, use it
  if (API_BASE_URL) {
    return API_BASE_URL.replace(/\/$/, "");
  }

  // On web, derive from current hostname by replacing port 8081 with 3000
  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;
    // Pattern: 8081-sandboxid.region.domain -> 3000-sandboxid.region.domain
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) {
      return `${protocol}//${apiHostname}`;
    }
  }

  // Fallback to empty (will use relative URL)
  return "";
}

export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "manus-runtime-user-info";

/**
 * Get the redirect URI for OAuth callback.
 * - Web: uses API server callback endpoint
 * - Native: uses deep link scheme
 */
export const getRedirectUri = () => {
  if (ReactNative.Platform.OS === "web") {
    return `${getApiBaseUrl()}/api/oauth/callback`;
  }

  // AuthSession uses the app config scheme in a Development Build / production app,
  // and automatically falls back to Expo Go's exp:// URL while running in Expo Go.
  return makeRedirectUri({
    native: `${env.deepLinkScheme}://oauth/callback`,
    scheme: env.deepLinkScheme,
    path: "oauth/callback",
  });
};

export const getLoginUrl = (type: "signIn" | "signUp" = "signIn") => {
  if (!OAUTH_PORTAL_URL || !APP_ID) {
    throw new Error("OAUTH_CONFIG_MISSING");
  }
  const redirectUri = getRedirectUri();
  return buildOAuthUrl({ portalUrl: OAUTH_PORTAL_URL, appId: APP_ID, redirectUri, type });
};

export async function startOAuthSignUp(): Promise<string | null> {
  const signUpUrl = getLoginUrl("signUp");

  if (ReactNative.Platform.OS === "web") {
    if (typeof window !== "undefined") window.location.href = signUpUrl;
    return null;
  }

  const redirectUri = getRedirectUri();
  const result = await WebBrowser.openAuthSessionAsync(signUpUrl, redirectUri);
  if (result.type === "success" && result.url) {
    const { completeOAuthCallback } = await import("@/lib/oauth-session");
    await completeOAuthCallback(result.url);
  } else if (result.type === "cancel" || result.type === "dismiss") {
    console.info("[OAuth] Sign up browser session was cancelled");
    throw new Error("OAUTH_CANCELLED");
  }
  return result.type === "success" ? result.url ?? null : null;
}

/**
 * Start OAuth login flow.
 *
 * On native platforms (iOS/Android), open the system browser directly so
 * the OAuth callback returns via deep link to the app.
 *
 * On web, this simply redirects to the login URL.
 *
 * @returns Always null, the callback is handled via deep link.
 */
export async function startOAuthLogin(): Promise<string | null> {
  const loginUrl = getLoginUrl();

  if (ReactNative.Platform.OS === "web") {
    if (typeof window !== "undefined") window.location.href = loginUrl;
    return null;
  }

  const redirectUri = getRedirectUri();
  const result = await WebBrowser.openAuthSessionAsync(loginUrl, redirectUri);
  if (result.type === "success" && result.url) {
    const { completeOAuthCallback } = await import("@/lib/oauth-session");
    await completeOAuthCallback(result.url);
  } else if (result.type === "cancel" || result.type === "dismiss") {
    console.info("[OAuth] Login browser session was cancelled");
    throw new Error("OAUTH_CANCELLED");
  }
  return result.type === "success" ? result.url ?? null : null;
}
