import type { CookieOptions, Request } from "express";

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}

function getLegacyParentDomain(hostname: string): string | undefined {
  const knownPreviewSuffixes = [".manus.computer", ".manuspre.computer"];
  const suffix = knownPreviewSuffixes.find((value) => hostname.endsWith(value));
  return suffix ? suffix : undefined;
}

/**
 * Session cookies intentionally remain host-only. The API host is the only
 * host that needs to receive the cookie because the Web client calls the API
 * with credentials: "include". Sharing a cookie with the parent preview
 * domain can mix sessions from different Manus projects and makes a valid
 * login look like an invalid session.
 */
export function getSessionCookieOptions(
  req: Request,
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);
  return {
    domain: undefined,
    httpOnly: true,
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure,
  };
}

/**
 * Compatibility-only options used to remove cookies created by the previous
 * parent-domain strategy. New cookies must never use this scope.
 */
export function getLegacySessionCookieOptions(
  req: Request,
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> | null {
  const domain = getLegacyParentDomain(req.hostname);
  if (!domain) return null;

  const secure = isSecureRequest(req);
  return {
    domain,
    httpOnly: true,
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure,
  };
}
