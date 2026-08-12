# Wanderstamp (旅印足跡) - Mobile App Interface Design

## 1. Overview & Vision
Wanderstamp 是一個專為博物館愛好者打造的旅行與足跡紀錄行動應用程式。本設計針對行動裝置（iOS/Android）進行優化，強調單手操作、沈浸式視覺體驗與流暢的卡片互動。

## 2. Screen List & Primary Functionality
1. **Home / Dashboard (`(tabs)/index.tsx`)**
   - **Content**: 統計摘要（已造訪博物館總數、國家數、最近足跡）、快速導覽卡片、最近紀錄清單。
   - **Functionality**: 快速檢視成就、跳轉至新增紀錄或清單頁面。
2. **Museum List (`(tabs)/explore.tsx` or similar)**
   - **Content**: 所有已造訪博物館的清單，支援依國家或年份篩選、搜尋。
   - **Functionality**: 點擊查看詳細資訊、照片與備忘錄。
3. **Add Record (`modal/add-museum.tsx` or inline form)**
   - **Content**: 輸入表單（博物館名稱、城市、國家、造訪日期、心得備忘錄、照片上傳）。
   - **Functionality**: 新增並儲存至本機或雲端資料庫。
4. **Passport / Profile (`(tabs)/profile.tsx`)**
   - **Content**: 個人旅行護照風格頁面，展示徽章與年度統計。

## 3. Key User Flows
- **Flow 1: 瀏覽足跡總覽**
  開啟 App -> 首頁顯示統計卡片與近期造訪清單 -> 點擊單一項目進入細節。
- **Flow 2: 新增博物館紀錄**
  點擊底部導航或浮動按鈕 `+` -> 填寫博物館名稱、城市與心得 -> 點擊儲存 -> 即時更新於首頁與清單。

## 4. Color Choices & Branding
- **Primary Color**: `#0a7ea4` (Ocean Blue / Wanderlust Theme)
- **Background**: `#ffffff` (Light) / `#151718` (Dark)
- **Surface**: `#f5f5f5` (Light) / `#1e2022` (Dark)
- **Accent / Gold**: `#F59E0B` (Passport Stamp Gold)
