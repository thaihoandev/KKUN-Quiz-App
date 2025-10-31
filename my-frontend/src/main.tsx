// 1) Patch AntD v5 cho React 19 (phải đứng trước antd)
import '@ant-design/v5-patch-for-react-19';

import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, notification } from 'antd';
import { GoogleOAuthProvider } from '@react-oauth/google';

// CSS
import 'antd/dist/reset.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './index.css';
import "boxicons/css/boxicons.min.css";


import App from './App';

notification.config({
  placement: 'topRight',
  duration: 4,
});

createRoot(document.getElementById('root')!).render(
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ConfigProvider getPopupContainer={() => document.body}>
        <BrowserRouter>
          <Suspense fallback={<div>Loading...</div>}>
            <App />
          </Suspense>
        </BrowserRouter>
      </ConfigProvider>
    </GoogleOAuthProvider>
);
