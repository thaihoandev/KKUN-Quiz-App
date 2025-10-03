import { useEffect } from 'react';
import AppRoutes from './routes';
import { useAuthStore } from './store/authStore';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

declare global {
  interface Window {
    TemplateCustomizer: any;
  }
}

function App() {
  // Refresh user session khi mở app + khi quay lại tab
  useEffect(() => {
    useAuthStore.getState().refreshMeIfStale();

    const revalidate = () => useAuthStore.getState().refreshMeIfStale();
    window.addEventListener('focus', revalidate);
    const onVis = () => { if (!document.hidden) revalidate(); };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.removeEventListener('focus', revalidate);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Init TemplateCustomizer chỉ với Color + Theme
  useEffect(() => {
    if (window.TemplateCustomizer) {
      const originalFetch = window.fetch;

      // Override fetch để chặn request tới /img/customizer/*
      window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        if (typeof input === "string" && input.includes("img/customizer/")) {
          return Promise.reject("Customizer SVG fetch disabled");
        }
        return originalFetch(input, init);
      };

      // Khởi tạo chỉ với Color + Theme
      new window.TemplateCustomizer({
        displayCustomizer: true,
        controls: ["color", "theme"], 
        defaultTheme: "light",
        defaultPrimaryColor: "#696CFF",
      });

      // Khôi phục lại fetch gốc sau khi init
      window.fetch = originalFetch;
    }
  }, []);

  return <AppRoutes />;
}

export default App;
