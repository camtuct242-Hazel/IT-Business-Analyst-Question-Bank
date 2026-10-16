/**
 * IT BUSINESS ANALYST PRACTICE HUB - JAVASCRIPT APPLICATION
 * High-performance, vanilla JavaScript implementation with state management,
 * 20-minute timer, local storage persistence, and rich review mode.
 */

(function () {
  'use strict';

  // Application State
  const STATE = {
    data: null,
    blueprint: [],
    questions: [],
    progress: {}, // { [examId]: { score, total, completedAt, timeSpent, answers: {}, weakTopics: [] } }
    
    // Active Exam Session
    currentExamId: null,
    currentExamData: null,
    currentQuestions: [],
    currentIndex: 0,
    userAnswers: {}, // { [questionId]: 'A' | 'B' | 'C' | 'D' }
    flaggedQuestions: new Set(),
    
    // Timer
    timerSecondsLeft: 20 * 60,
    timerInterval: null,
    timeSpentSeconds: 0,
    
    // Review mode
    reviewFilter: 'all',
    lastResult: null
  };

  const STORAGE_KEY = 'itba_exam_progress_v1';
  const EXAM_DURATION_SECONDS = 20 * 60; // 20 minutes

  // DOM Elements Cache
  const DOM = {
    app: document.getElementById('app'),
    brandLink: document.getElementById('brand-link'),
    btnHome: document.getElementById('btn-home'),
    btnResetAll: document.getElementById('btn-reset-all'),
    
    // Views
    viewHome: document.getElementById('view-home'),
    viewExam: document.getElementById('view-exam'),
    viewResults: document.getElementById('view-results'),
    
    // Home View
    statTotalExams: document.getElementById('stat-total-exams'),
    statTotalQuestions: document.getElementById('stat-total-questions'),
    statCompletedExams: document.getElementById('stat-completed-exams'),
    statAvgScore: document.getElementById('stat-avg-score'),
    examSearch: document.getElementById('exam-search'),
    examGrid: document.getElementById('exam-grid'),
    
    // Exam View
    btnExitExam: document.getElementById('btn-exit-exam'),
    examTakingTitle: document.getElementById('exam-taking-title'),
    timerBadge: document.getElementById('timer-badge'),
    timerDisplay: document.getElementById('timer-display'),
    btnSubmitExam: document.getElementById('btn-submit-exam'),
    btnSidebarSubmit: document.getElementById('btn-sidebar-submit'),
    qNumberBadge: document.getElementById('q-number-badge'),
    qSubtopicBadge: document.getElementById('q-subtopic-badge'),
    qDifficultyBadge: document.getElementById('q-difficulty-badge'),
    btnFlagQuestion: document.getElementById('btn-flag-question'),
    flagBtnText: document.getElementById('flag-btn-text'),
    qScenarioBox: document.getElementById('q-scenario-box'),
    qScenarioText: document.getElementById('q-scenario-text'),
    qText: document.getElementById('q-text'),
    qOptionsList: document.getElementById('q-options-list'),
    btnPrevQ: document.getElementById('btn-prev-q'),
    btnNextQ: document.getElementById('btn-next-q'),
    qStepIndicator: document.getElementById('q-step-indicator'),
    sidebarAnsweredCount: document.getElementById('sidebar-answered-count'),
    sidebarProgressText: document.getElementById('sidebar-progress-text'),
    sidebarProgressFill: document.getElementById('sidebar-progress-fill'),
    questionNavGrid: document.getElementById('question-nav-grid'),
    
    // Results View
    resScore: document.getElementById('res-score'),
    resVerdict: document.getElementById('res-verdict'),
    resSubtext: document.getElementById('res-subtext'),
    resAccuracy: document.getElementById('res-accuracy'),
    resCorrect: document.getElementById('res-correct'),
    resIncorrect: document.getElementById('res-incorrect'),
    resTimeSpent: document.getElementById('res-time-spent'),
    weakTopicsCard: document.getElementById('weak-topics-card'),
    weakTopicTags: document.getElementById('weak-topic-tags'),
    btnBackToHome: document.getElementById('btn-back-to-home'),
    btnRetakeExam: document.getElementById('btn-retake-exam'),
    reviewQuestionsContainer: document.getElementById('review-questions-container'),
    pillAll: document.getElementById('pill-all'),
    pillIncorrect: document.getElementById('pill-incorrect'),
    pillCorrect: document.getElementById('pill-correct'),
    pillFlagged: document.getElementById('pill-flagged'),
    
    // Modals
    modalSubmit: document.getElementById('modal-submit'),
    modalSubmitBody: document.getElementById('modal-submit-body'),
    btnModalCancel: document.getElementById('btn-modal-cancel'),
    btnModalConfirmSubmit: document.getElementById('btn-modal-confirm-submit'),
    
    modalExit: document.getElementById('modal-exit'),
    btnModalCancelExit: document.getElementById('btn-modal-cancel-exit'),
    btnModalConfirmExit: document.getElementById('btn-modal-confirm-exit'),
    
    modalReset: document.getElementById('modal-reset'),
    btnModalCancelReset: document.getElementById('btn-modal-cancel-reset'),
    btnModalConfirmReset: document.getElementById('btn-modal-confirm-reset')
  };

  // ===================================================================
  // INITIALIZATION & DATA LOADING
  // ===================================================================
  async function init() {
    loadProgress();
    setupEventListeners();
    
    try {
      // Load question bank from relative path
      const response = await fetch('ITBA_Junior_Question_Bank.json');
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: Không thể tải tệp dữ liệu đề thi.`);
      }
      const data = await response.json();
      STATE.data = data;
      STATE.blueprint = data.blueprint || [];
      STATE.questions = data.questions || [];
      
      renderHome();
    } catch (err) {
      console.error('Lỗi khi tải câu hỏi:', err);
      DOM.examGrid.innerHTML = `
        <div style="grid-column: 1/-1; background: #FFF2F0; border: 1px solid #E8B4AF; border-radius: 12px; padding: 2rem; text-align: center;">
          <h3 style="color: #8A231E; margin-bottom: 0.5rem;">⚠️ Không thể tải dữ liệu câu hỏi</h3>
          <p style="color: #666; margin-bottom: 1rem;">${err.message}</p>
          <p style="font-size: 0.85rem; color: #777;">Lưu ý: Nếu bạn đang mở trực tiếp file HTML qua giao thức <code>file://</code>, trình duyệt có thể chặn tính năng <code>fetch()</code> do chính sách bảo mật CORS. Hãy chạy thông qua một máy chủ tĩnh (ví dụ: <code>npx serve site</code> hoặc <code>python -m http.server</code>).</p>
        </div>
      `;
    }
  }

  // ===================================================================
  // LOCAL STORAGE PROGRESS
  // ===================================================================
  function loadProgress() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        STATE.progress = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Không thể đọc dữ liệu từ localStorage', e);
      STATE.progress = {};
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE.progress));
    } catch (e) {
      console.warn('Không thể lưu vào localStorage', e);
    }
  }

  function resetAllProgress() {
    STATE.progress = {};
    saveProgress();
    renderHome();
    closeAllModals();
  }

  // ===================================================================
  // VIEW SWITCHER
  // ===================================================================
  function showView(viewName) {
    DOM.viewHome.style.display = (viewName === 'home') ? 'block' : 'none';
    DOM.viewExam.style.display = (viewName === 'exam') ? 'block' : 'none';
    DOM.viewResults.style.display = (viewName === 'results') ? 'block' : 'none';
    
    DOM.btnHome.style.display = (viewName === 'home') ? 'none' : 'inline-flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ===================================================================
  // VIEW 1: HOME PAGE RENDERING
  // ===================================================================
  function renderHome() {
    showView('home');
    
    // Update Stats
    const totalExams = STATE.blueprint.length || 10;
    const totalQuestions = STATE.questions.length || 200;
    const completedKeys = Object.keys(STATE.progress);
    const completedCount = completedKeys.length;
    
    let totalScoreSum = 0;
    completedKeys.forEach(k => {
      totalScoreSum += STATE.progress[k].score || 0;
    });
    const avgScore = completedCount > 0 ? (totalScoreSum / completedCount).toFixed(1) : '--';
    
    DOM.statTotalExams.textContent = totalExams;
    DOM.statTotalQuestions.textContent = totalQuestions;
    DOM.statCompletedExams.textContent = `${completedCount}/${totalExams}`;
    DOM.statAvgScore.textContent = (avgScore !== '--') ? `${avgScore}/20` : '--';
    
    renderExamCards();
  }

  function renderExamCards(searchTerm = '') {
    DOM.examGrid.innerHTML = '';
    const term = searchTerm.toLowerCase().trim();
    
    const filtered = STATE.blueprint.filter(b => {
      if (!term) return true;
      const titleMatch = b.exam_title.toLowerCase().includes(term);
      const topicMatch = b.topic.toLowerCase().includes(term);
      const descMatch = (b.learning_objectives || '').toLowerCase().includes(term);
      const idMatch = b.exam_id.toLowerCase().includes(term);
      return titleMatch || topicMatch || descMatch || idMatch;
    });
    
    if (filtered.length === 0) {
      DOM.examGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
          <p style="color: var(--text-secondary); font-size: 1.05rem;">Không tìm thấy đề thi phù hợp với từ khóa "${searchTerm}".</p>
          <button class="btn btn-outline btn-sm" style="margin-top: 1rem;" onclick="document.getElementById('exam-search').value=''; window.dispatchEvent(new Event('input-clear'));">Xóa bộ lọc</button>
        </div>
      `;
      return;
    }
    
    filtered.forEach(b => {
      const eid = b.exam_id;
      const prog = STATE.progress[eid];
      const isCompleted = !!prog;
      
      const card = document.createElement('div');
      card.className = 'exam-card';
      
      // Status & Score Badge
      let statusHtml = '';
      let btnLabel = 'Bắt đầu làm bài ➔';
      let btnClass = 'btn-primary';
      
      if (isCompleted) {
        const pct = Math.round((prog.score / 20) * 100);
        statusHtml = `
          <div class="score-tag completed" title="Lần thi gần nhất">
            <span>🏆</span> <span>${prog.score}/20 (${pct}%)</span>
          </div>
        `;
        btnLabel = 'Làm lại đề';
        btnClass = 'btn-secondary';
      } else {
        statusHtml = `
          <div class="score-tag">
            <span>⏳</span> <span>Chưa làm</span>
          </div>
        `;
      }
      
      card.innerHTML = `
        <div>
          <div class="exam-card-header">
            <span class="exam-id-badge">${b.exam_id}</span>
            <span class="badge badge-topic">${escapeHtml(b.topic)}</span>
          </div>
          <h3 class="exam-card-title">${escapeHtml(b.exam_title)}</h3>
          <p class="exam-card-desc">${escapeHtml(b.learning_objectives || '')}</p>
          
          <div class="exam-card-meta">
            <span class="badge badge-easy">10 Dễ</span>
            <span class="badge badge-inter">5 Khá</span>
            <span class="badge badge-hard">5 Khó</span>
            <span class="badge badge-gray">⏱️ 20 phút</span>
          </div>
        </div>
        
        <div class="exam-card-footer">
          ${statusHtml}
          <div style="display: flex; gap: 0.5rem;">
            ${isCompleted ? `<button class="btn btn-outline btn-sm" data-action="review" data-exam="${eid}">Xem kết quả</button>` : ''}
            <button class="btn ${btnClass} btn-sm" data-action="start" data-exam="${eid}">${btnLabel}</button>
          </div>
        </div>
      `;
      
      DOM.examGrid.appendChild(card);
    });
  }

  // ===================================================================
  // VIEW 2: EXAM TAKING LOGIC
  // ===================================================================
  function startExam(examId, isRetake = false) {
    const examData = STATE.blueprint.find(b => b.exam_id === examId);
    if (!examData) {
      alert('Không tìm thấy thông tin đề thi.');
      return;
    }
    
    STATE.currentExamId = examId;
    STATE.currentExamData = examData;
    
    // Filter questions for this exam and sort by question_number
    STATE.currentQuestions = STATE.questions
      .filter(q => q.exam_id === examId)
      .sort((a, b) => a.question_number - b.question_number);
      
    if (STATE.currentQuestions.length === 0) {
      alert(`Đề thi ${examId} chưa có câu hỏi nào.`);
      return;
    }
    
    STATE.currentIndex = 0;
    STATE.userAnswers = {};
    STATE.flaggedQuestions.clear();
    STATE.timerSecondsLeft = EXAM_DURATION_SECONDS;
    
    // Setup UI
    DOM.examTakingTitle.textContent = examData.exam_title;
    buildQuestionNavGrid();
    renderCurrentQuestion();
    startTimer();
    showView('exam');
  }

  function renderCurrentQuestion() {
    const q = STATE.currentQuestions[STATE.currentIndex];
    if (!q) return;
    
    const qNum = STATE.currentIndex + 1;
    const totalQ = STATE.currentQuestions.length;
    
    // Meta bar
    DOM.qNumberBadge.textContent = `Câu ${qNum} / ${totalQ} [${q.question_id}]`;
    DOM.qSubtopicBadge.textContent = q.subtopic || q.topic;
    
    // Difficulty
    DOM.qDifficultyBadge.textContent = q.difficulty;
    DOM.qDifficultyBadge.className = 'badge';
    if (q.difficulty === 'Dễ') DOM.qDifficultyBadge.classList.add('badge-easy');
    else if (q.difficulty === 'Khá') DOM.qDifficultyBadge.classList.add('badge-inter');
    else DOM.qDifficultyBadge.classList.add('badge-hard');
    
    // Flag Button
    const isFlagged = STATE.flaggedQuestions.has(q.question_id);
    DOM.btnFlagQuestion.classList.toggle('flagged', isFlagged);
    DOM.flagBtnText.textContent = isFlagged ? 'Đã đánh dấu' : 'Đánh dấu';
    
    // Scenario
    if (q.scenario && q.scenario.trim()) {
      DOM.qScenarioBox.style.display = 'block';
      DOM.qScenarioText.textContent = q.scenario;
    } else {
      DOM.qScenarioBox.style.display = 'none';
    }
    
    // Question Text
    DOM.qText.textContent = q.question_text;
    
    // Options list
    DOM.qOptionsList.innerHTML = '';
    const selectedAns = STATE.userAnswers[q.question_id];
    
    const options = [
      { key: 'A', text: q.option_a },
      { key: 'B', text: q.option_b },
      { key: 'C', text: q.option_c },
      { key: 'D', text: q.option_d }
    ];
    
    options.forEach(opt => {
      const isSelected = (selectedAns === opt.key);
      const optItem = document.createElement('div');
      optItem.className = `option-item ${isSelected ? 'selected' : ''}`;
      optItem.setAttribute('tabindex', '0');
      optItem.setAttribute('role', 'radio');
      optItem.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      optItem.dataset.optKey = opt.key;
      
      optItem.innerHTML = `
        <div class="option-indicator">${opt.key}</div>
        <div class="option-text">${escapeHtml(opt.text)}</div>
      `;
      
      optItem.addEventListener('click', () => {
        selectOption(q.question_id, opt.key);
      });
      
      optItem.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          selectOption(q.question_id, opt.key);
        }
      });
      
      DOM.qOptionsList.appendChild(optItem);
    });
    
    // Step indicator & Nav buttons
    DOM.qStepIndicator.textContent = `${qNum} / ${totalQ}`;
    DOM.btnPrevQ.disabled = (STATE.currentIndex === 0);
    DOM.btnNextQ.textContent = (STATE.currentIndex === totalQ - 1) ? 'Kiểm tra & Nộp bài' : 'Câu tiếp theo →';
    
    updateNavGridHighlight();
  }

  function selectOption(questionId, optKey) {
    STATE.userAnswers[questionId] = optKey;
    renderCurrentQuestion();
    updateSidebarProgress();
  }

  function toggleFlagCurrentQuestion() {
    const q = STATE.currentQuestions[STATE.currentIndex];
    if (!q) return;
    
    if (STATE.flaggedQuestions.has(q.question_id)) {
      STATE.flaggedQuestions.delete(q.question_id);
    } else {
      STATE.flaggedQuestions.add(q.question_id);
    }
    
    renderCurrentQuestion();
    updateNavGridHighlight();
  }

  function buildQuestionNavGrid() {
    DOM.questionNavGrid.innerHTML = '';
    STATE.currentQuestions.forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.className = 'nav-grid-btn';
      btn.textContent = idx + 1;
      btn.title = `Chuyển tới câu ${idx + 1} (${q.subtopic || ''})`;
      btn.dataset.index = idx;
      
      btn.addEventListener('click', () => {
        STATE.currentIndex = idx;
        renderCurrentQuestion();
      });
      
      DOM.questionNavGrid.appendChild(btn);
    });
    
    updateSidebarProgress();
  }

  function updateNavGridHighlight() {
    const buttons = DOM.questionNavGrid.querySelectorAll('.nav-grid-btn');
    buttons.forEach((btn, idx) => {
      const q = STATE.currentQuestions[idx];
      const isAnswered = !!STATE.userAnswers[q.question_id];
      const isCurrent = (idx === STATE.currentIndex);
      const isFlagged = STATE.flaggedQuestions.has(q.question_id);
      
      btn.classList.toggle('answered', isAnswered);
      btn.classList.toggle('current', isCurrent);
      btn.classList.toggle('flagged', isFlagged);
    });
  }

  function updateSidebarProgress() {
    const totalQ = STATE.currentQuestions.length;
    const answeredCount = Object.keys(STATE.userAnswers).length;
    const pct = Math.round((answeredCount / totalQ) * 100);
    
    DOM.sidebarAnsweredCount.textContent = `${answeredCount}/${totalQ}`;
    DOM.sidebarProgressText.textContent = `Đã trả lời: ${answeredCount}/${totalQ} (${pct}%)`;
    DOM.sidebarProgressFill.style.width = `${pct}%`;
    
    updateNavGridHighlight();
  }

  // ===================================================================
  // 20-MINUTE TIMER
  // ===================================================================
  function startTimer() {
    clearInterval(STATE.timerInterval);
    updateTimerDisplay();
    
    STATE.timerInterval = setInterval(() => {
      STATE.timerSecondsLeft--;
      updateTimerDisplay();
      
      if (STATE.timerSecondsLeft <= 0) {
        clearInterval(STATE.timerInterval);
        alert('⏰ Hết giờ làm bài! Hệ thống sẽ tự động nộp bài thi của bạn.');
        closeAllModals();
        doSubmitExam();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const sec = Math.max(0, STATE.timerSecondsLeft);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    DOM.timerDisplay.textContent = formatted;
    
    DOM.timerBadge.classList.remove('warning', 'danger');
    if (sec <= 60) {
      DOM.timerBadge.classList.add('danger');
    } else if (sec <= 300) {
      DOM.timerBadge.classList.add('warning');
    }
  }

  function stopTimer() {
    clearInterval(STATE.timerInterval);
    STATE.timeSpentSeconds = EXAM_DURATION_SECONDS - STATE.timerSecondsLeft;
  }

  // ===================================================================
  // SUBMISSION & SCORING
  // ===================================================================
  function promptSubmitExam() {
    const totalQ = STATE.currentQuestions.length;
    const answeredCount = Object.keys(STATE.userAnswers).length;
    const unansweredCount = totalQ - answeredCount;
    
    if (unansweredCount > 0) {
      // Find which questions are unanswered
      const missingNums = [];
      STATE.currentQuestions.forEach((q, idx) => {
        if (!STATE.userAnswers[q.question_id]) {
          missingNums.push(idx + 1);
        }
      });
      
      DOM.modalSubmitBody.innerHTML = `
        <div style="background-color: #FEF3D6; border: 1px solid #F5DCA5; border-radius: 8px; padding: 0.85rem; margin-bottom: 1rem; color: #7E5109;">
          <strong>⚠️ Cảnh báo:</strong> Bạn còn <strong>${unansweredCount}</strong> câu chưa chọn đáp án!<br>
          <span style="font-size: 0.85rem;">Các câu chưa trả lời: Câu ${missingNums.join(', ')}</span>
        </div>
        <p>Bạn có chắc chắn muốn nộp bài thi ngay bây giờ không?</p>
      `;
    } else {
      DOM.modalSubmitBody.innerHTML = `
        <div style="background-color: var(--correct-bg); border: 1px solid var(--correct-border); border-radius: 8px; padding: 0.85rem; margin-bottom: 1rem; color: var(--correct-text);">
          <strong>✅ Tuyệt vời!</strong> Bạn đã trả lời đầy đủ <strong>${totalQ}/${totalQ}</strong> câu hỏi.
        </div>
        <p>Bạn có muốn nộp bài để xem điểm số và lời giải chi tiết?</p>
      `;
    }
    
    DOM.modalSubmit.classList.add('active');
  }

  function doSubmitExam() {
    stopTimer();
    closeAllModals();
    
    const totalQ = STATE.currentQuestions.length;
    let correctCount = 0;
    const weakTopicsMap = {}; // topic/subtopic -> count of errors
    
    STATE.currentQuestions.forEach(q => {
      const userChoice = STATE.userAnswers[q.question_id];
      const isCorrect = (userChoice === q.correct_answer);
      
      if (isCorrect) {
        correctCount++;
      } else {
        const key = q.subtopic || q.topic;
        weakTopicsMap[key] = (weakTopicsMap[key] || 0) + 1;
      }
    });
    
    // Sort weak topics by error frequency
    const weakTopics = Object.keys(weakTopicsMap).sort((a, b) => weakTopicsMap[b] - weakTopicsMap[a]);
    
    const resultObj = {
      examId: STATE.currentExamId,
      examTitle: STATE.currentExamData.exam_title,
      score: correctCount,
      total: totalQ,
      accuracy: Math.round((correctCount / totalQ) * 100),
      timeSpent: STATE.timeSpentSeconds,
      userAnswers: { ...STATE.userAnswers },
      flagged: Array.from(STATE.flaggedQuestions),
      weakTopics: weakTopics,
      completedAt: new Date().toISOString()
    };
    
    // Persist to STATE & localStorage
    STATE.progress[STATE.currentExamId] = resultObj;
    saveProgress();
    
    STATE.lastResult = resultObj;
    renderResults(resultObj);
  }

  // ===================================================================
  // VIEW 3: RESULTS & REVIEW MODE
  // ===================================================================
  function renderResults(res) {
    showView('results');
    STATE.reviewFilter = 'all';
    
    // Score & Accuracy
    DOM.resScore.textContent = res.score;
    DOM.resAccuracy.textContent = `${res.accuracy}%`;
    DOM.resCorrect.textContent = res.score;
    DOM.resIncorrect.textContent = res.total - res.score;
    
    // Format Time Spent
    const m = Math.floor(res.timeSpent / 60);
    const s = res.timeSpent % 60;
    DOM.resTimeSpent.textContent = `${m}p ${s}s`;
    
    // Verdict & Subtext
    if (res.score >= 18) {
      DOM.resVerdict.textContent = 'Xuất Sắc! Sẵn Sàng Phỏng Vấn';
      DOM.resVerdict.style.color = '#215A1A';
      DOM.resSubtext.textContent = 'Bạn đã thể hiện sự am hiểu rất sâu sắc và vững vàng về các kiến thức, nghiệp vụ và tình huống thực tế của đề thi này.';
    } else if (res.score >= 14) {
      DOM.resVerdict.textContent = 'Khá Tốt! Đạt Yêu Cầu Nền Tảng';
      DOM.resVerdict.style.color = '#7E5109';
      DOM.resSubtext.textContent = 'Bạn đã nắm được các nguyên tắc cốt lõi nhưng còn một vài câu tình huống cần củng cố lại để tối ưu điểm số.';
    } else if (res.score >= 10) {
      DOM.resVerdict.textContent = 'Cần Ôn Luyện Thêm!';
      DOM.resVerdict.style.color = '#9C4221';
      DOM.resSubtext.textContent = 'Bạn cần xem kỹ lại phần giải thích chi tiết bên dưới, ghi chép lại các bẫy tư duy để làm lại đề này đạt kết quả cao hơn.';
    } else {
      DOM.resVerdict.textContent = 'Chưa Đạt Yêu Cầu!';
      DOM.resVerdict.style.color = '#8A231E';
      DOM.resSubtext.textContent = 'Hãy dành thời gian đọc lại tài liệu lý thuyết chuẩn mực và ôn tập theo danh sách chủ đề yếu bên dưới trước khi thi lại.';
    }
    
    // Weak topics rendering
    if (res.weakTopics && res.weakTopics.length > 0) {
      DOM.weakTopicsCard.style.display = 'block';
      DOM.weakTopicTags.innerHTML = '';
      res.weakTopics.forEach(top => {
        const tag = document.createElement('span');
        tag.className = 'weak-topic-tag';
        tag.textContent = `📌 ${top}`;
        DOM.weakTopicTags.appendChild(tag);
      });
    } else {
      DOM.weakTopicsCard.style.display = 'none';
    }
    
    // Filter pill counts
    const questions = STATE.questions.filter(q => q.exam_id === res.examId);
    const flaggedSet = new Set(res.flagged || []);
    
    const countIncorrect = questions.filter(q => res.userAnswers[q.question_id] !== q.correct_answer).length;
    const countCorrect = questions.filter(q => res.userAnswers[q.question_id] === q.correct_answer).length;
    const countFlagged = questions.filter(q => flaggedSet.has(q.question_id)).length;
    
    DOM.pillAll.textContent = `Tất cả (${questions.length})`;
    DOM.pillIncorrect.textContent = `Câu làm sai (${countIncorrect})`;
    DOM.pillCorrect.textContent = `Câu làm đúng (${countCorrect})`;
    DOM.pillFlagged.textContent = `Đã đánh dấu (${countFlagged})`;
    
    updateFilterPillsUI();
    renderReviewQuestions();
  }

  function updateFilterPillsUI() {
    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.filter === STATE.reviewFilter);
    });
  }

  function renderReviewQuestions() {
    const res = STATE.lastResult;
    if (!res) return;
    
    const questions = STATE.questions.filter(q => q.exam_id === res.examId);
    const flaggedSet = new Set(res.flagged || []);
    
    DOM.reviewQuestionsContainer.innerHTML = '';
    
    const filteredQuestions = questions.filter(q => {
      const userChoice = res.userAnswers[q.question_id];
      const isCorrect = (userChoice === q.correct_answer);
      const isFlagged = flaggedSet.has(q.question_id);
      
      if (STATE.reviewFilter === 'incorrect') return !isCorrect;
      if (STATE.reviewFilter === 'correct') return isCorrect;
      if (STATE.reviewFilter === 'flagged') return isFlagged;
      return true; // 'all'
    });
    
    if (filteredQuestions.length === 0) {
      DOM.reviewQuestionsContainer.innerHTML = `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 2.5rem; text-align: center;">
          <p style="color: var(--text-secondary); font-size: 1rem;">Không có câu hỏi nào thuộc bộ lọc này.</p>
        </div>
      `;
      return;
    }
    
    filteredQuestions.forEach((q, idx) => {
      const userChoice = res.userAnswers[q.question_id];
      const isCorrect = (userChoice === q.correct_answer);
      const isFlagged = flaggedSet.has(q.question_id);
      
      const card = document.createElement('div');
      card.className = `review-card ${isCorrect ? 'correct' : 'incorrect'}`;
      
      const options = [
        { key: 'A', text: q.option_a, whyIncorrect: q.why_a_incorrect },
        { key: 'B', text: q.option_b, whyIncorrect: q.why_b_incorrect },
        { key: 'C', text: q.option_c, whyIncorrect: q.why_c_incorrect },
        { key: 'D', text: q.option_d, whyIncorrect: q.why_d_incorrect }
      ];
      
      // Options HTML
      let optionsHtml = '';
      options.forEach(opt => {
        const isUserSelected = (userChoice === opt.key);
        const isCorrectOpt = (q.correct_answer === opt.key);
        
        let optClasses = 'review-option';
        let tagsHtml = '';
        
        if (isUserSelected) {
          optClasses += ` user-selected ${isCorrect ? '' : 'is-incorrect'}`;
          tagsHtml += `<span class="review-tag tag-user">Lựa chọn của bạn</span>`;
        }
        if (isCorrectOpt) {
          optClasses += ' is-correct';
          tagsHtml += `<span class="review-tag tag-correct">✓ Đáp án đúng</span>`;
        }
        
        optionsHtml += `
          <div class="${optClasses}">
            <div style="font-weight: 700; width: 20px;">${opt.key}.</div>
            <div style="flex: 1;">${escapeHtml(opt.text)}</div>
            ${tagsHtml}
          </div>
        `;
      });
      
      // Distractor explanations HTML
      let distractorsHtml = '';
      options.forEach(opt => {
        if (opt.key !== q.correct_answer) {
          distractorsHtml += `<li><strong>Lựa chọn ${opt.key}:</strong> ${escapeHtml(opt.whyIncorrect)}</li>`;
        }
      });
      
      card.innerHTML = `
        <div class="review-card-header">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span style="font-weight: 800; color: var(--text-main);">Câu ${q.question_number} [${q.question_id}]</span>
            <span class="badge badge-topic">${escapeHtml(q.subtopic || q.topic)}</span>
            <span class="badge ${q.difficulty === 'Dễ' ? 'badge-easy' : (q.difficulty === 'Khá' ? 'badge-inter' : 'badge-hard')}">${q.difficulty}</span>
            ${isFlagged ? '<span class="badge" style="background:#FCEBDD; color:#E87A43;">🚩 Đã đánh dấu</span>' : ''}
          </div>
          <span class="review-status-badge ${isCorrect ? 'correct' : 'incorrect'}">
            ${isCorrect ? '✓ Trả lời Đúng' : (userChoice ? '✗ Trả lời Sai' : '⚠️ Bỏ trống')}
          </span>
        </div>
        
        ${q.scenario ? `
          <div class="scenario-box">
            <div class="scenario-title">📋 Tình huống nghiệp vụ:</div>
            <div>${escapeHtml(q.scenario)}</div>
          </div>
        ` : ''}
        
        <div style="font-size: 1.05rem; font-weight: 600; margin-bottom: 1.25rem; color: var(--text-main);">
          ${escapeHtml(q.question_text)}
        </div>
        
        <div style="margin-bottom: 1.25rem;">
          ${optionsHtml}
        </div>
        
        <div class="explanation-box">
          <div class="explanation-title">💡 Giải thích chi tiết & Phân tích đáp án:</div>
          
          <div class="explanation-section">
            <strong>• Vì sao đáp án [${q.correct_answer}] là tốt nhất?</strong>
            ${escapeHtml(q.explanation)}
          </div>
          
          <div class="explanation-section">
            <strong>• Phân tích lý do các lựa chọn còn lại chưa đúng:</strong>
            <ul class="distractor-list">
              ${distractorsHtml}
            </ul>
          </div>
          
          <div class="explanation-section" style="margin-bottom: 0;">
            <div class="concept-pill-wrap">
              <span class="badge badge-topic"><strong>Trọng tâm:</strong> ${escapeHtml(q.key_concept)}</span>
              <span class="badge badge-easy"><strong>Ghi nhớ:</strong> ${escapeHtml(q.learning_point)}</span>
            </div>
            <div style="font-size: 0.78rem; color: #004586; margin-top: 0.5rem; font-style: italic;">
              📖 Nguồn tham chiếu: ${escapeHtml(q.reference_url)}
            </div>
          </div>
        </div>
      `;
      
      DOM.reviewQuestionsContainer.appendChild(card);
    });
  }

  // ===================================================================
  // MODAL CONTROLS
  // ===================================================================
  function closeAllModals() {
    DOM.modalSubmit.classList.remove('active');
    DOM.modalExit.classList.remove('active');
    DOM.modalReset.classList.remove('active');
  }

  // ===================================================================
  // EVENT LISTENERS
  // ===================================================================
  function setupEventListeners() {
    // Brand / Home navigation
    DOM.brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      handleGoHome();
    });
    
    DOM.btnHome.addEventListener('click', () => {
      handleGoHome();
    });
    
    function handleGoHome() {
      if (DOM.viewExam.style.display === 'block') {
        DOM.modalExit.classList.add('active');
      } else {
        renderHome();
      }
    }
    
    // Reset All Progress
    DOM.btnResetAll.addEventListener('click', () => {
      DOM.modalReset.classList.add('active');
    });
    DOM.btnModalCancelReset.addEventListener('click', closeAllModals);
    DOM.btnModalConfirmReset.addEventListener('click', resetAllProgress);
    
    // Search Box
    DOM.examSearch.addEventListener('input', (e) => {
      renderExamCards(e.target.value);
    });
    window.addEventListener('input-clear', () => {
      renderExamCards('');
    });
    
    // Exam Card Click delegation
    DOM.examGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      
      const action = btn.dataset.action;
      const examId = btn.dataset.exam;
      
      if (action === 'start') {
        startExam(examId);
      } else if (action === 'review') {
        const saved = STATE.progress[examId];
        if (saved) {
          STATE.currentExamId = examId;
          STATE.lastResult = saved;
          renderResults(saved);
        }
      }
    });
    
    // Exam Navigation Buttons
    DOM.btnPrevQ.addEventListener('click', () => {
      if (STATE.currentIndex > 0) {
        STATE.currentIndex--;
        renderCurrentQuestion();
      }
    });
    
    DOM.btnNextQ.addEventListener('click', () => {
      if (STATE.currentIndex < STATE.currentQuestions.length - 1) {
        STATE.currentIndex++;
        renderCurrentQuestion();
      } else {
        promptSubmitExam();
      }
    });
    
    DOM.btnFlagQuestion.addEventListener('click', toggleFlagCurrentQuestion);
    
    // Submit Exam Buttons
    DOM.btnSubmitExam.addEventListener('click', promptSubmitExam);
    DOM.btnSidebarSubmit.addEventListener('click', promptSubmitExam);
    
    DOM.btnModalCancel.addEventListener('click', closeAllModals);
    DOM.btnModalConfirmSubmit.addEventListener('click', doSubmitExam);
    
    // Exit Modal Buttons
    DOM.btnExitExam.addEventListener('click', () => {
      DOM.modalExit.classList.add('active');
    });
    DOM.btnModalCancelExit.addEventListener('click', closeAllModals);
    DOM.btnModalConfirmExit.addEventListener('click', () => {
      stopTimer();
      closeAllModals();
      renderHome();
    });
    
    // Results Page Buttons
    DOM.btnBackToHome.addEventListener('click', renderHome);
    DOM.btnRetakeExam.addEventListener('click', () => {
      if (STATE.lastResult && STATE.lastResult.examId) {
        startExam(STATE.lastResult.examId, true);
      }
    });
    
    // Filter Pills in Review Mode
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        STATE.reviewFilter = pill.dataset.filter;
        updateFilterPillsUI();
        renderReviewQuestions();
      });
    });
    
    // Close modal when clicking outside card
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeAllModals();
        }
      });
    });
    
    // Keyboard Shortcuts during Exam
    window.addEventListener('keydown', (e) => {
      // Only when in exam view and no modal is open
      if (DOM.viewExam.style.display !== 'block') return;
      if (document.querySelector('.modal-overlay.active')) return;
      
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        const q = STATE.currentQuestions[STATE.currentIndex];
        if (q) selectOption(q.question_id, key);
      } else if (e.key === 'ArrowLeft') {
        DOM.btnPrevQ.click();
      } else if (e.key === 'ArrowRight') {
        DOM.btnNextQ.click();
      } else if (key === 'F') {
        toggleFlagCurrentQuestion();
      }
    });
  }

  // Helper Utility
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Start Application
  document.addEventListener('DOMContentLoaded', init);

})();
