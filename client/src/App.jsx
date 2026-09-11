import { Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import SuccessPage from './pages/SuccessPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import RecordViewPage from './pages/admin/RecordViewPage';
import RecordEditPage from './pages/admin/RecordEditPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import CustomEmailPage from './pages/admin/CustomEmailPage';
import SettingsPage from './pages/admin/SettingsPage';
import AdminLayout from './components/admin/AdminLayout';
import RequireAdmin from './components/RequireAdmin';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/register" replace />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/success/:id" element={<SuccessPage />} />

      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="records/:id" element={<RecordViewPage />} />
        <Route path="records/:id/edit" element={<RecordEditPage />} />
        <Route path="audit-log" element={<AuditLogPage />} />
        <Route path="custom-email" element={<CustomEmailPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
