import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import DashboardPage from './pages/DashboardPage';
import SyncDataPage from './pages/SyncDataPage';
import SchedulePage from './pages/SchedulePage';
import DeadlinePage from './pages/DeadlinePage';
import DocumentsPage from './pages/DocumentsPage';
import AISummaryPage from './pages/AISummaryPage';
import AIQuizPage from './pages/AIQuizPage';
import AIChatbotPage from './pages/AIChatbotPage';
import AIStudyPlanPage from './pages/AIStudyPlanPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sync" element={<SyncDataPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/deadline" element={<DeadlinePage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/ai/summary" element={<AISummaryPage />} />
              <Route path="/ai/quiz" element={<AIQuizPage />} />
              <Route path="/ai/chatbot" element={<AIChatbotPage />} />
              <Route path="/ai/study-plan" element={<AIStudyPlanPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
