import { useEffect, useState } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ShieldAlert, Lock, Loader2 } from 'lucide-react';

export function DashboardLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardProvider>
      <DashboardContent isAdmin={isAdmin} logout={logout} />
    </DashboardProvider>
  );
}

function DashboardContent({ isAdmin, logout }: { isAdmin: boolean; logout: () => void }) {
  const { isLogoutConfirmOpen, setIsLogoutConfirmOpen } = useDashboard();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Prevent accidental closure/reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Required for Chrome
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // 2. Back Button Intercept
  useEffect(() => {
    // Initial push to ensure we have a state to "go back" from
    window.history.pushState(null, '', window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      // Re-push immediately to keep them on the current URL
      window.history.pushState(null, '', window.location.href);
      // Trigger the logout confirmation
      setIsLogoutConfirmOpen(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setIsLogoutConfirmOpen]);

  const confirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    setIsLoggingOut(true);

    setTimeout(() => {
      logout();
      navigate('/', { replace: true });
    }, 2000);
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 relative overflow-hidden">
      {/* Global Cinematic Background (Fixed) */}
      <div className="fixed inset-0 bg-black pointer-events-none z-0" />

      {/* Aurora / Spotlight Effect based on role */}
      {isAdmin ? (
        <>
          <div className="fixed top-[-20%] left-[20%] w-[1000px] h-[600px] bg-cyan-900/10 blur-[150px] rounded-full pointer-events-none z-0" />
          <div className="fixed bottom-[-20%] right-[20%] w-[800px] h-[600px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none z-0" />
        </>
      ) : (
        <>
          <div className="fixed top-[-20%] left-[20%] w-[1000px] h-[600px] bg-emerald-900/10 blur-[150px] rounded-full pointer-events-none z-0" />
          <div className="fixed bottom-[-20%] right-[20%] w-[800px] h-[600px] bg-green-900/10 blur-[150px] rounded-full pointer-events-none z-0" />
        </>
      )}

      {/* Grid Texture */}
      <div className="fixed inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:60px_60px] opacity-10 pointer-events-none z-0" />

      {/* Content */}
      <DashboardSidebar />
      <main className="flex-1 overflow-auto relative z-10">
        <div className="p-8 pb-32">
          <Outlet />
        </div>
      </main>

      {/* Global Logout Confirmation */}
      <AlertDialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
        <AlertDialogContent className="bg-zinc-900 border-white/10 text-white border ring-1 ring-white/5 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold tracking-tight">
              {isAdmin ? 'Admin Session Security' : 'Logout Confirmation'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {isAdmin
                ? 'Are you sure you want to terminate your secure admin session?'
                : 'Are you sure you want to exit the dashboard? Any unsaved work may be lost.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl">
              CANCEL
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className={cn(
                "rounded-xl font-bold tracking-wide shadow-lg",
                isAdmin ? "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/20" : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
              )}
            >
              YES, TERMINATE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* Logout Animation Overlay */}
      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-3xl"
          >
            <div className="flex flex-col items-center gap-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className={cn(
                  "w-24 h-24 rounded-full border-2 flex items-center justify-center relative z-10",
                  isAdmin ? "border-cyan-500/20 bg-cyan-950/30" : "border-emerald-500/20 bg-emerald-950/30"
                )}>
                  {isAdmin ? (
                    <ShieldAlert className="w-10 h-10 text-cyan-400 animate-pulse" />
                  ) : (
                    <Lock className="w-10 h-10 text-emerald-400 animate-pulse" />
                  )}
                </div>
                {/* Rings */}
                <motion.div 
                  className={cn("absolute inset-0 rounded-full border opacity-50", isAdmin ? "border-cyan-500" : "border-emerald-500")}
                  initial={{ scale: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div 
                   className={cn("absolute inset-0 rounded-full border opacity-50", isAdmin ? "border-cyan-500" : "border-emerald-500")}
                  initial={{ scale: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />
              </motion.div>

              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white mb-1">
                  {isAdmin ? 'Terminating Session' : 'Logging Out'}
                </h3>
                <p className="text-white/40 text-sm font-medium flex items-center justify-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {isAdmin ? 'Clearing secure credentials...' : 'Saving preferences...'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
