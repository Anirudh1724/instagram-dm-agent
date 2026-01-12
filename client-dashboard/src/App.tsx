import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { AdminSidebar } from './components/AdminSidebar';
import Login from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Insights } from './pages/Insights';
import { Leads } from './pages/Leads';
import { FollowupLeads } from './pages/FollowupLeads';
import { BookingLeads } from './pages/BookingLeads';
import { Settings } from './pages/Settings';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Clients } from './pages/admin/Clients';
import { ClientEditor } from './pages/admin/ClientEditor';

import './index.css';

// Client Layout with Sidebar
function ClientLayout() {
  const navigate = useNavigate();
  const token = localStorage.getItem('auth_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('client_id');
    localStorage.removeItem('business_name');
    navigate('/login');
  };

  return (
    <div className="app">
      <Sidebar onLogout={handleLogout} />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

// Admin Layout with Admin Sidebar
function AdminLayout() {
  const navigate = useNavigate();
  const adminKey = localStorage.getItem('admin_key');

  if (!adminKey) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_key');
    navigate('/login');
  };

  return (
    <div className="app">
      <AdminSidebar onLogout={handleLogout} />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Client Dashboard Routes */}
        <Route path="/client" element={<ClientLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="insights" element={<Insights />} />
          <Route path="leads" element={<Leads />} />
          <Route path="followup-leads" element={<FollowupLeads />} />
          <Route path="booking-leads" element={<BookingLeads />} />
          <Route path="settings" element={<Settings />} />
        </Route>


        {/* Admin Dashboard Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientEditor />} />
        </Route>

        {/* Legacy routes - redirect to new structure */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/leads" element={<Navigate to="/client/leads" replace />} />
        <Route path="/followup-leads" element={<Navigate to="/client/followup-leads" replace />} />
        <Route path="/booking-leads" element={<Navigate to="/client/booking-leads" replace />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
