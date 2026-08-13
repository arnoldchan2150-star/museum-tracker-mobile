import { describe, expect, it } from "vitest";
import { ENV } from "../server/_core/env";
import { sdk } from "../server/_core/sdk";

describe("server session token", () => {
  it("creates a token that the server can verify", async () => {
    expect(ENV.appId).toBeTruthy();
    expect(ENV.cookieSecret).toBeTruthy();

    const token = await sdk.createSessionToken("session-regression-user", {
      name: "Session Regression User",
    });
    await expect(sdk.verifySession(token)).resolves.toMatchObject({
      openId: "session-regression-user",
      appId: ENV.appId,
      name: "Session Regression User",
    });
  });
});
