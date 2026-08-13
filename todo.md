# Project TODO

- [x] 初始化行動專案與設計文件 (design.md)
- [x] 實作博物館足跡資料模型與本機儲存 (AsyncStorage)
- [x] 實作首頁（數據統計與近期造訪清單）
- [x] 實作博物館清單與搜尋/篩選功能
- [x] 實作新增博物館紀錄表單
- [x] 生成專案專屬 App Logo 與品牌設定
- [x] 驗證並建立最終檢查點
- [x] 修復 Expo Go 開啟時 port 8081 的 HTTP 502 upstream_connect_failed 問題
- [x] 排查 Expo Go 仍然無法開啟：確認 Metro 原生 bundle、工作區代理與 QR 連線模式
- [x] 升級首頁為可縮放世界地圖，並標示已更新的博物館名稱與標記
- [x] 實作個人 Profile 編輯功能（姓名、頭銜、個人簡介）
- [x] 實作博物館照片 Album 上傳與藝廊檢視
- [x] 準備 App Store 正式原生打包與發佈說明
- [x] 修復 Web 預覽錯誤：react-native-maps 原生 codegenNativeComponent 不應在 Web 載入
- [x] 修復 Expo Go 啟動錯誤：RNMapsAirModule 不存在，改用不依賴 react-native-maps 的地圖首頁
- [x] 升級首頁為支援真實世界地圖背景、拖曳與縮放的互動地圖
- [x] 升級博物館照片 Album，讓每張照片支援獨立的 description（描述）與編輯/刪除
- [x] 新增博物館時支援上傳照片與影片，並在詳情頁顯示媒體預覽與描述
- [x] 加入雲端備份與跨裝置同步功能（帳號登入、資料庫備份與媒體同步）
- [x] 加入自動同步開關，在新增或修改博物館、照片、影片與個人資料後自動備份到雲端
- [x] 在博物館清單頁加入搜尋與多條件篩選（依名稱、國家、城市與有無照片快速過濾）
- [x] 實作多使用者帳戶模式：未登入時顯示歡迎登入閘門，登入後使用各自的專屬個人資料與博物館足跡
- [x] 實作未登入訪客預覽模式（提供安全示範資料瀏覽，不寫入任何帳戶）
- [x] 實作繁體中文與英文語系切換支援
- [x] 修復 Apple ID 登入問題，確保真實裝置與 Expo 登入路由正常連線
- [x] 實作獨立的個人資料設定頁面（管理帳號資訊、檢視登入狀態與安全登出）
- [x] 實作外觀模式切換選項（支援跟隨系統、淺色模式與深色模式偏好保存）
- [x] 修復登入成功後畫面仍停留在登入介面的問題（確保 OAuth 回呼與 AuthGate即時刷新）
- [x] 修復掃描 Expo QR Code 後無法開啟的問題（確保 Metro 通訊協定與 tunnel/lan 設定正確）
- [ ] 進一步排查與修復 Expo QR Code 掃描後無法開啟的問題（分析 tunnel 連線、ngrok 輸出與 Expo Go 相容性）
- [x] 修復 Apple ID 與 Google 登入失敗問題（更新 audience、AuthSession redirect、回呼與 session 驗證路由；真機 provider E2E 仍需驗證）

- [x] 修正 Apple Go／正式原生環境的 audience 驗證分流，並保留正式 bundle ID 安全驗證
- [x] 更新 Google／Manus OAuth 使用 AuthSession redirect URI 與原生回呼處理
- [x] 加入 OAuth 取消回呼與 Expo Go／Development Build 的雙語錯誤提示
- [x] 新增 EAS Development Build profile 與 App Store OAuth 測試文件；原生登入仍需在真機完成

- [x] 修復按登入後畫面仍停留在同一個畫面的問題（修正 server env 載入、OAuth callback、Session 儲存、AuthGate 訂閱與 `router.replace`；真機 provider E2E 仍需驗證）

- [x] 深度排查與修復登入後仍卡在登入畫面的根本原因（修正 session cookie 跨域網域衝突、自動清除舊版父網域與無效 cookie、統一 HTTP/HTTPS SameSite 與 Localhost/Secure 策略，並完成回歸測試）

- [x] 實作一鍵清除前端快取與重新授權流程，並提供裝置端操作指南（在登入閘門新增雙語「清除登入狀態並重新授權」按鈕，執行安全的 API 登出、Token 移除與事件廣播）
