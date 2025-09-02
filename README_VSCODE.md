# 📝 VS Code 常用操作速查表

## 🚀 開發工作流程
| 操作 | 快捷鍵 / 指令 | 說明 |
|------|----------------|------|
| 啟動 Dev Server | **Ctrl+Shift+B** | 等同 `npm run dev`，啟動 Vite 本地伺服器 (http://localhost:5173) |
| 打包專案 | **Ctrl+Alt+B** | 等同 `npm run build`，輸出到 `dist/` |
| 程式碼檢查 / 修正 | **Ctrl+Alt+L** | 等同 `npm run lint`，自動修正 ESLint 問題 |
| Debug React | **Ctrl+Shift+D** → 選 **Debug Vite App** | 開啟 Chrome 附加調試，支援斷點 |
| 停止任務 | **Ctrl+C** (在 Terminal) | 停止正在執行的任務 |

## 🔧 常用快捷鍵
| 功能 | 快捷鍵 |
|------|---------|
| 開啟命令面板 | **Ctrl+Shift+P** |
| 開啟 Terminal | **Ctrl+`** (數字 1 左邊的 `) |
| 格式化程式碼 | **Shift+Alt+F** (或存檔自動格式化) |
| 多光標編輯 | **Alt+點擊** |
| 重命名變數/函式 | **F2** |
| 搜尋檔案 | **Ctrl+P** |
| 全域搜尋字串 | **Ctrl+Shift+F** |
| 開啟設定 (JSON) | **Ctrl+,** → 點右上角圖示 |

## 🔍 Debug 小技巧
1. 在程式碼左側灰色區點一下，會出現 🔴 斷點。  
2. 按 **Ctrl+Shift+D** → 選「Debug Vite App」。  
3. Chrome 會開 `http://localhost:5173` → 進入後 VS Code 會自動連結。  
4. 碰到斷點時，左邊可以看到：
   - **Variables**：變數狀態  
   - **Watch**：自定義監看表達式  
   - **Call Stack**：程式呼叫堆疊  
   - **Breakpoints**：斷點清單  

## 📦 套件檢查
- **ESLint / Prettier** → 自動修正格式 + 程式錯誤  
- **Error Lens** → 錯誤直接顯示在程式碼上  
- **Tailwind IntelliSense** → className 智慧提示  
- **Dexie DevTools (Chrome 外掛)** → 查看 IndexedDB 寫入情況  

## 🛡️ 推薦習慣
- **存檔自動格式化** → `settings.json` 已設定好  
- **Lint 一次檢查全部**：`Ctrl+Alt+L`  
- **版本控管**：建議把 `.vscode/` 也 commit 到 Git，確保團隊環境一致  
- **Debug 前**：確認 `npm run dev` 已啟動  

---

📌 **結論**  
照這張速查表走，你在 VS Code 就能一鍵完成「啟動 → Debug → 打包 → 檢查 → 發佈」全流程，幾乎不需要再去 Cursor。
