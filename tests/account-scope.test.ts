import { describe, expect, it } from "vitest";
import { getAccountKeyFromUser, getAccountStorageKey } from "../lib/account-keys";

describe("account-scoped storage", () => {
  it("creates a stable namespace from the OAuth openId", () => {
    const first = getAccountKeyFromUser({ id: 1, openId: "user-alpha" });
    const second = getAccountKeyFromUser({ id: 2, openId: "user-beta" });

    expect(first).not.toBe(second);
    expect(getAccountStorageKey(first, "museums")).toContain("user-alpha");
    expect(getAccountStorageKey(second, "museums")).not.toBe(getAccountStorageKey(first, "museums"));
  });

  it("sanitizes namespace characters while keeping account separation", () => {
    const key = getAccountKeyFromUser({ id: 3, openId: "user/three@example.com" });
    expect(key).toBe("user_three_example.com");
    expect(getAccountStorageKey(key, "profile")).toBe("wanderstamp.account.v1.user_three_example.com.profile");
  });
});
