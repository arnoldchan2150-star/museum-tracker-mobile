import { describe, expect, it } from "vitest";
import { getGuestMuseums, getGuestProfile } from "../lib/guest-preview";

describe("guest preview data", () => {
  it("provides a useful read-only museum collection", () => {
    const museums = getGuestMuseums();
    expect(museums.length).toBeGreaterThanOrEqual(3);
    expect(museums.every((museum) => museum.latitude !== undefined && museum.longitude !== undefined)).toBe(true);
  });

  it("returns cloned demo data so preview interactions cannot mutate the source", () => {
    const first = getGuestMuseums();
    const second = getGuestMuseums();
    first[0].name = "Changed only in this preview";
    expect(second[0].name).not.toBe(first[0].name);
    expect(getGuestProfile()).toMatchObject({ title: "Cultural traveller" });
  });
});
