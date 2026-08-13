import { describe, expect, it } from "vitest";
import { getMuseumPhotos, normalizePhotos } from "../types/museum";

describe("museum photo album data", () => {
  it("normalizes legacy URI strings into photo items", () => {
    const photos = normalizePhotos(["https://example.com/old.jpg"]);
    expect(photos).toHaveLength(1);
    expect(photos[0]).toMatchObject({ uri: "https://example.com/old.jpg", description: "" });
    expect(photos[0].id).toContain("legacy-");
  });

  it("keeps an individual description for each photo", () => {
    const photos = getMuseumPhotos({ id: "m", name: "Museum", city: "Taipei", country: "Taiwan", visitedDate: "2026-01-01", note: "", createdAt: "2026-01-01", photos: [{ id: "p1", uri: "file://one.jpg", description: "入口的光影", createdAt: "2026-01-01" }, { id: "p2", uri: "file://two.jpg", description: "展廳中的作品", createdAt: "2026-01-01" }] });
    expect(photos.map((photo) => photo.description)).toEqual(["入口的光影", "展廳中的作品"]);
  });
});
