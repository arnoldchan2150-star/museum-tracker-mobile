import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { GuestBanner } from "@/components/guest-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { filterMuseums, formatVisitedDate, getCountries, getInitials, getYears, searchMuseums, sortMuseums, getMuseums } from "@/lib/museum-storage";
import { getGuestMuseums } from "@/lib/guest-preview";
import { useGuestPreview } from "@/lib/guest-preview-context";
import { useI18n } from "@/lib/i18n";
import { getMuseumMedia, type MuseumItem } from "@/types/museum";

type PhotoFilter = "all" | "with" | "without";

export default function LibraryScreen() {
  const colors = useColors();
  const { t } = useI18n();
  const { isGuestPreview } = useGuestPreview();
  const [items, setItems] = useState<MuseumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [photoFilter, setPhotoFilter] = useState<PhotoFilter>("all");

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    void (isGuestPreview ? Promise.resolve(getGuestMuseums()) : getMuseums()).then((nextItems) => { if (active) setItems(nextItems); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isGuestPreview]));

  const countries = useMemo(() => getCountries(items), [items]);
  const cities = useMemo(() => Array.from(new Set(items.map((item) => item.city.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-Hant")), [items]);
  const years = useMemo(() => getYears(items), [items]);
  const filtered = useMemo(() => {
    const base = sortMuseums(filterMuseums(searchMuseums(items, query), country, year));
    return base.filter((item) => {
      if (city && item.city !== city) return false;
      if (photoFilter === "all") return true;
      const hasPhoto = getMuseumMedia(item).some((media) => media.type === "photo");
      return photoFilter === "with" ? hasPhoto : !hasPhoto;
    });
  }, [items, query, country, city, year, photoFilter]);

  const clearFilters = () => { setQuery(""); setCountry(null); setCity(null); setYear(null); setPhotoFilter("all"); };
  const hasActiveFilters = Boolean(query.trim() || country || city || year || photoFilter !== "all");

  if (loading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} /></ScreenContainer>;

  return <ScreenContainer><FlatList
    data={filtered}
    keyExtractor={(item) => item.id}
    contentContainerStyle={styles.content}
    ListHeaderComponent={<View>
      {isGuestPreview ? <GuestBanner /> : null}
      <Text style={[styles.kicker, { color: colors.primary }]}>{t("library.kicker")}</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>{t("library.title")}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>{t("library.subtitle")}</Text>
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="magnifyingglass" size={20} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder={t("library.search")} placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.foreground }]} returnKeyType="search" />{query ? <Pressable accessibilityLabel={t("common.delete")} onPress={() => setQuery("")} style={({ pressed }) => [styles.searchClear, pressed && styles.pressed]}><IconSymbol name="xmark" size={19} color={colors.muted} /></Pressable> : null}</View>
      <FilterSection title={t("library.country")} colors={colors} onClear={() => setCountry(null)} showClear={Boolean(country)} clearLabel={t("library.clear")}><Chip label={t("library.all")} selected={!country} onPress={() => setCountry(null)} colors={colors} />{countries.map((item) => <Chip key={item} label={item} selected={country === item} onPress={() => setCountry(item)} colors={colors} />)}</FilterSection>
      <FilterSection title={t("library.city")} colors={colors} onClear={() => setCity(null)} showClear={Boolean(city)} clearLabel={t("library.clear")}><Chip label={t("library.all")} selected={!city} onPress={() => setCity(null)} colors={colors} />{cities.map((item) => <Chip key={item} label={item} selected={city === item} onPress={() => setCity(item)} colors={colors} />)}</FilterSection>
      <FilterSection title={t("library.year")} colors={colors} onClear={() => setYear(null)} showClear={Boolean(year)} clearLabel={t("library.clear")}><Chip label={t("library.all")} selected={!year} onPress={() => setYear(null)} colors={colors} />{years.map((item) => <Chip key={item} label={item} selected={year === item} onPress={() => setYear(item)} colors={colors} />)}</FilterSection>
      <FilterSection title={t("library.photos")} colors={colors} onClear={() => setPhotoFilter("all")} showClear={photoFilter !== "all"} clearLabel={t("library.clear")}><Chip label={t("library.all")} selected={photoFilter === "all"} onPress={() => setPhotoFilter("all")} colors={colors} /><Chip label={t("library.withPhotos")} selected={photoFilter === "with"} onPress={() => setPhotoFilter("with")} colors={colors} /><Chip label={t("library.withoutPhotos")} selected={photoFilter === "without"} onPress={() => setPhotoFilter("without")} colors={colors} /></FilterSection>
      <View style={styles.resultRow}><View><Text style={[styles.resultCount, { color: colors.muted }]}>{filtered.length} / {items.length} {t("library.results")}</Text><Text style={[styles.resultHint, { color: colors.muted }]}>{hasActiveFilters ? t("library.applied") : t("library.allMuseums")}</Text></View><View style={styles.resultActions}>{hasActiveFilters ? <Pressable onPress={clearFilters} style={({ pressed }) => [styles.clearAll, pressed && styles.pressed]}><Text style={{ color: colors.primary, fontSize: 12, fontWeight: "800" }}>{t("library.clear")}</Text></Pressable> : null}{!isGuestPreview ? <Pressable onPress={() => router.push("/add")} style={({ pressed }) => [styles.quickAdd, pressed && styles.pressed]}><IconSymbol name="plus" size={16} color={colors.primary} /><Text style={{ color: colors.primary, fontSize: 13, fontWeight: "800" }}>{t("library.add")}</Text></Pressable> : null}</View></View>
    </View>}
    ListEmptyComponent={<View style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}><IconSymbol name="magnifyingglass" size={23} color={colors.muted} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t("library.noResults")}</Text><Text style={[styles.emptyCopy, { color: colors.muted }]}>{t("library.noResultsCopy")}</Text><Pressable onPress={clearFilters} style={({ pressed }) => [styles.emptyButton, { borderColor: colors.primary }, pressed && styles.pressed]}><Text style={[styles.emptyButtonText, { color: colors.primary }]}>{t("library.clearFilters")}</Text></Pressable></View>}
    renderItem={({ item, index }) => <Pressable onPress={() => router.push({ pathname: "/museum/[id]", params: { id: item.id } })} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}><View style={[styles.avatar, { backgroundColor: index % 2 ? "#F4E7D0" : "#DCEEF2" }]}><Text style={{ color: index % 2 ? "#8A5A16" : "#0A5E75", fontSize: 20, fontWeight: "800" }}>{getInitials(item.name)}</Text></View><View style={styles.cardCopy}><Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text><Text style={[styles.meta, { color: colors.muted }]}>{item.city} · {item.country}</Text><View style={styles.cardFooter}><Text style={[styles.date, { color: colors.muted }]}>{formatVisitedDate(item.visitedDate)}</Text>{getMuseumMedia(item).some((media) => media.type === "photo") ? <View style={styles.photoBadge}><IconSymbol name="photo" size={12} color={colors.primary} /><Text style={[styles.photoBadgeText, { color: colors.primary }]}>{t("library.hasPhoto")}</Text></View> : null}</View></View><IconSymbol name="chevron.right" size={20} color={colors.muted} /></Pressable>}
  /></ScreenContainer>;
}

