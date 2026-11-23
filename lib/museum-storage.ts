import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAccountStorageKey, getActiveAccountKey, legacyMuseumStorageKey, legacyProfileStorageKey } from "@/lib/account-scope";
import { GUEST_ACCOUNT_KEY, getAccountKeyFromUser } from "@/lib/account-keys";
import type { MuseumDraft, MuseumItem, MuseumMedia, MuseumPhoto, UserProfile } from "@/types/museum";
import { DEFAULT_PROFILE, normalizeMuseum, normalizePhotos, normalizeProfile } from "@/types/museum";
export type { MuseumDraft } from "@/types/museum";

const MUSEUMS_RESOURCE = "museums";
const PROFILE_RESOURCE = "profile";

const photo = (uri: string, description = ""): MuseumPhoto => ({ id: `seed-${uri.slice(-24)}`, uri, type: "photo", description, createdAt: "2025-04-18T09:00:00.000Z" });

const SEED: MuseumItem[] = [
  { id: "louvre", name: "羅浮宮博物館", city: "巴黎", country: "法國", visitedDate: "2025-04-18", note: "第一次看見蒙娜麗莎，金字塔建築非常宏偉。", rating: 5, createdAt: "2025-04-18T09:00:00.000Z", photos: [photo("https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600", "抵達巴黎時拍下的城市與博物館周邊。")] },
  { id: "moma", name: "現代藝術博物館", city: "紐約", country: "美國", visitedDate: "2024-11-03", note: "現代繪畫與星夜真跡令人驚嘆。", rating: 4, createdAt: "2024-11-03T09:00:00.000Z", photos: [] },
  { id: "npm", name: "國立故宮博物院", city: "台北", country: "台灣", visitedDate: "2024-08-16", note: "翠玉白菜雕工細緻。", rating: 5, createdAt: "2024-08-16T09:00:00.000Z", photos: [] },
];

export type MuseumRecordDraft = Omit<MuseumItem, "id" | "createdAt">;

async function getRequiredAccount() {
  const accountKey = await getActiveAccountKey();
  return accountKey ?? GUEST_ACCOUNT_KEY;
}

async function isGuestStorage() {
  return (await getActiveAccountKey()) === null;
}

export async function hasLegacyDeviceData(): Promise<boolean> {
  const accountKey = await getRequiredAccount();
  if (!accountKey) return false;
  const [legacyMuseums, legacyProfile, dismissed] = await Promise.all([
    AsyncStorage.getItem(legacyMuseumStorageKey),
    AsyncStorage.getItem(legacyProfileStorageKey),
    AsyncStorage.getItem(getAccountStorageKey(accountKey, "legacy-dismissed")),
  ]);
  return Boolean((legacyMuseums || legacyProfile) && dismissed !== "true");
}

export async function importLegacyDeviceData(): Promise<{ museumCount: number; hasProfile: boolean }> {
  const accountKey = await getRequiredAccount();
  if (!accountKey) throw new Error("目前無法建立本機訪客資料空間，請稍後再試。");
  const [legacyMuseums, legacyProfile] = await Promise.all([
    AsyncStorage.getItem(legacyMuseumStorageKey),
    AsyncStorage.getItem(legacyProfileStorageKey),
  ]);
  let museums: MuseumItem[] = [];
  if (legacyMuseums) {
    try {
      const parsed = JSON.parse(legacyMuseums) as MuseumItem[];
      if (Array.isArray(parsed)) museums = parsed.map(normalizeMuseum);
    } catch {
      museums = [];
    }
  }
  if (museums.length) await AsyncStorage.setItem(getAccountStorageKey(accountKey, MUSEUMS_RESOURCE), JSON.stringify(museums));
  if (legacyProfile) {
    try {
      await AsyncStorage.setItem(getAccountStorageKey(accountKey, PROFILE_RESOURCE), JSON.stringify(normalizeProfile(JSON.parse(legacyProfile) as UserProfile)));
    } catch {
      // Ignore malformed legacy profile data.
    }
  }
  await Promise.all([
    AsyncStorage.removeItem(legacyMuseumStorageKey),
    AsyncStorage.removeItem(legacyProfileStorageKey),
    AsyncStorage.removeItem(getAccountStorageKey(accountKey, "legacy-dismissed")),
  ]);
  return { museumCount: museums.length, hasProfile: Boolean(legacyProfile) };
}

export async function discardLegacyDeviceData(): Promise<void> {
  const accountKey = await getRequiredAccount();
  if (accountKey) await AsyncStorage.setItem(getAccountStorageKey(accountKey, "legacy-dismissed"), "true");
}

