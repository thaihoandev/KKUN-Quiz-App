// Helper to read cookie value by name
export const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
};