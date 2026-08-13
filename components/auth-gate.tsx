import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { startOAuthLogin } from "@/constants/oauth";

export function AuthGate({ loading, error }: { loading: boolean; error: Error | null }) {
  const colors = useColors();

  if (loading) {
    return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center"><ActivityIndicator color={colors.primary} size="large" /></ScreenContainer>;
  }

  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><View style={styles.content}>
    <View style={[styles.brandMark, { backgroundColor: colors.primary }]}><IconSymbol name="book.closed.fill" size={34} color="#FFFDF6" /></View>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>WANDERSTAMP</Text>
    <Text style={[styles.title, { color: colors.foreground }]}>收藏屬於你的世界足跡</Text>
    <Text style={[styles.copy, { color: colors.muted }]}>登入或建立自己的帳戶後，博物館、照片、影片與現場回憶都會只保存到你的個人空間，換裝置也能繼續探索。</Text>
    <View style={[styles.promise, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <PromiseRow icon="person.crop.circle.fill" text="每位使用者都有獨立的 Profile" colors={colors} />
      <PromiseRow icon="building.2.fill" text="各自的博物館清單與世界地圖" colors={colors} />
      <PromiseRow icon="cloud.fill" text="登入後可跨裝置備份與同步" colors={colors} />
    </View>
    <Pressable onPress={() => void startOAuthLogin()} style={({ pressed }) => [styles.loginButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
      <IconSymbol name="person.crop.circle.fill" size={19} color="#FFFDF6" />
      <Text style={styles.loginText}>登入／建立我的帳戶</Text>
    </Pressable>
    {error ? <Text style={[styles.error, { color: colors.error }]}>登入狀態確認失敗，請再試一次。</Text> : null}
    <Text style={[styles.note, { color: colors.muted }]}>不登入時不會載入或展示其他帳戶的足跡。</Text>
  </View></ScreenContainer>;
}

function PromiseRow({ icon, text, colors }: { icon: "person.crop.circle.fill" | "building.2.fill" | "cloud.fill"; text: string; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.promiseRow}><IconSymbol name={icon} size={18} color={colors.primary} /><Text style={[styles.promiseText, { color: colors.foreground }]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 26, paddingBottom: 24 },
  brandMark: { alignSelf: "center", width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 22 },
  eyebrow: { alignSelf: "center", fontSize: 11, fontWeight: "900", letterSpacing: 2.2 },
  title: { textAlign: "center", fontSize: 30, lineHeight: 38, fontWeight: "900", marginTop: 10 },
  copy: { textAlign: "center", fontSize: 14, lineHeight: 22, marginTop: 13 },
  promise: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 15, marginTop: 25 },
  promiseRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  promiseText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  loginButton: { minHeight: 52, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 },
  loginText: { color: "#FFFDF6", fontSize: 14, fontWeight: "900" },
  error: { textAlign: "center", fontSize: 12, marginTop: 12 },
  note: { textAlign: "center", fontSize: 11, lineHeight: 17, marginTop: 18 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
