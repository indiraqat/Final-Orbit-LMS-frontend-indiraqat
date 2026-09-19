// QUIZ TAKING — reads ?quizId= (and optionally &courseId=, &mode=result)

document.addEventListener('DOMContentLoaded', initQuizPage);

function getParams() {
  return new URLSearchParams(window.location.search);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function setBackLinks(mode, courseId) {
  let href, label;

  if (mode === 'result') {
    href = 'quizzes.html';
    label = 'Back to Quizzes';
  } else if (courseId) {
    href = `course-detail.html?id=${courseId}`;
    label = 'Back to Course';
  } else {
    href = 'courses.html';
    label = 'Back to My Courses';
  }

  const topLink = document.getElementById('back-link-top');
  if (topLink) {
    topLink.href = href;
    topLink.innerHTML = `&larr; ${label}`;
  }

  const resultLink = document.getElementById('back-link-result');
  if (resultLink) {
    resultLink.href = href;
    resultLink.textContent = label;
  }
}

async function initQuizPage() {
  const params = getParams();
  const quizId = params.get('quizId');
  const mode = params.get('mode');
  const courseId = params.get('courseId');

  initQuizPrint();
  setBackLinks(mode, courseId);

  if (!quizId) {
    document.querySelector('.dashboard-content').innerHTML =
      `<p style="color:var(--color-danger);">No quiz was specified. <a href="quizzes.html">Back to Quizzes</a></p>`;
    return;
  }

  if (mode === 'result') {
    showPastResult(quizId, params);
    return;
  }

  await loadQuizForTaking(quizId);
}

// --- TAKING A QUIZ (new or retake) -----------------------------------

async function loadQuizForTaking(quizId) {
  const quizView = document.getElementById('quiz-view');

  try {
    const { data: quiz } = await apiFetch(`/quizzes/${quizId}`);
    renderQuizForm(quiz);
  } catch (err) {
    if (quizView) quizView.innerHTML = `<p style="color:var(--color-danger);">Couldn't load this quiz: ${escapeHtml(err.message)}</p>`;
    showToast('Failed to load quiz.', 'danger');
  }
}

function renderQuizForm(quiz) {
  const titleEl = document.querySelector('.quiz-meta-title');
  const trailEl = document.querySelector('.quiz-meta-trail');
  const questionsContainer = document.querySelector('.quiz-questions');

  if (titleEl) titleEl.textContent = quiz.title;
  if (trailEl) trailEl.textContent = 'Take the quiz below';
  document.title = `${quiz.title} — Orbit LMS`;

  if (questionsContainer) {
    questionsContainer.innerHTML = quiz.questions.map((q, i) => `
      <div class="quiz-question" data-question-id="${q.id}">
        <span class="quiz-question-number">Question ${i + 1}</span>
        <p class="quiz-question-text">${escapeHtml(q.text)}</p>
        <div class="quiz-options">
          ${q.options.map(opt => `
            <label class="quiz-option">
              <input type="radio" name="q-${q.id}" value="${opt.id}">
              <span class="quiz-option-text">${escapeHtml(opt.text)}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  wireQuizSubmit(quiz.id, quiz.questions.length);
}

function wireQuizSubmit(quizId, totalQuestions) {
  const questions = () => Array.from(document.querySelectorAll('.quiz-question'));
  const answeredCountEl = document.getElementById('quiz-answered-count');
  const submitBtn = document.getElementById('submit-quiz-btn');

  function updateAnsweredCount() {
    const answered = questions().filter(q => q.querySelector('input[type="radio"]:checked')).length;
    if (answeredCountEl) answeredCountEl.innerHTML = `<strong>${answered}</strong> / ${totalQuestions} answered`;
  }

  questions().forEach(q => {
    q.querySelectorAll('input[type="radio"]').forEach(input => {
      input.addEventListener('change', updateAnsweredCount);
    });
  });
  updateAnsweredCount();

  submitBtn?.addEventListener('click', async () => {
    const unanswered = questions().filter(q => !q.querySelector('input[type="radio"]:checked'));
    if (unanswered.length > 0) {
      showToast(`Please answer all questions (${unanswered.length} left).`, 'danger');
      unanswered[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const answers = questions().map(q => ({
      questionId: q.dataset.questionId,
      optionId: q.querySelector('input[type="radio"]:checked').value,
    }));

    submitBtn.disabled = true;
    try {
      const { data: result } = await apiFetch(`/quizzes/${quizId}/attempt`, {
        method: 'POST',
        body: { answers },
      });
      showFreshResult(result);
    } catch (err) {
      showToast(err.message || 'Failed to submit quiz.', 'danger');
      submitBtn.disabled = false;
    }
  });
}

// --- RESULT VIEW: just-submitted (full per-question breakdown) --------

function showFreshResult(result) {
  document.getElementById('quiz-view')?.classList.add('is-hidden');
  const resultView = document.getElementById('result-view');
  resultView?.classList.remove('is-hidden');

  setResultHeader(result.percent, `${result.score} / ${result.totalQuestions} correct`, result.passed);

  const dateEl = document.getElementById('quiz-result-date');
  if (dateEl) dateEl.textContent = new Date(result.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const answersContainer = document.getElementById('quiz-result-answers');
  if (answersContainer) {
    answersContainer.innerHTML = result.results.map((r, i) => `
      <div class="quiz-answer-row ${r.isCorrect ? 'correct' : 'incorrect'}">
        <span class="quiz-answer-icon">${r.isCorrect
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18"/></svg>'}</span>
        <div class="quiz-answer-body">
          <div class="quiz-answer-question">${i + 1}. ${escapeHtml(r.questionText)}</div>
          <div class="quiz-answer-detail">
            ${r.isCorrect
              ? `<span class="label">Your answer:</span> ${escapeHtml(r.selectedOptionText || '—')}`
              : `<span class="label">Your answer:</span> ${escapeHtml(r.selectedOptionText || '—')} &nbsp;·&nbsp; <span class="label">Correct answer:</span> ${escapeHtml(r.correctOptionText || '—')}`}
          </div>
        </div>
      </div>
    `).join('');
  }

  resultView?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- RESULT VIEW: viewing a past (already-passed) attempt -------------

async function showPastResult(quizId, params) {
  document.getElementById('quiz-view')?.classList.add('is-hidden');
  const resultView = document.getElementById('result-view');
  resultView?.classList.remove('is-hidden');

  const score = Number(params.get('score'));
  const total = Number(params.get('total'));
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  setResultHeader(percent, `${score} / ${total} correct`, true);

  const dateEl = document.getElementById('quiz-result-date');
  if (dateEl) dateEl.textContent = 'Previously completed';

  try {
    const { data: quiz } = await apiFetch(`/quizzes/${quizId}`);
    const titleEl = document.querySelector('.quiz-meta-title');
    if (titleEl) titleEl.textContent = quiz.title;
    document.title = `${quiz.title} — Orbit LMS`;
  } catch {
  }

  const answersContainer = document.getElementById('quiz-result-answers');
  if (answersContainer) {
    answersContainer.innerHTML = `
      <p style="font-size:var(--text-sm);color:var(--color-gray-500);">
        This is a past result. A full question-by-question review isn't available for
        previous attempts — only your score is stored.
      </p>`;
  }
}

// --- SHARED --------------------------------------------------------------

function setResultHeader(percent, fractionText, passed) {
  const scoreValueEl = document.getElementById('quiz-score-value');
  const scoreFractionEl = document.getElementById('quiz-score-fraction');
  const scoreBadgeEl = document.getElementById('quiz-score-badge');

  if (scoreValueEl) scoreValueEl.textContent = `${percent}%`;
  if (scoreFractionEl) scoreFractionEl.textContent = fractionText;
  if (scoreBadgeEl) {
    scoreBadgeEl.textContent = passed ? 'Passed' : 'Not Passed';
    scoreBadgeEl.className = `badge ${passed ? 'badge-success' : 'badge-danger'}`;
  }

  const employeeField = document.querySelector('.quiz-result-field');
  if (employeeField && window.currentUser) {
    employeeField.innerHTML = `<strong>Employee:</strong> ${escapeHtml(window.currentUser.firstName + ' ' + window.currentUser.lastName)}`;
  }
}

function initQuizPrint() {
  document.getElementById('print-result-btn')?.addEventListener('click', () => window.print());
}