(function () {
  const token = getToken();
  const user = getCurrentUser();

  if (!token || !user) {
    window.location.href = 'login.html';
    return;
  }

  // Make the current user available globally for page-specific scripts
  // (e.g. to populate the sidebar name/avatar, or to redirect an INTERN
  // away from an admin-only page).
  window.currentUser = user;
})();

function logout() {
  clearSession();
  window.location.href = 'login.html';
}