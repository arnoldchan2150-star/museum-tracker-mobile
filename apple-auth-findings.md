# Apple ID Login Findings

Apple's official Sign in with Apple guidance says the app server must securely receive the identity token and authorization code, verify the JWS signature with Apple's public key, verify the nonce, confirm `iss` is `https://appleid.apple.com`, confirm `aud` matches the developer client ID, and verify the token has not expired. Source: https://developer.apple.com/documentation/signinwithapple/verifying-a-user

Expo's Apple Authentication documentation says `expo-apple-authentication` supports iOS only, requires the native AppleAuthenticationButton when available, and requires `ios.usesAppleSignIn: true` plus a new native build for EAS. It also warns that the user's name and email are returned only on the first authorization and should be stored server-side. Source: https://docs.expo.dev/versions/latest/sdk/apple-authentication/

Current Wanderstamp uses a Manus OAuth browser portal and a `/api/oauth/mobile` code/state exchange. The current server has no endpoint that accepts an Apple native identity token, and app.config.ts has no `usesAppleSignIn` property or expo-apple-authentication dependency. Therefore, fixing the native Apple ID flow requires both an iOS capability/UI addition and a server-side Apple token verification/session exchange, not just changing button text.
