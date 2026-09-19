// DASHBOARD SHELL — shared across every logged-in page: sidebar toggle,
// real user info in the sidebar, real quiz-badge count, orbit ring, logout.

document.addEventListener('DOMContentLoaded', () => {
  initDashboardSidebar();
  populateSidebarUser();
  updateQuizBadge();
  initOrbitRing();
  initLogout();
});

// SIDEBAR MOBILE TOGGLE

function initDashboardSidebar() {
  const toggle = document.querySelector('.dashboard-sidebar-toggle');
  const sidebar = document.querySelector('.dashboard-sidebar');
  const backdrop = document.querySelector('.dashboard-sidebar-backdrop');

  if (!sidebar) return;

  function closeSidebar() {
    sidebar.classList.remove('open');
    backdrop?.classList.remove('open');
  }

  toggle?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    backdrop?.classList.toggle('open');
  });

  backdrop?.addEventListener('click', closeSidebar);

  sidebar.querySelectorAll('.dashboard-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 900) closeSidebar();
    });
  });
}

// REAL SIDEBAR USER INFO — runs on every page, so nobody sees a stale
// hardcoded name/avatar just because that page's own script didn't set it.

function populateSidebarUser() {
  const user = window.currentUser;
  if (!user) return;

  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const roleLabel = user.role === 'ADMIN' ? 'Mentor' : 'Intern';

  document.querySelectorAll('.dashboard-user-name').forEach(el => { el.textContent = fullName; });
  document.querySelectorAll('.dashboard-user-role').forEach(el => {
    el.textContent = `${roleLabel}${user.department ? ' — ' + user.department : ''}`;
  });
  document.querySelectorAll('.avatar').forEach(el => {
    // Only overwrite avatars still showing placeholder initials (e.g. "JS"),
    // not icons or other content that might also carry the .avatar class.
    if (/^[A-Z]{1,2}$/.test(el.textContent.trim())) el.textContent = initials;
  });

  const welcomeHeading = document.querySelector('.dashboard-welcome-heading');
  if (welcomeHeading && welcomeHeading.textContent.includes('Welcome back')) {
    welcomeHeading.textContent = `Welcome back, ${user.firstName}`;
  }
}

// REAL QUIZ BADGE — only meaningful for interns; computes how many quizzes
// are actually available to THIS user, instead of a hardcoded "2".

async function updateQuizBadge() {
  const user = window.currentUser;
  const badges = document.querySelectorAll('.dashboard-nav-badge');
  if (!user || user.role !== 'INTERN' || !badges.length) return;

  try {
    const { data: courses } = await apiFetch(`/users/${user.id}/progress`);
    let availableCount = 0;

    courses.forEach(course => {
      course.modules.forEach((module, index) => {
        if (!module.quiz) return;
        const previousDone = index === 0 || course.modules[index - 1].percent === 100;
        if (previousDone && !module.quiz.attempted) availableCount++;
      });
    });

    badges.forEach(el => { el.textContent = availableCount; });
  } catch {
    // Non-critical — leave the badge as-is if this fails, don't block the page
  }
}

// ORBIT PROGRESS RING — animates the stroke-dashoffset in on load (if present)

function initOrbitRing() {
  const ring = document.querySelector('.orbit-ring-progress');
  if (!ring) return;

  const percent = parseFloat(ring.dataset.percent || '0');
  const circumference = parseFloat(ring.getAttribute('stroke-dasharray')) || 345.6;
  const offset = circumference - (percent / 100) * circumference;

  requestAnimationFrame(() => {
    setTimeout(() => {
      ring.style.strokeDashoffset = offset;
    }, 150);
  });

  const percentLabel = document.querySelector('.orbit-ring-percent');
  if (percentLabel) percentLabel.textContent = `${Math.round(percent)}%`;
}

// LOGOUT — clears the real session (requires api.js loaded before this file)

function initLogout() {
  document.querySelectorAll('.dashboard-logout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('Logged out. Redirecting to login...', 'info');
      setTimeout(() => {
        if (typeof clearSession === 'function') clearSession();
        window.location.href = 'login.html';
      }, 700);
    });
  });
}