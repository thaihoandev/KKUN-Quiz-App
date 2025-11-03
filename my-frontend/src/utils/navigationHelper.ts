export const redirectToLogin = () => {
  if (window.location.pathname !== "/login") {
    window.location.href = "/login"; // SPA vẫn OK
  }
};
