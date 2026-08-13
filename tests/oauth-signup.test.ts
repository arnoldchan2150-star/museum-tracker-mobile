import { describe, expect, it } from "vitest";
import { buildOAuthUrl } from "../lib/oauth-url";

describe("OAuth sign-up URL", () => {
  it("builds an isolated sign-up request with the correct type and state", () => {
    const url = new URL(
      buildOAuthUrl({
        portalUrl: "https://portal.example.test",
        appId: "wanderstamp-test",
        redirectUri: "https://api.example.test/api/oauth/callback",
        type: "signUp",
      }),
    );

    expect(url.pathname).toBe("/app-auth");
    expect(url.searchParams.get("appId")).toBe("wanderstamp-test");
    expect(url.searchParams.get("type")).toBe("signUp");
    expect(url.searchParams.get("redirectUri")).toBe("https://api.example.test/api/oauth/callback");
    expect(url.searchParams.get("state")).toBeTruthy();
  });
});
