// PROFILE + SETTINGS 

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggleIcons();
  fixSidebarNavForRole();
  populateSidebarUser();
  loadProfileIfPresent();
  initProfileInfoForm();
  initProfilePasswordForm();
  initAvatarEditButton();
  initSettingsForm();
  initDangerZone();
});

function fixSidebarNavForRole() {
  const user = window.currentUser;
  if (!user) return;

  const dashboardLink = document.querySelector('.dashboard-nav-link[href="user-dashboard.html"], .dashboard-nav-link[href="admin-dashboard.html"]');
  const coursesLink = document.querySelector('.dashboard-nav-link[href="courses.html"]');
  const quizzesLink = document.querySelector('.dashboard-nav-link[href="quizzes.html"]');

  if (user.role === 'ADMIN') {
    if (dashboardLink) dashboardLink.href = 'admin-dashboard.html';
    coursesLink?.remove();
    quizzesLink?.remove();

    if (dashboardLink && !document.querySelector('.dashboard-nav-link[href="manage-courses.html"]')) {
      const manageCoursesLink = document.createElement('a');
      manageCoursesLink.href = 'manage-courses.html';
      manageCoursesLink.className = 'dashboard-nav-link';
      manageCoursesLink.innerHTML = `
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75C10.5 5.25 8 4.5 5.25 4.5v13.5c2.75 0 5.25.75 6.75 2.25 1.5-1.5 4-2.25 6.75-2.25V4.5c-2.75 0-5.25.75-6.75 2.25z"/></svg>
        </span>
        Manage Courses`;
      dashboardLink.insertAdjacentElement('afterend', manageCoursesLink);
    }
  } else {
    if (dashboardLink) dashboardLink.href = 'user-dashboard.html';
  }
}

function getInitials(firstName, lastName) {
  return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
}

function roleLabel(role) {
  return role === 'ADMIN' ? 'Mentor' : 'Intern';
}

// Populates the sidebar/topbar avatar + name
function populateSidebarUser() {
  const user = window.currentUser;
  if (!user) return;

  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = getInitials(user.firstName, user.lastName);

  document.querySelectorAll('.dashboard-user-name').forEach(el => { el.textContent = fullName; });
  document.querySelectorAll('.dashboard-user-role').forEach(el => {
    el.textContent = `${roleLabel(user.role)}${user.department ? ' — ' + user.department : ''}`;
  });
  document.querySelectorAll('.avatar').forEach(el => {
    // Only touch avatars showing the placeholder initials (JS/RA), not icons/other content
    if (/^[A-Z]{1,2}$/.test(el.textContent.trim())) el.textContent = initials;
  });
}

// --- PROFILE PAGE ONLY ---------------------------------------------------

async function loadProfileIfPresent() {
  const header = document.querySelector('.profile-header-card');
  if (!header) return; // this is settings.html, not profile.html

  const user = window.currentUser;
  if (!user) return;

  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = getInitials(user.firstName, user.lastName);

  const nameEl = document.querySelector('.profile-header-name');
  const roleEl = document.querySelector('.profile-header-role');
  const avatarEls = header.querySelectorAll('.avatar');
  if (nameEl) nameEl.textContent = fullName;
  if (roleEl) roleEl.textContent = `${roleLabel(user.role)}${user.department ? ' · ' + user.department : ''}`;
  avatarEls.forEach(el => { el.textContent = initials; });

  if (user.createdAt) {
    const metaEl = document.querySelector('.profile-header-meta');
    const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    if (metaEl) metaEl.textContent = `Member since ${memberSince}`;
  }

  const firstNameInput = document.getElementById('profile-firstname');
  const lastNameInput = document.getElementById('profile-lastname');
  const emailInput = document.getElementById('profile-email');
  const departmentSelect = document.getElementById('profile-department');
  const roleInput = document.getElementById('profile-role');

  if (firstNameInput) firstNameInput.value = user.firstName;
  if (lastNameInput) lastNameInput.value = user.lastName;
  if (emailInput) emailInput.value = user.email;
  if (departmentSelect && user.department) {
    const match = Array.from(departmentSelect.options).find(o => o.textContent.trim().toLowerCase() === user.department.toLowerCase());
    if (match) departmentSelect.value = match.value;
  }
  if (roleInput) roleInput.value = user.role === 'ADMIN' ? 'Mentor / Admin' : 'Intern / New Employee';
}