/**
 * After signing in, move anything the user saved as a guest into their account
 * (merged by id), so it isn't left behind under the guest key. Returns how many museums moved.
 */
export async function moveGuestDataToAccount(userId: string): Promise<number> {
  const accountKey = getAccountKeyFromUser({ id: userId, openId: userId });
  const guestMuseumsKey = getAccountStorageKey(GUEST_ACCOUNT_KEY, MUSEUMS_RESOURCE);
  const guestProfileKey = getAccountStorageKey(GUEST_ACCOUNT_KEY, PROFILE_RESOURCE);
  const accountMuseumsKey = getAccountStorageKey(accountKey, MUSEUMS_RESOURCE);
  const accountProfileKey = getAccountStorageKey(accountKey, PROFILE_RESOURCE);
  const [guestMuseumsRaw, guestProfileRaw, accountMuseumsRaw, accountProfileRaw] = await Promise.all([
    AsyncStorage.getItem(guestMuseumsKey),
    AsyncStorage.getItem(guestProfileKey),
    AsyncStorage.getItem(accountMuseumsKey),
    AsyncStorage.getItem(accountProfileKey),
  ]);
  const parse = (raw: string | null): MuseumItem[] => { try { const v = raw ? JSON.parse(raw) : []; return Array.isArray(v) ? v.map(normalizeMuseum) : []; } catch { return []; } };
  const guestMuseums = parse(guestMuseumsRaw);
  if (guestMuseums.length) {
    const merged = new Map<string, MuseumItem>();
    parse(accountMuseumsRaw).forEach((item) => merged.set(item.id, item));
    guestMuseums.forEach((item) => { if (!merged.has(item.id)) merged.set(item.id, item); });
    await AsyncStorage.setItem(accountMuseumsKey, JSON.stringify(sortMuseums(Array.from(merged.values()))));
  }
  if (guestProfileRaw && !accountProfileRaw) await AsyncStorage.setItem(accountProfileKey, guestProfileRaw);
  if (guestMuseumsRaw || guestProfileRaw) await Promise.all([AsyncStorage.removeItem(guestMuseumsKey), AsyncStorage.removeItem(guestProfileKey)]);
  return guestMuseums.length;
}

export async function getMuseums(): Promise<MuseumItem[]> {
  const accountKey = await getRequiredAccount();
  const raw = await AsyncStorage.getItem(getAccountStorageKey(accountKey, MUSEUMS_RESOURCE));
  if (!raw) return (await isGuestStorage()) ? SEED.map(normalizeMuseum) : [];
  try {
    return (JSON.parse(raw) as MuseumItem[]).map(normalizeMuseum);
  } catch {
    return [];
  }
}

export async function saveMuseums(items: MuseumItem[]): Promise<void> {
  const accountKey = await getRequiredAccount();
  await AsyncStorage.setItem(getAccountStorageKey(accountKey, MUSEUMS_RESOURCE), JSON.stringify(items.map(normalizeMuseum)));
}

export async function addMuseum(draft: MuseumDraft): Promise<MuseumItem> {
  const item = normalizeMuseum({ ...draft, id: String(Date.now()), createdAt: new Date().toISOString(), photos: draft.photos ?? [] });
  await saveMuseums([item, ...(await getMuseums())]);
  return item;
}

export async function updateMuseumMedia(id: string, media: MuseumMedia[]): Promise<MuseumItem[]> {
  const items = await getMuseums();
  const updated = items.map((museum) => museum.id === id ? normalizeMuseum({ ...museum, media }) : museum);
  await saveMuseums(updated);
  return updated;
}

export async function updateMuseumPhotos(id: string, photos: MuseumPhoto[]): Promise<MuseumItem[]> {
  return updateMuseumMedia(id, photos);
}

export async function updateMuseumMediaDescription(museumId: string, mediaId: string, description: string): Promise<MuseumItem[]> {
  const items = await getMuseums();
  const updated = items.map((museum) => museum.id === museumId ? normalizeMuseum({ ...museum, media: museum.media?.map((item) => item.id === mediaId ? { ...item, description } : item) }) : museum);
  await saveMuseums(updated);
  return updated;
}

export async function updateMuseumPhotoDescription(museumId: string, photoId: string, description: string): Promise<MuseumItem[]> {
  return updateMuseumMediaDescription(museumId, photoId, description);
}

