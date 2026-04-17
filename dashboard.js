// ============================================================
// 全域狀態
// ============================================================
let currentUser = null;
let userRole = null;

// 教師狀態
let selectedChapterId = null;
let gradingChapterId = null;
let gradingStudentUid = null;

// 學生狀態
let currentAssignmentChapterId = null;
let currentAssignmentQuestions = null;
const studentAnswers = {};

// 防止複製題目與答案
['assignmentContainer', 'submissionViewContainer'].forEach(id => {
    document.addEventListener('DOMContentLoaded', () => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('copy', e => e.preventDefault());
        el.addEventListener('cut', e => e.preventDefault());
        el.addEventListener('contextmenu', e => e.preventDefault());
        el.addEventListener('dragstart', e => e.preventDefault());
    });
});

// ============================================================
// 身份驗證
// ============================================================
firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) { window.location.href = 'index.html'; return; }

    try {
        const snap = await database.ref('users/' + user.uid).once('value');
        let data = snap.val();
        if (!data) {
            // 自動初始化用戶資料
            const name = user.displayName || '新用戶';
            const userId = user.email ? user.email.split('@')[0] : user.uid.substring(0, 8);
            const role = 'student'; // 預設為學生，可根據需求調整
            data = { name, userId, role };
            await database.ref('users/' + user.uid).set(data);
        }

        currentUser = { ...data, uid: user.uid };
        userRole = data.role;
        document.getElementById('userName').textContent = data.name;
        document.getElementById('userRoleBadge').textContent = userRole === 'teacher' ? '教師' : '學生';
        document.getElementById('userRoleBadge').classList.add(userRole === 'teacher' ? 'role-teacher' : 'role-student');

        if (userRole === 'teacher') {
            document.getElementById('teacherView').style.display = 'block';
            initTeacherDashboard();
        } else {
            document.getElementById('studentView').style.display = 'block';
            document.getElementById('studentWelcomeName').textContent = data.name;
            document.getElementById('studentWelcomeId').textContent = data.userId;
            initStudentDashboard();
        }
    } catch (err) {
        console.error('載入用戶資料失敗:', err);
        alert('系統錯誤，請重新登入');
        await firebase.auth().signOut();
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await firebase.auth().signOut();
    window.location.href = 'index.html';
});

// ============================================================
// 工具函式
// ============================================================
function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function getStatusInfo(status) {
    const map = {
        submitted:   { text: '已繳交',   color: '#3498db', bg: '#ebf5fb' },
        graded:      { text: '批改完成', color: '#27ae60', bg: '#eafaf1' },
        returned:    { text: '已退回',   color: '#e74c3c', bg: '#fdedec' },
        resubmitted: { text: '重新繳交', color: '#f39c12', bg: '#fef9e7' },
    };
    return map[status] || { text: '未繳交', color: '#95a5a6', bg: '#f2f3f4' };
}

function getTypeLabel(type) {
    return { single: '單選題', multiple: '多選題', short_answer: '簡答題' }[type] || type;
}

// ============================================================
//  學生功能
// ============================================================
async function initStudentDashboard() {
    await loadStudentChapters();
}

async function loadStudentChapters() {
    const container = document.getElementById('studentChapterList');
    container.innerHTML = '<p class="loading">載入中...</p>';

    try {
        const snap = await database.ref('chapters').orderByChild('order').once('value');
        container.innerHTML = '';
        if (!snap.exists()) { container.innerHTML = '<p class="empty-message">目前還沒有章節作業</p>'; return; }

        const chapters = [];
        snap.forEach(c => { chapters.push({ id: c.key, ...c.val() }); });
        chapters.sort((a, b) => (a.order || 0) - (b.order || 0));

        for (const ch of chapters) {
            const subSnap = await database.ref(`submissions/${ch.id}/${currentUser.uid}`).once('value');
            const sub = subSnap.val();
            const si = getStatusInfo(sub?.status);

            let actionBtn = '';
            if (!sub || sub.status === 'returned') {
                const label = sub?.status === 'returned' ? '重新作答' : '開始作答';
                actionBtn = `<button class="btn btn-primary btn-small" onclick="startAssignment('${ch.id}')">${label}</button>`;
            } else {
                actionBtn = `<button class="btn btn-secondary btn-small" onclick="viewSubmission('${ch.id}')">查看內容</button>`;
            }

            let noteHtml = '';
            if (sub?.teacherNote) {
                noteHtml = `<div class="teacher-note">📝 老師備註：${escapeHtml(sub.teacherNote)}</div>`;
            }

            const card = document.createElement('div');
            card.className = 'assignment-card';
            card.style.borderLeftColor = si.color;
            card.innerHTML = `
                <div class="assignment-header">
                    <span class="assignment-title">${escapeHtml(ch.title)}</span>
                    <span class="assignment-status" style="background-color:${si.bg};color:${si.color}">${si.text}</span>
                </div>
                ${noteHtml}
                <div class="assignment-actions">${actionBtn}</div>`;
            container.appendChild(card);
        }
    } catch (err) {
        console.error('載入章節失敗:', err);
        container.innerHTML = '<p class="error-message">載入失敗，請重新整理頁面</p>';
    }
}

