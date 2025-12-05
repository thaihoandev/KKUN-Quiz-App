import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";

// Routes
import ProtectedRoute from "@/routes/ProtectedRoute";
import PublicRoute from "@/routes/PublicRoute";

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
import UserProfilePage from "@/pages/users/UserProfilePage";
import HomePostPage from "@/pages/HomePostPage";
import FriendConnectionsPage from "@/pages/FriendConnectionsPage";
import ChatPage from "@/pages/ChatPage";

// Articles
import ArticlesPage from "@/pages/article/ArticlesPage";
import ArticleDetailPage from "@/pages/article/ArticleDetailPage";
import CreateArticlePage from "@/pages/article/CreateArticlePage";
import ArticleEditPage from "@/pages/article/ArticleEditPage";

// Series
import SeriesPage from "@/pages/series/SeriesPage";
import SeriesDetailPage from "@/pages/series/SeriesDetailPage";
import AuthorSeriesPage from "@/pages/series/AuthorSeriesPage";
import CreateSeriesPage from "@/pages/series/CreateSeriesPage";
import EditSeriesPage from "@/pages/series/EditSeriesPage";

const AppRoutes: React.FC = () => (
  <>
    <ScrollToTop />
    <Suspense fallback={<div>Loading...</div>}>

      <Routes>

        {/* ======================================
              🔓 AUTH ROUTES (LOGIN & REGISTER)
        ======================================= */}
        <Route
          element={
            <PublicRoute>
              <AuthLayout />
            </PublicRoute>
          }
        >
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* ======================================
               🌍 PUBLIC ROUTES (SingleLayout)
        ======================================= */}
        <Route path="/" element={<SingleLayout />}>
          <Route index element={<HomePage />} />

          {/* Game */}
          <Route path="join-game" element={<JoinGamePage />} />
          <Route path="join-game/:pinCode" element={<JoinGamePage />} />
          <Route path="game-session/:gameId" element={<WaitingRoomSessionPage />} />
          <Route path="game-play/:gameId" element={<GamePlayPage />} />

          <Route path="chat" element={<ChatPage />} />

          {/* Articles (public) */}
          <Route path="articles" element={<ArticlesPage />} />
          <Route path="articles/:slug" element={<ArticleDetailPage />} />

          {/* Series (public) */}
          <Route path="series/:slug" element={<SeriesDetailPage />} />
          <Route path="author/:authorId/series" element={<AuthorSeriesPage />} />
        </Route>

        {/* ======================================
               🔐 PROTECTED ROUTES (LOGIN REQUIRED)
               → GIỮ dạng /profile/:userId
        ======================================= */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* User */}
          <Route path="/profile/:userId" element={<UserProfilePage />} />
          <Route path="/settings" element={<SettingProfilePage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/achievements" element={<AchievementPage />} />
          <Route path="/friends" element={<FriendConnectionsPage />} />
          <Route path="/posts" element={<HomePostPage />} />

          {/* Quizzes */}
          <Route path="/quiz/:slug" element={<QuizManagementPage />} />
          <Route path="/quiz/:quizId/edit" element={<QuizEditorPage />} />
          <Route path="/quiz/:quizId/questions/create" element={<QuestionCreatePage />} />
          <Route path="/quiz/:quizId/questions/:questionId/edit" element={<QuestionEditorPage />} />

          {/* Series management */}
          <Route path="/me/series" element={<SeriesPage />} />
          <Route path="/series/create" element={<CreateSeriesPage />} />
          <Route path="/series/edit/:slug" element={<EditSeriesPage />} />

          {/* Article management */}
          <Route path="/articles/create" element={<CreateArticlePage />} />
          <Route path="/articles/edit/:slug" element={<ArticleEditPage />} />
        </Route>

        {/* ======================================
                     🔴 404 NOT FOUND
        ======================================= */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Suspense>
  </>
);

export default AppRoutes;
