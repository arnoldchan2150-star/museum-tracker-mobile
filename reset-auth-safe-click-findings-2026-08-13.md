# Reset Auth 安全版點擊驗證

在登入閘門點擊「清除快取並重新整理 (Reset Auth)」後，頁面仍保持正常的登入閘門，沒有再次進入預覽 unavailable；瀏覽器 console 沒有 JavaScript 錯誤。這表示現在的流程只清除登入 token／user info 並透過 auth event 讓畫面保持在乾淨的未登入狀態。
