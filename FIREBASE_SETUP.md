# Firebase 設定指南

本指南將協助您設定 Firebase 以啟用持久性資料庫功能。

## 步驟 1：創建 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「新增專案」或「Add project」
3. 輸入專案名稱（例如：student-assignment-system）
4. 選擇是否啟用 Google Analytics（可選）
5. 點擊「建立專案」

## 步驟 2：註冊網頁應用程式

1. 在 Firebase 專案總覽頁面，點擊網頁圖示 `</>`
2. 輸入應用程式暱稱（例如：作業管理系統）
3. **不需要**勾選 Firebase Hosting
4. 點擊「註冊應用程式」
5. 複製顯示的 Firebase 配置程式碼

## 步驟 3：更新 firebase-config.js

將複製的配置貼到 `firebase-config.js` 文件中：

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};
```

## 步驟 4：啟用 Authentication

1. 在 Firebase Console 左側選單選擇「Authentication」
2. 點擊「開始使用」或「Get started」
3. 在「Sign-in method」標籤中，點擊「電子郵件/密碼」
4. 啟用「電子郵件/密碼」選項
5. 點擊「儲存」

## 步驟 5：啟用 Realtime Database

1. 在 Firebase Console 左側選單選擇「Realtime Database」
2. 點擊「建立資料庫」
3. 選擇資料庫位置（建議選擇較近的地區，如 asia-southeast1）
4. 選擇「以測試模式啟動」（稍後會設定安全規則）
5. 點擊「啟用」

## 步驟 6：設定安全規則

在 Realtime Database 的「規則」標籤中，設定以下規則：

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "settings": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'teacher'"
    },
    "chapters": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'teacher'"
    },
    "questions": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'teacher'"
    },
    "submissions": {
      "$chapterId": {
        ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'teacher'",
        "$studentUid": {
          ".read": "auth != null && auth.uid === $studentUid",
          ".write": "auth != null && (auth.uid === $studentUid || root.child('users').child(auth.uid).child('role').val() === 'teacher')"
        }
      }
    }
  }
}
```

這些規則確保：
- 只有已登入的用戶可以讀取資料
- 只有教師可以建立/修改章節和題目
- 學生只能讀寫自己的繳交記錄
- 教師可以讀取所有繳交記錄並進行批改

## 步驟 7：設定教師邀請碼

在 Firebase Console 的 Realtime Database 中，手動新增以下資料：

1. 點擊資料庫根節點的 `+` 號
2. 鍵入 `settings`，展開後再新增子節點
3. 鍵入 `teacherInviteCode`，值設為您自訂的邀請碼（例如 `TEACHER2026`）

結構如下：
```
settings/
  teacherInviteCode: "TEACHER2026"
```

教師註冊時需要輸入此邀請碼才能取得教師權限。

## 步驟 8：測試設定

1. 在瀏覽器中開啟 `index.html`
2. 先以教師身份註冊（需要輸入邀請碼）
3. 登入教師帳號，建立章節和題目
4. 另開瀏覽器/無痕視窗，以學生身份註冊並登入
5. 學生應該可以看到章節作業並進行作答

## 資料結構

系統會在 Firebase Realtime Database 中建立以下結構：

```
{
  "settings": {
    "teacherInviteCode": "TEACHER2026"
  },
  "users": {
    "firebase_uid_1": {
      "userId": "T001",
      "name": "王老師",
      "role": "teacher",
      "createdAt": 1234567890
    },
    "firebase_uid_2": {
      "userId": "S10001",
      "name": "陳同學",
      "role": "student",
      "createdAt": 1234567890
    }
  },
  "chapters": {
    "chapter_id_1": {
      "title": "第一章 - 導論",
      "order": 1,
      "createdBy": "firebase_uid_1",
      "createdAt": 1234567890
    }
  },
  "questions": {
    "chapter_id_1": {
      "question_id_1": {
        "type": "single",
        "question": "第二代電腦與第三代電腦的分野是發明了什麼技術？",
        "options": ["超大型積體電路", "電晶體", "積體電路", "真空管"],
        "correctAnswer": 2,
        "createdAt": 1234567890
      },
      "question_id_2": {
        "type": "multiple",
        "question": "下列哪些屬於電腦的輸出單元？",
        "options": ["螢幕", "鍵盤", "印表機", "滑鼠"],
        "correctAnswers": [0, 2],
        "createdAt": 1234567890
      },
      "question_id_3": {
        "type": "short_answer",
        "question": "請簡述馮紐曼架構的特色。",
        "createdAt": 1234567890
      }
    }
  },
  "submissions": {
    "chapter_id_1": {
      "firebase_uid_2": {
        "status": "submitted",
        "studentName": "陳同學",
        "studentId": "S10001",
        "submittedAt": 1234567890,
        "questionOrder": ["question_id_1", "question_id_3", "question_id_2"],
        "answers": {
          "question_id_1": { "type": "single", "answer": 2 },
          "question_id_2": { "type": "multiple", "answer": [0, 2] },
          "question_id_3": { "type": "short_answer", "answer": "馮紐曼架構的特色是..." }
        },
        "teacherNote": "",
        "gradedAt": null,
        "gradedBy": null
      }
    }
  }
}
```

### 作業狀態流程

```
未繳交 → 已繳交（學生繳交）
已繳交 → 批改完成（老師通過）
已繳交 → 已退回（老師退回）
已退回 → 重新繳交（學生重新作答）
重新繳交 → 批改完成 / 已退回（老師再次批改）
```

## 免費方案限制

Firebase 免費方案（Spark Plan）包含：
- **Realtime Database**: 1GB 儲存空間，10GB/月下載量
- **Authentication**: 無限制
- **Hosting**: 10GB/月流量

對於一般課程使用，免費方案已經足夠。

## 部署到 GitHub Pages

1. 確保 `firebase-config.js` 已正確設定
2. 將所有文件推送到 GitHub 倉庫
3. 在倉庫設定中啟用 GitHub Pages
4. 在 Firebase Console 的 Authentication 設定中，將您的 GitHub Pages 網址加入「授權網域」

## 疑難排解

### 問題：註冊時顯示「auth/operation-not-allowed」
**解決方案**：確保在 Firebase Console 的 Authentication 中已啟用「電子郵件/密碼」登入方式。

### 問題：無法讀取或寫入資料庫
**解決方案**：檢查 Realtime Database 的安全規則是否正確設定。

### 問題：GitHub Pages 無法登入
**解決方案**：在 Firebase Console 的 Authentication > Settings > Authorized domains 中加入您的 GitHub Pages 網址。

### 問題：教師註冊失敗
**解決方案**：確認 Firebase Realtime Database 中已新增 `settings/teacherInviteCode`，且輸入的邀請碼完全一致。
- 檔案上傳

需要協助？請參考 [Firebase 官方文件](https://firebase.google.com/docs)
