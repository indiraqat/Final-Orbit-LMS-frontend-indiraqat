// MANAGE MODULES (admin) — reads ?courseId= from the URL, loads that
// course's real modules, and wires up real create/edit/delete.

document.addEventListener('DOMContentLoaded', loadModules);

function getCourseIdFromUrl() {
  return new URLSearchParams(window.location.search).get('courseId');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

let currentCourseId = null;
let currentModules = [];

async function loadModules() {
  currentCourseId = getCourseIdFromUrl();
  const main = document.querySelector('.dashboard-content');
  const list = document.querySelector('.module-manage-list');

  if (!currentCourseId) {
    if (main) main.innerHTML = `<p style="color:var(--color-danger);">No course was specified. <a href="manage-courses.html">Back to Manage Courses</a></p>`;
    return;
  }

  if (list) list.innerHTML = `<p style="color:var(--color-gray-500);">Loading modules...</p>`;

  try {
    const { data: course } = await apiFetch(`/courses/${currentCourseId}`);
    currentModules = course.modules;
    renderHeader(course);
    renderModules(course.modules);
    document.title = `Manage Modules — ${course.title} — Orbit LMS`;
  } catch (err) {
    if (main) main.innerHTML = `<p style="color:var(--color-danger);">Couldn't load this course: ${escapeHtml(err.message)}</p>`;
    showToast('Failed to load course.', 'danger');
  }
}

function renderHeader(course) {
  const titleEl = document.querySelector('.manage-course-title');
  const metaEl = document.querySelector('.manage-course-meta');
  if (titleEl) titleEl.textContent = course.title;
  if (metaEl) metaEl.textContent = `${course.category} · ${course.modules.length} module${course.modules.length === 1 ? '' : 's'}`;
}

function renderModules(modules) {
  const list = document.querySelector('.module-manage-list');
  if (!list) return;

  const rowsHtml = modules.map((module, i) => {
    const materialCount = module.materials.length;
    const quizLabel = module.quiz ? '1 quiz' : 'no quiz';
    const statusLabel = module.published ? 'Published' : 'Draft';

    return `
      <div class="module-manage-row" data-module-id="${module.id}">
        <span class="module-manage-number">${i + 1}</span>
        <div class="module-manage-info">
          <div class="module-manage-title">${escapeHtml(module.title)}</div>
          <div class="module-manage-meta">${materialCount} material${materialCount === 1 ? '' : 's'} · ${quizLabel} · ${statusLabel}</div>
        </div>
        <div class="module-manage-actions">
          <button type="button" class="icon-btn edit-module-btn" data-module-id="${module.id}" aria-label="Edit module">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
          </button>
          <a href="module-editor.html?moduleId=${module.id}" class="icon-btn" aria-label="Edit module content (materials &amp; quiz)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3.75h5.19a1.5 1.5 0 011.06.44l3.06 3.06a1.5 1.5 0 01.44 1.06V18.75A2.25 2.25 0 0115.75 21h-7.5a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 018.25 3.75zM9 12h6M9 15.75h6"/></svg>
          </a>
          <button type="button" class="icon-btn danger delete-module-btn" data-module-id="${module.id}" aria-label="Delete module">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12M9.75 7.5V5.25a1.5 1.5 0 011.5-1.5h1.5a1.5 1.5 0 011.5 1.5V7.5m-7.5 0l.6 11.1a1.5 1.5 0 001.5 1.4h5.4a1.5 1.5 0 001.5-1.4l.6-11.1"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  list.innerHTML = rowsHtml + `
    <button type="button" class="add-module-row" id="add-module-btn-bottom">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
      Add Module
    </button>
  `;

  wireModuleActions();
}

function wireModuleActions() {
  const modal = document.getElementById('module-modal');
  const form = document.getElementById('module-form');
  const titleField = document.getElementById('module-modal-title');
  const nameInput = document.getElementById('module-name-input');
  const publishedInput = document.getElementById('module-published-input');

  let editingModuleId = null;

  function openCreate() {
    editingModuleId = null;
    titleField.textContent = 'Add Module';
    form.reset();
    if (publishedInput) publishedInput.checked = true;
    openModal(modal);
  }

  document.getElementById('add-module-btn')?.addEventListener('click', openCreate);
  document.getElementById('add-module-btn-bottom')?.addEventListener('click', openCreate);

  document.querySelectorAll('.edit-module-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const module = currentModules.find(m => m.id === btn.dataset.moduleId);
      if (!module) return;
      editingModuleId = module.id;
      titleField.textContent = 'Edit Module';
      nameInput.value = module.title;
      if (publishedInput) publishedInput.checked = module.published;
      openModal(modal);
    });
  });

  document.querySelectorAll('.delete-module-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const module = currentModules.find(m => m.id === btn.dataset.moduleId);
      if (!module) return;
      if (!confirm(`Delete module "${module.title}"? This also deletes its materials and quiz. This cannot be undone.`)) return;

      try {
        await apiFetch(`/modules/${module.id}`, { method: 'DELETE' });
        showToast(`Module "${module.title}" deleted.`, 'danger');
        loadModules();
      } catch (err) {
        showToast(err.message || 'Failed to delete module.', 'danger');
      }
    });
  });

  form.onsubmit = async (e) => {
    e.preventDefault();
    const payload = { title: nameInput.value.trim(), published: publishedInput?.checked ?? true };

    try {
      if (editingModuleId) {
        await apiFetch(`/modules/${editingModuleId}`, { method: 'PUT', body: payload });
        showToast('Module updated.', 'success');
      } else {
        payload.order = currentModules.length;
        await apiFetch(`/courses/${currentCourseId}/modules`, { method: 'POST', body: payload });
        showToast('Module created. Add materials and a quiz to it from the document icon.', 'success');
      }
      closeModal(modal);
      loadModules();
    } catch (err) {
      showToast(err.message || 'Failed to save module.', 'danger');
    }
  };
}