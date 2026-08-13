import { useRef, useState } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { getMuseumCoordinates, getMuseumLabel, type MuseumItem } from "@/types/museum";

type Palette = { primary: string; background: string; surface: string; border: string; foreground: string; muted: string };
const WORLD_MAP = require("@/assets/maps/world-map.png");

export function WorldMap({ museums, colors, onSelect }: { museums: MuseumItem[]; colors: Palette; onSelect: (museum: MuseumItem) => void }) {
  const [zoom, setZoom] = useState(1);
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
    onPanResponderGrant: () => pan.extractOffset(),
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: () => pan.flattenOffset(),
  })).current;
  const adjust = (direction: "in" | "out") => setZoom((value) => Math.max(0.75, Math.min(2.4, value * (direction === "in" ? 1.18 : 0.84))));

  return <View style={styles.container} {...panResponder.panHandlers}>
    <Animated.View style={[styles.stage, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: zoom }] }]}>
      <Animated.Image source={WORLD_MAP} resizeMode="contain" style={styles.mapImage} accessibilityLabel="真實世界地圖" />
      <View style={styles.markers} pointerEvents="box-none">
        {museums.map((museum, index) => {
          const point = getMuseumCoordinates(museum);
          const left = `${Math.min(95, Math.max(5, ((point.longitude + 180) / 360) * 100))}%` as `${number}%`;
          const top = `${Math.min(90, Math.max(10, ((90 - point.latitude) / 180) * 100))}%` as `${number}%`;
          return <Pressable key={museum.id} onPress={() => onSelect(museum)} accessibilityLabel={getMuseumLabel(museum)} style={({ pressed }) => [styles.marker, { left, top, backgroundColor: index % 2 ? "#D9B86C" : "#F5F0E8" }, pressed && styles.pressed]}><View style={[styles.markerDot, { backgroundColor: colors.primary }]} /><Text numberOfLines={1} style={[styles.markerName, { color: colors.foreground }]}>{museum.name}</Text></Pressable>;
        })}
      </View>
    </Animated.View>
    <View style={[styles.legend, { backgroundColor: colors.background }]} pointerEvents="none"><View style={[styles.legendDot, { backgroundColor: colors.primary }]} /><Text style={[styles.legendText, { color: colors.foreground }]}>已更新博物館</Text></View>
    <View style={styles.zoomControls}><Pressable accessibilityLabel="放大地圖" onPress={() => adjust("in")} style={({ pressed }) => [styles.zoomButton, { backgroundColor: colors.background, borderColor: colors.border }, pressed && styles.pressed]}><Text style={[styles.zoomText, { color: colors.foreground }]}>＋</Text></Pressable><Pressable accessibilityLabel="縮小地圖" onPress={() => adjust("out")} style={({ pressed }) => [styles.zoomButton, { backgroundColor: colors.background, borderColor: colors.border }, pressed && styles.pressed]}><Text style={[styles.zoomText, { color: colors.foreground }]}>−</Text></Pressable></View>
    <View style={styles.caption} pointerEvents="none"><Text style={styles.captionKicker}>YOUR CULTURAL TRAIL</Text><Text style={styles.captionTitle}>WORLD MAP</Text><Text style={styles.captionHint}>拖曳地圖，或使用右側按鈕縮放</Text></View>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#DCEEF2", overflow: "hidden", position: "relative" },
  stage: { position: "absolute", width: "118%", height: "96%", left: "-9%", top: "2%" },
  mapImage: { width: "100%", height: "100%", opacity: 0.78 },
  markers: { ...StyleSheet.absoluteFillObject },
  marker: { position: "absolute", flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 5, maxWidth: 165, shadowColor: "#0A5E75", shadowOpacity: 0.16, shadowRadius: 4, elevation: 2 },
  markerDot: { width: 10, height: 10, borderRadius: 5 },
  markerName: { fontSize: 10, fontWeight: "800", maxWidth: 125 },
  legend: { position: "absolute", left: 14, top: 14, flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 8, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 11, fontWeight: "700" },
  zoomControls: { position: "absolute", right: 14, bottom: 14, gap: 7 },
  zoomButton: { width: 38, height: 38, borderWidth: 1, borderRadius: 13, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 },
  zoomText: { fontSize: 22, lineHeight: 25, fontWeight: "600" },
  caption: { position: "absolute", left: 18, bottom: 18 },
  captionKicker: { color: "#0A5E75", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  captionTitle: { color: "#0A5E75", fontSize: 26, fontWeight: "900", marginTop: 2 },
  captionHint: { color: "#315B67", fontSize: 11, marginTop: 4 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
