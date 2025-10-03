import { useEffect } from 'react';
import AppRoutes from './routes';
import { useAuthStore } from './store/authStore';

function App() {
  // Revalidate user khi mở app + khi quay lại tab
  useEffect(() => {
    // revalidate ngay (nhẹ, chỉ fetch nếu stale)
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
  

  return <AppRoutes />;
}

export default App;
