// MANAGE COURSES (admin) — live course list, real IDs, real CRUD.

document.addEventListener('DOMContentLoaded', loadCourses);

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const THUMB_CLASSES = ['indigo', 'cyan', 'green'];
const THUMB_ICONS = [
  '<path stroke-linecap="round" stroke-linejoin="round" d="M17 20.25v-1.5a3 3 0 00-3-3H8a3 3 0 00-3 3v1.5M12.5 9.75a3 3 0 10-3-3 3 3 0 003 3zM19.5 20.25v-1.5a3 3 0 00-2-2.83M16 5.13a3 3 0 010 5.74"/>',
  '<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9l-3.75 3 3.75 3M15.75 9l3.75 3-3.75 3M13.5 6l-3 12"/>',
  '<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3.75h5.19a1.5 1.5 0 011.06.44l3.06 3.06a1.5 1.5 0 01.44 1.06V18.75A2.25 2.25 0 0115.75 21h-7.5a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 018.25 3.75z M9 12h6M9 15.75h6"/>',
];

let currentCourses = [];

async function loadCourses() {
  const grid = document.querySelector('.dashboard-courses-grid');
  if (!grid) return;

  grid.innerHTML = `<p style="color:var(--color-gray-500);">Loading courses...</p>`;

  try {
    const { data: courses } = await apiFetch('/courses');
    currentCourses = courses;
    renderCourses(courses);
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--color-danger);">Couldn't load courses: ${escapeHtml(err.message)}</p>`;
    showToast('Failed to load courses.', 'danger');
  }
}

function renderCourses(courses) {
  const grid = document.querySelector('.dashboard-courses-grid');
  if (!grid) return;

  const cardsHtml = courses.map((course, i) => `
    <article class="course-card" data-course-id="${course.id}">
      <div class="course-card-thumb ${THUMB_CLASSES[i % 3]}">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${THUMB_ICONS[i % 3]}</svg>
      </div>
      <div class="course-card-body">
        <div class="course-card-category">${escapeHtml(course.category)}</div>
        <h3 class="course-card-title">${escapeHtml(course.title)}</h3>
        <div class="course-manage-stats" style="padding:0;margin-bottom:var(--space-4);">
          <span><strong>${course.moduleCount}</strong> modules</span>
        </div>
        <div style="display:flex;gap:var(--space-2);">
          <a href="manage-course-modules.html?courseId=${course.id}" class="btn btn-primary btn-sm" style="flex:1;">Manage Modules</a>
          <button type="button" class="icon-btn edit-course-btn" data-course-id="${course.id}" aria-label="Edit course">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
          </button>
          <button type="button" class="icon-btn danger delete-course-btn" data-course-id="${course.id}" aria-label="Delete course">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12M9.75 7.5V5.25a1.5 1.5 0 011.5-1.5h1.5a1.5 1.5 0 011.5 1.5V7.5m-7.5 0l.6 11.1a1.5 1.5 0 001.5 1.4h5.4a1.5 1.5 0 001.5-1.4l.6-11.1"/></svg>
          </button>
        </div>
      </div>
    </article>
  `).join('');

  grid.innerHTML = cardsHtml + `
    <a href="#" class="course-card course-card-create" id="create-course-tile">
      <span class="course-card-create-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
      </span>
      Create New Course
    </a>
  `;

  wireCourseActions();
}

function wireCourseActions() {
  const modal = document.getElementById('course-modal');
  const form = document.getElementById('course-form');
  const titleField = document.getElementById('course-modal-title');
  const nameInput = document.getElementById('course-name-input');
  const categoryInput = document.getElementById('course-category-input');
  const descInput = document.getElementById('course-desc-input');

  let editingCourseId = null;

  function openCreate() {
    editingCourseId = null;
    titleField.textContent = 'Create New Course';
    form.reset();
    openModal(modal);
  }

  document.getElementById('new-course-btn')?.addEventListener('click', openCreate);
  document.getElementById('create-course-tile')?.addEventListener('click', (e) => { e.preventDefault(); openCreate(); });

  document.querySelectorAll('.edit-course-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const course = currentCourses.find(c => c.id === btn.dataset.courseId);
      if (!course) return;
      editingCourseId = course.id;
      titleField.textContent = 'Edit Course';
      nameInput.value = course.title;
      categoryInput.value = course.category;
      descInput.value = course.description || '';
      openModal(modal);
    });
  });

  document.querySelectorAll('.delete-course-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const course = currentCourses.find(c => c.id === btn.dataset.courseId);
      if (!course) return;
      if (!confirm(`Delete "${course.title}"? This also deletes all its modules, materials, and quizzes. This cannot be undone.`)) return;

      try {
        await apiFetch(`/courses/${course.id}`, { method: 'DELETE' });
        showToast(`"${course.title}" deleted.`, 'danger');
        loadCourses();
      } catch (err) {
        showToast(err.message || 'Failed to delete course.', 'danger');
      }
    });
  });

  form.onsubmit = async (e) => {
    e.preventDefault();
    const payload = { title: nameInput.value.trim(), category: categoryInput.value, description: descInput.value.trim() };

    try {
      if (editingCourseId) {
        await apiFetch(`/courses/${editingCourseId}`, { method: 'PUT', body: payload });
        showToast('Course updated.', 'success');
      } else {
        await apiFetch('/courses', { method: 'POST', body: payload });
        showToast('Course created.', 'success');
      }
      closeModal(modal);
      loadCourses();
    } catch (err) {
      showToast(err.message || 'Failed to save course.', 'danger');
    }
  };
}