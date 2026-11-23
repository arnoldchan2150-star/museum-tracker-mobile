import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

/**
 * Supabase client for Wanderstamp.
 *
 * Set these in a `.env` file at the project root (see SUPABASE_SETUP.md):
 *   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 *
 * If they are missing the app still works fully offline in guest mode;
 * login and cloud sync simply show a "not configured" message.
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const MEDIA_BUCKET = "museum-media";
export const BACKUP_TABLE = "museum_backups";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const isServer = Platform.OS === "web" && typeof window === "undefined";

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // On web, supabase-js uses localStorage by default; on native we persist with AsyncStorage.
        storage: Platform.OS === "web" ? undefined : AsyncStorage,
        autoRefreshToken: !isServer,
        persistSession: !isServer,
        detectSessionInUrl: Platform.OS === "web",
        flowType: "pkce",
      },
    })
  : null;

export const NOT_CONFIGURED_MESSAGE = "雲端功能尚未設定：請在 .env 填入 Supabase URL 與 anon key（見 SUPABASE_SETUP.md）。";

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error(NOT_CONFIGURED_MESSAGE);
  return supabase;
}

// Only refresh tokens while the app is in the foreground (recommended by Supabase for React Native).
if (supabase && Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
