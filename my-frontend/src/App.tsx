import { useEffect } from "react";
import AppRoutes from "./routes";
import { useAuthStore } from "./store/authStore";

function App() {
  useEffect(() => {
    const { accessToken, refreshMe, lastRefreshedAt } = useAuthStore.getState();

    // 1. Lần đầu mở app → luôn refresh nếu có token
    if (accessToken) {
      refreshMe();
    }

    // Thời gian tối thiểu phải "rời khỏi" để tự động refresh lại
    const INACTIVE_THRESHOLD = 10 * 60 * 1000; // 10 phút (tùy chỉnh thoải mái)
    // Thời gian tối đa giữa 2 lần refresh (dù có rời tab hay không)
    const MAX_STALE_TIME = 30 * 60 * 1000; // 30 phút

    let leftAppAt = 0;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Người dùng vừa rời tab/app → ghi lại thời gian
        leftAppAt = Date.now();
        return;
      }

      // Người dùng QUAY LẠI
      const currentToken = useAuthStore.getState().accessToken;
      if (!currentToken) return;

      const timeAway = Date.now() - leftAppAt;
      const timeSinceLastRefresh = Date.now() - (lastRefreshedAt || 0);

      const shouldRefresh =
        timeAway > INACTIVE_THRESHOLD || // Rời tab quá lâu
        timeSinceLastRefresh > MAX_STALE_TIME; // Dữ liệu đã cũ quá

      if (shouldRefresh) {
        console.log("Auto refresh user: user was away or data is stale");
        refreshMe();
      } else {
        console.log("User back quickly → skip refresh");
      }
    };

    // Chỉ cần visibilitychange là đủ (tốt nhất cho cả mobile & desktop)
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return <AppRoutes />;
}

export default App;