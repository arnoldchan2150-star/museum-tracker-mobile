import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { LanguageSwitcher, useI18n } from "@/lib/i18n";
import { startOAuthLogin } from "@/constants/oauth";
import { AppleSignInButton } from "@/components/apple-sign-in-button";

export function GuestBanner({ compact = false }: { compact?: boolean }) {
  const colors = useColors();
  const { t } = useI18n();
  return <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }, compact && styles.compact]}>
    <View style={styles.topRow}>
      <View style={styles.copyRow}>
        <View style={[styles.icon, { backgroundColor: colors.primary }]}><IconSymbol name="person.crop.circle.fill" size={16} color="#FFFDF6" /></View>
        <View style={styles.copy}><Text style={[styles.badge, { color: colors.primary }]}>{t("guest.badge")}</Text><Text style={[styles.text, { color: colors.muted }]}>{t("guest.banner")}</Text></View>
      </View>
      <LanguageSwitcher compact />
    </View>
    <Pressable onPress={() => void startOAuthLogin().catch((error) => Alert.alert(t("auth.loginErrorTitle"), error instanceof Error ? error.message : t("auth.loginError")))} style={({ pressed }) => [styles.button, { backgroundColor: colors.primary }, pressed && styles.pressed]}><Text style={styles.buttonText}>{t("guest.login")}</Text></Pressable>
    <AppleSignInButton compact />
  </View>;
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 17, padding: 12, gap: 10, marginBottom: 12 },
  compact: { marginHorizontal: 20, marginTop: 4 },
  topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  copyRow: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 9 },
  icon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, gap: 2 },
  badge: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  text: { fontSize: 12, lineHeight: 17 },
  button: { alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 },
  buttonText: { color: "#FFFDF6", fontSize: 11, fontWeight: "900" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
