// DASHBOARD SHELL — sidebar toggle + active link

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

  // Close sidebar on nav link click (mobile)
  sidebar.querySelectorAll('.dashboard-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 900) closeSidebar();
    });
  });
}

// ORBIT PROGRESS RING — animates the stroke-dashoffset in on load

function initOrbitRing() {
  const ring = document.querySelector('.orbit-ring-progress');
  if (!ring) return;

  const percent = parseFloat(ring.dataset.percent || '0');
  const circumference = parseFloat(ring.getAttribute('stroke-dasharray')) || 345.6;
  const offset = circumference - (percent / 100) * circumference;

  // Delay slightly so the transition is visible on load
  requestAnimationFrame(() => {
    setTimeout(() => {
      ring.style.strokeDashoffset = offset;
    }, 150);
  });

  const percentLabel = document.querySelector('.orbit-ring-percent');
  if (percentLabel) percentLabel.textContent = `${Math.round(percent)}%`;
}

// LOGOUT (demo — no backend yet)

function initLogout() {
  document.querySelectorAll('.dashboard-logout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('Logged out. Redirecting to login...', 'info');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 900);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initDashboardSidebar();
  initOrbitRing();
  initLogout();
});