// ---------- 開始作答 ----------
async function startAssignment(chapterId) {
    try {
        const snap = await database.ref(`questions/${chapterId}`).once('value');
        if (!snap.exists()) { alert('此章節還沒有題目'); return; }

        const questions = [];
        snap.forEach(c => { questions.push({ id: c.key, ...c.val() }); });

        currentAssignmentChapterId = chapterId;
        currentAssignmentQuestions = shuffleArray(questions).map(q => {
            if (q.type === 'single' || q.type === 'multiple') {
                const mapped = q.options.map((t, i) => ({ text: t, origIdx: i }));
                return { ...q, displayOptions: shuffleArray(mapped) };
            }
            return q;
        });

        // 清空舊答案
        Object.keys(studentAnswers).forEach(k => delete studentAnswers[k]);

        document.getElementById('studentChapterSection').style.display = 'none';
        const container = document.getElementById('assignmentContainer');
        container.style.display = 'block';
        renderAssignment();
    } catch (err) {
        console.error('載入題目失敗:', err);
        alert('載入題目失敗');
    }
}

function renderAssignment() {
    const container = document.getElementById('assignmentContainer');
    const qs = currentAssignmentQuestions;
    let html = '<div class="exam-header"><h3>📝 作答中</h3></div>';

    qs.forEach((q, idx) => {
        html += `<div class="question-card" id="question-${idx}">`;
        html += `<div class="question-number">第 ${idx + 1} 題 <span class="question-type-badge">${getTypeLabel(q.type)}</span></div>`;
        html += `<div class="question-text">${escapeHtml(q.question)}</div>`;

        if (q.type === 'single') {
            html += '<div class="options-container">';
            q.displayOptions.forEach((o, oi) => {
                html += `<div class="option-item" onclick="selectSingleOption(${idx},${oi})">
                    <input type="radio" name="q${idx}" id="q${idx}_o${oi}" value="${o.origIdx}">
                    <label for="q${idx}_o${oi}">${escapeHtml(o.text)}</label></div>`;
            });
            html += '</div>';
        } else if (q.type === 'multiple') {
            html += '<div class="options-container">';
            q.displayOptions.forEach((o, oi) => {
                html += `<div class="option-item" onclick="toggleMultiOption(${idx},${oi})">
                    <input type="checkbox" name="q${idx}" id="q${idx}_o${oi}" value="${o.origIdx}">
                    <label for="q${idx}_o${oi}">${escapeHtml(o.text)}</label></div>`;
            });
            html += '</div>';
        } else {
            html += `<textarea class="answer-textarea" id="answer-${idx}" placeholder="請輸入您的答案..."></textarea>`;
        }
        html += '</div>';
    });

    html += `<div class="exam-actions">
        <button class="btn btn-success btn-large" onclick="submitAssignment()">繳交作業</button>
        <button class="btn btn-secondary btn-large" onclick="cancelAssignment()">取消</button></div>`;
    container.innerHTML = html;
}

function selectSingleOption(qIdx, optIdx) {
    const q = currentAssignmentQuestions[qIdx];
    studentAnswers[qIdx] = q.displayOptions[optIdx].origIdx;
    const card = document.getElementById(`question-${qIdx}`);
    card.querySelectorAll('.option-item').forEach((el, i) => el.classList.toggle('selected', i === optIdx));
    card.classList.add('answered');
}

