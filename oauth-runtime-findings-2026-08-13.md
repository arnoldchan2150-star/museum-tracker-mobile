# OAuth runtime 驗證

更新後 Web 預覽中的「登入現有帳戶」按鈕已成功導向 Manus OAuth portal，而非留在登入閘門。

實際 URL 顯示：
- portal host: `manus.im/app-auth`
- `appId`: 已注入且為 Wanderstamp 專案 App ID
- `redirectUri`: `https://3000-iyyvrgcuu7ykvuqvetn4r-240b5824.sg1.manus.computer/api/oauth/callback`
- `type`: `signIn`
- `state`: 已產生

這證明 Metro runtime 的 OAuth env fallback 已生效；剩餘端到端成功條件是 provider 授權完成後，API callback 必須建立可被 `/api/auth/me` 驗證的 Session cookie。
