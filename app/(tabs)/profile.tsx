import { useCallback, useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { startOAuthLogin } from "@/constants/oauth";
import { backupLocalData, formatSyncTime, restoreCloudData } from "@/lib/cloud-sync";
import { cancelAutoSyncRuntime, clearPendingSync, getAutoSyncEnabled, isPendingSync, markDataChanged, retryPendingAutoSync, setAutoSyncEnabled } from "@/lib/auto-sync";
import { discardLegacyDeviceData, getBadgeLabel, getMuseums, getProfileCopy, getProfileFooter, getProfileSubtitle, hasLegacyDeviceData, importLegacyDeviceData, saveStoredProfile, getStoredProfile } from "@/lib/museum-storage";
import { getProfileDisplayName, getProfileDisplayTitle, getProfileInitial, type UserProfile } from "@/types/museum";

export default function ProfileScreen() {
  const colors = useColors();
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [count, setCount] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [draft, setDraft] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncState] = useState(true);
  const [pendingSync, setPendingSync] = useState(false);
  const [legacyAvailable, setLegacyAvailable] = useState(false);
  const [legacyBusy, setLegacyBusy] = useState(false);

  const load = useCallback(async () => {
    const [items, storedProfile, autoSync, pending, hasLegacy] = await Promise.all([getMuseums(), getStoredProfile(), getAutoSyncEnabled(), isPendingSync(), hasLegacyDeviceData()]);
    setCount(items.length);
    setAutoSyncState(autoSync);
    setPendingSync(pending);
    setLegacyAvailable(hasLegacy);
    setProfile(storedProfile);
    setDraft(storedProfile);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const startEditing = () => { setDraft(profile); setEditing(true); };
  const cancelEditing = () => { setDraft(profile); setEditing(false); };
  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const cleaned = { ...draft, name: draft.name.trim(), title: draft.title.trim(), bio: draft.bio.trim(), avatar: draft.avatar?.trim() || "" };
    await saveStoredProfile(cleaned);
    await markDataChanged();
    setPendingSync(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setProfile(cleaned);
    setDraft(cleaned);
    setEditing(false);
    setSaving(false);
  };

  const login = async () => {
    setSyncMessage("正在開啟登入頁面…");
    await startOAuthLogin();
  };

  const signOut = async () => {
    cancelAutoSyncRuntime();
    await logout();
  };

  const importLegacy = async () => {
    setLegacyBusy(true);
    try {
      const result = await importLegacyDeviceData();
      setLegacyAvailable(false);
      setSyncMessage(`已匯入這台裝置的 ${result.museumCount} 間舊博物館紀錄。`);
      await load();
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "舊資料匯入失敗，請稍後再試。");
    } finally {
      setLegacyBusy(false);
    }
  };

  const discardLegacy = async () => {
    setLegacyBusy(true);
    await discardLegacyDeviceData();
    setLegacyAvailable(false);
    setLegacyBusy(false);
    setSyncMessage("已保留目前帳戶的空白資料空間，舊裝置資料不會再顯示。");
  };

  const toggleAutoSync = async (enabled: boolean) => {
    setAutoSyncState(enabled);
    await setAutoSyncEnabled(enabled);
    if (!enabled) { setSyncMessage("自動同步已關閉；資料仍會保存在本機。"); return; }
    setSyncMessage(isAuthenticated ? "自動同步已開啟，正在檢查待同步資料…" : "自動同步已開啟，登入後會自動備份資料。");
    if (isAuthenticated && (await isPendingSync())) {
      const completed = await retryPendingAutoSync();
      if (completed) { setPendingSync(false); setSyncMessage("已完成待同步資料的雲端備份。"); }
    }
  };

  const backup = async () => {
    if (!isAuthenticated) { await login(); return; }
    setSyncing(true);
    setSyncMessage("正在備份博物館資料與媒體…");
    try {
      const result = await backupLocalData();
      await clearPendingSync();
      setPendingSync(false);
      setLastSync(result.updatedAt);
      setSyncMessage(`已備份 ${result.mediaCount} 個媒體項目。`);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "備份失敗，請稍後再試。");
    } finally { setSyncing(false); }
  };

  const restore = async () => {
    if (!isAuthenticated) { await login(); return; }
    setSyncing(true);
    setSyncMessage("正在從雲端還原資料…");
    try {
      const result = await restoreCloudData();
      if (!result) { setSyncMessage("雲端目前沒有備份，請先在另一台裝置備份。"); return; }
      setLastSync(result.updatedAt);
      setSyncMessage(`已合併 ${result.museumCount} 間博物館與 ${result.mediaCount} 個媒體項目。`);
      await load();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "還原失敗，請稍後再試。");
    } finally { setSyncing(false); }
  };

  if (!profile || !draft) return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} /></ScreenContainer>;
  const displayName = getProfileDisplayName(profile);
  const avatar = profile.avatar?.trim();
  const cloudUserName = user?.name || user?.email || "目前裝置";

  return <ScreenContainer edges={["top", "left", "right"]}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><View><Text style={[styles.kicker, { color: colors.primary }]}>THE COLLECTOR</Text><Text style={[styles.title, { color: colors.foreground }]}>我的旅印</Text></View><Pressable accessibilityLabel="編輯個人資料" onPress={editing ? cancelEditing : startEditing} style={({ pressed }) => [styles.headerButton, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && styles.pressed]}><IconSymbol name={editing ? "xmark" : "pencil"} size={17} color={colors.primary} /><Text style={[styles.headerButtonText, { color: colors.primary }]}>{editing ? "取消" : "編輯"}</Text></Pressable></View>

    <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>{avatar ? <Image source={{ uri: avatar }} style={styles.avatarImage} /> : <View style={styles.avatar}><Text style={[styles.avatarText, { color: colors.primary }]}>{getProfileInitial(profile)}</Text></View>}<View style={styles.profileCopy}><Text style={styles.profileName}>{displayName}</Text><Text style={styles.profileTitle}>{getProfileDisplayTitle(profile)}</Text><Text style={styles.profileBadge}>{getBadgeLabel(count)}</Text></View><IconSymbol name="person.crop.circle.fill" size={30} color="#D8F0F1" /></View>

    {editing ? <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.formTitle, { color: colors.foreground }]}>編輯個人資料</Text><Text style={[styles.formHint, { color: colors.muted }]}>資料會保存在本機，也可以透過下方雲端同步跨裝置備份。</Text><Field label="姓名" value={draft.name} placeholder="例如：王小明" onChangeText={(value) => setDraft({ ...draft, name: value })} colors={colors} /><Field label="收藏者身份" value={draft.title} placeholder="例如：藝文旅行者" onChangeText={(value) => setDraft({ ...draft, title: value })} colors={colors} /><Field label="個人簡介" value={draft.bio} placeholder="寫下你的博物館旅行方式" onChangeText={(value) => setDraft({ ...draft, bio: value })} colors={colors} multiline /><Field label="頭像網址（選填）" value={draft.avatar ?? ""} placeholder="https://..." onChangeText={(value) => setDraft({ ...draft, avatar: value, avatarUri: value })} colors={colors} autoCapitalize="none" keyboardType="url" /><Pressable onPress={save} disabled={saving} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.foreground }, pressed && styles.pressed, saving && styles.disabled]}><Text style={[styles.saveButtonText, { color: colors.background }]}>{saving ? "儲存中…" : "儲存個人資料"}</Text></Pressable></View> : <><Text style={[styles.subtitle, { color: colors.muted }]}>{getProfileSubtitle()}</Text><Text style={[styles.copy, { color: colors.foreground }]}>{getProfileCopy(count)}</Text></>}

    {legacyAvailable ? <View style={[styles.legacyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.legacyTitle, { color: colors.foreground }]}>發現這台裝置上的舊紀錄</Text><Text style={[styles.legacyCopy, { color: colors.muted }]}>這些資料來自之前的單一裝置版本。只有在你確認它屬於目前登入的帳戶時，才應該匯入；其他使用者請選擇略過。</Text><View style={styles.legacyActions}><Pressable disabled={legacyBusy} onPress={() => void importLegacy()} style={({ pressed }) => [styles.legacyButton, { backgroundColor: colors.primary }, pressed && styles.pressed, legacyBusy && styles.disabled]}><Text style={styles.legacyButtonText}>{legacyBusy ? "處理中…" : "匯入舊紀錄"}</Text></Pressable><Pressable disabled={legacyBusy} onPress={() => void discardLegacy()} style={({ pressed }) => [styles.legacyButton, { borderColor: colors.border, backgroundColor: colors.background }, pressed && styles.pressed, legacyBusy && styles.disabled]}><Text style={[styles.legacyButtonText, { color: colors.foreground }]}>略過</Text></Pressable></View></View> : null}

    <View style={styles.stats}><View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.statValue, { color: colors.foreground }]}>{count}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>已收藏</Text></View><View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.statValue, { color: colors.foreground }]}>∞</Text><Text style={[styles.statLabel, { color: colors.muted }]}>下一站</Text></View></View>

    <View style={[styles.cloudCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.cloudHeader}><View style={[styles.cloudIcon, { backgroundColor: colors.primary }]}><IconSymbol name="cloud.fill" size={21} color="#FFFDF6" /></View><View style={styles.cloudCopy}><Text style={[styles.cloudTitle, { color: colors.foreground }]}>雲端備份</Text><Text style={[styles.cloudSubtitle, { color: colors.muted }]}>{isAuthenticated ? `已登入：${cloudUserName}` : "登入後同步到其他裝置"}</Text></View>{isAuthenticated ? <View style={[styles.connectedDot, { backgroundColor: colors.success }]} /> : null}</View><Text style={[styles.cloudDescription, { color: colors.muted }]}>博物館資料、照片、影片和每張媒體描述都會安全保存；沒有網路時仍可使用本機資料。</Text><View style={styles.settingRow}><View style={styles.settingCopy}><Text style={[styles.settingTitle, { color: colors.foreground }]}>自動同步</Text><Text style={[styles.settingHint, { color: colors.muted }]}>{autoSyncEnabled ? "修改後會在登入且有網路時自動備份" : "目前只保存於本機，不會自動上傳"}</Text></View><Switch value={autoSyncEnabled} onValueChange={toggleAutoSync} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.background} /></View>{pendingSync ? <Text style={[styles.syncStatus, { color: colors.warning }]}>有資料等待雲端備份，恢復連線後會重試。</Text> : null}{authLoading ? <Text style={[styles.syncStatus, { color: colors.muted }]}>正在確認登入狀態…</Text> : !isAuthenticated ? <Pressable onPress={login} style={({ pressed }) => [styles.cloudPrimaryButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}><IconSymbol name="cloud.fill" size={17} color="#FFFDF6" /><Text style={styles.cloudPrimaryText}>登入並啟用雲端備份</Text></Pressable> : <View style={styles.cloudActions}><Pressable onPress={backup} disabled={syncing} style={({ pressed }) => [styles.cloudActionButton, { backgroundColor: colors.primary }, pressed && styles.pressed, syncing && styles.disabled]}><IconSymbol name="arrow.up.circle" size={17} color="#FFFDF6" /><Text style={styles.cloudActionText}>{syncing ? "處理中…" : "立即備份"}</Text></Pressable><Pressable onPress={restore} disabled={syncing} style={({ pressed }) => [styles.cloudActionButton, { borderColor: colors.primary, backgroundColor: colors.background }, pressed && styles.pressed, syncing && styles.disabled]}><IconSymbol name="arrow.down.circle" size={17} color={colors.primary} /><Text style={[styles.cloudActionText, { color: colors.primary }]}>從雲端還原</Text></Pressable></View>}{syncMessage ? <Text style={[styles.syncStatus, { color: colors.primary }]}>{syncMessage}</Text> : null}{lastSync ? <Text style={[styles.lastSync, { color: colors.muted }]}>最近同步：{formatSyncTime(lastSync)}</Text> : null}</View>

    <Text style={[styles.localNote, { color: colors.muted }]}>{isAuthenticated ? "本機資料與雲端備份可手動同步。" : "個人資料與照片目前保存在這台裝置；登入後即可啟用雲端備份。"}</Text>{isAuthenticated ? <Pressable onPress={() => void signOut()} style={({ pressed }) => [styles.signOutButton, { borderColor: colors.border }, pressed && styles.pressed]}><Text style={[styles.signOutText, { color: colors.error }]}>登出此帳戶</Text></Pressable> : null}<Text style={[styles.footer, { color: colors.muted }]}>{getProfileFooter()}</Text>
  </ScrollView></KeyboardAvoidingView></ScreenContainer>;
}