function toggleMultiOption(qIdx, optIdx) {
    const q = currentAssignmentQuestions[qIdx];
    if (!studentAnswers[qIdx]) studentAnswers[qIdx] = [];
    const origIdx = q.displayOptions[optIdx].origIdx;
    const pos = studentAnswers[qIdx].indexOf(origIdx);
    if (pos >= 0) studentAnswers[qIdx].splice(pos, 1); else studentAnswers[qIdx].push(origIdx);

    const card = document.getElementById(`question-${qIdx}`);
    const cb = card.querySelector(`#q${qIdx}_o${optIdx}`);
    cb.checked = !cb.checked;
    card.querySelectorAll('.option-item').forEach(el => {
        el.classList.toggle('selected', el.querySelector('input[type="checkbox"]').checked);
    });
    if (studentAnswers[qIdx].length > 0) card.classList.add('answered');
}

async function submitAssignment() {
    const qs = currentAssignmentQuestions;
    const unanswered = qs.filter((q, i) => {
        if (q.type === 'short_answer') { const ta = document.getElementById(`answer-${i}`); return !ta || !ta.value.trim(); }
        return studentAnswers[i] === undefined || (Array.isArray(studentAnswers[i]) && studentAnswers[i].length === 0);
    }).length;

    if (unanswered > 0 && !confirm(`還有 ${unanswered} 題未作答，確定要繳交嗎？`)) return;

    const existSnap = await database.ref(`submissions/${currentAssignmentChapterId}/${currentUser.uid}/status`).once('value');
    const isResubmit = existSnap.val() === 'returned';

    const answers = {};
    qs.forEach((q, i) => {
        if (q.type === 'short_answer') {
            const ta = document.getElementById(`answer-${i}`);
            answers[q.id] = { type: q.type, answer: ta?.value?.trim() || '' };
        } else if (q.type === 'multiple') {
            answers[q.id] = { type: q.type, answer: studentAnswers[i] || [] };
        } else {
            answers[q.id] = { type: q.type, answer: studentAnswers[i] ?? -1 };
        }
    });

    try {
        await database.ref(`submissions/${currentAssignmentChapterId}/${currentUser.uid}`).set({
            status: isResubmit ? 'resubmitted' : 'submitted',
            answers,
            submittedAt: firebase.database.ServerValue.TIMESTAMP,
            questionOrder: qs.map(q => q.id),
            studentName: currentUser.name,
            studentId: currentUser.userId,
        });
        alert('作業繳交成功！');
        cancelAssignment();
        loadStudentChapters();
    } catch (err) {
        console.error('繳交失敗:', err);
        alert('繳交失敗，請重試');
    }
}

function cancelAssignment() {
    Object.keys(studentAnswers).forEach(k => delete studentAnswers[k]);
    currentAssignmentChapterId = null;
    currentAssignmentQuestions = null;
    document.getElementById('assignmentContainer').style.display = 'none';
    document.getElementById('assignmentContainer').innerHTML = '';
    document.getElementById('studentChapterSection').style.display = 'block';
}

