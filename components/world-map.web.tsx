import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getMuseumCoordinates, getMuseumLabel, type MuseumItem } from "@/types/museum";

type Palette = { primary: string; background: string; surface: string; border: string; foreground: string; muted: string };

export function WorldMap({ museums, colors, onSelect }: { museums: MuseumItem[]; colors: Palette; onSelect: (museum: MuseumItem) => void }) {
  const [scale, setScale] = useState(1);
  const adjust = (direction: "in" | "out") => setScale((value) => Math.max(0.75, Math.min(1.6, value * (direction === "in" ? 1.16 : 0.86))));

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={[styles.mapShape, { transform: [{ scale }] }]} />
      <View style={styles.title}><Text style={styles.kicker}>YOUR CULTURAL TRAIL</Text><Text style={styles.mapText}>WORLD MAP</Text><Text style={styles.hint}>Web 預覽以示意地圖呈現；原生版本支援雙指縮放與拖曳</Text></View>
      <View style={styles.markers}>
        {museums.map((museum, index) => {
          const point = getMuseumCoordinates(museum);
          const left = `${Math.min(87, Math.max(13, ((point.longitude + 180) / 360) * 100))}%` as `${number}%`;
          const top = `${Math.min(72, Math.max(15, ((90 - point.latitude) / 180) * 100))}%` as `${number}%`;
          return <Pressable key={museum.id} onPress={() => onSelect(museum)} accessibilityLabel={getMuseumLabel(museum)} style={({ pressed }) => [styles.marker, { left, top, backgroundColor: index % 2 ? "#D9B86C" : "#F5F0E8" }, pressed && styles.pressed]}><View style={[styles.dot, { backgroundColor: colors.primary }]} /><Text numberOfLines={1} style={[styles.markerName, { color: colors.foreground }]}>{museum.name}</Text></Pressable>;
        })}
      </View>
      <View style={[styles.legend, { backgroundColor: colors.background }]}><View style={[styles.legendDot, { backgroundColor: colors.primary }]} /><Text style={[styles.legendText, { color: colors.foreground }]}>已更新博物館</Text></View>
      <View style={styles.zoomControls}><Pressable accessibilityLabel="放大地圖" onPress={() => adjust("in")} style={({ pressed }) => [styles.zoomButton, { backgroundColor: colors.background, borderColor: colors.border }, pressed && styles.pressed]}><Text style={[styles.zoomText, { color: colors.foreground }]}>＋</Text></Pressable><Pressable accessibilityLabel="縮小地圖" onPress={() => adjust("out")} style={({ pressed }) => [styles.zoomButton, { backgroundColor: colors.background, borderColor: colors.border }, pressed && styles.pressed]}><Text style={[styles.zoomText, { color: colors.foreground }]}>−</Text></Pressable></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: "relative", overflow: "hidden" },
  mapShape: { position: "absolute", width: "88%", height: "54%", left: "6%", top: "20%", borderRadius: 170, backgroundColor: "rgba(183,228,232,0.28)", borderWidth: 1, borderColor: "rgba(247,244,238,0.35)" },
  title: { position: "absolute", left: 18, bottom: 18 },
  kicker: { color: "#B7E4E8", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  mapText: { color: "#FFFDF6", fontSize: 26, fontWeight: "900", marginTop: 3 },
  hint: { color: "#D8F0F1", fontSize: 11, maxWidth: 260, lineHeight: 16, marginTop: 5 },
  markers: { ...StyleSheet.absoluteFillObject },
  marker: { position: "absolute", flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingRight: 8, paddingLeft: 5, paddingVertical: 5, maxWidth: 170 },
  dot: { width: 11, height: 11, borderRadius: 6 },
  markerName: { fontSize: 10, fontWeight: "800", maxWidth: 125 },
  legend: { position: "absolute", top: 14, left: 14, flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 8 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 11, fontWeight: "700" },
  zoomControls: { position: "absolute", right: 14, bottom: 14, gap: 7 },
  zoomButton: { width: 38, height: 38, borderWidth: 1, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  zoomText: { fontSize: 22, lineHeight: 25, fontWeight: "600" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