function initProfileInfoForm() {
  const form = document.getElementById('profile-info-form');
  if (!form) return;

  const firstNameInput = document.getElementById('profile-firstname');
  const lastNameInput = document.getElementById('profile-lastname');
  const departmentSelect = document.getElementById('profile-department');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setButtonLoading(submitBtn, true);

    try {
      const { data: updatedUser } = await apiFetch(`/users/${window.currentUser.id}`, {
        method: 'PUT',
        body: {
          firstName: firstNameInput.value.trim(),
          lastName: lastNameInput.value.trim(),
          department: departmentSelect?.options[departmentSelect.selectedIndex]?.textContent.trim(),
        },
      });

      // Keep the local session in sync with what was just saved
      setSession(getToken(), { ...window.currentUser, ...updatedUser });
      window.currentUser = { ...window.currentUser, ...updatedUser };
      populateSidebarUser();

      showToast('Profile updated.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'danger');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

function initProfilePasswordForm() {
  const form = document.getElementById('profile-password-form');
  if (!form) return;

  const currentInput = document.getElementById('current-password');
  const newInput = document.getElementById('new-password');
  const confirmInput = document.getElementById('confirm-new-password');
  const submitBtn = form.querySelector('button[type="submit"]');

  newInput?.addEventListener('input', () => {
    clearFieldError(newInput);
    const val = newInput.value;
    if (val.length > 0 && val.length < 8) {
      showFieldError(newInput, 'Password must be at least 8 characters.');
    } else if (val.length >= 8) {
      markFieldSuccess(newInput);
    }
  });

  confirmInput?.addEventListener('input', () => {
    clearFieldError(confirmInput);
    if (confirmInput.value && !Validate.passwordMatch(newInput.value, confirmInput.value)) {
      showFieldError(confirmInput, 'Passwords do not match.');
    } else if (confirmInput.value) {
      markFieldSuccess(confirmInput);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isValid = true;
    if (!Validate.required(currentInput?.value || '')) {
      showFieldError(currentInput, 'Enter your current password.');
      isValid = false;
    }
    if (!Validate.minLength(newInput?.value || '', 8)) {
      showFieldError(newInput, 'Password must be at least 8 characters.');
      isValid = false;
    }
    if (!Validate.passwordMatch(newInput?.value, confirmInput?.value)) {
      showFieldError(confirmInput, 'Passwords do not match.');
      isValid = false;
    }
    if (!isValid) return;

    setButtonLoading(submitBtn, true);
    try {
      await apiFetch(`/users/${window.currentUser.id}`, {
        method: 'PUT',
        body: { password: newInput.value },
      });

      showToast('Password updated.', 'success');
      form.reset();
    } catch (err) {
      showToast(err.message || 'Failed to update password.', 'danger');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

function initAvatarEditButton() {
  document.getElementById('edit-avatar-btn')?.addEventListener('click', () => {
    showToast('Avatar upload will be available once file uploads are supported.', 'info');
  });
}

// --- SETTINGS PAGE ONLY ---------------------------------------------------

function initSettingsForm() {
  const form = document.getElementById('settings-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Settings saved.', 'success');
  });
}

function initDangerZone() {
  document.getElementById('deactivate-account-btn')?.addEventListener('click', () => {
    showToast('Please contact your admin to deactivate your account.', 'info');
  });
}

// --- SHARED: password visibility toggle -----------

function initPasswordToggleIcons() {
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });
}