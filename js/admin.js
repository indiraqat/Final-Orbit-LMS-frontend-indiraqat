// GENERIC MODAL SYSTEM — shared by every admin page that uses a modal
// (manage-courses.html, manage-course-modules.html). Page-specific CRUD
// logic lives in its own script (admin-courses.js, admin-course-modules.js)
// and calls openModal()/closeModal() from here.

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

document.addEventListener('DOMContentLoaded', initModals);