import type { MuseumItem, UserProfile } from "@/types/museum";

export const GUEST_PROFILE: UserProfile = {
  name: "Wanderstamp Guest",
  title: "Cultural traveller",
  bio: "A read-only preview of how your museum memories can be organized.",
};

export const GUEST_MUSEUMS: MuseumItem[] = [
  {
    id: "guest-louvre",
    name: "羅浮宮博物館 · Louvre Museum",
    city: "巴黎 · Paris",
    country: "法國 · France",
    visitedDate: "2025-05-18",
    note: "A sample memory: light across the glass pyramid and a first walk through the sculpture halls.",
    rating: 5,
    createdAt: "2025-05-18T09:00:00.000Z",
    latitude: 48.8606,
    longitude: 2.3376,
    media: [
      { id: "guest-louvre-photo", uri: "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=900&q=80", type: "photo", description: "Morning light at the glass pyramid.", createdAt: "2025-05-18T09:10:00.000Z" },
    ],
  },
  {
    id: "guest-moma",
    name: "現代藝術博物館 · MoMA",
    city: "紐約 · New York",
    country: "美國 · United States",
    visitedDate: "2024-10-03",
    note: "A sample memory: a quiet hour with colour, shape, and the city moving beyond the windows.",
    rating: 4,
    createdAt: "2024-10-03T09:00:00.000Z",
    latitude: 40.7614,
    longitude: -73.9776,
    media: [],
  },
  {
    id: "guest-palace",
    name: "國立故宮博物院 · National Palace Museum",
    city: "台北 · Taipei",
    country: "台灣 · Taiwan",
    visitedDate: "2024-02-11",
    note: "A sample memory: jade, ink, and the patient rhythm of looking closely.",
    rating: 5,
    createdAt: "2024-02-11T09:00:00.000Z",
    latitude: 25.1024,
    longitude: 121.5485,
    media: [],
  },
];

export function getGuestMuseums(): MuseumItem[] {
  return GUEST_MUSEUMS.map((museum) => ({
    ...museum,
    media: museum.media?.map((media) => ({ ...media })),
  }));
}

export function getGuestProfile(): UserProfile {
  return { ...GUEST_PROFILE };
}
