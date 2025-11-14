import { useEffect } from "react";
import AppRoutes from "./routes";
import { useAuthStore } from "./store/authStore";

function App() {
  useEffect(() => {
    const { accessToken, refreshMe } = useAuthStore.getState();

    // 🔄 Khi mở app → tải user nếu đã login
    if (accessToken) {
      refreshMe();
    }

    // 🔄 Khi quay lại tab
    const revalidate = () => {
      const { accessToken, refreshMe } = useAuthStore.getState();
      if (accessToken) refreshMe();
    };

    window.addEventListener("focus", revalidate);

    const onVis = () => {
      if (!document.hidden) revalidate();
    };

    document.addEventListener("visibilitychange", onVis);

    // Cleanup listener
    return () => {
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <AppRoutes />;
}

export default App;
