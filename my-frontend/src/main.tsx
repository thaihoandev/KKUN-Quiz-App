// 1. Patch AntD v5 cho React 19 (phải nằm trước import 'antd')
import '@ant-design/v5-patch-for-react-19';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, notification } from 'antd';

// 2. Import CSS
import 'antd/dist/reset.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import AppRoutes from './routes';
import { Suspense } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';


notification.config({
  placement: 'topRight',
  duration: 4, // Default for errors
});


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>  {/* <<< bọc toàn App */}
      <ConfigProvider getPopupContainer={() => document.body}>
        <BrowserRouter>
          <Suspense fallback={<div>Loading...</div>}>
            <AppRoutes />
          </Suspense>
        </BrowserRouter>
      </ConfigProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
