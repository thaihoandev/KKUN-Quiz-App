import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";

// layouts
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
import SingleLayout from "@/layouts/SingleLayout";

// pages
import HomePage               from "@/pages/HomePage";
import AchievementPage        from "@/pages/AchievementPage";
import QuizManagementPage     from "@/pages/quizManagement/QuizManagementPage";
import QuizEditorPage         from "@/pages/quizManagement/QuizEditorPage";
import QuestionCreatePage     from "@/pages/QuestionCreatePage";
import QuestionEditorPage     from "@/pages/QuestionEditorPage";
import Login                  from "@/pages/LoginPage";
import Register               from "@/pages/RegisterPage";
import NotFound               from "@/pages/NotFoundPage";
import SettingProfilePage     from "@/pages/SettingProfilePage";
import ChangePasswordPage     from "@/pages/ChangePasswordPage";
import JoinGamePage from "@/pages/gameSession/JoinGamePage";
import WaitingRoomSessionPage from "@/pages/gameSession/WaitingRoomSessionPage";
import GamePlayPage from "@/pages/game/GamePlayPage";
import UserDashboardPage from "@/pages/UserDashboardPage";
import UserProfilePage from "@/pages/UserProfilePage";
import HomePostPage from "@/pages/HomePostPage";
import FriendConnectionsPage from "@/pages/FriendConnectionsPage";

const AppRoutes: React.FC = () => (
  <>
    <ScrollToTop />
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
       

        {/* 2) Authentication pages */}
        <Route element={<AuthLayout />}>
          <Route path="login"    element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/* 3) Main application */}
        <Route path="/" element={<MainLayout />}>
          {/* index = "/" */}
          <Route index element={<HomePage />} />
          <Route path="posts" element={<HomePostPage />} />

          {/* 4) User profile and dashboard */}
          {/* nested paths */}
          <Route path="dashboard" element={<UserProfilePage />} />
          <Route path="profile/:userId"   element={<UserProfilePage />} />
          <Route path="quizzes/:quizId"   element={<QuizManagementPage />} />
          <Route path="achievements"      element={<AchievementPage />} />
          <Route path="settings"          element={<SettingProfilePage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
          <Route path="/friends" element={<FriendConnectionsPage />} />
          
        </Route>

        <Route path="/" element={<SingleLayout />}>
          <Route path="game-session/:gameId" element={<WaitingRoomSessionPage />} />
          <Route path="game-play/:gameId" element={<GamePlayPage />} />
          <Route path="join-game/:pinCode" element={<JoinGamePage />} />
          <Route path="quizzes/:quizId/edit" element={<QuizEditorPage />} />
          <Route path="quizzes/:quizId/questions/create" element={<QuestionCreatePage />} />
          <Route path="quizzes/:quizId/questions/:questionId/edit" element={<QuestionEditorPage />} />
        </Route>

        {/* 5) 404 catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </>
);

export default AppRoutes;
