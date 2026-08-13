export type OAuthMode = "signIn" | "signUp";

function encodeState(value: string) {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(value);
  }

  const BufferImpl = (globalThis as Record<string, any>).Buffer;
  if (BufferImpl) {
    return BufferImpl.from(value, "utf-8").toString("base64");
  }

  return value;
}

export function buildOAuthUrl({
  portalUrl,
  appId,
  redirectUri,
  type,
}: {
  portalUrl: string;
  appId: string;
  redirectUri: string;
  type: OAuthMode;
}) {
  const url = new URL(`${portalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", encodeState(redirectUri));
  url.searchParams.set("type", type);
  return url.toString();
}
