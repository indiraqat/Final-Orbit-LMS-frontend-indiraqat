// QUIZZES LIST — filter tabs + search over table rows

function initQuizListFilters() {
  const tabs = document.querySelectorAll('.quiz-list-tab');
  const searchInput = document.querySelector('.quiz-search-input');
  const rows = document.querySelectorAll('.quiz-list-row[data-status]');

  if (!tabs.length && !searchInput) return;

  let activeStatus = 'all';

  function applyFilters() {
    const query = (searchInput?.value || '').trim().toLowerCase();

    rows.forEach(row => {
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

document.addEventListener('DOMContentLoaded', initQuizListFilters);