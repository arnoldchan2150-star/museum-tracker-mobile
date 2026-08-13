import { describe, expect, it } from "vitest";
import { getLegacySessionCookieOptions, getSessionCookieOptions } from "../server/_core/cookies";

describe("session cookie scope", () => {
  it("keeps the session cookie host-only for preview API requests", () => {
    const options = getSessionCookieOptions({
      protocol: "https",
      hostname: "3000-project.sg1.manus.computer",
      headers: { "x-forwarded-proto": "https" },
    } as any);

    expect(options.domain).toBeUndefined();
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("none");
    expect(options.secure).toBe(true);
  });

  it("uses lax cookies for local HTTP development", () => {
    const options = getSessionCookieOptions({
      protocol: "http",
      hostname: "localhost",
      headers: {},
    } as any);

    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(false);
  });

  it("recognizes the legacy preview parent domain only for cleanup", () => {
    const options = getLegacySessionCookieOptions({
      protocol: "https",
      hostname: "3000-project.sg1.manus.computer",
      headers: { "x-forwarded-proto": "https" },
    } as any);

    expect(options?.domain).toBe(".manus.computer");
  });
});
