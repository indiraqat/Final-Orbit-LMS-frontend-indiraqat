// MY COURSES — live enrolled courses, real IDs, working filters/search

const COURSE_ICONS = [
  '<path stroke-linecap="round" stroke-linejoin="round" d="M17 20.25v-1.5a3 3 0 00-3-3H8a3 3 0 00-3 3v1.5M12.5 9.75a3 3 0 10-3-3 3 3 0 003 3zM19.5 20.25v-1.5a3 3 0 00-2-2.83M16 5.13a3 3 0 010 5.74"/>',
  '<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9l-3.75 3 3.75 3M15.75 9l3.75 3-3.75 3M13.5 6l-3 12"/>',
  '<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3.75h5.19a1.5 1.5 0 011.06.44l3.06 3.06a1.5 1.5 0 01.44 1.06V18.75A2.25 2.25 0 0115.75 21h-7.5a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 018.25 3.75z M9 12h6M9 15.75h6"/>',
];
const COURSE_THUMB_CLASSES = ['indigo', 'cyan', 'green'];

document.addEventListener('DOMContentLoaded', loadCourses);

async function loadCourses() {
  const grid = document.querySelector('.dashboard-courses-grid');
  if (!grid || !window.currentUser) return;

  grid.innerHTML = `<p style="color:var(--color-gray-500);">Loading your courses...</p>`;

  try {
    const [{ data: catalog }, { data: progress }] = await Promise.all([
      apiFetch('/courses'),
      apiFetch(`/users/${window.currentUser.id}/progress`),
    ]);

    const progressById = new Map(progress.map(p => [p.id, p]));
    const enrolled = catalog
      .filter(c => progressById.has(c.id))
      .map(c => ({ ...c, ...progressById.get(c.id) }));

    renderCourses(enrolled);
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--color-danger);">Couldn't load your courses: ${escapeHtml(err.message)}</p>`;
    showToast('Failed to load courses.', 'danger');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function statusFor(percent) {
  if (percent === 100) return 'completed';
  if (percent > 0) return 'in-progress';
  return 'not-started';
}

function buttonLabelFor(status) {
  if (status === 'completed') return 'Review';
  if (status === 'in-progress') return 'Continue';
  return 'Start';
}

function renderCourses(courses) {
  const grid = document.querySelector('.dashboard-courses-grid');
  if (!grid) return;

  if (!courses.length) {
    grid.innerHTML = `<p style="color:var(--color-gray-500);">You're not enrolled in any courses yet. Ask your mentor to enroll you.</p>`;
    return;
  }

  grid.innerHTML = courses.map((course, i) => {
    const status = statusFor(course.percent);
    const thumbClass = COURSE_THUMB_CLASSES[i % COURSE_THUMB_CLASSES.length];
    const icon = COURSE_ICONS[i % COURSE_ICONS.length];
    const btnClass = status === 'not-started' ? 'btn-primary' : status === 'completed' ? 'btn-secondary' : 'btn-primary';

    return `
      <article class="course-card" data-status="${status}">
        <div class="course-card-thumb ${thumbClass}">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${icon}</svg>
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
          <a href="course-detail.html?id=${encodeURIComponent(course.id)}" class="btn ${btnClass} btn-sm btn-block">${buttonLabelFor(status)}</a>
        </div>
      </article>
    `;
  }).join('');

  wireFilters();
}

function wireFilters() {
  const tabs = document.querySelectorAll('.course-filter-tab');
  const searchInput = document.querySelector('.course-search-input');
  let activeStatus = 'all';

  function applyFilters() {
    const query = (searchInput?.value || '').trim().toLowerCase();
    document.querySelectorAll('.course-card[data-status]').forEach(card => {
      const status = card.dataset.status;
      const title = card.querySelector('.course-card-title')?.textContent.toLowerCase() || '';
      const statusMatch = activeStatus === 'all' || status === activeStatus;
      const searchMatch = !query || title.includes(query);
      card.classList.toggle('is-hidden', !(statusMatch && searchMatch));
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