function Field({ label, value, placeholder, onChangeText, colors, multiline, autoCapitalize, keyboardType }: { label: string; value: string; placeholder: string; onChangeText: (value: string) => void; colors: ReturnType<typeof useColors>; multiline?: boolean; autoCapitalize?: "none" | "sentences"; keyboardType?: "url" | "default" }) { return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} multiline={multiline} autoCapitalize={autoCapitalize} keyboardType={keyboardType} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }, multiline && styles.multiline]} /> </View>; }

const styles = StyleSheet.create({ flex: { flex: 1 }, content: { padding: 22, paddingBottom: 140 }, header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginTop: 8 }, kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 1.6 }, title: { fontSize: 29, fontWeight: "800", marginTop: 5 }, headerButton: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 5 }, headerButtonText: { fontSize: 12, fontWeight: "800" }, profileCard: { borderRadius: 22, padding: 18, marginTop: 22, flexDirection: "row", alignItems: "center", gap: 13 }, avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#F7F4EE", alignItems: "center", justifyContent: "center" }, avatarImage: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#F7F4EE" }, avatarText: { fontSize: 23, fontWeight: "900" }, profileCopy: { flex: 1 }, profileName: { color: "#FFFDF6", fontSize: 18, fontWeight: "800" }, profileTitle: { color: "#D8F0F1", fontSize: 12, marginTop: 3 }, profileBadge: { color: "#B7E4E8", fontSize: 11, marginTop: 5 }, subtitle: { fontSize: 14, marginTop: 18 }, copy: { fontSize: 18, lineHeight: 27, fontWeight: "700", marginTop: 7 }, formCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 18 }, formTitle: { fontSize: 18, fontWeight: "800" }, formHint: { fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 13 }, field: { marginTop: 12 }, fieldLabel: { fontSize: 12, fontWeight: "800", marginBottom: 6 }, input: { borderWidth: 1, borderRadius: 13, minHeight: 46, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 }, multiline: { minHeight: 88, textAlignVertical: "top" }, saveButton: { minHeight: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 18 }, saveButtonText: { fontSize: 14, fontWeight: "800" }, disabled: { opacity: 0.55 }, legacyCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 18 }, legacyTitle: { fontSize: 16, fontWeight: "800" }, legacyCopy: { fontSize: 12, lineHeight: 18, marginTop: 7 }, legacyActions: { flexDirection: "row", gap: 9, marginTop: 14 }, legacyButton: { flex: 1, minHeight: 44, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" }, legacyButtonText: { color: "#FFFDF6", fontSize: 12, fontWeight: "800" }, stats: { flexDirection: "row", gap: 10, marginTop: 20 }, stat: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 15 }, statValue: { fontSize: 25, fontWeight: "800" }, statLabel: { fontSize: 12, marginTop: 4 }, cloudCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 18 }, cloudHeader: { flexDirection: "row", alignItems: "center", gap: 11 }, cloudIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" }, cloudCopy: { flex: 1 }, cloudTitle: { fontSize: 17, fontWeight: "800" }, cloudSubtitle: { fontSize: 12, marginTop: 3 }, connectedDot: { width: 9, height: 9, borderRadius: 5 }, cloudDescription: { fontSize: 12, lineHeight: 18, marginTop: 13 }, settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "rgba(10,94,117,0.14)", paddingVertical: 13, marginTop: 14 }, settingCopy: { flex: 1, gap: 3 }, settingTitle: { fontSize: 13, fontWeight: "800" }, settingHint: { fontSize: 11, lineHeight: 16 }, cloudPrimaryButton: { minHeight: 48, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 14 }, cloudPrimaryText: { color: "#FFFDF6", fontSize: 13, fontWeight: "800" }, cloudActions: { flexDirection: "row", gap: 9, marginTop: 14 }, cloudActionButton: { flex: 1, minHeight: 45, borderRadius: 13, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 }, cloudActionText: { color: "#FFFDF6", fontSize: 12, fontWeight: "800" }, syncStatus: { fontSize: 12, lineHeight: 18, marginTop: 12 }, lastSync: { fontSize: 11, marginTop: 4 }, localNote: { fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 22 }, signOutButton: { borderWidth: 1, borderRadius: 13, minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 16 }, signOutText: { fontSize: 13, fontWeight: "800" }, footer: { textAlign: "center", fontSize: 12, marginTop: 24 }, pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] } });
