// INTERN DASHBOARD — live stats, live "current track", live "My Courses"

document.addEventListener('DOMContentLoaded', async () => {
  populateSidebarUser();
  await loadDashboardData();
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function populateSidebarUser() {
  const user = window.currentUser;
  if (!user) return;

  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  document.querySelectorAll('.dashboard-user-name').forEach(el => { el.textContent = fullName; });
  document.querySelectorAll('.dashboard-user-role').forEach(el => {
    el.textContent = `Intern${user.department ? ' — ' + user.department : ''}`;
  });
  document.querySelectorAll('[data-user-avatar]').forEach(el => { el.textContent = initials; });

  const heading = document.querySelector('.dashboard-welcome-heading');
  if (heading) heading.textContent = `Welcome back, ${user.firstName}`;
}

async function loadDashboardData() {
  try {
    const [{ data: progressCourses }, { data: catalog }] = await Promise.all([
      apiFetch(`/users/${window.currentUser.id}/progress`),
      apiFetch('/courses'),
    ]);

    const catalogById = new Map(catalog.map(c => [c.id, c]));
    const courses = progressCourses.map(c => ({ ...c, category: catalogById.get(c.id)?.category || '' }));

    renderStats(courses);
    renderOrbitRing(courses);
    renderCurrentTrack(courses);
    renderMyCourses(courses);
  } catch (err) {
    showToast(err.message || 'Failed to load your dashboard.', 'danger');
  }
}

// --- STATS -------------------------------------------------------------

function renderStats(courses) {
  const allModules = courses.flatMap(c => c.modules);
  const allMaterials = allModules.flatMap(m => m.materials);
  const allQuizzes = allModules.map(m => m.quiz).filter(Boolean);

  const modulesCompleted = allModules.filter(m => m.percent === 100).length;
  const quizzesPassed = allQuizzes.filter(q => q.passed).length;
  const materialsCompleted = allMaterials.filter(m => m.completed).length;

  setStat('stat-enrolled-courses', courses.length);
  setStat('stat-modules-completed', `${modulesCompleted} / ${allModules.length}`);
  setStat('stat-quizzes-passed', `${quizzesPassed} / ${allQuizzes.length}`);
  setStat('stat-materials-completed', `${materialsCompleted} / ${allMaterials.length}`);
}

function setStat(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// --- ORBIT RING (overall progress across all enrolled courses) --------

function renderOrbitRing(courses) {
  const totalItems = courses.reduce((sum, c) => sum + c.totalItems, 0);
  const completedItems = courses.reduce((sum, c) => sum + c.completedItems, 0);
  const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const ring = document.querySelector('.orbit-ring-progress');
  const percentLabel = document.querySelector('.orbit-ring-percent');
  if (!ring) return;

  ring.dataset.percent = percent;
  const circumference = parseFloat(ring.getAttribute('stroke-dasharray')) || 345.6;
  const offset = circumference - (percent / 100) * circumference;
  requestAnimationFrame(() => setTimeout(() => { ring.style.strokeDashoffset = offset; }, 150));
  if (percentLabel) percentLabel.textContent = `${percent}%`;
}

// --- CURRENT TRACK (the enrolled course most worth showing right now) -

function pickPrimaryCourse(courses) {
  return courses.find(c => c.percent > 0 && c.percent < 100) || courses[0] || null;
}

function renderCurrentTrack(courses) {
  const trackCard = document.querySelector('.track-card');
  if (!trackCard) return;

  const course = pickPrimaryCourse(courses);
  if (!course) {
    trackCard.innerHTML = `<p style="color:var(--color-gray-500);">You're not enrolled in any courses yet.</p>`;
    return;
  }

  const titleEl = trackCard.querySelector('.dashboard-section-title');
  if (titleEl) titleEl.textContent = course.title;

  const rowsHtml = course.modules.map((module, index) => {
    const previousDone = index === 0 || course.modules[index - 1].percent === 100;
    const locked = !previousDone;
    const dotClass = locked ? 'pending' : module.percent === 100 ? 'done' : 'active';

    return `
      <a href="course-detail.html?id=${course.id}" class="track-module-row ${dotClass === 'active' ? 'is-active' : ''}">
        <span class="hero-module-dot ${dotClass}"></span>
        <span class="track-module-text">${escapeHtml(module.title)}</span>
        <span class="track-module-meta">${module.completedItems} / ${module.totalItems} items · ${locked ? 'Locked' : module.percent + '%'}</span>
      </a>
    `;
  }).join('');

  trackCard.querySelectorAll('.track-module-row').forEach(el => el.remove());
  trackCard.insertAdjacentHTML('beforeend', rowsHtml);
}

// --- MY COURSES (same card style as the full My Courses page) ---------

const COURSE_THUMB_CLASSES = ['indigo', 'cyan', 'green'];
const COURSE_ICONS = [
  '<path stroke-linecap="round" stroke-linejoin="round" d="M17 20.25v-1.5a3 3 0 00-3-3H8a3 3 0 00-3 3v1.5M12.5 9.75a3 3 0 10-3-3 3 3 0 003 3zM19.5 20.25v-1.5a3 3 0 00-2-2.83M16 5.13a3 3 0 010 5.74"/>',
  '<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9l-3.75 3 3.75 3M15.75 9l3.75 3-3.75 3M13.5 6l-3 12"/>',
  '<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3.75h5.19a1.5 1.5 0 011.06.44l3.06 3.06a1.5 1.5 0 01.44 1.06V18.75A2.25 2.25 0 0115.75 21h-7.5a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 018.25 3.75z M9 12h6M9 15.75h6"/>',
];

function buttonLabelFor(percent) {
  if (percent === 100) return 'Review';
  if (percent > 0) return 'Continue';
  return 'Start';
}

function renderMyCourses(courses) {
  const grid = document.querySelector('.dashboard-courses-grid');
  if (!grid) return;

  if (!courses.length) {
    grid.innerHTML = `<p style="color:var(--color-gray-500);">You're not enrolled in any courses yet.</p>`;
    return;
  }

  grid.innerHTML = courses.map((course, i) => `
    <article class="course-card">
      <div class="course-card-thumb ${COURSE_THUMB_CLASSES[i % 3]}">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${COURSE_ICONS[i % 3]}</svg>
      </div>
      <div class="course-card-body">
        <div class="course-card-category">${escapeHtml(course.category)}</div>
        <h3 class="course-card-title">${escapeHtml(course.title)}</h3>
        <div class="course-progress-wrap">
          <div class="course-progress-label">
            <span>${course.completedItems} / ${course.totalItems} items</span>
            <span>${course.percent}%</span>
          </div>
          <div class="progress"><div class="progress-bar" style="width:${course.percent}%"></div></div>
        </div>
        <a href="course-detail.html?id=${course.id}" class="btn btn-primary btn-sm btn-block">${buttonLabelFor(course.percent)}</a>
      </div>
    </article>
  `).join('');
}