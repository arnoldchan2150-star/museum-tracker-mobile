# Reset Auth 點擊結果

在 Web 預覽點擊 Reset Auth 後，頁面立即進入預覽 proxy 的「This page is currently unavailable」畫面，且等待後沒有自行恢復。此行為表示 `window.location.reload()` 觸發時預覽 tunnel／Metro 會短暫斷線，對使用者而言不夠穩定；下一步應避免在按鈕流程中直接強制 reload，改為先完成 API logout 與前端儲存清理，再讓 AuthGate 以狀態更新回到登入頁，或提供手動重新開啟預覽的指示。
