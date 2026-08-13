import AsyncStorage from "@react-native-async-storage/async-storage";
import { backupLocalData } from "@/lib/cloud-sync";

const AUTO_SYNC_KEY = "wanderstamp.auto-sync.enabled";
const PENDING_SYNC_KEY = "wanderstamp.auto-sync.pending";
let timer: ReturnType<typeof setTimeout> | null = null;
let inFlight = false;
let queued = false;

export async function getAutoSyncEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(AUTO_SYNC_KEY)) !== "false";
}

export async function setAutoSyncEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(AUTO_SYNC_KEY, String(enabled));
  if (enabled && (await isPendingSync())) scheduleAutoSync();
}

export async function isPendingSync(): Promise<boolean> {
  return (await AsyncStorage.getItem(PENDING_SYNC_KEY)) === "true";
}

export async function markDataChanged(): Promise<void> {
  await AsyncStorage.setItem(PENDING_SYNC_KEY, "true");
  if (await getAutoSyncEnabled()) scheduleAutoSync();
}

export async function clearPendingSync(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_SYNC_KEY);
}

function scheduleAutoSync(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { timer = null; void retryPendingAutoSync(); }, 1500);
}

export async function retryPendingAutoSync(): Promise<boolean> {
  if (!(await getAutoSyncEnabled()) || !(await isPendingSync())) return false;
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
