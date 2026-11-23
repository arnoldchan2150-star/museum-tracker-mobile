import * as Crypto from "expo-crypto";
import { getMuseums, getStoredProfile, saveMuseums, saveStoredProfile } from "@/lib/museum-storage";
import { getSession } from "@/lib/_core/auth";
import { BACKUP_TABLE, MEDIA_BUCKET, requireSupabase } from "@/lib/supabase";
import { getMuseumMedia, normalizeMuseum, normalizeProfile, type MuseumItem, type MuseumMedia, type UserProfile } from "@/types/museum";

const SYNC_VERSION = 1;

type CloudSnapshot = { version: number; updatedAt: string; museums: MuseumItem[]; profile: UserProfile };

export function isLocalUri(uri: string): boolean {
  return /^(file|content|ph|blob|data|assets-library):/i.test(uri);
}

function getContentType(media: MuseumMedia): string {
  if (media.type === "video") return media.uri.toLowerCase().includes(".mov") ? "video/quicktime" : "video/mp4";
  const lower = media.uri.toLowerCase();
  if (lower.includes(".png") || lower.startsWith("data:image/png")) return "image/png";
  if (lower.includes(".webp") || lower.startsWith("data:image/webp")) return "image/webp";
  if (lower.includes(".heic")) return "image/heic";
  return "image/jpeg";
}

function getExtension(contentType: string): string {
  return ({ "image/png": "png", "image/webp": "webp", "image/heic": "heic", "video/quicktime": "mov", "video/mp4": "mp4" } as Record<string, string>)[contentType] ?? "jpg";
}

async function requireUserId(message: string): Promise<string> {
  const session = await getSession();
  if (!session?.user) throw new Error(message);
  return session.user.id;
}

async function uploadMedia(userId: string, media: MuseumMedia): Promise<MuseumMedia> {
  if (!isLocalUri(media.uri)) return media;
  const client = requireSupabase();
  const source = await fetch(media.uri);
  if (!source.ok && source.status !== 0) throw new Error(`無法讀取媒體：${media.id}`);
  const body = await source.arrayBuffer();
  const contentType = getContentType(media);
  // Random file name so public URLs can't be guessed.
  const path = `${userId}/${Crypto.randomUUID()}.${getExtension(contentType)}`;
  const { error } = await client.storage.from(MEDIA_BUCKET).upload(path, body, { contentType, upsert: false });
  if (error) throw new Error(`媒體上傳失敗：${error.message}`);
  const { data } = client.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { ...media, uri: data.publicUrl };
}

function mergeMedia(local: MuseumMedia[], remote: MuseumMedia[]): MuseumMedia[] {
  const result = new Map<string, MuseumMedia>();
  local.forEach((item) => result.set(item.id, item));
  remote.forEach((item) => result.set(item.id, item));
  return Array.from(result.values());
}

export function mergeMuseums(local: MuseumItem[], remote: MuseumItem[]): MuseumItem[] {
  const result = new Map<string, MuseumItem>();
  local.forEach((item) => result.set(item.id, normalizeMuseum(item)));
  remote.forEach((item) => {
    const existing = result.get(item.id);
    result.set(item.id, normalizeMuseum(existing ? { ...existing, ...item, media: mergeMedia(getMuseumMedia(existing), getMuseumMedia(item)) } : item));
  });
  return Array.from(result.values()).sort((a, b) => b.visitedDate.localeCompare(a.visitedDate));
}

function parseSnapshot(payload: unknown): CloudSnapshot {
  const parsed = (typeof payload === "string" ? JSON.parse(payload) : payload) as Partial<CloudSnapshot>;
  if (!parsed || !Array.isArray(parsed.museums) || !parsed.profile || typeof parsed.updatedAt !== "string") throw new Error("雲端備份格式無效");
  return {
    version: typeof parsed.version === "number" ? parsed.version : SYNC_VERSION,
    updatedAt: parsed.updatedAt,
    museums: parsed.museums.map((item) => normalizeMuseum(item as MuseumItem)),
    profile: normalizeProfile(parsed.profile),
  };
}

export async function backupLocalData(): Promise<{ updatedAt: string; mediaCount: number }> {
  const client = requireSupabase();
  const userId = await requireUserId("請先登入自己的帳戶，再進行雲端備份。");
  const [museums, profile] = await Promise.all([getMuseums(), getStoredProfile()]);
  const uploadedMuseums: MuseumItem[] = [];
  let mediaCount = 0;
  for (const museum of museums) {
    const uploadedMedia: MuseumMedia[] = [];
    for (const item of getMuseumMedia(museum)) {
      uploadedMedia.push(await uploadMedia(userId, item));
      mediaCount += 1;
    }
    uploadedMuseums.push(normalizeMuseum({ ...museum, media: uploadedMedia }));
  }
  // Save uploaded URLs locally first, so a later failure never re-uploads the same files.
  await saveMuseums(uploadedMuseums);

  const updatedAt = new Date().toISOString();
  const snapshot: CloudSnapshot = {
    version: SYNC_VERSION,
    updatedAt,
    museums: uploadedMuseums,
    profile: { name: profile.name, title: profile.title, bio: profile.bio, avatar: profile.avatar ?? "", avatarUri: profile.avatarUri ?? "" },
  };
  const { error } = await client.from(BACKUP_TABLE).upsert({ user_id: userId, payload: snapshot, version: SYNC_VERSION, updated_at: updatedAt }, { onConflict: "user_id" });
  if (error) throw new Error(`雲端備份失敗：${error.message}`);
  return { updatedAt, mediaCount };
}

export async function restoreCloudData(): Promise<{ updatedAt: string; museumCount: number; mediaCount: number } | null> {
  const client = requireSupabase();
  const userId = await requireUserId("請先登入自己的帳戶，再從雲端還原。");
  const { data, error } = await client.from(BACKUP_TABLE).select("payload").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`讀取雲端備份失敗：${error.message}`);
  if (!data) return null;
  const snapshot = parseSnapshot(data.payload);
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
