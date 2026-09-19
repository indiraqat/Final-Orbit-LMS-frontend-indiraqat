// ADMIN DASHBOARD — role guard + live data from the API

document.addEventListener('DOMContentLoaded', async () => {
  guardAdminRole();
  populateSidebarUser();
  await loadDashboardData();
});

function guardAdminRole() {
  if (window.currentUser && window.currentUser.role !== 'ADMIN') {
    window.location.href = 'user-dashboard.html';
  }
}

function getInitials(firstName, lastName) {
  return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
}

function populateSidebarUser() {
  const user = window.currentUser;
  if (!user) return;

  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = getInitials(user.firstName, user.lastName);

  document.querySelectorAll('.dashboard-user-name').forEach(el => { el.textContent = fullName; });
  document.querySelectorAll('.dashboard-user-role').forEach(el => {
    el.textContent = `Mentor${user.department ? ' — ' + user.department : ''}`;
  });
  document.querySelectorAll('[data-user-avatar]').forEach(el => { el.textContent = initials; });

  const heading = document.querySelector('.dashboard-welcome-heading');
  if (heading) heading.textContent = `Welcome back, ${user.firstName}`;
}

function showDashboardError(message) {
  const banner = document.getElementById('dashboard-error-banner');
  if (!banner) return;
  banner.textContent = message;
  banner.style.display = 'flex';
}

async function loadDashboardData() {
  const totalInternsEl  = document.getElementById('stat-total-interns');
  const activeCoursesEl = document.getElementById('stat-active-courses');
  const totalModulesEl  = document.getElementById('stat-total-modules');
  const rosterBody       = document.getElementById('roster-body');

  try {
    const [coursesRes, usersRes] = await Promise.all([
      apiFetch('/courses'),
      apiFetch('/users'),
    ]);

    const courses = coursesRes.data;
    const interns = usersRes.data.filter(u => u.role === 'INTERN');

    if (activeCoursesEl) activeCoursesEl.textContent = courses.length;
    if (totalModulesEl) totalModulesEl.textContent = courses.reduce((sum, c) => sum + c.moduleCount, 0);
    if (totalInternsEl) totalInternsEl.textContent = interns.length;

    // Fetch each intern's per-course progress so we can split their
    // enrolled courses into "taken" (100%) vs "to take" (enrolled, not
    // yet finished). Courses they're not enrolled in at all don't show
    // in either column, matching how this table is meant to read.
    const rosterRows = await Promise.all(interns.map(async (intern) => {
      let progress = [];
      try {
        const progressRes = await apiFetch(`/users/${intern.id}/progress`);
        progress = progressRes.data;
      } catch {
        progress = []; // one intern's progress failing shouldn't break the whole roster
      }

      return {
        intern,
        taken: progress.filter(c => c.percent === 100).map(c => c.title),
        toTake: progress.filter(c => c.percent < 100).map(c => c.title),
      };
    }));

    renderRoster(rosterRows);
  } catch (err) {
    showDashboardError(err.message || 'Failed to load dashboard data. Please refresh the page.');
    showToast('Failed to load dashboard data.', 'danger');
    if (rosterBody) {
      rosterBody.innerHTML = `
        <tr><td colspan="3" style="text-align:center;color:var(--color-danger);padding:var(--space-6);">
          Couldn't load your team. Please refresh.
        </td></tr>`;
    }
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const AVATAR_PALETTE = [
  { bg: '#E0E7FF', color: '#3730A3' },
  { bg: '#DCFCE7', color: '#166534' },
  { bg: '#FEF3C7', color: '#92400E' },
  { bg: '#CFFAFE', color: '#0E7490' },
];

function colorForId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash << 5) - hash + id.charCodeAt(i);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function badgeListHtml(items, variant, emptyLabel) {
  if (!items.length) return `<span class="roster-empty">${emptyLabel}</span>`;
  return `<div class="roster-badges">${items.map(t => `<span class="badge ${variant}">${escapeHtml(t)}</span>`).join('')}</div>`;
}

function renderRoster(rows) {
  const rosterBody = document.getElementById('roster-body');
  if (!rosterBody) return;

  if (!rows.length) {
    rosterBody.innerHTML = `
      <tr><td colspan="3" style="text-align:center;color:var(--color-gray-500);padding:var(--space-6);">
        No interns yet.
      </td></tr>`;
    return;
  }

  rosterBody.innerHTML = rows.map(({ intern, taken, toTake }) => {
    const initials = getInitials(intern.firstName, intern.lastName);
    const colors = colorForId(intern.id);

    return `
      <tr>
        <td>
          <div class="roster-user">
            <div class="avatar avatar-sm" style="background:${colors.bg};color:${colors.color};">${initials}</div>
            <div>
              <div class="roster-user-name">${escapeHtml(intern.firstName + ' ' + intern.lastName)}</div>
              <div class="roster-user-dept">${escapeHtml(intern.department || '—')}</div>
            </div>
          </div>
        </td>
        <td>${badgeListHtml(taken, 'badge-success', 'None yet')}</td>
        <td>${badgeListHtml(toTake, 'badge-info', 'None left')}</td>
      </tr>
    `;
  }).join('');

  wireRosterSearch(rows);
}

function wireRosterSearch(rows) {
  const searchInput = document.getElementById('roster-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    document.querySelectorAll('#roster-body tr').forEach((row, i) => {
      const name = `${rows[i]?.intern.firstName} ${rows[i]?.intern.lastName}`.toLowerCase();
      row.style.display = !query || name.includes(query) ? '' : 'none';
    });
  });
}