import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CampaignListingPage from './pages/CampaignListingPage';
import CampaignDetailsPage from './pages/CampaignDetailsPage';
import DonorDashboardPage from './pages/DonorDashboardPage';
import NgoDashboardPage from './pages/NgoDashboardPage';
import CreateCampaignPage from './pages/CreateCampaignPage';
import AddExpensePage from './pages/AddExpensePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import FeedbackPage from './pages/FeedbackPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <WalletProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/campaigns" element={<CampaignListingPage />} />
            <Route path="/campaigns/:id" element={<CampaignDetailsPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['donor']}>
                  <DonorDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ngo/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ngo']}>
                  <NgoDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ngo/campaigns/new"
              element={
                <ProtectedRoute allowedRoles={['ngo']}>
                  <CreateCampaignPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ngo/campaigns/:campaignId/expenses/new"
              element={
                <ProtectedRoute allowedRoles={['ngo']}>
                  <AddExpensePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<LandingPage />} />
          </Routes>
        </WalletProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
