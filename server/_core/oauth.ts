import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import type { Express, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { getUserByOpenId, upsertUser } from "../db";
import { getLegacySessionCookieOptions, getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { getAppleAudiences } from "./apple-audience";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || "com.app.museumtrackermobile";
const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

async function syncUser(userInfo: {
  openId?: string | null;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  platform?: string | null;
}) {
  if (!userInfo.openId) {
    throw new Error("openId missing from user info");
  }

  const lastSignedIn = new Date();
  await upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email ?? null,
    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
    lastSignedIn,
  });
  const saved = await getUserByOpenId(userInfo.openId);
  return (
    saved ?? {
      openId: userInfo.openId,
      name: userInfo.name,
      email: userInfo.email,
      loginMethod: userInfo.loginMethod ?? null,
      lastSignedIn,
    }
  );
}

function buildUserResponse(
  user:
    | Awaited<ReturnType<typeof getUserByOpenId>>
    | {
        openId: string;
        name?: string | null;
        email?: string | null;
        loginMethod?: string | null;
        lastSignedIn?: Date | null;
      },
) {
  return {
    id: (user as any)?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
  };
}

function clearLegacySessionCookie(req: Request, res: Response) {
  const legacyOptions = getLegacySessionCookieOptions(req);
  if (legacyOptions) {
    res.clearCookie(COOKIE_NAME, legacyOptions);
  }
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      await syncUser(userInfo);
      const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      clearLegacySessionCookie(req, res);

      // Redirect to the frontend URL (Expo web on port 8081)
      // The new cookie is host-only and is sent with API requests using credentials: include.
      const frontendUrl =
        process.env.EXPO_WEB_PREVIEW_URL ||
        process.env.EXPO_PACKAGER_PROXY_URL ||
        "http://localhost:8081";
      res.redirect(302, frontendUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  app.post("/api/oauth/apple", async (req: Request, res: Response) => {
    const body = req.body as {
      identityToken?: unknown;
      authorizationCode?: unknown;
      nonce?: unknown;
      user?: unknown;
      email?: unknown;
      name?: unknown;
    };
    const identityToken = typeof body.identityToken === "string" ? body.identityToken : "";
    const nonce = typeof body.nonce === "string" ? body.nonce : "";
    const requestedUser = typeof body.user === "string" ? body.user : "";

    if (!identityToken || !nonce || !requestedUser) {
      res.status(400).json({ error: "Apple identityToken, nonce, and user are required" });
      return;
    }

    try {
      // Expo Go issues an Apple token for host.exp.Exponent. Accept it only on the
      // development server; production/TestFlight must use the app's bundle ID.
      const expectedAudiences = getAppleAudiences(APPLE_CLIENT_ID);
      let verifiedPayload: JWTPayload | null = null;
      let lastJwtError: unknown = null;

      for (const aud of expectedAudiences) {
        try {
          const { payload } = await jwtVerify(identityToken, appleJwks, {
            issuer: APPLE_ISSUER,
            audience: aud,
            algorithms: ["RS256"],
          });
          verifiedPayload = payload;
          break;
        } catch (err) {
          lastJwtError = err;
        }
      }

      if (!verifiedPayload) {
        console.error("[OAuth] Apple token JWT verification failed for all audiences:", lastJwtError);
        res.status(401).json({ error: "Apple identity verification failed: audience mismatch" });
        return;
      }
      const payload = verifiedPayload;
      const subject = typeof payload.sub === "string" ? payload.sub : "";
      const tokenNonce = typeof payload.nonce === "string" ? payload.nonce : "";
      if (!subject || subject !== requestedUser || tokenNonce !== nonce) {
        res.status(401).json({ error: "Apple identity verification failed" });
        return;
      }

      const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : null;
      const email = typeof payload.email === "string" ? payload.email : typeof body.email === "string" ? body.email.trim().slice(0, 320) : null;
      const user = await syncUser({ openId: subject, name, email, loginMethod: "apple" });
      const sessionToken = await sdk.createSessionToken(subject, {
        name: user.name || name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      clearLegacySessionCookie(req, res);
      res.json({ app_session_id: sessionToken, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[OAuth] Apple sign-in verification failed", error);
      res.status(401).json({ error: "Apple sign-in verification failed" });
    }
  });

  app.get("/api/oauth/mobile", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      const user = await syncUser(userInfo);

      const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      clearLegacySessionCookie(req, res);

      res.json({
        app_session_id: sessionToken,
        user: buildUserResponse(user),
      });
    } catch (error) {
      console.error("[OAuth] Mobile exchange failed", error);
      res.status(500).json({ error: "OAuth mobile exchange failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    clearLegacySessionCookie(req, res);
    res.json({ success: true });
  });

  // Get current authenticated user - works with both cookie (web) and Bearer token (mobile)
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error);
      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(COOKIE_NAME, cookieOptions);
      clearLegacySessionCookie(req, res);
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });

  // Establish session cookie from Bearer token
  // Used by iframe preview: frontend receives token via postMessage, then calls this endpoint
  // to get a proper Set-Cookie response from the backend (3000-xxx domain)
  app.post("/api/auth/session", async (req: Request, res: Response) => {
    try {
      // Authenticate using Bearer token from Authorization header
      const user = await sdk.authenticateRequest(req);

      // Get the token from the Authorization header to set as cookie
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      const token = authHeader.slice("Bearer ".length).trim();

      // Set cookie for this domain (3000-xxx)
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/session failed:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  });
}
