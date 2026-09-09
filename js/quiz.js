// QUIZ TAKING — answer tracking + grading + printable result

function initQuiz() {
  const quizView = document.getElementById('quiz-view');
  const resultView = document.getElementById('result-view');
  const submitBtn = document.getElementById('submit-quiz-btn');
  const answeredCountEl = document.getElementById('quiz-answered-count');

  if (!quizView || !submitBtn) return;

  const questions = Array.from(document.querySelectorAll('.quiz-question'));
  const totalQuestions = questions.length;

  function updateAnsweredCount() {
    const answered = questions.filter(q => q.querySelector('input[type="radio"]:checked')).length;
    if (answeredCountEl) {
      answeredCountEl.innerHTML = `<strong>${answered}</strong> / ${totalQuestions} answered`;
    }
  }

  questions.forEach(q => {
    q.querySelectorAll('input[type="radio"]').forEach(input => {
      input.addEventListener('change', updateAnsweredCount);
    });
  });

  updateAnsweredCount();

  submitBtn.addEventListener('click', () => {
    const unanswered = questions.filter(q => !q.querySelector('input[type="radio"]:checked'));

    if (unanswered.length > 0) {
      showToast(`Please answer all questions (${unanswered.length} left).`, 'danger');
      unanswered[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    gradeQuiz(questions, totalQuestions);
    quizView.classList.add('is-hidden');
    resultView.classList.remove('is-hidden');
    resultView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function gradeQuiz(questions, totalQuestions) {
  const answersContainer = document.getElementById('quiz-result-answers');
  const scoreValueEl = document.getElementById('quiz-score-value');
  const scoreFractionEl = document.getElementById('quiz-score-fraction');
  const scoreBadgeEl = document.getElementById('quiz-score-badge');

  if (answersContainer) answersContainer.innerHTML = '';

  let correctCount = 0;

  questions.forEach((q, index) => {
    const checked = q.querySelector('input[type="radio"]:checked');
    const correctInput = q.querySelector('input[data-correct="true"]');
    const isCorrect = checked && checked.dataset.correct === 'true';

    if (isCorrect) correctCount++;

    const questionText = q.querySelector('.quiz-question-text')?.textContent.trim() || `Question ${index + 1}`;
    const yourAnswerText = checked?.closest('.quiz-option')?.querySelector('.quiz-option-text')?.textContent.trim() || '—';
    const correctAnswerText = correctInput?.closest('.quiz-option')?.querySelector('.quiz-option-text')?.textContent.trim() || '—';

    if (!answersContainer) return;

    const row = document.createElement('div');
    row.className = `quiz-answer-row ${isCorrect ? 'correct' : 'incorrect'}`;

    const icon = document.createElement('span');
    icon.className = 'quiz-answer-icon';
    icon.innerHTML = isCorrect
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18"/></svg>';

    const body = document.createElement('div');
    body.className = 'quiz-answer-body';

    const qEl = document.createElement('div');
    qEl.className = 'quiz-answer-question';
    qEl.textContent = `${index + 1}. ${questionText}`;

    const detailEl = document.createElement('div');
    detailEl.className = 'quiz-answer-detail';
    detailEl.innerHTML = isCorrect
      ? `<span class="label">Your answer:</span> ${escapeHtml(yourAnswerText)}`
      : `<span class="label">Your answer:</span> ${escapeHtml(yourAnswerText)} &nbsp;·&nbsp; <span class="label">Correct answer:</span> ${escapeHtml(correctAnswerText)}`;

    body.appendChild(qEl);
    body.appendChild(detailEl);
    row.appendChild(icon);
    row.appendChild(body);
    answersContainer.appendChild(row);
  });

  const percent = Math.round((correctCount / totalQuestions) * 100);
  const passed = percent >= 70;

  if (scoreValueEl) scoreValueEl.textContent = `${percent}%`;
  if (scoreFractionEl) scoreFractionEl.textContent = `${correctCount} / ${totalQuestions} correct`;
  if (scoreBadgeEl) {
    scoreBadgeEl.textContent = passed ? 'Passed' : 'Not Passed';
    scoreBadgeEl.className = `badge ${passed ? 'badge-success' : 'badge-danger'}`;
  }

  const dateEl = document.getElementById('quiz-result-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// PRINT / SAVE AS PDF

function initQuizPrint() {
  document.getElementById('print-result-btn')?.addEventListener('click', () => {
    window.print();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initQuiz();
  initQuizPrint();
});