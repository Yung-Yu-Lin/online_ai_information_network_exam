# 發布到 GitHub Pages 教學

## 步驟 1：在 GitHub 創建新倉庫

1. 前往 https://github.com
2. 登入你的帳號
3. 點擊右上角的 `+` → 選擇 `New repository`
4. 填寫倉庫資訊：
   - **Repository name**: `online-exam-system`（或任何你喜歡的名稱）
   - **Description**: 線上測驗系統
   - 選擇 **Public**（必須是公開才能使用免費的 GitHub Pages）
   - **不要**勾選 "Add a README file"
5. 點擊 `Create repository`

## 步驟 2：上傳檔案到 GitHub

### 方法 A：使用 Git 指令（推薦）

在 PowerShell 中執行以下指令：

```powershell
# 進入 Website 資料夾
cd "c:\Users\Gary\Desktop\AI時代的計算機概論\Website"

# 初始化 Git（如果還沒有）
git init

# 添加所有檔案
git add .

# 提交檔案
git commit -m "Initial commit - 線上測驗系統"

# 連接到你的 GitHub 倉庫（請替換成你的用戶名和倉庫名）
git remote add origin https://github.com/你的用戶名/online-exam-system.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 方法 B：使用 GitHub 網頁上傳

1. 在 GitHub 倉庫頁面，點擊 `uploading an existing file`
2. 將 Website 資料夾內的所有檔案拖曳到網頁
3. 點擊 `Commit changes`

**重要**：需要上傳的檔案：
- `index.html`
- `dashboard.html`
- `dashboard.js`
- `auth.js`
- `styles.css`
- `firebase-config.js`（如果有使用 Firebase）

## 步驟 3：啟用 GitHub Pages

1. 在你的 GitHub 倉庫頁面，點擊 `Settings`（設定）
2. 在左側選單找到 `Pages`
3. 在 **Source** 下：
   - Branch: 選擇 `main`
   - Folder: 選擇 `/ (root)`
4. 點擊 `Save`
5. 等待約 1-2 分鐘，頁面會顯示你的網站網址

## 步驟 4：取得網址並測試

你的網站網址格式會是：
```
https://你的用戶名.github.io/倉庫名稱/
```

例如：
```
https://gary.github.io/online-exam-system/
```

### 重要提醒：

1. **登入頁面網址**: `https://你的用戶名.github.io/倉庫名稱/index.html`
2. **測試帳號**:
   - 帳號：`TEST`
   - 密碼：`TEST`

## 步驟 5：分享給學生

將這個網址提供給學生：
```
https://你的用戶名.github.io/倉庫名稱/
```

學生開啟後：
1. 輸入帳號 `TEST` 和密碼 `TEST`
2. 點擊「開始測驗」
3. 作答完成後點擊「交卷」查看分數

## 更新題目

當你想更新題目時：

### 方法 A：使用 Git 指令
```powershell
cd "c:\Users\Gary\Desktop\AI時代的計算機概論\Website"
git add dashboard.js
git commit -m "更新題目"
git push
```

### 方法 B：直接在 GitHub 編輯
1. 在 GitHub 倉庫中找到 `dashboard.js`
2. 點擊檔案，然後點擊鉛筆圖示（Edit）
3. 修改 `questionsData` 陣列中的題目
4. 點擊 `Commit changes`

## 常見問題

### Q: 網站顯示 404 Not Found
A: 
- 確認 GitHub Pages 已啟用
- 確認網址正確（包含倉庫名稱）
- 等待幾分鐘讓 GitHub 部署完成

### Q: 學生可以看到題目答案嗎？
A: 
- 是的，因為題目存在前端 JavaScript 中
- 如果需要更安全的方式，需要建立後端伺服器
- 對於一般測驗練習，這樣的方式是可接受的

### Q: 如何讓學生用自己的學號登入？
A: 
- 目前系統只支援測試帳號 (TEST/TEST)
- 如果需要個人帳號，可以啟用 Firebase Authentication
- 詳見 FIREBASE_SETUP.md

### Q: 可以記錄學生成績嗎？
A: 
- 目前版本不會記錄成績
- 如果需要記錄功能，需要啟用 Firebase Database
- 或者可以請學生截圖成績畫面

## 檢查清單

上傳前確認：
- [ ] 題目已經更新完成
- [ ] 測試過登入功能（TEST/TEST）
- [ ] 測試過測驗功能
- [ ] 確認所有檔案都已上傳

上傳後確認：
- [ ] GitHub Pages 已啟用
- [ ] 網站可以正常開啟
- [ ] 登入功能正常
- [ ] 測驗功能正常
- [ ] 評分功能正常

## 進階：自訂網域

如果你有自己的網域（如 exam.yourschool.com）：
1. 在 GitHub Pages 設定中的 `Custom domain` 填入你的網域
2. 在你的網域提供商設定 DNS CNAME 記錄指向 `你的用戶名.github.io`

---

完成以上步驟後，你就有一個可以公開使用的線上測驗系統了！
