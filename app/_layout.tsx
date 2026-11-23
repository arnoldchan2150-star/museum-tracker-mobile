import "@/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { AppState } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import type { EdgeInsets, Rect } from "react-native-safe-area-context";

import { markDataChanged, retryPendingAutoSync } from "@/lib/auto-sync";
import { moveGuestDataToAccount } from "@/lib/museum-storage";
import { supabase } from "@/lib/supabase";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  useEffect(() => {
    const retry = () => { void retryPendingAutoSync(); };
    retry();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") retry();
    });
    // Back up anything pending as soon as the user signs in.
    const auth = supabase?.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" || !session?.user) return;
      const userId = session.user.id;
      // Defer: calling Supabase from inside this callback can deadlock.
      setTimeout(() => {
        void (async () => {
          const moved = await moveGuestDataToAccount(userId).catch(() => 0);
          if (moved) await markDataChanged();
          retry();
        })();
      }, 0);
    });
    const interval = setInterval(retry, 30_000);
    return () => {
      subscription.remove();
      auth?.data.subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Ensure minimum padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: DEFAULT_WEB_INSETS, frame: DEFAULT_WEB_FRAME };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, []);

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          {/* Native headers are hidden; screens draw their own titles. */}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="auth/callback" />
          </Stack>
          <StatusBar style="auto" />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
