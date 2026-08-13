import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { startOAuthLogin } from "@/constants/oauth";
import { useGuestPreview } from "@/lib/guest-preview-context";
import { getGuestProfile } from "@/lib/guest-preview";
import { getAutoSyncEnabled, isPendingSync, setAutoSyncEnabled, cancelAutoSyncRuntime, markDataChanged } from "@/lib/auto-sync";
import { getStoredProfile, saveStoredProfile } from "@/lib/museum-storage";
import { getProfileInitial, type UserProfile } from "@/types/museum";
import { useI18n } from "@/lib/i18n";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useI18n();
  const { user, isAuthenticated, logout } = useAuth();
  const { isGuestPreview } = useGuestPreview();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [draft, setDraft] = useState<UserProfile | null>(null);
  const [autoSyncEnabled, setAutoSyncState] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (isGuestPreview) {
      const guest = getGuestProfile();
      setProfile(guest);
      setDraft(guest);
      setAutoSyncState(false);
      setPendingSync(false);
      return;
    }
    if (!isAuthenticated) {
      const signedOutProfile = await getStoredProfile();
      setProfile(signedOutProfile);
      setDraft(signedOutProfile);
      setAutoSyncState(false);
      setPendingSync(false);
      return;
    }
    const [storedProfile, autoSync, pending] = await Promise.all([getStoredProfile(), getAutoSyncEnabled(), isPendingSync()]);
    setProfile(storedProfile);
    setDraft(storedProfile);
    setAutoSyncState(autoSync);
    setPendingSync(pending);
  }, [isGuestPreview, isAuthenticated]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const save = async () => {
    if (!draft || isGuestPreview || !isAuthenticated) return;
    setSaving(true);
    try {
      const cleaned = { ...draft, name: draft.name.trim(), title: draft.title.trim(), bio: draft.bio.trim(), avatar: draft.avatar?.trim() || "", avatarUri: draft.avatar?.trim() || "" };
      await saveStoredProfile(cleaned);
      await markDataChanged();
      setProfile(cleaned);
      setDraft(cleaned);
      setMessage(t("settings.saved"));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setMessage(t("settings.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const toggleSync = async (enabled: boolean) => {
    if (isGuestPreview || !isAuthenticated) return;
    setAutoSyncState(enabled);
    await setAutoSyncEnabled(enabled);
    setMessage(enabled ? t("settings.syncReady") : t("settings.syncLocal"));
  };

  const confirmLogout = async () => {
    cancelAutoSyncRuntime();
    await logout();
    router.replace("/(tabs)");
  };

  const requestLogout = () => {
    Alert.alert(t("settings.logoutTitle"), t("settings.logoutCopy"), [
      { text: t("settings.logoutCancel"), style: "cancel" },
      { text: t("settings.logoutConfirm"), style: "destructive", onPress: () => { void confirmLogout(); } },
    ]);
  };

  const login = () => {
    void startOAuthLogin().catch(() => setMessage(t("auth.loginError")));
  };

  if (!profile || !draft) {
    return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} /></ScreenContainer>;
  }

  const statusLabel = isAuthenticated ? t("settings.signedIn") : t("settings.signedOut");
  const loginMethod = user?.loginMethod === "apple" ? "Apple ID" : user?.loginMethod || "Manus OAuth";
  const accountId = user?.openId ? maskAccountId(user.openId) : "—";
  const avatar = profile.avatar?.trim();

  return <ScreenContainer edges={["top", "left", "right"]}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable accessibilityLabel={t("common.back")} onPress={() => router.back()} style={({ pressed }) => [styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && styles.pressed]}>
            <IconSymbol name="chevron.left" size={18} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>{t("common.back")}</Text>
          </Pressable>
          <Text style={[styles.kicker, { color: colors.primary }]}>{t("settings.kicker")}</Text>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>{t("settings.title")}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{t("settings.subtitle")}</Text>

        <View style={[styles.identityCard, { backgroundColor: colors.primary }]}>
          <View style={styles.avatar}>{avatar ? <Text style={styles.avatarUrl}>●</Text> : <Text style={[styles.avatarText, { color: colors.primary }]}>{getProfileInitial(profile)}</Text>}</View>
          <View style={styles.identityCopy}>
            <Text style={styles.identityName}>{profile.name.trim() || "Wanderstamp"}</Text>
            <Text style={styles.identityTitle}>{profile.title.trim() || t("settings.profileSection")}</Text>
          </View>
          <IconSymbol name="gear" size={26} color="#D8F0F1" />
        </View>

        <SectionTitle icon="person.crop.circle.fill" title={t("settings.profileSection")} colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingField label={t("settings.name")} value={draft.name} placeholder={t("settings.namePlaceholder")} onChange={(value) => setDraft({ ...draft, name: value })} colors={colors} />
          <SettingField label={t("settings.titleField")} value={draft.title} placeholder={t("settings.titlePlaceholder")} onChange={(value) => setDraft({ ...draft, title: value })} colors={colors} />
          <SettingField label={t("settings.bio")} value={draft.bio} placeholder={t("settings.bioPlaceholder")} onChange={(value) => setDraft({ ...draft, bio: value })} colors={colors} multiline />
          <SettingField label={t("settings.avatar")} value={draft.avatar ?? ""} placeholder={t("settings.avatarPlaceholder")} onChange={(value) => setDraft({ ...draft, avatar: value, avatarUri: value })} colors={colors} autoCapitalize="none" keyboardType="url" />
          <Pressable disabled={saving || isGuestPreview || !isAuthenticated} onPress={() => { void save(); }} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.foreground }, pressed && styles.pressed, (saving || isGuestPreview || !isAuthenticated) && styles.disabled]}>
            <Text style={[styles.saveText, { color: colors.background }]}>{saving ? t("common.loading") : t("settings.save")}</Text>
          </Pressable>
          {message ? <Text style={[styles.message, { color: colors.primary }]}>{message}</Text> : null}
          {!isAuthenticated ? <Text style={[styles.message, { color: colors.muted }]}>{t("settings.readOnly")}</Text> : null}
        </View>

        <SectionTitle icon="lock" title={t("settings.accountSection")} colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <InfoRow label={t("settings.loginStatus")} value={statusLabel} valueColor={isAuthenticated ? colors.success : colors.muted} colors={colors} />
          <InfoRow label={t("settings.loginMethod")} value={isAuthenticated ? loginMethod : "—"} colors={colors} />
          <InfoRow label={t("settings.email")} value={user?.email || "—"} colors={colors} />
          <InfoRow label={t("settings.accountId")} value={accountId} colors={colors} last />
          {!isAuthenticated && !isGuestPreview ? <Pressable onPress={login} style={({ pressed }) => [styles.loginButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}><IconSymbol name="person.crop.circle.fill" size={17} color="#FFFDF6" /><Text style={styles.loginText}>{t("common.login")}</Text></Pressable> : null}
        </View>

        <SectionTitle icon="cloud.fill" title={t("settings.syncSection")} colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.syncHeader}><View style={styles.syncCopy}><Text style={[styles.syncTitle, { color: colors.foreground }]}>{t("settings.autoSync")}</Text><Text style={[styles.syncHint, { color: colors.muted }]}>{pendingSync ? t("settings.syncPending") : isAuthenticated ? t("settings.syncReady") : t("settings.syncLocal")}</Text></View><Switch disabled={!isAuthenticated || isGuestPreview} value={autoSyncEnabled} onValueChange={toggleSync} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.background} /></View>
          <Text style={[styles.syncNote, { color: colors.muted }]}>{isGuestPreview ? t("settings.guestCopy") : isAuthenticated ? t("profile.localOnly") : t("settings.guestCopy")}</Text>
        </View>

        {isGuestPreview ? <View style={[styles.guestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.guestTitle, { color: colors.foreground }]}>{t("settings.guestTitle")}</Text><Text style={[styles.guestCopy, { color: colors.muted }]}>{t("settings.guestCopy")}</Text><Pressable onPress={login} style={({ pressed }) => [styles.loginButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}><Text style={styles.loginText}>{t("common.login")}</Text></Pressable></View> : null}
        {isAuthenticated ? <Pressable onPress={requestLogout} style={({ pressed }) => [styles.logoutButton, { borderColor: colors.border }, pressed && styles.pressed]}><IconSymbol name="logout" size={17} color={colors.error} /><Text style={[styles.logoutText, { color: colors.error }]}>{t("settings.logout")}</Text></Pressable> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  </ScreenContainer>;
}

function maskAccountId(value: string) {
  return value.length > 12 ? `${value.slice(0, 4)}…${value.slice(-4)}` : value;
}

function SectionTitle({ icon, title, colors }: { icon: "person.crop.circle.fill" | "lock" | "cloud.fill"; title: string; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.sectionTitle}><IconSymbol name={icon} size={18} color={colors.primary} /><Text style={[styles.sectionText, { color: colors.foreground }]}>{title}</Text></View>;
}

function SettingField({ label, value, placeholder, onChange, colors, multiline, autoCapitalize, keyboardType }: { label: string; value: string; placeholder: string; onChange: (value: string) => void; colors: ReturnType<typeof useColors>; multiline?: boolean; autoCapitalize?: "none" | "sentences"; keyboardType?: "url" | "default" }) {
  return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.muted} autoCapitalize={autoCapitalize} keyboardType={keyboardType} multiline={multiline} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }, multiline && styles.multiline]} /></View>;
}