// ---------- 查看繳交內容 ----------
async function viewSubmission(chapterId) {
    try {
        const [subSnap, qSnap, chapSnap] = await Promise.all([
            database.ref(`submissions/${chapterId}/${currentUser.uid}`).once('value'),
            database.ref(`questions/${chapterId}`).once('value'),
            database.ref(`chapters/${chapterId}`).once('value'),
        ]);
        const sub = subSnap.val();
        const chapter = chapSnap.val();
        if (!sub) { alert('找不到繳交記錄'); return; }

        const qMap = {};
        qSnap.forEach(c => { qMap[c.key] = c.val(); });

        document.getElementById('studentChapterSection').style.display = 'none';
        const container = document.getElementById('submissionViewContainer');
        container.style.display = 'block';

        const si = getStatusInfo(sub.status);
        let html = `<div class="exam-header">
            <h3>📄 ${escapeHtml(chapter?.title || '作業')}</h3>
            <span class="assignment-status" style="background-color:${si.bg};color:${si.color}">${si.text}</span></div>`;

        if (sub.teacherNote) {
            html += `<div class="teacher-note-box">📝 老師備註：${escapeHtml(sub.teacherNote)}</div>`;
        }

        const order = sub.questionOrder || Object.keys(sub.answers || {});
        order.forEach((qId, idx) => {
            const q = qMap[qId];
            const ans = sub.answers?.[qId];
            if (!q) return;

            html += `<div class="question-card">`;
            html += `<div class="question-number">第 ${idx + 1} 題 <span class="question-type-badge">${getTypeLabel(q.type)}</span></div>`;
            html += `<div class="question-text">${escapeHtml(q.question)}</div>`;

            if (q.type === 'single') {
                html += '<div class="options-container">';
                q.options.forEach((opt, i) => {
                    // 只標記學生選擇的選項，不顯示正確答案
                    const selected = i === ans?.answer;
                    const marker = selected ? '▶ ' : '';
                    html += `<div class="option-item${selected ? ' selected' : ''}">${marker}${escapeHtml(opt)}</div>`;
                });
                html += '</div>';
            } else if (q.type === 'multiple') {
                const selected = ans?.answer || [];
                html += '<div class="options-container">';
                q.options.forEach((opt, i) => {
                    const isSelected = selected.includes(i);
                    const marker = isSelected ? '▶ ' : '';
                    html += `<div class="option-item${isSelected ? ' selected' : ''}">${marker}${escapeHtml(opt)}</div>`;
                });
                html += '</div>';
            } else {
                html += `<div class="student-answer-text">${escapeHtml(ans?.answer || '（未作答）')}</div>`;
            }
            html += '</div>';
        });

        html += `<button class="btn btn-secondary btn-large" onclick="closeSubmissionView()">返回</button>`;
        container.innerHTML = html;
    } catch (err) {
        console.error('載入失敗:', err);
        alert('載入繳交記錄失敗');
    }
}

function closeSubmissionView() {
    document.getElementById('submissionViewContainer').style.display = 'none';
    document.getElementById('submissionViewContainer').innerHTML = '';
    document.getElementById('studentChapterSection').style.display = 'block';
}

// ============================================================
//  教師功能
// ============================================================
async function initTeacherDashboard() {
    setupTabs();
    await loadTeacherChapters();
    await loadGradingChapterSelect();
    setupGradingChapterListener();
}

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
        });
    });
}

// ---------- 章節管理 ----------
async function loadTeacherChapters() {
    const container = document.getElementById('chapterList');
    container.innerHTML = '<p class="loading">載入中...</p>';

    try {
        const snap = await database.ref('chapters').orderByChild('order').once('value');
        container.innerHTML = '';
        if (!snap.exists()) { container.innerHTML = '<p class="empty-message">還沒有章節，請新增</p>'; return; }

        const chapters = [];
        snap.forEach(c => { chapters.push({ id: c.key, ...c.val() }); });
        chapters.sort((a, b) => (a.order || 0) - (b.order || 0));

        chapters.forEach(ch => {
            const card = document.createElement('div');
            card.className = 'chapter-card';
            card.innerHTML = `
                <div class="chapter-info">
                    <span class="chapter-order">#${ch.order || 0}</span>
                    <span class="chapter-title">${escapeHtml(ch.title)}</span>
                </div>
                <div class="chapter-actions">
                    <button class="btn btn-primary btn-small" onclick="manageQuestions('${ch.id}')">管理題目</button>
                    <button class="btn btn-danger btn-small" onclick="deleteChapter('${ch.id}')">刪除</button>
                </div>`;
            container.appendChild(card);
        });
    } catch (err) {
        console.error('載入章節失敗:', err);
        container.innerHTML = '<p class="error-message">載入失敗</p>';
    }
}

async function addChapter() {
    const titleEl = document.getElementById('newChapterTitle');
    const orderEl = document.getElementById('newChapterOrder');
    const title = titleEl.value.trim();
    const order = parseInt(orderEl.value) || 0;
    if (!title) { alert('請輸入章節名稱'); return; }

    try {
        await database.ref('chapters').push().set({
            title, order,
            createdBy: currentUser.uid,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
        });
        titleEl.value = '';
        orderEl.value = '';
        await loadTeacherChapters();
        await loadGradingChapterSelect();
    } catch (err) { console.error(err); alert('新增失敗'); }
}

