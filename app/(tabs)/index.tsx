import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import MapView, { Marker, type Region } from "react-native-maps";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getMuseums, getStats } from "@/lib/museum-storage";
import { getMapRegion, getMuseumCoordinates, getMuseumLabel, type MuseumItem } from "@/types/museum";

export default function HomeScreen() {
  const colors = useColors();
  const mapRef = useRef<MapView>(null);
  const [museums, setMuseums] = useState<MuseumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region>(getMapRegion());
  const stats = getStats(museums);

  const load = useCallback(async () => {
    const items = await getMuseums();
    setMuseums(items);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const markers = useMemo(() => museums.map((museum) => ({ museum, coordinate: getMuseumCoordinates(museum) })), [museums]);
  const changeZoom = (direction: "in" | "out") => {
    const next: Region = { ...region, latitudeDelta: direction === "in" ? Math.max(8, region.latitudeDelta / 2) : Math.min(160, region.latitudeDelta * 2), longitudeDelta: direction === "in" ? Math.max(14, region.longitudeDelta / 2) : Math.min(280, region.longitudeDelta * 2) };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 220);
  };

  if (loading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} /></ScreenContainer>;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>WANDERSTAMP</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>世界足跡</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>每個標記，都是一次看見世界的證明。</Text>
          </View>
          <View style={[styles.counter, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.counterNumber, { color: colors.primary }]}>{stats.museums}</Text>
            <Text style={[styles.counterLabel, { color: colors.muted }]}>間已更新</Text>
          </View>
        </View>

        <View style={[styles.mapCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {Platform.OS === "web" ? (
            <WebMapFallback museums={museums} colors={colors} onPress={(museum) => router.push({ pathname: "/museum/[id]", params: { id: museum.id } })} />
          ) : (
            <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={getMapRegion()} region={region} onRegionChangeComplete={setRegion} mapType="standard" showsCompass showsScale zoomEnabled scrollEnabled accessibilityLabel="可縮放及拖曳的世界地圖">
              {markers.map(({ museum, coordinate }) => (
                <Marker key={museum.id} coordinate={coordinate} title={museum.name} description={`${museum.city} · ${museum.country}`} onCalloutPress={() => router.push({ pathname: "/museum/[id]", params: { id: museum.id } })}>
                  <View style={[styles.marker, { backgroundColor: colors.primary, borderColor: colors.background }]}><Text style={styles.markerLetter}>{museum.name.slice(0, 1)}</Text></View>
                </Marker>
              ))}
            </MapView>
          )}
          <View style={styles.mapOverlay} pointerEvents="box-none">
            <View style={[styles.mapLegend, { backgroundColor: colors.background }]}><View style={[styles.legendDot, { backgroundColor: colors.primary }]} /><Text style={[styles.legendText, { color: colors.foreground }]}>已更新博物館</Text></View>
            <View style={styles.zoomControls}>
              <Pressable accessibilityLabel="放大地圖" onPress={() => changeZoom("in")} style={({ pressed }) => [styles.zoomButton, { backgroundColor: colors.background, borderColor: colors.border }, pressed && styles.pressed]}><Text style={[styles.zoomText, { color: colors.foreground }]}>＋</Text></Pressable>
              <Pressable accessibilityLabel="縮小地圖" onPress={() => changeZoom("out")} style={({ pressed }) => [styles.zoomButton, { backgroundColor: colors.background, borderColor: colors.border }, pressed && styles.pressed]}><Text style={[styles.zoomText, { color: colors.foreground }]}>−</Text></Pressable>
            </View>
          </View>
        </View>

        <View style={styles.mapFooter}>
          <View><Text style={[styles.footerTitle, { color: colors.foreground }]}>你的文化航線</Text><Text style={[styles.footerText, { color: colors.muted }]}>{stats.countries} 個國家 · {stats.cities} 座城市</Text></View>
          <Pressable onPress={() => router.push("/(tabs)/library")} style={({ pressed }) => [styles.libraryButton, { borderColor: colors.primary }, pressed && styles.pressed]}><Text style={[styles.libraryButtonText, { color: colors.primary }]}>查看清單</Text><IconSymbol name="chevron.right" size={16} color={colors.primary} /></Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

function WebMapFallback({ museums, colors, onPress }: { museums: MuseumItem[]; colors: ReturnType<typeof useColors>; onPress: (museum: MuseumItem) => void }) {
  return <View style={[styles.webMap, { backgroundColor: colors.primary }]}><View style={styles.webGrid} /><View style={styles.webMapTitle}><Text style={styles.webMapKicker}>YOUR CULTURAL TRAIL</Text><Text style={styles.webMapText}>WORLD MAP</Text><Text style={styles.webMapHint}>在手機原生版本可雙指縮放與拖曳</Text></View>{museums.map((museum, index) => { const point = getMuseumCoordinates(museum); const left = `${Math.min(88, Math.max(12, ((point.longitude + 180) / 360) * 100))}%` as `${number}%`; const top = `${Math.min(78, Math.max(18, ((90 - point.latitude) / 180) * 100))}%` as `${number}%`; return <Pressable key={museum.id} onPress={() => onPress(museum)} accessibilityLabel={getMuseumLabel(museum)} style={({ pressed }) => [styles.webMarker, { left, top, backgroundColor: index % 2 ? "#D9B86C" : "#F5F0E8" }, pressed && styles.pressed]}><View style={[styles.webMarkerDot, { backgroundColor: colors.primary }]} /><Text numberOfLines={1} style={[styles.webMarkerName, { color: colors.foreground }]}>{museum.name}</Text></Pressable>; })}</View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingVertical: 8 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.7, marginTop: 4 },
  subtitle: { fontSize: 13, marginTop: 5 },
  counter: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9, alignItems: "center" },
  counterNumber: { fontSize: 21, fontWeight: "800" },
  counterLabel: { fontSize: 10, marginTop: 1 },
  mapCard: { flex: 1, minHeight: 390, overflow: "hidden", borderWidth: 1, borderRadius: 25, position: "relative" },
  mapOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between", padding: 14 },
  mapLegend: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 8, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 11, fontWeight: "700" },
  zoomControls: { alignSelf: "flex-end", gap: 7 },
  zoomButton: { width: 38, height: 38, borderWidth: 1, borderRadius: 13, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 },
  zoomText: { fontSize: 22, lineHeight: 25, fontWeight: "600" },
  marker: { minWidth: 32, height: 32, borderRadius: 16, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  markerLetter: { color: "#FFFDF6", fontSize: 13, fontWeight: "900" },
  mapFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12 },
  footerTitle: { fontSize: 16, fontWeight: "800" },
  footerText: { fontSize: 12, marginTop: 3 },
  libraryButton: { borderWidth: 1, borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 11, paddingVertical: 9 },
  libraryButtonText: { fontSize: 12, fontWeight: "800" },
  webMap: { flex: 1, overflow: "hidden", position: "relative" },
  webGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.15, borderWidth: 1, borderColor: "#D8F0F1", backgroundColor: "transparent" },
  webMapTitle: { position: "absolute", left: 18, bottom: 18 },
  webMapKicker: { color: "#B7E4E8", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  webMapText: { color: "#FFFDF6", fontSize: 26, fontWeight: "900", marginTop: 3 },
  webMapHint: { color: "#D8F0F1", fontSize: 11, marginTop: 5 },
  webMarker: { position: "absolute", flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingRight: 8, paddingLeft: 5, paddingVertical: 5, maxWidth: 170 },
  webMarkerDot: { width: 11, height: 11, borderRadius: 6 },
  webMarkerName: { fontSize: 10, fontWeight: "800", maxWidth: 125 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