function FilterSection({ title, colors, onClear, showClear, clearLabel, children }: { title: string; colors: ReturnType<typeof useColors>; onClear: () => void; showClear: boolean; clearLabel: string; children: ReactNode }) {
  return <View><View style={styles.filterLabel}><Text style={[styles.filterTitle, { color: colors.foreground }]}>{title}</Text>{showClear ? <Pressable onPress={onClear} style={({ pressed }) => [styles.clear, pressed && styles.pressed]}><Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>{clearLabel}</Text></Pressable> : null}</View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{children}</ScrollView></View>;
}

function Chip({ label, selected, onPress, colors }: { label: string; selected: boolean; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border }, pressed && styles.pressed]}><Text style={{ color: selected ? colors.background : colors.foreground, fontSize: 12, fontWeight: "700" }}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({ content: { padding: 22, paddingBottom: 112 }, kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 1.6, marginTop: 8 }, title: { fontSize: 29, fontWeight: "800", marginTop: 5 }, subtitle: { fontSize: 14, marginTop: 7, marginBottom: 19, lineHeight: 21 }, search: { height: 50, borderWidth: 1, borderRadius: 14, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 8 }, searchInput: { flex: 1, fontSize: 14 }, searchClear: { padding: 3 }, filterLabel: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 18, marginBottom: 9 }, filterTitle: { fontSize: 14, fontWeight: "800" }, clear: { padding: 5 }, chips: { gap: 8, paddingBottom: 1 }, chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 }, resultRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 10 }, resultCount: { fontSize: 13, fontWeight: "700" }, resultHint: { fontSize: 11, marginTop: 3 }, resultActions: { flexDirection: "row", alignItems: "center", gap: 10 }, clearAll: { paddingVertical: 5 }, quickAdd: { flexDirection: "row", alignItems: "center", gap: 3, padding: 5 }, card: { borderWidth: 1, borderRadius: 17, padding: 13, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }, avatar: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center" }, cardCopy: { flex: 1 }, name: { fontSize: 15, fontWeight: "800" }, meta: { fontSize: 12, marginTop: 4 }, cardFooter: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 3 }, date: { fontSize: 11 }, photoBadge: { flexDirection: "row", alignItems: "center", gap: 3 }, photoBadgeText: { fontSize: 10, fontWeight: "800" }, empty: { alignItems: "center", paddingTop: 42, paddingHorizontal: 18 }, emptyIcon: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 14 }, emptyTitle: { fontSize: 17, fontWeight: "800" }, emptyCopy: { marginTop: 7, fontSize: 13, lineHeight: 20, textAlign: "center" }, emptyButton: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 16, paddingVertical: 10, marginTop: 16 }, emptyButtonText: { fontSize: 13, fontWeight: "800" }, pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] } });
