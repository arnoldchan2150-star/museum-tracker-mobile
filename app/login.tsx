import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { sendPasswordReset, signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/_core/auth";
import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from "@/lib/supabase";

type Mode = "signIn" | "signUp" | "reset";

const COPY: Record<Mode, { title: string; submit: string }> = {
  signIn: { title: "登入你的旅印帳戶", submit: "登入" },
  signUp: { title: "建立新的旅印帳戶", submit: "建立帳戶" },
  reset: { title: "重設密碼", submit: "寄送重設連結" },
};

export default function LoginScreen() {
  const colors = useColors();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(isSupabaseConfigured ? null : { tone: "error", text: NOT_CONFIGURED_MESSAGE });

  const close = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile"));

  const done = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    close();
  };

  const submit = async () => {
    if (!email.trim().includes("@")) { setMessage({ tone: "error", text: "請輸入有效的 Email。" }); return; }
    if (mode !== "reset" && password.length < 6) { setMessage({ tone: "error", text: "密碼至少需要 6 個字元。" }); return; }
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signIn") {
        await signInWithEmail(email, password);
        await done();
      } else if (mode === "signUp") {
        const { needsConfirmation } = await signUpWithEmail(email, password, newsletter);
        if (needsConfirmation) { setMode("signIn"); setMessage({ tone: "info", text: "已寄出確認信，請到信箱點擊連結後再登入。" }); }
        else await done();
      } else {
        await sendPasswordReset(email);
        setMode("signIn");
        setMessage({ tone: "info", text: "已寄出重設密碼連結，請查看信箱。" });
      }
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "發生錯誤，請稍後再試。" });
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setMessage(null);
    try {
      if (await signInWithGoogle()) await done();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Google 登入失敗。" });
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy || !isSupabaseConfigured;

  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Pressable accessibilityLabel="關閉" onPress={close} style={({ pressed }) => [styles.close, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && styles.pressed]}><IconSymbol name="xmark" size={16} color={colors.primary} /></Pressable>
    <View style={[styles.brandMark, { backgroundColor: colors.primary }]}><IconSymbol name="book.closed.fill" size={30} color="#FFFDF6" /></View>
    <Text style={[styles.eyebrow, { color: colors.primary }]}>WANDERSTAMP</Text>
    <Text style={[styles.title, { color: colors.foreground }]}>{COPY[mode].title}</Text>
    <Text style={[styles.copy, { color: colors.muted }]}>登入後，博物館、照片與影片會備份到你的個人雲端空間，換手機也能還原。不登入也可以繼續以訪客模式使用。</Text>

    {mode !== "reset" ? <>
      <Pressable onPress={google} disabled={disabled} style={({ pressed }) => [styles.googleButton, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && styles.pressed, disabled && styles.disabled]}>
        <Text style={[styles.googleG, { color: colors.primary }]}>G</Text>
        <Text style={[styles.googleText, { color: colors.foreground }]}>使用 Google 繼續</Text>
      </Pressable>
      <View style={styles.dividerRow}><View style={[styles.divider, { backgroundColor: colors.border }]} /><Text style={[styles.dividerText, { color: colors.muted }]}>或使用 Email</Text><View style={[styles.divider, { backgroundColor: colors.border }]} /></View>
    </> : null}

    <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
    <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.muted} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
    {mode !== "reset" ? <>
      <Text style={[styles.label, { color: colors.foreground }]}>密碼</Text>
      <TextInput value={password} onChangeText={setPassword} placeholder="至少 6 個字元" placeholderTextColor={colors.muted} secureTextEntry autoCapitalize="none" autoComplete={mode === "signUp" ? "new-password" : "current-password"} textContentType={mode === "signUp" ? "newPassword" : "password"} onSubmitEditing={submit} style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
    </> : null}

    {mode === "signUp" ? <View style={styles.optInRow}>
      <Switch value={newsletter} onValueChange={setNewsletter} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.background} />
      <Text style={[styles.optInText, { color: colors.muted }]}>我願意收到 Wanderstamp 的電子報與新功能消息（可隨時取消）。</Text>
    </View> : null}

    <Pressable onPress={submit} disabled={disabled} style={({ pressed }) => [styles.submit, { backgroundColor: colors.primary }, pressed && styles.pressed, disabled && styles.disabled]}>
      {busy ? <ActivityIndicator color="#FFFDF6" /> : <Text style={styles.submitText}>{COPY[mode].submit}</Text>}
    </Pressable>

    {message ? <Text style={[styles.message, { color: message.tone === "error" ? colors.error : colors.primary }]}>{message.text}</Text> : null}

    <View style={styles.links}>
      {mode === "signIn" ? <>
        <LinkText label="還沒有帳戶？建立帳戶" onPress={() => { setMode("signUp"); setMessage(null); }} color={colors.primary} />
        <LinkText label="忘記密碼？" onPress={() => { setMode("reset"); setMessage(null); }} color={colors.muted} />
      </> : <LinkText label="返回登入" onPress={() => { setMode("signIn"); setMessage(null); }} color={colors.primary} />}
    </View>
  </ScrollView></KeyboardAvoidingView></ScreenContainer>;
}

function LinkText({ label, onPress, color }: { label: string; onPress: () => void; color: string }) {
  return <Pressable onPress={onPress} hitSlop={8}><Text style={[styles.link, { color }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 26, paddingTop: 12, paddingBottom: 40 },
  close: { alignSelf: "flex-end", width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  brandMark: { alignSelf: "center", width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center", marginTop: 4, marginBottom: 16 },
  eyebrow: { alignSelf: "center", fontSize: 11, fontWeight: "900", letterSpacing: 2.2 },
  title: { textAlign: "center", fontSize: 26, lineHeight: 34, fontWeight: "900", marginTop: 8 },
  copy: { textAlign: "center", fontSize: 13, lineHeight: 20, marginTop: 10 },
  googleButton: { minHeight: 50, borderRadius: 15, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 24 },
  googleG: { fontSize: 18, fontWeight: "900" },
  googleText: { fontSize: 14, fontWeight: "800" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20, marginBottom: 4 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 11, fontWeight: "700" },
  label: { fontSize: 12, fontWeight: "800", marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 13, minHeight: 48, paddingHorizontal: 13, fontSize: 15 },
  optInRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  optInText: { flex: 1, fontSize: 12, lineHeight: 18 },
  submit: { minHeight: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 22 },
  submitText: { color: "#FFFDF6", fontSize: 15, fontWeight: "900" },
  message: { textAlign: "center", fontSize: 13, lineHeight: 19, marginTop: 14 },
  links: { alignItems: "center", gap: 14, marginTop: 20 },
  link: { fontSize: 13, fontWeight: "800" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
