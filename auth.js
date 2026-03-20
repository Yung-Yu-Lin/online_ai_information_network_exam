let isRegistering = false;

// 切換登入和註冊表單
document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
});

// 切換教師邀請碼欄位
document.getElementById('registerRole').addEventListener('change', function () {
    document.getElementById('inviteCodeGroup').style.display =
        this.value === 'teacher' ? 'block' : 'none';
});

// 顯示/隱藏載入狀態
function showLoading(button) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = '處理中...';
}
function hideLoading(button) {
    button.disabled = false;
    button.textContent = button.dataset.originalText || '提交';
}

// ==================== 登入 ====================
document.getElementById('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = document.getElementById('loginUserId').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!userId || !password) return;
    showLoading(submitBtn);

    try {
        const email = `${userId}@homework.edu.tw`;
        await auth.signInWithEmailAndPassword(email, password);
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('登入錯誤:', error);
        let msg = '登入失敗：';
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                msg += '帳號或密碼錯誤'; break;
            case 'auth/too-many-requests':
                msg += '嘗試次數過多，請稍後再試'; break;
            default:
                msg += error.message;
        }
        alert(msg);
    } finally {
        hideLoading(submitBtn);
    }
});

// ==================== 註冊 ====================
document.getElementById('register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const role = document.getElementById('registerRole').value;
    const userId = document.getElementById('registerUserId').value.trim();
    const name = document.getElementById('registerName').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (password !== confirmPassword) { alert('密碼與確認密碼不符！'); return; }
    if (password.length < 6) { alert('密碼長度至少需要 6 個字元！'); return; }

    // 教師註冊先檢查有沒有填邀請碼
    let inviteCode = '';
    if (role === 'teacher') {
        inviteCode = document.getElementById('registerInviteCode').value.trim();
        if (!inviteCode) { alert('請輸入教師邀請碼'); return; }
    }

    showLoading(submitBtn);
    isRegistering = true;

    try {
        const email = `${userId}@homework.edu.tw`;
        const cred = await auth.createUserWithEmailAndPassword(email, password);

        // 教師需在帳號建立後（已有 auth）驗證邀請碼
        if (role === 'teacher') {
            try {
                const codeSnap = await database.ref('settings/teacherInviteCode').once('value');
                const correctCode = codeSnap.val();
                if (!correctCode || inviteCode !== correctCode) {
                    // 邀請碼錯誤，刪除剛建立的帳號
                    await cred.user.delete();
                    alert('教師邀請碼錯誤，註冊失敗');
                    hideLoading(submitBtn);
                    return;
                }
            } catch (err) {
                await cred.user.delete();
                console.error('驗證邀請碼失敗:', err);
                alert('無法驗證邀請碼，請稍後再試');
                hideLoading(submitBtn);
                return;
            }
        }

        // 儲存使用者資料到 Realtime Database
        await database.ref('users/' + cred.user.uid).set({
            userId: userId,
            name: name,
            role: role,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });

        await cred.user.updateProfile({ displayName: name });
        alert('註冊成功！');
        window.location.href = 'dashboard.html';
    } catch (error) {
        isRegistering = false;
        console.error('註冊錯誤:', error);
        let msg = '註冊失敗：';
        switch (error.code) {
            case 'auth/email-already-in-use': msg += '此帳號已被使用'; break;
            case 'auth/weak-password': msg += '密碼強度不足（至少6個字元）'; break;
            default: msg += error.message;
        }
        alert(msg);
    } finally {
        hideLoading(submitBtn);
    }
});

// 若已登入則自動跳轉
auth.onAuthStateChanged((user) => {
    if (user && !isRegistering) {
        window.location.href = 'dashboard.html';
    }
});
