import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { addMuseum, formatVisitedDate, getPalette, getRecentMuseums, getStats, getWelcomeCopy, getStars, getMuseums } from "@/lib/museum-storage";
import type { MuseumItem } from "@/types/museum";

export default function HomeScreen() {
  const colors = useColors();
  const [museums, setMuseums] = useState<MuseumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { setMuseums(await getMuseums()); setLoading(false); }, []);
  useEffect(() => { void load(); }, [load]);
  const stats = getStats(museums);
  const recent = getRecentMuseums(museums);
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const goAdd = async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/add"); };
  if (loading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} /></ScreenContainer>;
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}>
        <View style={styles.headerRow}><View><Text style={[styles.eyebrow, { color: colors.primary }]}>WANDERSTAMP</Text><Text style={[styles.title, { color: colors.foreground }]}>我的博物館護照</Text></View><View style={[styles.stamp, { borderColor: colors.primary }]}><Text style={[styles.stampText, { color: colors.primary }]}>M</Text></View></View>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{getWelcomeCopy(museums.length)}</Text>
        <View style={[styles.hero, { backgroundColor: colors.primary }]}><View style={styles.heroCopy}><Text style={styles.heroKicker}>YOUR CULTURAL TRAIL</Text><Text style={styles.heroTitle}>{museums.length} 間博物館</Text><Text style={styles.heroText}>每一枚印章，都是你看過世界的證明。</Text></View><View style={styles.heroCircle}><IconSymbol name="book.closed.fill" size={34} color="#F7F4EE" /></View></View>
        <View style={styles.statsRow}>{[[stats.museums, "博物館"], [stats.countries, "國家"], [stats.cities, "城市"]].map(([value, label]) => <View key={String(label)} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text></View>)}</View>
        <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>最近的足跡</Text><Pressable onPress={() => router.push("/(tabs)/library")} style={({ pressed }) => [styles.link, pressed && styles.pressed]}><Text style={{ color: colors.primary, fontWeight: "700" }}>查看全部</Text><IconSymbol name="chevron.right" size={17} color={colors.primary} /></Pressable></View>
        {recent.map((museum, index) => { const palette = getPalette(index); return <Pressable key={museum.id} onPress={() => router.push({ pathname: "/museum/[id]", params: { id: museum.id } })} style={({ pressed }) => [styles.museumCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}><View style={[styles.museumBadge, { backgroundColor: palette.background }]}><Text style={[styles.museumBadgeText, { color: palette.ink }]}>{museum.name.slice(0, 1)}</Text></View><View style={styles.museumCopy}><Text style={[styles.museumName, { color: colors.foreground }]} numberOfLines={1}>{museum.name}</Text><Text style={[styles.museumMeta, { color: colors.muted }]}>{museum.city} · {museum.country}</Text><Text style={[styles.museumDate, { color: colors.muted }]}>{formatVisitedDate(museum.visitedDate)} {museum.rating ? `· ${getStars(museum.rating)}` : ""}</Text></View><IconSymbol name="chevron.right" size={20} color={colors.muted} /></Pressable>; })}
        <Pressable onPress={goAdd} style={({ pressed }) => [styles.addButton, { backgroundColor: colors.foreground }, pressed && styles.pressed]}><IconSymbol name="plus" size={21} color={colors.background} /><Text style={[styles.addButtonText, { color: colors.background }]}>新增博物館紀錄</Text></Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({ content: { padding: 22, paddingBottom: 112, gap: 16 }, headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }, eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 2 }, title: { fontSize: 27, fontWeight: "800", letterSpacing: -0.6, marginTop: 5 }, subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 3 }, stamp: { width: 48, height: 48, borderWidth: 1.5, borderRadius: 24, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }] }, stampText: { fontSize: 22, fontWeight: "800" }, hero: { borderRadius: 24, padding: 20, minHeight: 150, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, heroCopy: { flex: 1, paddingRight: 14 }, heroKicker: { color: "#B7E4E8", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 }, heroTitle: { color: "#FFFDF6", fontSize: 30, fontWeight: "800", marginTop: 6 }, heroText: { color: "#D8F0F1", fontSize: 13, lineHeight: 19, marginTop: 5 }, heroCircle: { width: 70, height: 70, borderRadius: 35, borderWidth: 1, borderColor: "rgba(255,255,255,0.5)", alignItems: "center", justifyContent: "center" }, statsRow: { flexDirection: "row", gap: 10 }, statCard: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 14 }, statValue: { fontSize: 24, fontWeight: "800" }, statLabel: { fontSize: 12, marginTop: 4 }, sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }, sectionTitle: { fontSize: 19, fontWeight: "800" }, link: { flexDirection: "row", alignItems: "center", gap: 2 }, museumCard: { borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: "row", alignItems: "center", gap: 12 }, museumBadge: { width: 50, height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center" }, museumBadgeText: { fontSize: 23, fontWeight: "800" }, museumCopy: { flex: 1 }, museumName: { fontSize: 15, fontWeight: "800" }, museumMeta: { fontSize: 12, marginTop: 4 }, museumDate: { fontSize: 11, marginTop: 3 }, addButton: { borderRadius: 16, minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }, addButtonText: { fontWeight: "800", fontSize: 15 }, pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] } });
