export interface MuseumPhoto {
  id: string;
  uri: string;
  description: string;
  createdAt: string;
}

export interface MuseumItem {
  id: string;
  name: string;
  city: string;
  country: string;
  visitedDate: string;
  note: string;
  rating?: number;
  createdAt: string;
  photos?: MuseumPhoto[] | string[];
  latitude?: number;
  longitude?: number;
}

export type MuseumRecord = MuseumItem;
export type MuseumDraft = Omit<MuseumItem, "id" | "createdAt">;

export interface UserProfile {
  name: string;
  title: string;
  bio: string;
  avatar?: string;
  avatarUri?: string;
}

export const DEFAULT_PROFILE: UserProfile = { name: "", title: "", bio: "", avatar: "", avatarUri: undefined };

export function normalizePhotos(photos?: MuseumItem["photos"]): MuseumPhoto[] {
  if (!Array.isArray(photos)) return [];
  return photos.filter(Boolean).map((photo, index) => {
    if (typeof photo === "string") {
      return { id: `legacy-${index}-${photo.slice(-18)}`, uri: photo, description: "", createdAt: "1970-01-01T00:00:00.000Z" };
    }
    return { id: photo.id || `photo-${index}`, uri: photo.uri, description: photo.description ?? "", createdAt: photo.createdAt || "1970-01-01T00:00:00.000Z" };
  }).filter((photo) => Boolean(photo.uri));
}

export function getMuseumPhotos(museum: MuseumItem): MuseumPhoto[] { return normalizePhotos(museum.photos); }

export function getMuseumCoordinates(museum: MuseumItem): { latitude: number; longitude: number } {
  if (museum.latitude !== undefined && museum.longitude !== undefined) return { latitude: museum.latitude, longitude: museum.longitude };
  const known: Record<string, { latitude: number; longitude: number }> = {
    "羅浮宮博物館": { latitude: 48.8606, longitude: 2.3376 },
    "現代藝術博物館": { latitude: 40.7614, longitude: -73.9776 },
    "國立故宮博物院": { latitude: 25.1024, longitude: 121.5485 },
  };
  return known[museum.name] ?? { latitude: 25.033, longitude: 121.5654 };
}

export function normalizeMuseum(museum: MuseumItem): MuseumItem { return { ...museum, photos: normalizePhotos(museum.photos), ...getMuseumCoordinates(museum) }; }
export function normalizeProfile(profile?: Partial<UserProfile>): UserProfile { return { ...DEFAULT_PROFILE, ...profile }; }
export function getProfileInitial(profile: UserProfile): string { return profile.name.trim().slice(0, 1).toUpperCase() || "M"; }
export function getPhotoCount(museum: MuseumItem): number { return getMuseumPhotos(museum).length; }
export function mergeMuseumPhotos(museum: MuseumItem, photos: MuseumPhoto[]): MuseumItem { return normalizeMuseum({ ...museum, photos: [...getMuseumPhotos(museum), ...photos] }); }
export function removeMuseumPhoto(museum: MuseumItem, photoId: string): MuseumItem { return normalizeMuseum({ ...museum, photos: getMuseumPhotos(museum).filter((photo) => photo.id !== photoId) }); }
export function getMapRegion() { return { latitude: 25, longitude: 20, latitudeDelta: 80, longitudeDelta: 140 }; }
export function getMuseumLabel(museum: MuseumItem): string { return `${museum.name} · ${museum.city}`; }
export function getProfileDisplayName(profile: UserProfile): string { return profile.name.trim() || "旅印收藏家"; }
export function getProfileDisplayTitle(profile: UserProfile): string { return profile.title.trim() || "藝文旅行者"; }
export function getProfileDisplayBio(profile: UserProfile): string { return profile.bio.trim() || "用博物館記錄每一段旅程。"; }
export function isProfileComplete(profile: UserProfile): boolean { return Boolean(profile.name.trim() && profile.title.trim()); }
export function getStoreDistributionNote(): string { return "App Store 正式下載需完成原生建置、Apple Developer 簽署與商店審核；Expo Go 僅供開發測試。"; }
