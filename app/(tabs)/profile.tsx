import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getBadgeLabel, getMuseums, getProfileCopy, getProfileFooter, getProfileSubtitle, saveStoredProfile, getStoredProfile } from "@/lib/museum-storage";
import { getProfileDisplayName, getProfileDisplayTitle, getProfileInitial, type UserProfile } from "@/types/museum";

export default function ProfileScreen() {
  const colors = useColors();
  const [count, setCount] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [draft, setDraft] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [items, storedProfile] = await Promise.all([getMuseums(), getStoredProfile()]);
    setCount(items.length);
    setProfile(storedProfile);
    setDraft(storedProfile);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const startEditing = () => { setDraft(profile); setEditing(true); };
  const cancelEditing = () => { setDraft(profile); setEditing(false); };
  const save = async () => {
    if (!draft) return;
    setSaving(true);
    await saveStoredProfile({ ...draft, name: draft.name.trim(), title: draft.title.trim(), bio: draft.bio.trim(), avatar: draft.avatar?.trim() || "" });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setProfile(draft);
    setEditing(false);
    setSaving(false);
  };

  if (!profile || !draft) return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} /></ScreenContainer>;
  const displayName = getProfileDisplayName(profile);
  const avatar = profile.avatar?.trim();

  return <ScreenContainer edges={["top", "left", "right"]}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><View><Text style={[styles.kicker, { color: colors.primary }]}>THE COLLECTOR</Text><Text style={[styles.title, { color: colors.foreground }]}>我的旅印</Text></View><Pressable accessibilityLabel="編輯個人資料" onPress={editing ? cancelEditing : startEditing} style={({ pressed }) => [styles.headerButton, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && styles.pressed]}><IconSymbol name={editing ? "xmark" : "pencil"} size={17} color={colors.primary} /><Text style={[styles.headerButtonText, { color: colors.primary }]}>{editing ? "取消" : "編輯"}</Text></Pressable></View>

    <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>{avatar ? <Image source={{ uri: avatar }} style={styles.avatarImage} /> : <View style={styles.avatar}><Text style={[styles.avatarText, { color: colors.primary }]}>{getProfileInitial(profile)}</Text></View>}<View style={styles.profileCopy}><Text style={styles.profileName}>{displayName}</Text><Text style={styles.profileTitle}>{getProfileDisplayTitle(profile)}</Text><Text style={styles.profileBadge}>{getBadgeLabel(count)}</Text></View><IconSymbol name="person.crop.circle.fill" size={30} color="#D8F0F1" /></View>

    {editing ? <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.formTitle, { color: colors.foreground }]}>編輯個人資料</Text><Text style={[styles.formHint, { color: colors.muted }]}>這些資料目前只會保存在本機。</Text><Field label="姓名" value={draft.name} placeholder="例如：王小明" onChangeText={(value) => setDraft({ ...draft, name: value })} colors={colors} /><Field label="收藏者身份" value={draft.title} placeholder="例如：藝文旅行者" onChangeText={(value) => setDraft({ ...draft, title: value })} colors={colors} /><Field label="個人簡介" value={draft.bio} placeholder="寫下你的博物館旅行方式" onChangeText={(value) => setDraft({ ...draft, bio: value })} colors={colors} multiline /><Field label="頭像網址（選填）" value={draft.avatar ?? ""} placeholder="https://..." onChangeText={(value) => setDraft({ ...draft, avatar: value, avatarUri: value })} colors={colors} autoCapitalize="none" keyboardType="url" /><Pressable onPress={save} disabled={saving} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.foreground }, pressed && styles.pressed, saving && styles.disabled]}><Text style={[styles.saveButtonText, { color: colors.background }]}>{saving ? "儲存中…" : "儲存個人資料"}</Text></Pressable></View> : <><Text style={[styles.subtitle, { color: colors.muted }]}>{getProfileSubtitle()}</Text><Text style={[styles.copy, { color: colors.foreground }]}>{getProfileCopy(count)}</Text></>}

    <View style={styles.stats}><View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.statValue, { color: colors.foreground }]}>{count}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>已收藏</Text></View><View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.statValue, { color: colors.foreground }]}>∞</Text><Text style={[styles.statLabel, { color: colors.muted }]}>下一站</Text></View></View>
    <Text style={[styles.localNote, { color: colors.muted }]}>個人資料與照片目前保存在這台裝置。</Text><Text style={[styles.footer, { color: colors.muted }]}>{getProfileFooter()}</Text>
  </ScrollView></KeyboardAvoidingView></ScreenContainer>;
}

function Field({ label, value, placeholder, onChangeText, colors, multiline, autoCapitalize, keyboardType }: { label: string; value: string; placeholder: string; onChangeText: (value: string) => void; colors: ReturnType<typeof useColors>; multiline?: boolean; autoCapitalize?: "none" | "sentences"; keyboardType?: "url" | "default" }) {
  return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} multiline={multiline} autoCapitalize={autoCapitalize} keyboardType={keyboardType} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }, multiline && styles.multiline]} /></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, content: { padding: 22, paddingBottom: 118 }, header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginTop: 8 }, kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 1.6 }, title: { fontSize: 29, fontWeight: "800", marginTop: 5 }, headerButton: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 5 }, headerButtonText: { fontSize: 12, fontWeight: "800" }, profileCard: { borderRadius: 22, padding: 18, marginTop: 22, flexDirection: "row", alignItems: "center", gap: 13 }, avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#F7F4EE", alignItems: "center", justifyContent: "center" }, avatarImage: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#F7F4EE" }, avatarText: { fontSize: 23, fontWeight: "900" }, profileCopy: { flex: 1 }, profileName: { color: "#FFFDF6", fontSize: 18, fontWeight: "800" }, profileTitle: { color: "#D8F0F1", fontSize: 12, marginTop: 3 }, profileBadge: { color: "#B7E4E8", fontSize: 11, marginTop: 5 }, subtitle: { fontSize: 14, marginTop: 18 }, copy: { fontSize: 18, lineHeight: 27, fontWeight: "700", marginTop: 7 }, formCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 18 }, formTitle: { fontSize: 18, fontWeight: "800" }, formHint: { fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 13 }, field: { marginTop: 12 }, fieldLabel: { fontSize: 12, fontWeight: "800", marginBottom: 6 }, input: { borderWidth: 1, borderRadius: 13, minHeight: 46, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 }, multiline: { minHeight: 88, textAlignVertical: "top" }, saveButton: { minHeight: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 18 }, saveButtonText: { fontSize: 14, fontWeight: "800" }, disabled: { opacity: 0.55 }, stats: { flexDirection: "row", gap: 10, marginTop: 20 }, stat: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 15 }, statValue: { fontSize: 25, fontWeight: "800" }, statLabel: { fontSize: 12, marginTop: 4 }, localNote: { fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 22 }, footer: { textAlign: "center", fontSize: 12, marginTop: 24 }, pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