async function deleteChapter(id) {
    if (!confirm('確定要刪除此章節？相關題目和繳交記錄都會被刪除。')) return;
    try {
        await Promise.all([
            database.ref(`chapters/${id}`).remove(),
            database.ref(`questions/${id}`).remove(),
            database.ref(`submissions/${id}`).remove(),
        ]);
        if (selectedChapterId === id) { document.getElementById('questionManager').style.display = 'none'; selectedChapterId = null; }
        await loadTeacherChapters();
        await loadGradingChapterSelect();
    } catch (err) { console.error(err); alert('刪除失敗'); }
}

// ---------- 題目管理 ----------
let optionInputs = ['', '', '', ''];

async function manageQuestions(chapterId) {
    selectedChapterId = chapterId;

    // 取得章節名稱
    const snap = await database.ref(`chapters/${chapterId}/title`).once('value');
    document.getElementById('selectedChapterTitle').textContent = snap.val() || '';
    document.getElementById('questionManager').style.display = 'block';

    resetQuestionForm();
    await loadQuestions();
}

function closeQuestionManager() {
    document.getElementById('questionManager').style.display = 'none';
    selectedChapterId = null;
}

function resetQuestionForm() {
    document.getElementById('questionType').value = 'single';
    document.getElementById('questionText').value = '';
    optionInputs = ['', '', '', ''];
    updateQuestionFormType();
}

function updateQuestionFormType() {
    const type = document.getElementById('questionType').value;
    const sec = document.getElementById('optionsFormSection');
    if (type === 'short_answer') { sec.style.display = 'none'; }
    else { sec.style.display = 'block'; renderOptionInputs(type); }
}

function renderOptionInputs(type) {
    const container = document.getElementById('optionInputsList');
    container.innerHTML = '';
    optionInputs.forEach((val, idx) => {
        const row = document.createElement('div');
        row.className = 'option-input-row';

        const correctEl = type === 'single'
            ? `<input type="radio" name="correctOpt" value="${idx}" title="正確答案">`
            : `<input type="checkbox" name="correctOpts" value="${idx}" title="正確答案">`;

        row.innerHTML = `${correctEl}
            <input type="text" value="${escapeHtml(val)}" placeholder="選項 ${idx + 1}" oninput="optionInputs[${idx}]=this.value">
            <button class="btn-icon" onclick="removeOptionInput(${idx})" title="刪除">✕</button>`;
        container.appendChild(row);
    });
}

function addOptionInput() {
    optionInputs.push('');
    renderOptionInputs(document.getElementById('questionType').value);
}

function removeOptionInput(idx) {
    if (optionInputs.length <= 2) { alert('至少需要 2 個選項'); return; }
    optionInputs.splice(idx, 1);
    renderOptionInputs(document.getElementById('questionType').value);
}

async function saveQuestion() {
    const type = document.getElementById('questionType').value;
    const text = document.getElementById('questionText').value.trim();
    if (!text) { alert('請輸入題目內容'); return; }

    const data = { type, question: text, createdAt: firebase.database.ServerValue.TIMESTAMP };

    if (type === 'single') {
        const inputs = document.querySelectorAll('#optionInputsList input[type="text"]');
        const opts = Array.from(inputs).map(i => i.value.trim());
        if (opts.some(o => !o)) { alert('所有選項都必須填寫'); return; }
        const radio = document.querySelector('input[name="correctOpt"]:checked');
        if (!radio) { alert('請選擇正確答案'); return; }
        data.options = opts;
        data.correctAnswer = parseInt(radio.value);
    } else if (type === 'multiple') {
        const inputs = document.querySelectorAll('#optionInputsList input[type="text"]');
        const opts = Array.from(inputs).map(i => i.value.trim());
        if (opts.some(o => !o)) { alert('所有選項都必須填寫'); return; }
        const cbs = document.querySelectorAll('input[name="correctOpts"]:checked');
        if (cbs.length === 0) { alert('請選擇至少一個正確答案'); return; }
        data.options = opts;
        data.correctAnswers = Array.from(cbs).map(cb => parseInt(cb.value));
    }

    try {
        await database.ref(`questions/${selectedChapterId}`).push().set(data);
        resetQuestionForm();
        await loadQuestions();
    } catch (err) { console.error(err); alert('儲存失敗'); }
}

