import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import { getMapRegion, getMuseumCoordinates, getMuseumLabel, type MuseumItem } from "@/types/museum";

type Palette = { primary: string; background: string; surface: string; border: string; foreground: string; muted: string };

export function WorldMap({ museums, colors, onSelect }: { museums: MuseumItem[]; colors: Palette; onSelect: (museum: MuseumItem) => void }) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(getMapRegion());
  const zoom = (direction: "in" | "out") => {
    const next: Region = { ...region, latitudeDelta: direction === "in" ? Math.max(8, region.latitudeDelta / 2) : Math.min(160, region.latitudeDelta * 2), longitudeDelta: direction === "in" ? Math.max(14, region.longitudeDelta / 2) : Math.min(280, region.longitudeDelta * 2) };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 220);
  };
  return <View style={styles.container}><MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={getMapRegion()} region={region} onRegionChangeComplete={setRegion} mapType="standard" showsCompass showsScale zoomEnabled scrollEnabled accessibilityLabel="可縮放及拖曳的世界地圖">{museums.map((museum) => { const coordinate = getMuseumCoordinates(museum); return <Marker key={museum.id} coordinate={coordinate} title={museum.name} description={`${museum.city} · ${museum.country}`} onCalloutPress={() => onSelect(museum)} accessibilityLabel={getMuseumLabel(museum)}><View style={[styles.marker, { backgroundColor: colors.primary, borderColor: colors.background }]}><Text style={styles.markerLetter}>{museum.name.slice(0, 1)}</Text></View></Marker>; })}</MapView><View style={styles.controls} pointerEvents="box-none"><View style={[styles.legend, { backgroundColor: colors.background }]}><View style={[styles.dot, { backgroundColor: colors.primary }]} /><Text style={[styles.legendText, { color: colors.foreground }]}>已更新博物館</Text></View><View style={styles.zoomControls}><Pressable accessibilityLabel="放大地圖" onPress={() => zoom("in")} style={({ pressed }) => [styles.zoomButton, { backgroundColor: colors.background, borderColor: colors.border }, pressed && styles.pressed]}><Text style={[styles.zoomText, { color: colors.foreground }]}>＋</Text></Pressable><Pressable accessibilityLabel="縮小地圖" onPress={() => zoom("out")} style={({ pressed }) => [styles.zoomButton, { backgroundColor: colors.background, borderColor: colors.border }, pressed && styles.pressed]}><Text style={[styles.zoomText, { color: colors.foreground }]}>−</Text></Pressable></View></View></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, position: "relative" }, controls: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between", padding: 14 }, legend: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 8, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 }, dot: { width: 9, height: 9, borderRadius: 5 }, legendText: { fontSize: 11, fontWeight: "700" }, zoomControls: { alignSelf: "flex-end", gap: 7 }, zoomButton: { width: 38, height: 38, borderWidth: 1, borderRadius: 13, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 }, zoomText: { fontSize: 22, lineHeight: 25, fontWeight: "600" }, marker: { minWidth: 32, height: 32, borderRadius: 16, borderWidth: 3, alignItems: "center", justifyContent: "center" }, markerLetter: { color: "#FFFDF6", fontSize: 13, fontWeight: "900" }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] } });
