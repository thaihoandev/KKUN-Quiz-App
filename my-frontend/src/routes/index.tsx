import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";

// layouts
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
import SingleLayout from "@/layouts/SingleLayout";

// pages
import HomePage               from "@/pages/HomePage";
import ProfilePage            from "@/pages/ProfilePage";
import ClassesPage            from "@/pages/ClassesPage";
import CoursesPage            from "@/pages/CoursesPage";
import QuizzesPage            from "@/pages/QuizzesPage";
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

          {/* nested paths */}
          <Route path="profile"           element={<ProfilePage />} />
          <Route path="classes"           element={<ClassesPage />} />
          <Route path="courses"           element={<CoursesPage />} />
          <Route path="quizzes"           element={<QuizzesPage />} />
          <Route path="quizzes/:quizId"   element={<QuizManagementPage />} />
          <Route path="achievements"      element={<AchievementPage />} />
          <Route path="settings"          element={<SettingProfilePage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
          
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
