// QUIZZES LIST 

document.addEventListener('DOMContentLoaded', loadQuizzes);

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadQuizzes() {
  const tbody = document.querySelector('.data-table tbody');
  if (!tbody || !window.currentUser) return;

  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--color-gray-500);padding:var(--space-6);">Loading quizzes...</td></tr>`;

  try {
    const { data: courses } = await apiFetch(`/users/${window.currentUser.id}/progress`);
    const rows = flattenQuizzes(courses);
    renderQuizzes(rows);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--color-danger);padding:var(--space-6);">Couldn't load quizzes: ${escapeHtml(err.message)}</td></tr>`;
    showToast('Failed to load quizzes.', 'danger');
  }
}

function flattenQuizzes(courses) {
  const rows = [];

  courses.forEach(course => {
    course.modules.forEach((module, index) => {
      if (!module.quiz) return;

      const previousDone = index === 0 || course.modules[index - 1].percent === 100;
      const locked = !previousDone;
      const quiz = module.quiz;

      let status;
      if (locked) status = 'locked';
      else if (quiz.passed) status = 'passed';
      else if (quiz.attempted) status = 'not-passed';
      else status = 'available';

      rows.push({
        quizId: quiz.id,
        courseId: course.id,
        title: quiz.title,
        meta: `${course.title} · ${module.title}`,
        status,
        score: quiz.score,
        totalQuestions: quiz.totalQuestions,
        displayScore: quiz.attempted ? `${quiz.percent}%` : '—',
      });
    });
  });

  const availableCount = rows.filter(r => r.status === 'available').length;
  document.querySelectorAll('.dashboard-nav-badge').forEach(el => { el.textContent = availableCount; });

  return rows;
}

const STATUS_BADGE = {
  passed: '<span class="badge badge-success">Passed</span>',
  'not-passed': '<span class="badge badge-danger">Not Passed</span>',
  available: '<span class="badge badge-primary">Available</span>',
  locked: '<span class="badge badge-neutral">Locked</span>',
};

function actionHtml(row) {
  if (row.status === 'locked') {
    return `<span class="btn btn-ghost btn-sm" style="opacity:0.5;pointer-events:none;">Locked</span>`;
  }
  if (row.status === 'passed') {
    return `<a href="quiz-take.html?quizId=${row.quizId}&courseId=${row.courseId}&mode=result&score=${row.score}&total=${row.totalQuestions}&passed=true" class="btn btn-ghost btn-sm">View Result</a>`;
  }
  if (row.status === 'not-passed') {
    return `<a href="quiz-take.html?quizId=${row.quizId}&courseId=${row.courseId}" class="btn btn-primary btn-sm">Retake Quiz</a>`;
  }
  return `<a href="quiz-take.html?quizId=${row.quizId}&courseId=${row.courseId}" class="btn btn-primary btn-sm">Take Quiz</a>`;
}

function renderQuizzes(rows) {
  const tbody = document.querySelector('.data-table tbody');
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--color-gray-500);padding:var(--space-6);">No quizzes yet — enroll in a course to get started.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(row => `
    <tr class="quiz-list-row" data-status="${row.status}">
      <td><span class="quiz-list-title">${escapeHtml(row.title)}</span></td>
      <td><span class="quiz-list-meta">${escapeHtml(row.meta)}</span></td>
      <td>${STATUS_BADGE[row.status]}</td>
      <td>${row.displayScore}</td>
      <td>${actionHtml(row)}</td>
    </tr>
  `).join('');

  wireFilters();
}

function wireFilters() {
  const tabs = document.querySelectorAll('.quiz-list-tab');
  const searchInput = document.querySelector('.quiz-search-input');
  let activeStatus = 'all';

  function applyFilters() {
    const query = (searchInput?.value || '').trim().toLowerCase();
    document.querySelectorAll('.quiz-list-row[data-status]').forEach(row => {
      const status = row.dataset.status;
      const title = row.querySelector('.quiz-list-title')?.textContent.toLowerCase() || '';
      const statusMatch = activeStatus === 'all' || status === activeStatus;
      const searchMatch = !query || title.includes(query);
      row.classList.toggle('is-hidden', !(statusMatch && searchMatch));
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeStatus = tab.dataset.filter || 'all';
      applyFilters();
    });
  });

  searchInput?.addEventListener('input', applyFilters);
}