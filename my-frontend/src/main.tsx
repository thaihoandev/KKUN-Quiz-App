// ==========================
// 1️⃣ Ant Design patch for React 19
// ==========================
import "@ant-design/v5-patch-for-react-19";

// ==========================
// 2️⃣ Core React & Libraries
// ==========================
import React, { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App as AntApp, notification } from "antd";
import { GoogleOAuthProvider } from "@react-oauth/google";

// ==========================
// 3️⃣ Global Styles
// ==========================
import "antd/dist/reset.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "boxicons/css/boxicons.min.css";
import "@/assets/css/theme.css";       // Theme sáng
import "@/assets/css/antd-theme.css";    
// import "@/assets/css/bootstrap-theme.css";    

import "./index.css";

// ==========================
// 4️⃣ App Entry
// ==========================
import App from "./App";

// ==========================
// 5️⃣ Notification config
// ==========================
notification.config({
  placement: "topRight",
  duration: 4,
  maxCount: 3,
  closeIcon: null,
});

// ==========================
// 6️⃣ Render
// ==========================
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ConfigProvider
        getPopupContainer={() => document.body}
        theme={{
          token: {
            colorPrimary: "#6366f1", // đồng bộ với CSS theme
            borderRadius: 8,
          },
        }}
      >
        <AntApp>
          <BrowserRouter>
            <Suspense fallback={<div className="text-center mt-5">Loading...</div>}>
              <App />
            </Suspense>
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
