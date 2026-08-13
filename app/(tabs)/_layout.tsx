import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { AuthGate } from "@/components/auth-gate";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { loading, error, isAuthenticated } = useAuth();
  const bottom = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);

  if (loading || !isAuthenticated) {
    return <View style={{ flex: 1, backgroundColor: colors.background }}><AuthGate loading={loading} error={error} /></View>;
  }

  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarButton: HapticTab, tabBarStyle: { height: 58 + bottom, paddingTop: 8, paddingBottom: bottom, backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 0.5 } }}>
    <Tabs.Screen name="index" options={{ title: "足跡", tabBarIcon: ({ color }) => <IconSymbol name="book.closed.fill" size={24} color={color} /> }} />
    <Tabs.Screen name="library" options={{ title: "清單", tabBarIcon: ({ color }) => <IconSymbol name="building.2.fill" size={24} color={color} /> }} />
    <Tabs.Screen name="profile" options={{ title: "我的", tabBarIcon: ({ color }) => <IconSymbol name="person.crop.circle.fill" size={24} color={color} /> }} />
  </Tabs>;
}
