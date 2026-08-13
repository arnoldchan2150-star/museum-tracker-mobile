import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { notifyAuthChanged } from "@/lib/auth-events";

function createNonce(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function isAppleSignInAvailable() {
  if (Platform.OS !== "ios") return false;
  return AppleAuthentication.isAvailableAsync();
}

export async function signInWithApple() {
  if (!(await isAppleSignInAvailable())) {
    throw new Error("Apple ID 登入只適用於支援 Apple Authentication 的 iOS 裝置。");
  }

  const nonce = createNonce(await Crypto.getRandomBytesAsync(32));
  const credential = await AppleAuthentication.signInAsync({
    nonce,
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error("Apple 沒有回傳有效的身份憑證，請稍後再試。");
  }

  const name = [credential.fullName?.givenName, credential.fullName?.middleName, credential.fullName?.familyName]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ") || null;
  const result = await Api.signInWithApple({
    identityToken: credential.identityToken,
    authorizationCode: credential.authorizationCode,
    nonce,
    user: credential.user,
    email: credential.email,
    name,
  });

  await Auth.setSessionToken(result.sessionToken);
  if (result.user) {
    await Auth.setUserInfo({
      id: result.user.id ?? 0,
      openId: result.user.openId,
      name: result.user.name ?? name,
      email: result.user.email ?? credential.email ?? null,
      loginMethod: result.user.loginMethod ?? "apple",
      lastSignedIn: new Date(result.user.lastSignedIn || Date.now()),
    });
  }
  notifyAuthChanged();
  return result.user;
}
