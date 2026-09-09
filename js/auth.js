document.addEventListener('DOMContentLoaded', () => {
  initRoleSelector();
  initPasswordToggle();
  initLoginForm();
  initRegisterForm();
});

// ROLE SELECTOR (Register page)

function initRoleSelector() {
  const roleOptions = document.querySelectorAll('.role-option');
  roleOptions.forEach(option => {
    option.addEventListener('click', () => {
      roleOptions.forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      const radio = option.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });
}

// PASSWORD VISIBILITY TOGGLE

function initPasswordToggle() {
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁';
      }
    });
  });
}

// LOGIN FORM

function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const emailInput    = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const submitBtn     = document.getElementById('login-submit');
  const errorBanner   = document.getElementById('login-error');

  // Live validation on blur
  emailInput?.addEventListener('blur', () => {
    if (!Validate.required(emailInput.value)) {
      showFieldError(emailInput, 'Email is required.');
    } else if (!Validate.email(emailInput.value)) {
      showFieldError(emailInput, 'Please enter a valid email address.');
    } else {
      markFieldSuccess(emailInput);
    }
  });

  emailInput?.addEventListener('input', () => clearFieldError(emailInput));

  passwordInput?.addEventListener('blur', () => {
    if (!Validate.required(passwordInput.value)) {
      showFieldError(passwordInput, 'Password is required.');
    } else {
      markFieldSuccess(passwordInput);
    }
  });

  passwordInput?.addEventListener('input', () => clearFieldError(passwordInput));

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isValid = true;

    if (!Validate.email(emailInput.value)) {
      showFieldError(emailInput, 'Please enter a valid email address.');
      isValid = false;
    }

    if (!Validate.required(passwordInput.value)) {
      showFieldError(passwordInput, 'Password is required.');
      isValid = false;
    }

    if (!isValid) return;

    // Simulate API call
    setButtonLoading(submitBtn, true);

    setTimeout(() => {
      setButtonLoading(submitBtn, false);

      // Simulate failed login for demo
      const mockFail = emailInput.value !== 'admin@orbit.com';

      if (mockFail) {
        if (errorBanner) {
          errorBanner.textContent = 'Invalid email or password. Please try again.';
          errorBanner.classList.add('show');
        }
        showToast('Login failed. Check your credentials.', 'danger');
      } else {
        showToast('Login successful! Redirecting...', 'success');
        if (errorBanner) errorBanner.classList.remove('show');
        // In real app: window.location.href = '/dashboard.html';
        setTimeout(() => {
          alert('Demo: Would redirect to dashboard.');
        }, 1000);
      }
    }, 1500);
  });
}

// REGISTER FORM

function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  const firstNameInput  = document.getElementById('reg-firstname');
  const lastNameInput   = document.getElementById('reg-lastname');
  const emailInput      = document.getElementById('reg-email');
  const passwordInput   = document.getElementById('reg-password');
  const confirmInput    = document.getElementById('reg-confirm-password');
  const submitBtn       = document.getElementById('register-submit');

  // Real-time password strength feedback
  passwordInput?.addEventListener('input', () => {
    clearFieldError(passwordInput);
    const val = passwordInput.value;
    if (val.length > 0 && val.length < 8) {
      showFieldError(passwordInput, 'Password must be at least 8 characters.');
    } else if (val.length >= 8) {
      markFieldSuccess(passwordInput);
    }
  });

  confirmInput?.addEventListener('input', () => {
    clearFieldError(confirmInput);
    if (confirmInput.value && !Validate.passwordMatch(passwordInput.value, confirmInput.value)) {
      showFieldError(confirmInput, 'Passwords do not match.');
    } else if (confirmInput.value) {
      markFieldSuccess(confirmInput);
    }
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isValid = true;

    if (!Validate.required(firstNameInput?.value || '')) {
      showFieldError(firstNameInput, 'First name is required.');
      isValid = false;
    }

    if (!Validate.required(lastNameInput?.value || '')) {
      showFieldError(lastNameInput, 'Last name is required.');
      isValid = false;
    }

    if (!Validate.email(emailInput?.value || '')) {
      showFieldError(emailInput, 'Please enter a valid email address.');
      isValid = false;
    }

    if (!Validate.minLength(passwordInput?.value || '', 8)) {
      showFieldError(passwordInput, 'Password must be at least 8 characters.');
      isValid = false;
    }

    if (!Validate.passwordMatch(passwordInput?.value, confirmInput?.value)) {
      showFieldError(confirmInput, 'Passwords do not match.');
      isValid = false;
    }

    // Check role selected
    const selectedRole = document.querySelector('.role-option.selected input');
    if (!selectedRole) {
      showToast('Please select your role to continue.', 'danger');
      isValid = false;
    }

    if (!isValid) return;

    setButtonLoading(submitBtn, true);

    setTimeout(() => {
      setButtonLoading(submitBtn, false);
      showToast('Account created! Please log in.', 'success');
      setTimeout(() => {
        // In real app: window.location.href = '/login.html';
        alert('Demo: Would redirect to login page.');
      }, 1200);
    }, 1600);
  });
}