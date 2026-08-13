# Wanderstamp 登入卡住深度排查結果

## 實際症狀

開啟 Web 預覽時，`/api/auth/me` 在未登入狀態回報 `Missing session cookie`；舊登入狀態則曾回報 `Invalid session cookie`，AuthGate 因 `useAuth().isAuthenticated` 為 false 而持續顯示登入畫面。

## 根因判斷

先前 `getSessionCookieOptions()` 將 `app_session_id` 設到共享的 `.manus.computer` 或 `.manuspre.computer` 父網域。不同 Manus 專案或舊預覽可共享同名 cookie，瀏覽器便可能把另一個專案或過期 JWT 一起送給 Wanderstamp API，後端驗證失敗後，畫面看起來像登入按鈕沒有反應。

## 已完成修正

1. 新的 Session cookie 改為 API host-only，不再設定父網域。
2. OAuth callback、Apple 登入、Mobile OAuth exchange、Session 建立與登出會清理舊版父網域 cookie。
3. `/api/auth/me` 遇到無效 cookie 時也會清理 host-only 與舊父網域 cookie，讓下一次登入從乾淨狀態開始。
4. 移除不安全的 Web 假登入 bypass；正式登入仍以伺服器驗證的 HTTP-only cookie 為唯一來源。
5. 保留原生端 Bearer token 與 OAuth callback 的立即 AuthGate 更新及 `router.replace`。

## 驗證

TypeScript、ESLint、Vitest 通過；Session cookie 測試確認新 cookie 沒有 domain，舊 preview domain 只可被辨識用於清理。以無效 cookie 呼叫 `/api/auth/me` 時回傳 401，並收到兩個清理 cookie：API host-only 與 `.manus.computer` legacy cookie。Expo Web 預覽可正常載入。
