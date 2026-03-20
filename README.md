# 學生作業管理系統

一個完整的學生作業管理系統，使用 Firebase 作為後端資料庫，可以部署到 GitHub Pages。

## 功能特色

- ✅ 學生註冊與登入（使用學號）
- ✅ 即時顯示本週未完成作業
- ✅ 即時顯示本週已完成作業
- ✅ 標記作業完成狀態
- ✅ 新增作業（測試功能）
- ✅ 響應式設計，支援手機和桌面
- ✅ **持久性資料庫**（Firebase Realtime Database）
- ✅ **安全的用戶認證**（Firebase Authentication）
- ✅ **即時數據同步**

## 技術棧

- HTML5
- CSS3
- JavaScript (ES6+)
- **Firebase Authentication**（用戶認證）
- **Firebase Realtime Database**（持久性數據存儲）

## 如何使用

### ⚠️ 重要：首先設定 Firebase

在使用系統之前，您需要先設定 Firebase。請參閱 **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)** 獲取完整的設定指南。

簡要步驟：
1. 在 [Firebase Console](https://console.firebase.google.com/) 創建新專案
2. 啟用 Authentication（電子郵件/密碼）
3. 啟用 Realtime Database
4. 複製 Firebase 配置到 `firebase-config.js`
5. 設定資料庫安全規則

### 本地測試

1. 完成 Firebase 設定
2. 在瀏覽器中打開 `index.html`
3. 註冊一個新帳號（使用學號）
4. 登入後即可查看和管理作業

### 部署到 GitHub Pages

1. 完成 Firebase 設定
2. 在 GitHub 上創建一個新的倉庫
3. 將此 Website 資料夾中的所有文件上傳到倉庫
4. 進入倉庫設定 (Settings) → Pages
5. 在 Source 下選擇 `main` 分支
6. 在 Firebase Console 的 Authentication 設定中，將您的 GitHub Pages 網址加入「授權網域」
7. 點擊 Save，等待幾分鐘後即可訪問

您的網站將會在 `https://<你的用戶名>.github.io/<倉庫名>/` 上線。

## 預設測試數據

系統首次啟動時會自動在 Firebase 中建立以下範例作業：
- 第一章作業：電腦概論
- 第二章作業：數位編碼
- 實作作業：HTML 基礎

## 資料庫結構

系統使用 Firebase Realtime Database，資料結構如下：
```
├── students/          # 學生資料
│   └── {學號}/
│       ├── uid
│       ├── studentId
│       ├── name
│       └── registeredAt
├── assignments/       # 作業資料
│   └── {作業ID}/ # 登入/註冊頁面
├── dashboard.html       # 作業管理頁面
├── styles.css           # 樣式文件
├── auth.js             # 認證邏輯（Firebase Auth）
├── dashboard.js        # 儀表板邏輯（Firebase Database）
├── firebase-config.js  # Firebase 配置（需自行設定）
├── README.md           # 說明文件
└── FIREBASE_SETUP.md   # Firebase 設定指南
```

## 未來改進方向

- [x] 整合 Firebase 持久性資料庫
- [x] 安全的用戶認證系統
- [ ] 增加作業分類和搜尋功能
- [ ] 支援檔案上傳（Firebase Storage）
- [ ] 教師管理介面
- [ ] 郵件通知功能（Firebase Cloud Functions）
- [ ] 作業評分系統
- [ ] 匯出成績報表
- ✅ 數據持久化存儲於 Firebase，不會因清除瀏覽器而遺失
- ✅ 支援多人同時使用，數據即時同步
- ✅ 使用 Firebase Authentication 確保安全性
- ⚠️ 免費方案有使用限制（1GB 儲存，10GB/月流量）
- ⚠️ 請妥善保管 `firebase-config.js`，避免洩露 API 金鑰

## 文件結構

```
Website/
├── index.html          # 登入/註冊頁面
├── dashboard.html      # 作業管理頁面
├── styles.css          # 樣式文件
├── auth.js            # 認證邏輯
├── dashboard.js       # 儀表板邏輯
└── README.md          # 說明文件
```

## 未來改進方向

- [ ] 整合 Firebase 或其他後端服務
- [ ] 增加作業分類和搜尋功能
- [ ] 支援檔案上傳
- [ ] 教師管理介面
- [ ] 郵件通知功能
