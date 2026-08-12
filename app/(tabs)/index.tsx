import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WorldMap } from "@/components/world-map";
import { useColors } from "@/hooks/use-colors";
import { getMuseums, getStats } from "@/lib/museum-storage";
import type { MuseumItem } from "@/types/museum";

export default function HomeScreen() {
  const colors = useColors();
  const [museums, setMuseums] = useState<MuseumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setMuseums(await getMuseums()); setLoading(false); }, []);
  useEffect(() => { void load(); }, [load]);
  const stats = getStats(museums);
  if (loading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} /></ScreenContainer>;
  return <ScreenContainer edges={["top", "left", "right"]}><View style={styles.page}><View style={styles.header}><View><Text style={[styles.eyebrow, { color: colors.primary }]}>WANDERSTAMP</Text><Text style={[styles.title, { color: colors.foreground }]}>世界足跡</Text><Text style={[styles.subtitle, { color: colors.muted }]}>每個標記，都是一次看見世界的證明。</Text></View><View style={[styles.counter, { borderColor: colors.border, backgroundColor: colors.surface }]}><Text style={[styles.counterNumber, { color: colors.primary }]}>{stats.museums}</Text><Text style={[styles.counterLabel, { color: colors.muted }]}>間已更新</Text></View></View><View style={[styles.mapCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><WorldMap museums={museums} colors={colors} onSelect={(museum) => router.push({ pathname: "/museum/[id]", params: { id: museum.id } })} /></View><View style={styles.mapFooter}><View><Text style={[styles.footerTitle, { color: colors.foreground }]}>你的文化航線</Text><Text style={[styles.footerText, { color: colors.muted }]}>{stats.countries} 個國家 · {stats.cities} 座城市</Text></View><Pressable onPress={() => router.push("/(tabs)/library")} style={({ pressed }) => [styles.libraryButton, { borderColor: colors.primary }, pressed && styles.pressed]}><Text style={[styles.libraryButtonText, { color: colors.primary }]}>查看清單</Text><IconSymbol name="chevron.right" size={16} color={colors.primary} /></Pressable></View></View></ScreenContainer>;
}

const styles = StyleSheet.create({ page: { flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }, header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingVertical: 8 }, eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 2 }, title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.7, marginTop: 4 }, subtitle: { fontSize: 13, marginTop: 5 }, counter: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9, alignItems: "center" }, counterNumber: { fontSize: 21, fontWeight: "800" }, counterLabel: { fontSize: 10, marginTop: 1 }, mapCard: { flex: 1, minHeight: 390, overflow: "hidden", borderWidth: 1, borderRadius: 25, position: "relative" }, mapFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12 }, footerTitle: { fontSize: 16, fontWeight: "800" }, footerText: { fontSize: 12, marginTop: 3 }, libraryButton: { borderWidth: 1, borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 11, paddingVertical: 9 }, libraryButtonText: { fontSize: 12, fontWeight: "800" }, pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] } });
