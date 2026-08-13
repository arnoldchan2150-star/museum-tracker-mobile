# 安全版 Reset Auth 預覽驗證

重啟後等待 Metro bundle 完成，Wanderstamp 登入閘門正常載入，新增的「清除快取並重新整理 (Reset Auth)」按鈕可見。安全版流程已改為只清除 Session token 與使用者快取、呼叫 auth-change 通知，不再清空整個 AsyncStorage，也不再強制 `window.location.reload()`，因此不應刪除博物館資料或讓預覽 tunnel 進入 unavailable。
