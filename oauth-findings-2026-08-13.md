# OAuth 排查重點（2026-08-13）

## Expo 官方來源

來源：[Expo Authentication guide](https://docs.expo.dev/guides/authentication/)

Expo 官方指南指出，OAuth 流程應使用 `WebBrowser.maybeCompleteAuthSession()`、`AuthSession.makeRedirectUri()`，並且 **Expo Go 不能用於 OAuth／OpenID Connect 應用的本地開發與測試，因為無法自訂 App scheme**；應改用 Development Build，才能在登入後可靠地以自訂 redirect 回到 App。

來源：[Expo AuthSession reference](https://docs.expo.dev/versions/latest/sdk/auth-session/)

Expo AuthSession 文件指出，standalone/development build 需要在 app config 設定 scheme，並重新建立原生 binary；若沒有可由 App 處理的 scheme，登入可能完成但無法把結果傳回 App，最後看起來像被取消。

來源：[Expo WebBrowser reference](https://docs.expo.dev/versions/latest/sdk/webbrowser/)

Expo WebBrowser 文件說明，`openAuthSessionAsync` 的 redirect URI 必須使用 App config 中的 scheme，且 provider 端必須 allowlist 該 redirect URI。

## 專案日誌證據

Apple 登入 API 回傳 `Apple sign-in verification failed`，後端 jose 驗證錯誤為 `unexpected aud claim value`。實際 Apple identity token 的 `aud` 是 `host.exp.Exponent`，而後端預期 `com.app.museumtrackermobile`。這是 Expo Go token 與正式原生 bundle audience 不一致造成的。

Google／Manus OAuth 在現有日誌中出現 `Login browser session was cancelled`，與 Expo Go 無法使用可自訂 OAuth App scheme 的限制一致；登入後無法回到 App 時，`openAuthSessionAsync` 會看起來像取消。
