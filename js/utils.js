// NAVBAR — scroll shadow + mobile toggle

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const toggle = document.querySelector('.navbar-toggle');
  const mobileMenu = document.querySelector('.navbar-mobile');

  if (!navbar) return;

  // Scroll shadow
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile toggle
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });

    // Close when nav link is clicked
    mobileMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
      });
    });
  }
}

// TOAST NOTIFICATIONS

function showToast(message, type = 'default', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 250ms ease forwards';
    setTimeout(() => toast.remove(), 250), duration;
  }, duration);
}

// Fade out keyframe (added once)
if (!document.getElementById('toast-style')) {
  const style = document.createElement('style');
  style.id = 'toast-style';
  style.textContent = '@keyframes fadeOut { to { opacity: 0; transform: translateX(120%); } }';
  document.head.appendChild(style);
}

// FORM VALIDATION HELPERS

const Validate = {
  required(value) {
    return value.trim().length > 0;
  },
  email(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  },
  minLength(value, min) {
    return value.trim().length >= min;
  },
  passwordMatch(a, b) {
    return a === b;
  }
};

// Show field error
function showFieldError(inputEl, message) {
  inputEl.classList.add('error');
  inputEl.classList.remove('success');

  let errorEl = inputEl.parentElement.querySelector('.form-error');
  if (!errorEl) {
    errorEl = document.createElement('span');
    errorEl.className = 'form-error';
    inputEl.parentElement.appendChild(errorEl);
  }
  errorEl.textContent = message;
}

// Clear field error
function clearFieldError(inputEl) {
  inputEl.classList.remove('error');
  let errorEl = inputEl.parentElement.querySelector('.form-error');
  if (errorEl) errorEl.textContent = '';
}

// Mark field success
function markFieldSuccess(inputEl) {
  inputEl.classList.remove('error');
  inputEl.classList.add('success');
  let errorEl = inputEl.parentElement.querySelector('.form-error');
  if (errorEl) errorEl.textContent = '';
}

// LOADING STATE HELPERS

function setButtonLoading(btn, isLoading) {
  if (isLoading) {
    btn.classList.add('btn-loading');
    btn.disabled = true;
    btn.dataset.originalText = btn.textContent;
  } else {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || btn.textContent;
  }
}

// ACTIVE NAV LINK

function setActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(currentPath)) {
      link.classList.add('active');
    }
  });
}

// INIT ON DOM READY

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  setActiveNavLink();
});