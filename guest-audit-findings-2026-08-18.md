# 未登入／訪客畫面檢查結果

## 已重現問題

回復版本 87a329a2 的 `/add` 頁面在未登入時可以正常顯示表單，但填入有效資料並按「蓋上這枚印章」會從 `addMuseum -> saveMuseums` 拋出未捕捉的 `請先登入自己的帳戶，才能儲存博物館足跡。`，Web 預覽出現紅色 Error overlay。

直接開啟 `/museum/test`（不存在的 museum ID）時，頁面會一直顯示 spinner，因為 `!museum` 與 `loading` 共用同一個渲染分支。

## 已完成修正

`app/add.tsx` 現在以 try/catch 攔截保存錯誤，Web 會在頁面上顯示登入提示，原生會使用 Alert，不再產生未捕捉例外。

`app/museum/[id].tsx` 現在將 loading、載入錯誤與找不到資料分開處理，無效 ID 或未登入狀態會顯示清楚的空狀態及「返回上一頁」按鈕，不再永久 spinner。

## 預覽驗證

更新後在 Web 預覽重新測試 `/add`：未登入按保存後頁面保持正常，顯示「請先登入自己的帳戶，才能儲存博物館足跡。」且沒有 Error overlay。

更新後重新測試 `/museum/test`：顯示「目前沒有可顯示的博物館」及返回按鈕，沒有永久 spinner。

## 尚待檢查

Tabs（世界地圖、清單、Profile）目前由 `app/(tabs)/_layout.tsx` 的 AuthGate 阻擋未登入狀態，因此未登入無法預覽；這是產品策略限制，不是 runtime crash。仍需檢查 direct route 與 auth-gated tabs 的一致性，以及完整 TypeScript、lint、Vitest 和預覽回歸測試。
