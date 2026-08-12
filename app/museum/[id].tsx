import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatVisitedDate, getMuseumNote, getMuseums, getPalette, getStars, updateMuseumPhotos } from "@/lib/museum-storage";
import { getMuseumPhotos, type MuseumItem } from "@/types/museum";

export default function MuseumDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [museum, setMuseum] = useState<MuseumItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const items = await getMuseums();
    setMuseum(items.find((item) => item.id === id) ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const addPhotos = async () => {
    if (!museum) return;
    setUploading(true);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      if (Platform.OS !== "web") Alert.alert("需要相片權限", "請在系統設定允許 Wanderstamp 讀取相片，才能建立博物館 Album。");
      setUploading(false);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.88,
    });
    if (!result.canceled) {
      const selected = result.assets.map((asset) => asset.uri);
      const nextPhotos = Array.from(new Set([...getMuseumPhotos(museum), ...selected]));
      const nextItems = await updateMuseumPhotos(museum.id, nextPhotos);
      setMuseum(nextItems.find((item) => item.id === museum.id) ?? { ...museum, photos: nextPhotos });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setUploading(false);
  };

  const removePhoto = async (uri: string) => {
    if (!museum) return;
    const nextPhotos = getMuseumPhotos(museum).filter((photo) => photo !== uri);
    const nextItems = await updateMuseumPhotos(museum.id, nextPhotos);
    setMuseum(nextItems.find((item) => item.id === museum.id) ?? { ...museum, photos: nextPhotos });
  };

  if (loading || !museum) {
    return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} /></ScreenContainer>;
  }

  const photos = getMuseumPhotos(museum);
  const palette = getPalette(museum.name.length);

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <FlatList
        data={photos}
        numColumns={2}
        keyExtractor={(uri, index) => `${uri}-${index}`}
        contentContainerStyle={styles.content}
        columnWrapperStyle={photos.length > 1 ? styles.photoRow : undefined}
        ListHeaderComponent={<MuseumHeader museum={museum} photosCount={photos.length} palette={palette} colors={colors} uploading={uploading} onAddPhotos={addPhotos} />}
        ListEmptyComponent={<EmptyAlbum colors={colors} onAddPhotos={addPhotos} />}
        renderItem={({ item, index }) => (
          <View style={styles.photoCell}>
            <Image source={{ uri: item }} style={styles.photo} accessibilityLabel={`${museum.name} 相簿第 ${index + 1} 張照片`} />
            <Pressable accessibilityLabel="刪除照片" onPress={() => removePhoto(item)} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
              <IconSymbol name="xmark" size={13} color="#FFFDF6" />
            </Pressable>
          </View>
        )}
        ListFooterComponent={<View style={[styles.footer, { borderColor: colors.border }]}><IconSymbol name="book.closed.fill" size={19} color={colors.primary} /><Text style={[styles.footerText, { color: colors.muted }]}>這枚印章與照片已保存於你的博物館護照</Text></View>}
      />
    </ScreenContainer>
  );
}

function MuseumHeader({ museum, photosCount, palette, colors, uploading, onAddPhotos }: { museum: MuseumItem; photosCount: number; palette: { background: string; ink: string }; colors: ReturnType<typeof useColors>; uploading: boolean; onAddPhotos: () => void }) {
  return (
    <View>
      <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><IconSymbol name="chevron.left" size={23} color={colors.foreground} /><Text style={{ color: colors.foreground, fontWeight: "700" }}>返回</Text></Pressable>
      <View style={[styles.cover, { backgroundColor: palette.background }]}><View style={[styles.coverStamp, { borderColor: palette.ink }]}><Text style={[styles.coverLetter, { color: palette.ink }]}>{museum.name.slice(0, 1)}</Text><Text style={[styles.coverLabel, { color: palette.ink }]}>WANDERSTAMP</Text></View></View>
      <Text style={[styles.kicker, { color: colors.primary }]}>MUSEUM STAMP</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>{museum.name}</Text>
      <View style={styles.metaRow}><View style={styles.metaItem}><IconSymbol name="location.fill" size={17} color={colors.primary} /><Text style={[styles.metaText, { color: colors.muted }]}>{museum.city} · {museum.country}</Text></View><View style={styles.metaItem}><IconSymbol name="calendar" size={17} color={colors.primary} /><Text style={[styles.metaText, { color: colors.muted }]}>{formatVisitedDate(museum.visitedDate)}</Text></View></View>
      <View style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.noteLabel, { color: colors.primary }]}>MY NOTE</Text><Text style={[styles.note, { color: colors.foreground }]}>{getMuseumNote(museum)}</Text></View>
      {museum.rating ? <View style={styles.rating}><Text style={[styles.ratingLabel, { color: colors.muted }]}>我的評分</Text><Text style={{ color: colors.warning, fontSize: 20 }}>{getStars(museum.rating)}</Text></View> : null}
      <View style={styles.albumHeader}><View><Text style={[styles.albumTitle, { color: colors.foreground }]}>我的 Album</Text><Text style={[styles.albumSubtitle, { color: colors.muted }]}>{photosCount ? `${photosCount} 張旅程照片` : "收藏這間博物館的現場記憶"}</Text></View><Pressable accessibilityLabel="新增照片" onPress={onAddPhotos} disabled={uploading} style={({ pressed }) => [styles.addPhotoButton, { backgroundColor: colors.primary }, pressed && styles.pressed, uploading && styles.disabled]}><IconSymbol name="photo" size={17} color="#FFFDF6" /><Text style={styles.addPhotoText}>{uploading ? "讀取中…" : "新增照片"}</Text></Pressable></View>
    </View>
  );
}

