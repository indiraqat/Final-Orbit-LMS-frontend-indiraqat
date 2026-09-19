// COURSE DETAIL — reads ?id= from the URL, loads real module/material/quiz
// data with this user's real completion status, and wires up every action.

document.addEventListener('DOMContentLoaded', loadCourseDetail);

function getCourseIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadCourseDetail() {
  const courseId = getCourseIdFromUrl();
  const main = document.querySelector('.dashboard-content');

  if (!courseId) {
    if (main) main.innerHTML = `<p style="color:var(--color-danger);">No course was specified. <a href="courses.html">Back to My Courses</a></p>`;
    return;
  }

  try {
    const [{ data: course }, { data: progressCourses }] = await Promise.all([
      apiFetch(`/courses/${courseId}`),
      apiFetch(`/users/${window.currentUser.id}/progress`),
    ]);

    const progress = progressCourses.find(c => c.id === courseId);
    if (!progress) {
      if (main) main.innerHTML = `<p style="color:var(--color-danger);">You're not enrolled in this course. <a href="courses.html">Back to My Courses</a></p>`;
      return;
    }

    renderCourseHeader(course, progress);
    renderModules(progress.modules, courseId);
    document.title = `${course.title} — Orbit LMS`;
  } catch (err) {
    if (main) main.innerHTML = `<p style="color:var(--color-danger);">Couldn't load this course: ${escapeHtml(err.message)}</p>`;
    showToast('Failed to load course.', 'danger');
  }
}

function renderCourseHeader(course, progress) {
  const categoryEl = document.querySelector('.course-card-category');
  const titleEl = document.querySelector('.course-detail-title');
  const descEl = document.querySelector('.course-detail-desc');
  const pctEl = document.querySelector('.course-detail-progress-pct');
  const labelEl = document.querySelector('.course-detail-progress-label');
  const barEl = document.querySelector('.course-detail-header .progress-bar');

  if (categoryEl) categoryEl.textContent = course.category;
  if (titleEl) titleEl.textContent = course.title;
  if (descEl) descEl.textContent = course.description || '';
  if (pctEl) pctEl.textContent = `${progress.percent}%`;
  if (labelEl) labelEl.textContent = `${progress.completedItems} / ${progress.totalItems} items complete`;
  if (barEl) barEl.style.width = `${progress.percent}%`;
}

function materialIconSvg(type) {
  if (type === 'VIDEO_UPLOAD' || type === 'VIDEO_LINK') {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-2.36a.75.75 0 011.03.67v6.38a.75.75 0 01-1.03.67L15.75 13.5M4.5 6.75h9a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5h-9a1.5 1.5 0 01-1.5-1.5v-7.5a1.5 1.5 0 011.5-1.5z"/></svg>';
  }
  return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3.75h5.19a1.5 1.5 0 011.06.44l3.06 3.06a1.5 1.5 0 01.44 1.06V18.75A2.25 2.25 0 0115.75 21h-7.5a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 018.25 3.75zM9 12h6M9 15.75h6"/></svg>';
}

const CHECK_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
const QUIZ_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75l2 2 4-4M8.25 4.5h7.5a1.5 1.5 0 011.5 1.5v13.5a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5z"/></svg>';
const LOCK_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 10.5V7.5a4.5 4.5 0 119 0v3M6 10.5h12A1.5 1.5 0 0119.5 12v7.5A1.5 1.5 0 0118 21H6a1.5 1.5 0 01-1.5-1.5V12A1.5 1.5 0 016 10.5z"/></svg>';

function renderModules(modules, courseId) {
  const accordion = document.querySelector('.module-accordion');
  if (!accordion) return;

  accordion.innerHTML = modules.map((module, index) => {
    const previousDone = index === 0 || modules[index - 1].percent === 100;
    const locked = !previousDone;
    const state = locked ? 'locked' : (module.percent === 100 ? 'done' : 'active');
    const isOpen = !locked && (state === 'active' || index === 0);

    const itemsHtml = [
      ...module.materials.map(m => materialRowHtml(m, locked)),
      module.quiz ? quizRowHtml(module.quiz, locked, courseId) : '',
    ].join('');

    return `
      <div class="module-accordion-item ${isOpen ? 'open' : ''}">
        <button type="button" class="module-accordion-head" aria-expanded="${isOpen}">
          <span class="module-accordion-number ${state}">${index + 1}</span>
          <span class="module-accordion-info">
            <span class="module-accordion-title">${escapeHtml(module.title)}</span>
            <span class="module-accordion-meta">${module.completedItems} / ${module.totalItems} items · ${locked ? 'Locked' : module.percent + '%'}</span>
          </span>
          <svg class="module-accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="module-accordion-body">${itemsHtml}</div>
      </div>
    `;
  }).join('');

  wireAccordionToggles();
  wireMaterialButtons();
}

