import { useEffect } from "react";
import { Platform, View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { AuthGate } from "@/components/auth-gate";
import { useGuestPreview } from "@/lib/guest-preview-context";
import { useI18n } from "@/lib/i18n";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { loading, error, isAuthenticated } = useAuth();
  const { isGuestPreview, exitGuestPreview } = useGuestPreview();
  const { t } = useI18n();
  const bottom = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);

  useEffect(() => {
    if (isAuthenticated && isGuestPreview) exitGuestPreview();
  }, [exitGuestPreview, isAuthenticated, isGuestPreview]);

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.background }}><AuthGate loading error={error} /></View>;
  }

  if (!isAuthenticated && !isGuestPreview) {
    return <View style={{ flex: 1, backgroundColor: colors.background }}><AuthGate loading={false} error={error} /></View>;
  }

  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarButton: HapticTab, tabBarStyle: { height: 58 + bottom, paddingTop: 8, paddingBottom: bottom, backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 0.5 } }}>
    <Tabs.Screen name="index" options={{ title: t("tabs.map"), tabBarIcon: ({ color }) => <IconSymbol name="book.closed.fill" size={24} color={color} /> }} />
    <Tabs.Screen name="library" options={{ title: t("tabs.library"), tabBarIcon: ({ color }) => <IconSymbol name="building.2.fill" size={24} color={color} /> }} />
    <Tabs.Screen name="profile" options={{ title: t("tabs.profile"), tabBarIcon: ({ color }) => <IconSymbol name="person.crop.circle.fill" size={24} color={color} /> }} />
  </Tabs>;
}
