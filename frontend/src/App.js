import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import { LoginPage, SignupPage } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import { PatientsPage, RegisterVisitPage } from './pages/Patients';
import FeeCollection from './pages/FeeCollection';
import { ConsultationsPage, PrescriptionsPage } from './pages/Consultations';
import { MessagesPage, DispensePage, LeavePage, BillsPage } from './pages/Operations';
import NutritionCheck from './pages/NutritionCheck';
import { MedicinesPage, DiseasesPage, DoctorsPage, StaffPage } from './pages/Admin';
import './index.css';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading" style={{ minHeight: '100vh' }}>Loading Ojasya...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <div className="top-bar">
          <h3>🫀 Ojasya Healthcare System</h3>
          <div className="top-bar-right">
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/patients" element={<ProtectedLayout><PatientsPage /></ProtectedLayout>} />
      <Route path="/register-visit" element={<ProtectedLayout><RegisterVisitPage /></ProtectedLayout>} />
      <Route path="/fees" element={<ProtectedLayout><FeeCollection /></ProtectedLayout>} />
      <Route path="/consultations" element={<ProtectedLayout><ConsultationsPage /></ProtectedLayout>} />
      <Route path="/prescriptions" element={<ProtectedLayout><PrescriptionsPage /></ProtectedLayout>} />
      <Route path="/dispense" element={<ProtectedLayout><DispensePage /></ProtectedLayout>} />
      <Route path="/messages" element={<ProtectedLayout><MessagesPage /></ProtectedLayout>} />
      <Route path="/leave" element={<ProtectedLayout><LeavePage /></ProtectedLayout>} />
      <Route path="/bills" element={<ProtectedLayout><BillsPage /></ProtectedLayout>} />
      <Route path="/nutrition" element={<ProtectedLayout><NutritionCheck /></ProtectedLayout>} />
      <Route path="/medicines" element={<ProtectedLayout><MedicinesPage /></ProtectedLayout>} />
      <Route path="/diseases" element={<ProtectedLayout><DiseasesPage /></ProtectedLayout>} />
      <Route path="/doctors" element={<ProtectedLayout><DoctorsPage /></ProtectedLayout>} />
      <Route path="/staff" element={<ProtectedLayout><StaffPage /></ProtectedLayout>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
