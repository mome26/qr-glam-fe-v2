import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/auth-context';
import { useAuth } from './hooks/use-auth';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import Dashboard from './pages/Dashboard/Index'
import Events from './pages/Events/Index'
import EventDetail from './pages/EventDetail/Index'
import Sidebar from './components/layout/Sidebar'
import MobileOverlay from './components/layout/MobileOverlay'
import PasswordChangeBanner from './components/layout/PasswordChangeBanner'
import QRCodes from './pages/QRCodes/Index'
import MediaGallery from './pages/MediaGallery'
import AccountSettings from './pages/AccountSettings'
import TeamMembers from './pages/TeamMembers'
import CapturePhotos from './pages/CapturePhotos'
import Login from './pages/Login'
import QrCodeEditPage from './pages/QRCodes/QrCodeEditPage'
import MediaAdminPage from './pages/MediaAdminPage'
import TemplateDesigner from './pages/TemplateDesigner'
import TemplateEditPage from './pages/TemplateEditPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-info border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-xl font-display font-medium text-card-foreground">QR Glam</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminStaffRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-info border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-xl font-display font-medium text-card-foreground">QR Glam</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
    return <Navigate to="/events" replace />;
  }

  return <>{children}</>;
}

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar-collapsed', String(next));
      } catch {
        // localStorage not available
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
      <MobileOverlay isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`flex-1 flex flex-col ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'} ml-0`}>
        {/* Hamburger button — visible only on mobile when sidebar is closed */}
        {!sidebarOpen && (
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-border shadow-sm text-muted hover:text-info hover:bg-accent transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <PasswordChangeBanner />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-right" />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:slugWithId" element={<EventDetail />} />
              <Route path="/events/:eventId/qr-codes/:qrId/edit" element={<QrCodeEditPage />} />
              <Route path="/qr-codes" element={<QRCodes />} />
              <Route path="/media" element={<MediaGallery />} />
              <Route path="/settings" element={<AccountSettings />} />
            </Route>

            {/* Admin/Staff only routes */}
            <Route element={<AdminStaffRoute><MainLayout /></AdminStaffRoute>}>
              <Route path="/events/:slugWithId/templates/designer" element={<TemplateDesigner />} />
              <Route path="/events/:slugWithId/templates/:templateId/edit" element={<TemplateEditPage />} />
              <Route path="/media-admin" element={<MediaAdminPage />} />
              <Route path="/team" element={<TeamMembers />} />
            </Route>
            
            {/* Full-screen public routes */}
            <Route path="/capture/:id" element={<CapturePhotos />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
