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

  it("accepts provider sessions when the identity provider omits a display name", async () => {
    const token = await sdk.createSessionToken("provider-user-without-name");
    await expect(sdk.verifySession(token)).resolves.toMatchObject({
      openId: "provider-user-without-name",
      appId: ENV.appId,
      name: "",
    });
  });
});
