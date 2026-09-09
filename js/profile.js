// PASSWORD VISIBILITY TOGGLE — SVG based, no emoji

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

// PROFILE — personal info + password forms

function initProfileInfoForm() {
  const form = document.getElementById('profile-info-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Profile updated.', 'success');
  });
}

function initProfilePasswordForm() {
  const form = document.getElementById('profile-password-form');
  if (!form) return;

  const currentInput = document.getElementById('current-password');
  const newInput = document.getElementById('new-password');
  const confirmInput = document.getElementById('confirm-new-password');

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

  form.addEventListener('submit', (e) => {
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

    showToast('Password updated.', 'success');
    form.reset();
  });
}

function initAvatarEditButton() {
  document.getElementById('edit-avatar-btn')?.addEventListener('click', () => {
    showToast('Avatar upload will be available once accounts are connected.', 'info');
  });
}

// SETTINGS — preferences save + danger zone

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

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggleIcons();
  initProfileInfoForm();
  initProfilePasswordForm();
  initAvatarEditButton();
  initSettingsForm();
  initDangerZone();
});