export async function getStoredProfile(): Promise<UserProfile> {
  const accountKey = await getRequiredAccount();
  if (!accountKey) return DEFAULT_PROFILE;
  try {
    const json = await AsyncStorage.getItem(getAccountStorageKey(accountKey, PROFILE_RESOURCE));
    return json ? normalizeProfile(JSON.parse(json) as UserProfile) : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveStoredProfile(profile: UserProfile): Promise<void> {
  const accountKey = await getRequiredAccount();
  try {
    await AsyncStorage.setItem(getAccountStorageKey(accountKey, PROFILE_RESOURCE), JSON.stringify(normalizeProfile(profile)));
  } catch (error) {
    console.error("Failed to save profile", error);
  }
}

export function sortMuseums(items: MuseumItem[]) { return [...items].sort((a, b) => b.visitedDate.localeCompare(a.visitedDate)); }
export function searchMuseums(items: MuseumItem[], query: string) { const q = query.trim().toLowerCase(); return q ? items.filter((m) => [m.name, m.city, m.country, m.note].some((v) => v.toLowerCase().includes(q))) : items; }
export function getCountries(items: MuseumItem[]) { return Array.from(new Set(items.map((m) => m.country))).sort(); }
export function getYears(items: MuseumItem[]) { return Array.from(new Set(items.map((m) => m.visitedDate.slice(0, 4)))).sort().reverse(); }
export function getStats(items: MuseumItem[]) { return { museums: items.length, countries: new Set(items.map((m) => m.country)).size, cities: new Set(items.map((m) => m.city)).size }; }
export function formatVisitedDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString("zh-TW", { year: "numeric", month: "short", day: "numeric" }); }
export function getInitials(value: string) { return value.trim().slice(0, 1) || "M"; }
export function getStars(value = 0) { return "★".repeat(Math.max(0, Math.min(5, value))); }
export function getPalette(index: number) { const list = [{ background: "#DCEEF2", ink: "#0A5E75" }, { background: "#F4E7D0", ink: "#8A5A16" }, { background: "#E8E2F2", ink: "#69518A" }]; return list[index % list.length]; }
export const demoMuseums = SEED;
export const museumStorageKey = "wanderstamp.account.v1.<account>.museums";
export function getDraft(): MuseumRecordDraft { return { name: "", city: "", country: "", visitedDate: new Date().toISOString().slice(0, 10), note: "", rating: 0, photos: [], media: [] }; }
export function isDraftValid(draft: MuseumRecordDraft) { return Boolean(draft.name.trim() && draft.city.trim() && draft.country.trim()); }
export function getMuseumSummary(museum: MuseumItem) { return `${museum.city} · ${museum.country}`; }
export function getMuseumNote(museum: MuseumItem) { return museum.note || "尚未留下參觀筆記"; }
export function getStorageStatus() { return "訪客資料保存在本機 · 登入後可跨裝置同步"; }
export function resetMuseums() { return saveMuseums([]); }
export function getRecentMuseums(items: MuseumItem[], limit = 3) { return sortMuseums(items).slice(0, limit); }
export function filterMuseums(items: MuseumItem[], country: string | null, year: string | null) { return items.filter((m) => (!country || m.country === country) && (!year || m.visitedDate.startsWith(year))); }
export function getAccessibilityLabel(museum: MuseumItem) { return `${museum.name}，${getMuseumSummary(museum)}`; }
export function getWelcomeCopy(count: number) { return count ? "每一次造訪，都是下一段旅程的印章。" : "從第一間博物館開始，收藏你的文化足跡。"; }
export function getBadgeLabel(count: number) { return count >= 10 ? "展覽收藏家" : count >= 5 ? "博物館探索者" : "旅印新手"; }
export function getFilterLabel(country: string | null, year: string | null) { return country && year ? `${country} · ${year}` : country || year || "全部足跡"; }
export function getEmptySearchCopy(query: string) { return query ? "找不到符合的博物館" : "還沒有博物館足跡"; }
export function getProfileCopy(count: number) { return `已累積 ${count} 個博物館足跡，繼續探索吧。`; }
export function getProfileSubtitle() { return "把看過的展覽，留成未來的靈感。"; }
export function getProfileFooter() { return "Wanderstamp · 讓文化旅行留下印記"; }
export function getRoadmapItems() { return ["展品照片", "世界地圖", "雲端同步", "年度 PDF 護照"]; }
export function getRoadmapCopy() { return "先把核心紀錄流程做好，再接上照片、地圖與雲端同步。"; }
export function getValidationCopy() { return "請先填寫博物館名稱、城市與國家。"; }
export function getSavedCopy(name: string) { return `${name} 已加入你的博物館護照。`; }
export function getRatingHint(rating: number) { return rating ? `你的評分：${rating} 顆星` : "點選星星留下評分"; }
export function getFormHint() { return "先記下最重要的三件事：在哪裡、何時去、留下什麼感受。"; }
