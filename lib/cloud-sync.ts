import { getApiBaseUrl } from "@/constants/oauth";
import { createTRPCClient } from "@/lib/trpc";
import { getMuseums, getStoredProfile, saveMuseums, saveStoredProfile } from "@/lib/museum-storage";
import { getActiveAccountKey } from "@/lib/account-scope";
import { getMuseumMedia, normalizeMuseum, normalizeProfile, type MuseumItem, type MuseumMedia, type UserProfile } from "@/types/museum";

const SYNC_VERSION = 1;
const client = createTRPCClient();

type CloudSnapshot = { version: number; updatedAt: string; museums: MuseumItem[]; profile: UserProfile };

function isLocalUri(uri: string): boolean {
  return /^(file|content|ph|blob|data):/i.test(uri);
}

function getContentType(media: MuseumMedia): string {
  if (media.type === "video") return "video/mp4";
  const lower = media.uri.toLowerCase();
  if (lower.includes(".png")) return "image/png";
  if (lower.includes(".webp")) return "image/webp";
  return "image/jpeg";
}

function getFileName(media: MuseumMedia): string {
  const extension = media.type === "video" ? "mp4" : "jpg";
  return `${media.id}.${extension}`;
}

function resolveRemoteUri(uri: string): string {
  if (/^https?:\/\//i.test(uri)) return uri;
  if (uri.startsWith("/")) return `${getApiBaseUrl()}${uri}`;
  return uri;
}

async function uploadMedia(media: MuseumMedia): Promise<MuseumMedia> {
  if (!isLocalUri(media.uri)) return media;
  const source = await fetch(media.uri);
  if (!source.ok) throw new Error(`無法讀取媒體：${media.id}`);
  const blob = await source.blob();
  const contentType = blob.type || getContentType(media);
  const prepared = await client.cloudSync.prepareUpload.mutate({ fileName: getFileName(media), contentType });
  const uploaded = await fetch(prepared.uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: blob });
  if (!uploaded.ok) throw new Error(`媒體上傳失敗：${media.id}`);
  return { ...media, uri: prepared.url };
}

function mergeMedia(local: MuseumMedia[], remote: MuseumMedia[]): MuseumMedia[] {
  const result = new Map<string, MuseumMedia>();
  local.forEach((item) => result.set(item.id, item));
  remote.forEach((item) => result.set(item.id, item));
  return Array.from(result.values());
}

function mergeMuseums(local: MuseumItem[], remote: MuseumItem[]): MuseumItem[] {
  const result = new Map<string, MuseumItem>();
  local.forEach((item) => result.set(item.id, normalizeMuseum(item)));
  remote.forEach((item) => {
    const existing = result.get(item.id);
    result.set(item.id, normalizeMuseum(existing ? { ...existing, ...item, media: mergeMedia(getMuseumMedia(existing), getMuseumMedia(item)) } : item));
  });
  return Array.from(result.values()).sort((a, b) => b.visitedDate.localeCompare(a.visitedDate));
}

function parseSnapshot(payload: string): CloudSnapshot {
  const parsed = JSON.parse(payload) as Partial<CloudSnapshot>;
  if (!Array.isArray(parsed.museums) || !parsed.profile || typeof parsed.updatedAt !== "string") throw new Error("雲端備份格式無效");
  return { version: typeof parsed.version === "number" ? parsed.version : SYNC_VERSION, updatedAt: parsed.updatedAt, museums: parsed.museums.map((item) => normalizeMuseum({ ...(item as MuseumItem), media: getMuseumMedia(item as MuseumItem).map((media) => ({ ...media, uri: resolveRemoteUri(media.uri) })) })), profile: normalizeProfile(parsed.profile) };
}

export async function backupLocalData(): Promise<{ updatedAt: string; mediaCount: number }> {
  if (!(await getActiveAccountKey())) throw new Error("請先登入自己的帳戶，再進行雲端備份。");
  const [museums, profile] = await Promise.all([getMuseums(), getStoredProfile()]);
  const uploadedMuseums: MuseumItem[] = [];
  let mediaCount = 0;
  for (const museum of museums) {
    const media = getMuseumMedia(museum);
    const uploadedMedia: MuseumMedia[] = [];
    for (const item of media) {
      uploadedMedia.push(await uploadMedia(item));
      mediaCount += 1;
    }
    uploadedMuseums.push(normalizeMuseum({ ...museum, media: uploadedMedia }));
  }
  const updatedAt = new Date().toISOString();
  await client.cloudSync.save.mutate({ version: SYNC_VERSION, updatedAt, museums: uploadedMuseums, profile: { name: profile.name, title: profile.title, bio: profile.bio, avatar: profile.avatar ?? "", avatarUri: profile.avatarUri ?? "" } });
  await saveMuseums(uploadedMuseums);
  return { updatedAt, mediaCount };
}

export async function restoreCloudData(): Promise<{ updatedAt: string; museumCount: number; mediaCount: number } | null> {
  if (!(await getActiveAccountKey())) throw new Error("請先登入自己的帳戶，再從雲端還原。");
  const remote = await client.cloudSync.get.query();
  if (!remote) return null;
  const snapshot = parseSnapshot(remote.payload);
  const [localMuseums, localProfile] = await Promise.all([getMuseums(), getStoredProfile()]);
  const merged = mergeMuseums(localMuseums, snapshot.museums);
  await saveMuseums(merged);
  await saveStoredProfile({ ...localProfile, ...snapshot.profile });
  const mediaCount = merged.reduce((sum, museum) => sum + getMuseumMedia(museum).length, 0);
  return { updatedAt: snapshot.updatedAt, museumCount: merged.length, mediaCount };
}

export function formatSyncTime(value: string | null): string {
  if (!value) return "尚未同步";
  return new Date(value).toLocaleString("zh-TW", { dateStyle: "medium", timeStyle: "short" });
}