async function loadQuestions() {
    const container = document.getElementById('questionList');
    container.innerHTML = '<p class="loading">載入中...</p>';

    try {
        const snap = await database.ref(`questions/${selectedChapterId}`).once('value');
        container.innerHTML = '';
        if (!snap.exists()) { container.innerHTML = '<p class="empty-message">還沒有題目</p>'; return; }

        let idx = 0;
        snap.forEach(child => {
            const q = child.val();
            idx++;
            const card = document.createElement('div');
            card.className = 'question-card';

            let answerHtml = '';
            if (q.type === 'single') {
                answerHtml = q.options.map((o, i) =>
                    `<div class="option-preview ${i === q.correctAnswer ? 'correct-preview' : ''}">${escapeHtml(o)}</div>`
                ).join('');
            } else if (q.type === 'multiple') {
                answerHtml = q.options.map((o, i) =>
                    `<div class="option-preview ${(q.correctAnswers || []).includes(i) ? 'correct-preview' : ''}">${escapeHtml(o)}</div>`
                ).join('');
            } else {
                answerHtml = '<p class="type-note">簡答題（學生自行作答，老師手動批改）</p>';
            }

            card.innerHTML = `
                <div class="question-header-row">
                    <span class="question-number">第 ${idx} 題</span>
                    <span class="question-type-badge">${getTypeLabel(q.type)}</span>
                    <button class="btn-icon btn-delete" onclick="deleteQuestion('${child.key}')" title="刪除">🗑️</button>
                </div>
                <div class="question-text">${escapeHtml(q.question)}</div>
                <div class="question-answers">${answerHtml}</div>`;
            container.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="error-message">載入失敗</p>';
    }
}

async function deleteQuestion(qId) {
    if (!confirm('確定要刪除此題目？')) return;
    try {
        await database.ref(`questions/${selectedChapterId}/${qId}`).remove();
        await loadQuestions();
    } catch (err) { console.error(err); alert('刪除失敗'); }
}

// ---------- 作業批改 ----------
async function loadGradingChapterSelect() {
    const sel = document.getElementById('gradingChapterSelect');
    sel.innerHTML = '<option value="">-- 請選擇章節 --</option>';
    try {
        const snap = await database.ref('chapters').orderByChild('order').once('value');
        if (!snap.exists()) return;
        const chapters = [];
        snap.forEach(c => { chapters.push({ id: c.key, ...c.val() }); });
        chapters.sort((a, b) => (a.order || 0) - (b.order || 0));
        chapters.forEach(ch => {
            const opt = document.createElement('option');
            opt.value = ch.id;
            opt.textContent = ch.title;
            sel.appendChild(opt);
        });
    } catch (err) { console.error(err); }
}

function setupGradingChapterListener() {
    document.getElementById('gradingChapterSelect').addEventListener('change', async function () {
        gradingChapterId = this.value;
        document.getElementById('gradingDetail').style.display = 'none';
        if (!gradingChapterId) { document.getElementById('submissionsList').innerHTML = ''; return; }
        await loadSubmissions(gradingChapterId);
    });
}

async function loadSubmissions(chapterId) {
    const container = document.getElementById('submissionsList');
    container.innerHTML = '<p class="loading">載入中...</p>';

    try {
        const snap = await database.ref(`submissions/${chapterId}`).once('value');
        container.innerHTML = '';
        if (!snap.exists()) { container.innerHTML = '<p class="empty-message">還沒有學生繳交作業</p>'; return; }

        snap.forEach(child => {
            const sub = child.val();
            const uid = child.key;
            const si = getStatusInfo(sub.status);

            const card = document.createElement('div');
            card.className = 'submission-card';
            card.style.borderLeftColor = si.color;
            card.innerHTML = `
                <div class="submission-info">
                    <span class="student-name">${escapeHtml(sub.studentName || '未知')}</span>
                    <span class="student-id-label">${escapeHtml(sub.studentId || '')}</span>
                    <span class="assignment-status" style="background-color:${si.bg};color:${si.color}">${si.text}</span>
                </div>
                <div class="submission-time">繳交時間：${sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('zh-TW') : '未知'}</div>
                <button class="btn btn-primary btn-small" onclick="openGrading('${chapterId}','${uid}')">查看 / 批改</button>`;
            container.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="error-message">載入失敗</p>';
    }
}

async function openGrading(chapterId, studentUid) {
    gradingChapterId = chapterId;
    gradingStudentUid = studentUid;

    try {
        const [subSnap, qSnap] = await Promise.all([
            database.ref(`submissions/${chapterId}/${studentUid}`).once('value'),
            database.ref(`questions/${chapterId}`).once('value'),
        ]);
        const sub = subSnap.val();
        if (!sub) { alert('找不到繳交記錄'); return; }

        const qMap = {};
        qSnap.forEach(c => { qMap[c.key] = c.val(); });

        const detail = document.getElementById('gradingDetail');
        detail.style.display = 'block';

        document.getElementById('gradingStudentName').textContent =
            `${sub.studentName || '未知'} (${sub.studentId || ''})`;

        const si = getStatusInfo(sub.status);
        document.getElementById('gradingCurrentStatus').innerHTML =
            `目前狀態：<span style="color:${si.color};font-weight:bold">${si.text}</span>`;

        const answersEl = document.getElementById('gradingAnswers');
        answersEl.innerHTML = '';

        const order = sub.questionOrder || Object.keys(sub.answers || {});
        let realIdx = 0;
        order.forEach((qId) => {
            const q = qMap[qId];
            const ans = sub.answers?.[qId];
            if (!q) return; // 題目已被刪除，跳過

            const card = document.createElement('div');
            card.className = 'question-card';

            let answerHtml = '';
            if (q.type === 'single') {
                answerHtml = q.options.map((opt, i) => {
                    let cls = '';
                    if (i === q.correctAnswer) cls = 'correct';
                    else if (i === ans?.answer && i !== q.correctAnswer) cls = 'incorrect';
                    const marker = i === ans?.answer ? '▶ ' : '&nbsp;&nbsp;';
                    return `<div class="option-item ${cls}">${marker}${escapeHtml(opt)}</div>`;
                }).join('');
            } else if (q.type === 'multiple') {
                const correct = q.correctAnswers || [];
                const selected = ans?.answer || [];
                answerHtml = q.options.map((opt, i) => {
                    let cls = '';
                    if (correct.includes(i) && selected.includes(i)) cls = 'correct';
                    else if (correct.includes(i)) cls = 'correct faded';
                    else if (selected.includes(i)) cls = 'incorrect';
                    const marker = selected.includes(i) ? '▶ ' : '&nbsp;&nbsp;';
                    return `<div class="option-item ${cls}">${marker}${escapeHtml(opt)}</div>`;
                }).join('');
            } else {
                answerHtml = `<div class="student-answer-text">${escapeHtml(ans?.answer || '（未作答）')}</div>`;
            }

            card.innerHTML = `
                <div class="question-number">第 ${realIdx + 1} 題 <span class="question-type-badge">${getTypeLabel(q.type)}</span></div>
                <div class="question-text">${escapeHtml(q.question)}</div>
                ${answerHtml}`;
            answersEl.appendChild(card);
            realIdx++;
        });

        document.getElementById('teacherNote').value = sub.teacherNote || '';
        detail.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        console.error(err);
        alert('載入批改資料失敗');
    }
}

async function deleteSubmission() {
    if (!gradingChapterId || !gradingStudentUid) return;
    if (!confirm('確定要刪除此學生的繳交紀錄嗎？學生將需要完全重新作答。')) return;

    try {
        await database.ref(`submissions/${gradingChapterId}/${gradingStudentUid}`).remove();
        alert('已刪除繳交紀錄');
        await loadSubmissions(gradingChapterId);
        document.getElementById('gradingDetail').style.display = 'none';
    } catch (err) {
        console.error(err);
        alert('刪除失敗');
    }
}

async function setGradeStatus(status) {
    if (!gradingChapterId || !gradingStudentUid) return;
    const note = document.getElementById('teacherNote').value.trim();
    const label = status === 'graded' ? '批改完成' : '退回';
    if (!confirm(`確定要將此作業設為「${label}」嗎？`)) return;

    try {
        await database.ref(`submissions/${gradingChapterId}/${gradingStudentUid}`).update({
            status,
            teacherNote: note,
            gradedAt: firebase.database.ServerValue.TIMESTAMP,
            gradedBy: currentUser.uid,
        });
        alert(`已設為「${label}」`);
        await loadSubmissions(gradingChapterId);
        document.getElementById('gradingDetail').style.display = 'none';
    } catch (err) {
        console.error(err);
        alert('操作失敗');
    }
}
