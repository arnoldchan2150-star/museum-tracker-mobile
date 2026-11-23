import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { completeAuthFromUrl, getSession, updatePassword } from "@/lib/_core/auth";

/**
 * Landing page for links from Supabase emails (confirm sign-up, reset password)
 * and the Google OAuth redirect: wanderstamp://auth/callback?code=...
 */
export default function AuthCallbackScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ next?: string }>();
  const url = Linking.useURL();
  const [status, setStatus] = useState<"working" | "reset" | "error">("working");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // On web supabase-js exchanges the code from the URL itself; on native we do it here.
        if (url) await completeAuthFromUrl(url).catch((err) => { if (!(err instanceof Error && /code verifier|already/i.test(err.message))) throw err; });
        const session = await getSession();
        if (cancelled) return;
        if (!session) throw new Error("連結已失效或已使用過，請重新登入。");
        if (params.next === "reset") setStatus("reset");
        else router.replace("/(tabs)/profile");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "登入失敗，請再試一次。");
        setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [url, params.next]);

  const savePassword = async () => {
    if (password.length < 6) { setError("密碼至少需要 6 個字元。"); return; }
    setSaving(true);
    try {
      await updatePassword(password);
      router.replace("/(tabs)/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新密碼失敗。");
    } finally {
      setSaving(false);
    }
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="justify-center"><View style={styles.content}>
    {status === "working" ? <><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.copy, { color: colors.muted }]}>正在完成登入…</Text></> : null}
    {status === "reset" ? <>
      <Text style={[styles.title, { color: colors.foreground }]}>設定新密碼</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="至少 6 個字元" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
      <Pressable onPress={savePassword} disabled={saving} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={styles.buttonText}>{saving ? "儲存中…" : "儲存新密碼"}</Text></Pressable>
      {error ? <Text style={[styles.copy, { color: colors.error }]}>{error}</Text> : null}
    </> : null}
    {status === "error" ? <>
      <Text style={[styles.title, { color: colors.foreground }]}>無法完成登入</Text>
      <Text style={[styles.copy, { color: colors.error }]}>{error}</Text>
      <Pressable onPress={() => router.replace("/login")} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={styles.buttonText}>回到登入頁</Text></Pressable>
    </> : null}
  </View></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 28, gap: 14, alignItems: "stretch" },
  title: { fontSize: 24, fontWeight: "900", textAlign: "center" },
  copy: { fontSize: 13, lineHeight: 20, textAlign: "center" },
  input: { borderWidth: 1, borderRadius: 13, minHeight: 48, paddingHorizontal: 13, fontSize: 15 },
  button: { minHeight: 50, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFFDF6", fontSize: 14, fontWeight: "900" },
});
