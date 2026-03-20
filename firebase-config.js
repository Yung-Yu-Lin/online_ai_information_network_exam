// Firebase 配置
// 請替換為您自己的 Firebase 專案配置
const firebaseConfig = {
  apiKey: "AIzaSyBLyOf-fBAeeDSsgbfHwZkMe8TfY789VL8",
  authDomain: "student-assignment-syste-421b7.firebaseapp.com",
  databaseURL: "https://student-assignment-syste-421b7-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "student-assignment-syste-421b7",
  storageBucket: "student-assignment-syste-421b7.firebasestorage.app",
  messagingSenderId: "123443916337",
  appId: "1:123443916337:web:89ebc4dcabdb6013cfaf10"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);

// 取得服務參考
const auth = firebase.auth();
const database = firebase.database();
