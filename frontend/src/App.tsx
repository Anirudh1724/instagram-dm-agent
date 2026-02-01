import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Login from "./pages/Login";
import ClientDashboard from "./pages/client/Dashboard";
import Leads from "./pages/client/Leads";
import FollowupLeads from "./pages/client/FollowupLeads";
import BookingLeads from "./pages/client/BookingLeads";
import Insights from "./pages/admin/Insights";
import Settings from "./pages/client/Settings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Clients from "./pages/admin/Clients";
import ClientEditor from "./pages/admin/ClientEditor";
import UpgradePlan from "./pages/UpgradePlan";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            {/* Client Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<ClientDashboard />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/followup" element={<FollowupLeads />} />
              <Route path="/bookings" element={<BookingLeads />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/upgrade" element={<UpgradePlan />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/insights" element={<Insights />} />
              <Route path="/admin/clients" element={<Clients />} />
              <Route path="/admin/clients/:id" element={<ClientEditor />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
