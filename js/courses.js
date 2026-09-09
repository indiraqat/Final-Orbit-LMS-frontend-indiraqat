// COURSE LIST — filter tabs + search

function initCourseFilters() {
  const tabs = document.querySelectorAll('.course-filter-tab');
  const searchInput = document.querySelector('.course-search-input');
  const cards = document.querySelectorAll('.course-card[data-status]');

  if (!tabs.length && !searchInput) return;

  let activeStatus = 'all';

  function applyFilters() {
    const query = (searchInput?.value || '').trim().toLowerCase();

    cards.forEach(card => {
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

// MODULE ACCORDION — course detail page

function initModuleAccordion() {
  const heads = document.querySelectorAll('.module-accordion-head');
  if (!heads.length) return;

  heads.forEach(head => {
    head.addEventListener('click', () => {
      const item = head.closest('.module-accordion-item');
      item?.classList.toggle('open');
      head.setAttribute('aria-expanded', item?.classList.contains('open') ? 'true' : 'false');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCourseFilters();
  initModuleAccordion();
});