function InfoRow({ label, value, colors, valueColor, last }: { label: string; value: string; colors: ReturnType<typeof useColors>; valueColor?: string; last?: boolean }) {
  return <View style={[styles.infoRow, !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}><Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text><Text numberOfLines={1} style={[styles.infoValue, { color: valueColor || colors.foreground }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 22, paddingBottom: 64 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 8 },
  backText: { fontSize: 12, fontWeight: "800" },
  kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  title: { fontSize: 30, fontWeight: "800", marginTop: 19 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 7 },
  identityCard: { borderRadius: 22, padding: 18, marginTop: 22, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#F7F4EE", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 23, fontWeight: "900" },
  avatarUrl: { color: "#0A7EA4", fontSize: 24 },
  identityCopy: { flex: 1 },
  identityName: { color: "#FFFDF6", fontSize: 18, fontWeight: "800" },
  identityTitle: { color: "#D8F0F1", fontSize: 12, marginTop: 3 },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 24, marginBottom: 9 },
  sectionText: { fontSize: 16, fontWeight: "800" },
  card: { borderWidth: 1, borderRadius: 20, padding: 16 },
  field: { marginTop: 11 },
  fieldLabel: { fontSize: 12, fontWeight: "800", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 13, minHeight: 46, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  multiline: { minHeight: 84, textAlignVertical: "top" },
  saveButton: { minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 17 },
  saveText: { fontSize: 13, fontWeight: "800" },
  message: { fontSize: 12, lineHeight: 18, marginTop: 10, textAlign: "center" },
  infoRow: { minHeight: 47, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  infoLabel: { fontSize: 12 },
  infoValue: { flex: 1, textAlign: "right", fontSize: 13, fontWeight: "700" },
  loginButton: { minHeight: 46, borderRadius: 14, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", marginTop: 14 },
  loginText: { color: "#FFFDF6", fontSize: 13, fontWeight: "800" },
  syncHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  syncCopy: { flex: 1, gap: 4 },
  syncTitle: { fontSize: 14, fontWeight: "800" },
  syncHint: { fontSize: 12, lineHeight: 18 },
  syncNote: { fontSize: 12, lineHeight: 18, marginTop: 14 },
  guestCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 22 },
  guestTitle: { fontSize: 16, fontWeight: "800" },
  guestCopy: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  logoutButton: { minHeight: 48, borderWidth: 1, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 24 },
  logoutText: { fontSize: 13, fontWeight: "800" },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
