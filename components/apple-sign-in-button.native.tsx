import { Alert, Platform, StyleSheet } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { signInWithApple } from "@/lib/apple-auth";

export function AppleSignInButton({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void signInAvailability().then((result) => {
      if (active) setAvailable(result);
    });
    return () => { active = false; };
  }, []);

  if (Platform.OS !== "ios" || !available) return null;

  const handlePress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signInWithApple();
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code !== "ERR_REQUEST_CANCELED") {
        Alert.alert(t("auth.appleErrorTitle"), error instanceof Error ? error.message : t("auth.appleError"));
      }
    } finally {
      setBusy(false);
    }
  };

  return <AppleAuthentication.AppleAuthenticationButton
    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
    cornerRadius={compact ? 10 : 14}
    onPress={() => { void handlePress(); }}
    style={[styles.button, compact && styles.compact]}
  />;
}

async function signInAvailability() {
  try {
    return await signInWithAppleAvailability();
  } catch {
    return false;
  }
}

async function signInWithAppleAvailability() {
  if (Platform.OS !== "ios") return false;
  return AppleAuthentication.isAvailableAsync();
}

const styles = StyleSheet.create({
  button: { width: "100%", height: 52, marginTop: 10 },
  compact: { height: 46, marginTop: 8 },
});
