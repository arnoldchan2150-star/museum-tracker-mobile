import { describe, expect, it } from "vitest";
import { getAppleAudiences } from "../server/_core/apple-audience";

describe("getAppleAudiences", () => {
  it("accepts Expo Go audience only in development", () => {
    expect(getAppleAudiences("com.app.museumtrackermobile", "development")).toEqual([
      "com.app.museumtrackermobile",
      "host.exp.Exponent",
    ]);
  });

  it("keeps production restricted to the configured Apple client ID", () => {
    expect(getAppleAudiences("com.app.museumtrackermobile", "production")).toEqual([
      "com.app.museumtrackermobile",
    ]);
  });
});