function EmptyAlbum({ colors, onAddPhotos }: { colors: ReturnType<typeof useColors>; onAddPhotos: () => void }) {
  return <View style={[styles.emptyAlbum, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="photo" size={28} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>還沒有照片</Text><Text style={[styles.emptyText, { color: colors.muted }]}>從手機相簿加入第一張記憶，讓這枚印章更完整。</Text><Pressable onPress={onAddPhotos} style={({ pressed }) => [styles.emptyButton, { borderColor: colors.primary }, pressed && styles.pressed]}><Text style={[styles.emptyButtonText, { color: colors.primary }]}>從相簿選取</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  content: { padding: 22, paddingBottom: 42 },
  back: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 8, marginBottom: 18 },
  cover: { height: 205, borderRadius: 25, alignItems: "center", justifyContent: "center", marginBottom: 22 },
  coverStamp: { width: 132, height: 132, borderWidth: 2, borderRadius: 66, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }] },
  coverLetter: { fontSize: 54, fontWeight: "900" }, coverLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 2, marginTop: 1 },
  kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 1.6 }, title: { fontSize: 30, fontWeight: "800", marginTop: 6, lineHeight: 38 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 15 }, metaItem: { flexDirection: "row", alignItems: "center", gap: 5 }, metaText: { fontSize: 13 },
  noteCard: { borderWidth: 1, borderRadius: 18, padding: 17, marginTop: 27 }, noteLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1.4 }, note: { fontSize: 16, lineHeight: 25, marginTop: 9 },
  rating: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, paddingHorizontal: 2 }, ratingLabel: { fontSize: 13, fontWeight: "700" },
  albumHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 30, marginBottom: 12 }, albumTitle: { fontSize: 19, fontWeight: "800" }, albumSubtitle: { fontSize: 12, marginTop: 3 },
  addPhotoButton: { borderRadius: 13, minHeight: 42, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 5 }, addPhotoText: { color: "#FFFDF6", fontSize: 12, fontWeight: "800" },
  photoRow: { gap: 10 }, photoCell: { flex: 1, aspectRatio: 1, marginBottom: 10, borderRadius: 15, overflow: "hidden", position: "relative" }, photo: { width: "100%", height: "100%", backgroundColor: "#E8E2F2" }, deleteButton: { position: "absolute", top: 7, right: 7, width: 27, height: 27, borderRadius: 14, backgroundColor: "rgba(20,20,20,0.7)", alignItems: "center", justifyContent: "center" },
  emptyAlbum: { borderWidth: 1, borderRadius: 19, minHeight: 190, alignItems: "center", justifyContent: "center", padding: 20, marginTop: 2 }, emptyTitle: { fontSize: 16, fontWeight: "800", marginTop: 10 }, emptyText: { fontSize: 12, lineHeight: 18, textAlign: "center", maxWidth: 250, marginTop: 5 }, emptyButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, marginTop: 14 }, emptyButtonText: { fontSize: 12, fontWeight: "800" },
  footer: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, marginTop: 22, paddingTop: 16 }, footerText: { fontSize: 12 }, disabled: { opacity: 0.55 }, pressed: { opacity: 0.7, transform: [{ scale: 0.985 }] },
});