function materialRowHtml(material, locked) {
  const status = locked ? 'locked' : (material.completed ? 'done' : 'active');
  const icon = status === 'done' ? CHECK_ICON : status === 'locked' ? LOCK_ICON : materialIconSvg(material.type);
  const action = locked
    ? `<span class="module-item-action" style="font-size:var(--text-xs);color:var(--color-gray-400);">Locked</span>`
    : `<button type="button" class="module-item-action btn btn-ghost btn-sm review-material-btn" data-material-id="${material.id}" data-material-url="${escapeHtml(material.url || '')}">${material.completed ? 'Review' : 'Mark Complete'}</button>`;

  return `
    <div class="module-item-row ${locked ? 'is-locked' : ''}">
      <span class="module-item-status ${status}">${icon}</span>
      <span class="module-item-info">
        <span class="module-item-title">${escapeHtml(material.title)}</span>
        <span class="module-item-type">Material</span>
      </span>
      ${action}
    </div>
  `;
}

function quizRowHtml(quiz, locked, courseId) {
  const status = locked ? 'locked' : (quiz.passed ? 'done' : 'active');
  const icon = status === 'done' ? CHECK_ICON : status === 'locked' ? LOCK_ICON : QUIZ_ICON;
  const typeLabel = quiz.passed ? 'Quiz · Passed' : quiz.attempted ? 'Quiz · Not Passed' : 'Quiz';
  const courseParam = `&courseId=${courseId}`;

  let action;
  if (locked) {
    action = `<span class="module-item-action" style="font-size:var(--text-xs);color:var(--color-gray-400);">Locked</span>`;
  } else if (quiz.passed) {
    action = `<a href="quiz-take.html?quizId=${quiz.id}${courseParam}&mode=result&score=${quiz.score}&total=${quiz.totalQuestions}&passed=true" class="module-item-action btn btn-ghost btn-sm">View Result</a>`;
  } else if (quiz.attempted) {
    action = `<a href="quiz-take.html?quizId=${quiz.id}${courseParam}" class="module-item-action btn btn-primary btn-sm">Retake Quiz</a>`;
  } else {
    action = `<a href="quiz-take.html?quizId=${quiz.id}${courseParam}" class="module-item-action btn btn-primary btn-sm">Start Quiz</a>`;
  }

  return `
    <div class="module-item-row ${locked ? 'is-locked' : ''}">
      <span class="module-item-status ${status}">${icon}</span>
      <span class="module-item-info">
        <span class="module-item-title">${escapeHtml(quiz.title)}</span>
        <span class="module-item-type">${typeLabel}</span>
      </span>
      ${action}
    </div>
  `;
}

function wireAccordionToggles() {
  document.querySelectorAll('.module-accordion-head').forEach(head => {
    head.addEventListener('click', () => {
      const item = head.closest('.module-accordion-item');
      item?.classList.toggle('open');
      head.setAttribute('aria-expanded', item?.classList.contains('open') ? 'true' : 'false');
    });
  });
}

function wireMaterialButtons() {
  document.querySelectorAll('.review-material-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const materialId = btn.dataset.materialId;
      const url = btn.dataset.materialUrl;

      if (url) window.open(url, '_blank', 'noopener');

      if (btn.textContent.trim() === 'Review') return;

      btn.disabled = true;
      try {
        await apiFetch(`/materials/${materialId}/complete`, { method: 'POST' });
        showToast('Marked as complete.', 'success');
        loadCourseDetail();
      } catch (err) {
        showToast(err.message || 'Failed to mark complete.', 'danger');
        btn.disabled = false;
      }
    });
  });
}