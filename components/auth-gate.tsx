import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { startOAuthLogin } from "@/constants/oauth";
import { LanguageSwitcher, useI18n } from "@/lib/i18n";
import { useGuestPreview } from "@/lib/guest-preview-context";
import { AppleSignInButton } from "@/components/apple-sign-in-button";

export function AuthGate({ loading, error }: { loading: boolean; error: Error | null }) {
  const colors = useColors();
  const { t } = useI18n();
  const { enterGuestPreview } = useGuestPreview();
  const isExpoGo = (Constants as { appOwnership?: string }).appOwnership === "expo";
  const getLoginError = (value: unknown) => value instanceof Error && value.message === "OAUTH_CANCELLED" ? t("auth.oauthCancelled") : value instanceof Error ? value.message : t("auth.loginError");

  if (loading) {
    return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center"><ActivityIndicator color={colors.primary} size="large" /></ScreenContainer>;
  }

  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><View style={styles.content}>
    <LanguageSwitcher compact />
    <View style={[styles.brandMark, { backgroundColor: colors.primary }]}><IconSymbol name="book.closed.fill" size={34} color="#FFFDF6" /></View>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>{t("auth.eyebrow")}</Text>
    <Text style={[styles.title, { color: colors.foreground }]}>{t("auth.title")}</Text>
    <Text style={[styles.copy, { color: colors.muted }]}>{t("auth.copy")}</Text>
    <View style={[styles.promise, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <PromiseRow icon="person.crop.circle.fill" text={t("auth.promiseProfile")} colors={colors} />
      <PromiseRow icon="building.2.fill" text={t("auth.promiseMuseums")} colors={colors} />
      <PromiseRow icon="cloud.fill" text={t("auth.promiseSync")} colors={colors} />
    </View>
    <Pressable onPress={() => void startOAuthLogin().catch((error) => Alert.alert(t("auth.loginErrorTitle"), getLoginError(error)))} style={({ pressed }) => [styles.loginButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
      <IconSymbol name="person.crop.circle.fill" size={19} color="#FFFDF6" />
      <Text style={styles.loginText}>{t("common.login")}</Text>
    </Pressable>
    <AppleSignInButton />
    {isExpoGo ? <Text style={[styles.buildNotice, { color: colors.warning }]}>{t("auth.oauthBuildNotice")}</Text> : null}
    <Pressable onPress={enterGuestPreview} style={({ pressed }) => [styles.guestButton, { borderColor: colors.primary }, pressed && styles.pressed]}>
      <IconSymbol name="book.closed.fill" size={17} color={colors.primary} />
      <Text style={[styles.guestText, { color: colors.primary }]}>{t("common.guest")}</Text>
    </Pressable>
    {error ? <Text style={[styles.error, { color: colors.error }]}>{t("auth.error")}</Text> : null}
    <Text style={[styles.note, { color: colors.muted }]}>{t("auth.note")}</Text>
  </View></ScreenContainer>;
}

function PromiseRow({ icon, text, colors }: { icon: "person.crop.circle.fill" | "building.2.fill" | "cloud.fill"; text: string; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.promiseRow}><IconSymbol name={icon} size={18} color={colors.primary} /><Text style={[styles.promiseText, { color: colors.foreground }]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 26, paddingBottom: 24 },
  brandMark: { alignSelf: "center", width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 22 },
  eyebrow: { alignSelf: "center", fontSize: 11, fontWeight: "900", letterSpacing: 2.2 },
  title: { textAlign: "center", fontSize: 30, lineHeight: 38, fontWeight: "900", marginTop: 10 },
  copy: { textAlign: "center", fontSize: 14, lineHeight: 22, marginTop: 13 },
  promise: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 15, marginTop: 25 },
  promiseRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  promiseText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  loginButton: { minHeight: 52, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 },
  loginText: { color: "#FFFDF6", fontSize: 14, fontWeight: "900" },
  guestButton: { minHeight: 48, borderWidth: 1, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 },
  guestText: { fontSize: 13, fontWeight: "900" },
  error: { textAlign: "center", fontSize: 12, marginTop: 12 },
  note: { textAlign: "center", fontSize: 11, lineHeight: 17, marginTop: 18 },
  buildNotice: { textAlign: "center", fontSize: 11, lineHeight: 16, marginTop: 13 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
