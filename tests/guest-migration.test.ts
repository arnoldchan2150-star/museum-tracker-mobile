import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => { store.set(k, v); },
    removeItem: async (k: string) => { store.delete(k); },
  },
}));
vi.mock("@/lib/account-scope", async () => {
  const keys = await import("../lib/account-keys");
  return { ...keys, getActiveAccountKey: async () => null, legacyMuseumStorageKey: "legacy.m", legacyProfileStorageKey: "legacy.p" };
});

const { moveGuestDataToAccount } = await import("../lib/museum-storage");
const { getAccountStorageKey, GUEST_ACCOUNT_KEY } = await import("../lib/account-keys");

const museum = (id: string, visitedDate: string) => ({ id, name: id, city: "台北", country: "台灣", visitedDate, note: "", createdAt: visitedDate, media: [] });

describe("moving guest data into an account after sign-in", () => {
  beforeEach(() => store.clear());

  it("moves guest museums and profile, then clears the guest copy", async () => {
    store.set(getAccountStorageKey(GUEST_ACCOUNT_KEY, "museums"), JSON.stringify([museum("g1", "2026-01-01")]));
    store.set(getAccountStorageKey(GUEST_ACCOUNT_KEY, "profile"), JSON.stringify({ name: "Arnold", title: "", bio: "" }));

    expect(await moveGuestDataToAccount("user-1")).toBe(1);

    const moved = JSON.parse(store.get(getAccountStorageKey("user-1", "museums"))!);
    expect(moved.map((m: { id: string }) => m.id)).toEqual(["g1"]);
    expect(JSON.parse(store.get(getAccountStorageKey("user-1", "profile"))!).name).toBe("Arnold");
    expect(store.has(getAccountStorageKey(GUEST_ACCOUNT_KEY, "museums"))).toBe(false);
  });

  it("merges with existing account museums and keeps the account profile", async () => {
    store.set(getAccountStorageKey("user-1", "museums"), JSON.stringify([museum("a1", "2025-05-01")]));
    store.set(getAccountStorageKey("user-1", "profile"), JSON.stringify({ name: "Account", title: "", bio: "" }));
    store.set(getAccountStorageKey(GUEST_ACCOUNT_KEY, "museums"), JSON.stringify([museum("g1", "2026-01-01"), museum("a1", "1999-01-01")]));
    store.set(getAccountStorageKey(GUEST_ACCOUNT_KEY, "profile"), JSON.stringify({ name: "Guest", title: "", bio: "" }));

    await moveGuestDataToAccount("user-1");

    const merged = JSON.parse(store.get(getAccountStorageKey("user-1", "museums"))!);
    expect(merged.map((m: { id: string; visitedDate: string }) => [m.id, m.visitedDate])).toEqual([["g1", "2026-01-01"], ["a1", "2025-05-01"]]);
    expect(JSON.parse(store.get(getAccountStorageKey("user-1", "profile"))!).name).toBe("Account");
  });

  it("does nothing when there is no guest data", async () => {
    expect(await moveGuestDataToAccount("user-1")).toBe(0);
    expect(store.size).toBe(0);
  });
});
