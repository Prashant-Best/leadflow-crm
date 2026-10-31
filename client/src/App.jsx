import { Navigate, Route, Routes } from 'react-router';
import Layout from './components/Layout';
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards';
import DashboardPage from './pages/DashboardPage';
import FollowUpsPage from './pages/FollowUpsPage';
import LeadCreatePage from './pages/LeadCreatePage';
import LeadDetailPage from './pages/LeadDetailPage';
import LeadEditPage from './pages/LeadEditPage';
import LeadsPage from './pages/LeadsPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/leads/new" element={<LeadCreatePage />} />
          <Route path="/leads/:id" element={<LeadDetailPage />} />
          <Route path="/leads/:id/edit" element={<LeadEditPage />} />
          <Route path="/follow-ups" element={<FollowUpsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
