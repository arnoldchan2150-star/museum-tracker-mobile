import AsyncStorage from "@react-native-async-storage/async-storage";
import { backupLocalData } from "@/lib/cloud-sync";
import { getAccountStorageKey, getActiveAccountKey } from "@/lib/account-scope";

const AUTO_SYNC_RESOURCE = "auto-sync.enabled";
const PENDING_SYNC_RESOURCE = "auto-sync.pending";
let timer: ReturnType<typeof setTimeout> | null = null;
let inFlight = false;
let queued = false;

async function getScopedKey(resource: string): Promise<string | null> {
  const accountKey = await getActiveAccountKey();
  return accountKey ? getAccountStorageKey(accountKey, resource) : null;
}

export async function getAutoSyncEnabled(): Promise<boolean> {
  const key = await getScopedKey(AUTO_SYNC_RESOURCE);
  if (!key) return false;
  const value = await AsyncStorage.getItem(key);
  return value !== "false";
}

export async function setAutoSyncEnabled(enabled: boolean): Promise<void> {
  const key = await getScopedKey(AUTO_SYNC_RESOURCE);
  if (!key) return;
  await AsyncStorage.setItem(key, String(enabled));
  if (enabled && (await isPendingSync())) scheduleAutoSync();
}

export async function isPendingSync(): Promise<boolean> {
  const key = await getScopedKey(PENDING_SYNC_RESOURCE);
  if (!key) return false;
  return (await AsyncStorage.getItem(key)) === "true";
}

export async function markDataChanged(): Promise<void> {
  const key = await getScopedKey(PENDING_SYNC_RESOURCE);
  if (!key) return;
  await AsyncStorage.setItem(key, "true");
  if (await getAutoSyncEnabled()) scheduleAutoSync();
}

export async function clearPendingSync(): Promise<void> {
  const key = await getScopedKey(PENDING_SYNC_RESOURCE);
  if (key) await AsyncStorage.removeItem(key);
}

export function cancelAutoSyncRuntime(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  queued = false;
}

function scheduleAutoSync(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { timer = null; void retryPendingAutoSync(); }, 1500);
}

export async function retryPendingAutoSync(): Promise<boolean> {
  const accountKey = await getActiveAccountKey();
  if (!accountKey || !(await getAutoSyncEnabled()) || !(await isPendingSync())) return false;
  if (inFlight) { queued = true; return false; }
  inFlight = true;
  try {
    await backupLocalData();
    await clearPendingSync();
    return true;
  } catch (error) {
    console.warn("[AutoSync] Backup postponed:", error instanceof Error ? error.message : error);
    return false;
  } finally {
    inFlight = false;
    if (queued) { queued = false; scheduleAutoSync(); }
  }
}
