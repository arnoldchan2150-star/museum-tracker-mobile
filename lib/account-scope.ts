import * as Auth from "./_core/auth";
import { getAccountKeyFromUser, getAccountStorageKey, type AccountKey } from "./account-keys";

export { getAccountKeyFromUser, getAccountStorageKey, type AccountKey } from "./account-keys";

export async function getActiveAccountKey(): Promise<AccountKey | null> {
  const user = await Auth.getUserInfo();
  return user ? getAccountKeyFromUser(user) : null;
}

export async function requireActiveAccountKey(): Promise<AccountKey> {
  const accountKey = await getActiveAccountKey();
  if (!accountKey) throw new Error("請先登入自己的帳戶，才能使用個人足跡。");
  return accountKey;
}

export const legacyMuseumStorageKey = "wanderstamp.museums.v2";
export const legacyProfileStorageKey = "wanderstamp.profile.v1";
