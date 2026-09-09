// GENERIC MODAL SYSTEM

function openModal(modal) {
  if (!modal) return;
  modal.classList.add('open');
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('open');
}

function initModals() {
  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = document.getElementById(btn.dataset.modalOpen);
      openModal(modal);
    });
  });

  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(btn.closest('.modal-overlay'));
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(closeModal);
    }
  });
}

// COURSE CRUD (manage-courses.html) — demo only, not persisted after reload

function initCourseCrud() {
  const modal = document.getElementById('course-modal');
  if (!modal) return;

  const form = document.getElementById('course-form');
  const titleField = document.getElementById('course-modal-title');
  const nameInput = document.getElementById('course-name-input');
  const categoryInput = document.getElementById('course-category-input');
  const descInput = document.getElementById('course-desc-input');
  const grid = document.querySelector('.dashboard-courses-grid');
  const createTile = document.querySelector('.course-card-create');

  let editingCard = null;

  document.getElementById('new-course-btn')?.addEventListener('click', () => {
    editingCard = null;
    titleField.textContent = 'Create New Course';
    form.reset();
    openModal(modal);
  });

  createTile?.addEventListener('click', (e) => {
    e.preventDefault();
    editingCard = null;
    titleField.textContent = 'Create New Course';
    form.reset();
    openModal(modal);
  });

  document.querySelectorAll('.edit-course-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      editingCard = btn.closest('.course-card');
      titleField.textContent = 'Edit Course';
      nameInput.value = editingCard.querySelector('.course-card-title')?.textContent.trim() || '';
      categoryInput.value = editingCard.querySelector('.course-card-category')?.textContent.trim() || '';
      descInput.value = '';
      openModal(modal);
    });
  });

  document.querySelectorAll('.delete-course-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.course-card');
      const name = card.querySelector('.course-card-title')?.textContent.trim();
      if (confirm(`Delete "${name}"? This cannot be undone.`)) {
        card.remove();
        showToast(`"${name}" deleted.`, 'danger');
      }
    });
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    if (editingCard) {
      editingCard.querySelector('.course-card-title').textContent = nameInput.value;
      editingCard.querySelector('.course-card-category').textContent = categoryInput.value;
      showToast('Course updated.', 'success');
    } else {
      showToast('Course created. (Demo only — add it manually to persist.)', 'success');
    }

    closeModal(modal);
  });
}

// MODULE CRUD (manage-course-modules.html) — demo only, not persisted after reload

function initModuleCrud() {
  const modal = document.getElementById('module-modal');
  if (!modal) return;

  const form = document.getElementById('module-form');
  const titleField = document.getElementById('module-modal-title');
  const nameInput = document.getElementById('module-name-input');
  const materialsInput = document.getElementById('module-materials-input');
  const quizzesInput = document.getElementById('module-quizzes-input');
  const publishedInput = document.getElementById('module-published-input');

  let editingRow = null;

  document.getElementById('add-module-btn')?.addEventListener('click', () => {
    editingRow = null;
    titleField.textContent = 'Add Module';
    form.reset();
    if (publishedInput) publishedInput.checked = true;
    openModal(modal);
  });

  function wireRowButtons() {
    document.querySelectorAll('.edit-module-btn').forEach(btn => {
      btn.onclick = () => {
        editingRow = btn.closest('.module-manage-row');
        titleField.textContent = 'Edit Module';
        nameInput.value = editingRow.querySelector('.module-manage-title')?.textContent.trim() || '';
        openModal(modal);
      };
    });

    document.querySelectorAll('.delete-module-btn').forEach(btn => {
      btn.onclick = () => {
        const row = btn.closest('.module-manage-row');
        const name = row.querySelector('.module-manage-title')?.textContent.trim();
        if (confirm(`Delete module "${name}"? This cannot be undone.`)) {
          row.remove();
          showToast(`Module "${name}" deleted.`, 'danger');
        }
      };
    });
  }

  wireRowButtons();

  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    if (editingRow) {
      editingRow.querySelector('.module-manage-title').textContent = nameInput.value;
      showToast('Module updated.', 'success');
    } else {
      showToast('Module created. (Demo only — add it manually to persist.)', 'success');
    }

    closeModal(modal);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initModals();
  initCourseCrud();
  initModuleCrud();
});