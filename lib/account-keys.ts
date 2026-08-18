export type AccountKey = string;

type AccountIdentity = { id: number; openId: string };

const ACCOUNT_STORAGE_PREFIX = "wanderstamp.account.v1";
export const GUEST_ACCOUNT_KEY = "guest";

function sanitize(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 96) || "anonymous";
}

export function getAccountKeyFromUser(user: Pick<AccountIdentity, "id" | "openId">): AccountKey {
  return sanitize(user.openId || String(user.id));
}

export function getAccountStorageKey(accountKey: AccountKey, resource: string): string {
  return `${ACCOUNT_STORAGE_PREFIX}.${sanitize(accountKey)}.${resource}`;
}

export function getAccountLabel(accountKey: AccountKey): string {
  return accountKey.length > 18 ? `${accountKey.slice(0, 18)}…` : accountKey;
}
