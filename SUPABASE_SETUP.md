# Wanderstamp × Supabase 設定說明

App 已經不再依賴 Manus。登入、雲端備份和照片儲存全部改用你自己的 Supabase 專案（免費方案就夠用）。
**沒有設定 Supabase 時，App 仍然可以以訪客模式完整離線使用**，只是「登入」和「雲端備份」會顯示尚未設定。

---

## 1. 建立 Supabase 專案

1. 到 <https://supabase.com> 註冊並按 **New project**。
2. Region 建議選 **Southeast Asia (Singapore)** 或 **Northeast Asia (Tokyo)**，香港用起來較快。
3. 記下資料庫密碼（之後很少用到）。

## 2. 建立資料表與照片儲存空間

1. 左側選 **SQL Editor → New query**。
2. 打開本 repo 的 `supabase/schema.sql`，全部複製貼上，按 **Run**。
3. 會建立：
   - `museum_backups` 資料表（每位使用者一列，存整本博物館護照）
   - `museum-media` 儲存桶（照片、影片）
   - RLS 安全規則：每個人只能讀寫自己的資料

## 3. 把金鑰放進 App

1. Supabase 左側 **Project Settings → API**，複製：
   - **Project URL**
   - **anon public** key（不是 service_role！）
2. 在專案根目錄複製 `.env.example` 為 `.env`，填入：

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

`.env` 已在 `.gitignore`，不會被上傳到 GitHub。用 EAS Build 打包時，請在 expo.dev 的專案 **Environment variables** 加入同樣兩個變數。

## 4. 設定登入回傳網址

Supabase 左側 **Authentication → URL Configuration**：

- **Site URL**：`wanderstamp://auth/callback`
- **Redirect URLs** 加入：
  - `wanderstamp://**`（正式 App）
  - `exp://**`（用 Expo Go 開發測試時）
  - `http://localhost:8081/**`（用瀏覽器預覽時）

## 5. Email／密碼登入

預設已開啟。若想註冊後不必收確認信就能直接登入（方便測試），到
**Authentication → Sign In / Providers → Email** 關閉 **Confirm email**。

## 6. Google 登入（選用）

1. 到 Google Cloud Console → **APIs & Services → Credentials** 建立 **OAuth client ID**（類型選 Web application）。
2. Authorized redirect URI 填 Supabase 提供的網址：`https://xxxx.supabase.co/auth/v1/callback`
3. 回到 Supabase **Authentication → Sign In / Providers → Google**，開啟並貼上 Client ID 與 Client Secret。

## 7. 測試

```bash
pnpm install
pnpm dev        # 用 Expo Go 掃 QR code
```

到「我的」→「登入並啟用雲端備份」→ 建立帳戶 → 回到「我的」按「立即備份」。
再到 Supabase **Table Editor → museum_backups** 應該可以看到一列資料，**Storage → museum-media** 會有你的照片。

---

### 資料流程

- 所有資料先存在手機本機（AsyncStorage），沒網路也能用。
- 登入後，訪客時期新增的博物館會自動移到你的帳戶，並在有網路時備份。
- 「立即備份」：上傳尚未上傳的照片／影片到 `museum-media/<你的使用者ID>/`，再把整本護照存到 `museum_backups`。
- 「從雲端還原」：下載備份並和手機上的資料合併（不會刪除手機上的紀錄）。

### 關於照片隱私

`museum-media` 設為「公開讀取」，照片網址用隨機 UUID 命名，別人無法猜到，但拿到網址的人可以看到該張照片。
只有你本人能上傳、修改或刪除自己資料夾裡的檔案。若日後想改成完全私密，可把 bucket 改為 private 並改用 signed URL。

### 電子報同意

註冊時勾選電子報會存到使用者的 `user_metadata.newsletter_opt_in` 與 `newsletter_consent_at`，可在 **Authentication → Users** 查看。
