document.addEventListener('DOMContentLoaded', () => {
  initRoleSelector();
  initPasswordToggle();
  initLoginForm();
  initRegisterForm();
});

// ROLE SELECTOR (Register page — UI only; see note in initRegisterForm)

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

// LOGIN FORM — calls the real API

function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const emailInput    = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const submitBtn     = document.getElementById('login-submit');
  const errorBanner   = document.getElementById('login-error');

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

    setButtonLoading(submitBtn, true);
    if (errorBanner) errorBanner.classList.remove('show');

    try {
      const { data } = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email: emailInput.value.trim(), password: passwordInput.value },
      });

      setSession(data.token, data.user);
      showToast('Login successful! Redirecting...', 'success');

      setTimeout(() => {
        window.location.href = data.user.role === 'ADMIN' ? 'admin-dashboard.html' : 'user-dashboard.html';
      }, 700);
    } catch (err) {
      if (errorBanner) {
        errorBanner.textContent = err.message || 'Invalid email or password. Please try again.';
        errorBanner.classList.add('show');
      }
      showToast('Login failed. Check your credentials.', 'danger');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

// REGISTER FORM — calls the real API
// Note: the "I am a..." role selector is currently decorative. The backend
// never allows self-registering as ADMIN (every new account is created as
// INTERN, regardless of what's selected here) — that's an intentional
// security rule. Promoting someone to ADMIN happens via an existing admin
// using PUT /api/users/:id.

function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  const firstNameInput  = document.getElementById('reg-firstname');
  const lastNameInput   = document.getElementById('reg-lastname');
  const emailInput      = document.getElementById('reg-email');
  const departmentInput = document.getElementById('reg-department');
  const passwordInput   = document.getElementById('reg-password');
  const confirmInput    = document.getElementById('reg-confirm-password');
  const termsInput      = document.getElementById('terms');
  const submitBtn       = document.getElementById('register-submit');

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

    const selectedRoleInput = document.querySelector('.role-option.selected input');
    if (!selectedRoleInput) {
      showToast('Please select your role to continue.', 'danger');
      isValid = false;
    }

    // This checkbox has `required` in the HTML, but the form also has
    // `novalidate`, which disables native browser enforcement of that —
    // so it has to be checked here explicitly, or it silently does nothing.
    if (termsInput && !termsInput.checked) {
      showToast('Please agree to the Terms of Service and Privacy Policy.', 'danger');
      isValid = false;
    }

    if (!isValid) return;

    setButtonLoading(submitBtn, true);

    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: {
          firstName: firstNameInput.value.trim(),
          lastName: lastNameInput.value.trim(),
          email: emailInput.value.trim(),
          password: passwordInput.value,
          department: departmentInput?.value || undefined,
        },
      });

      showToast('Account created! Please log in.', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1200);
    } catch (err) {
      showToast(err.message || 'Registration failed. Please try again.', 'danger');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}