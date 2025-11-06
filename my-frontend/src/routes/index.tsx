import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";

// Layouts
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
import SingleLayout from "@/layouts/SingleLayout";

// Pages
import HomePage from "@/pages/HomePage";
import AchievementPage from "@/pages/AchievementPage";
import QuizManagementPage from "@/pages/quizManagement/QuizManagementPage";
import QuizEditorPage from "@/pages/quizManagement/QuizEditorPage";
import QuestionCreatePage from "@/pages/QuestionCreatePage";
import QuestionEditorPage from "@/pages/QuestionEditorPage";
import Login from "@/pages/LoginPage";
import Register from "@/pages/RegisterPage";
import NotFound from "@/pages/NotFoundPage";
import SettingProfilePage from "@/pages/users/SettingProfilePage";
import ChangePasswordPage from "@/pages/ChangePasswordPage";
import JoinGamePage from "@/pages/gameSession/JoinGamePage";
import WaitingRoomSessionPage from "@/pages/gameSession/WaitingRoomSessionPage";
import GamePlayPage from "@/pages/game/GamePlayPage";
import UserDashboardPage from "@/pages/users/UserDashboardPage";
import UserProfilePage from "@/pages/users/UserProfilePage";
import HomePostPage from "@/pages/HomePostPage";
import FriendConnectionsPage from "@/pages/FriendConnectionsPage";
import ChatPage from "@/pages/ChatPage";

// Articles
import ArticlesPage from "@/pages/article/ArticlesPage";
import ArticleDetailPage from "@/pages/article/ArticleDetailPage";
import CreateArticlePage from "@/pages/article/CreateArticlePage";

// ✅ Series Pages
import SeriesPage from "@/pages/series/SeriesPage";
import SeriesDetailPage from "@/pages/series/SeriesDetailPage";
import AuthorSeriesPage from "@/pages/series/AuthorSeriesPage";
import CreateSeriesPage from "@/pages/series/CreateSeriesPage";
import EditSeriesPage from "@/pages/series/EditSeriesPage";
import ArticleEditPage from "@/pages/article/ArticleEditPage";

const AppRoutes: React.FC = () => (
  <>
    <ScrollToTop />
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>

        {/* === AUTHENTICATION === */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/* === MAIN APPLICATION === */}
        <Route path="/" element={<MainLayout />}>
          {/* HOME */}
          <Route index element={<HomePage />} />
          <Route path="posts" element={<HomePostPage />} />

          {/* USERS */}
          <Route path="profile/:userId" element={<UserProfilePage />} />
          <Route path="achievements" element={<AchievementPage />} />
          <Route path="settings" element={<SettingProfilePage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
          <Route path="friends" element={<FriendConnectionsPage />} />

          {/* QUIZZES */}
          <Route path="quizzes/:quizId" element={<QuizManagementPage />} />

          {/* ✅ SERIES (NEW) */}
          <Route path="series/create" element={<CreateSeriesPage />} />
          <Route path="me/series" element={<SeriesPage />} />
          <Route path="series/edit/:slug" element={<EditSeriesPage />} />
          <Route path="series/:slug" element={<SeriesDetailPage />} />
          <Route path="author/:authorId/series" element={<AuthorSeriesPage />} />

          
        </Route>

        {/* === SINGLE LAYOUT (NO SIDEBAR) === */}
        <Route path="/" element={<SingleLayout />}>
          {/* GAME SESSIONS */}
          <Route path="join-game" element={<JoinGamePage />} />
          <Route path="join-game/:pinCode" element={<JoinGamePage />} />
          <Route path="game-session/:gameId" element={<WaitingRoomSessionPage />} />
          <Route path="game-play/:gameId" element={<GamePlayPage />} />

          {/* QUIZ EDITOR */}
          <Route path="quizzes/:quizId/edit" element={<QuizEditorPage />} />
          <Route path="quizzes/:quizId/questions/create" element={<QuestionCreatePage />} />
          <Route path="quizzes/:quizId/questions/:questionId/edit" element={<QuestionEditorPage />} />

          {/* ARTICLES */}
          <Route path="articles" element={<ArticlesPage />} />
          <Route path="articles/create" element={<CreateArticlePage />} />
          <Route path="articles/edit/:slug" element={<ArticleEditPage />} />
          <Route path="articles/:slug" element={<ArticleDetailPage />} />
          
          {/* CHAT */}
          <Route path="chat" element={<ChatPage />} />
        </Route>

        {/* === 404 CATCH-ALL === */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </>
);

export default AppRoutes;
