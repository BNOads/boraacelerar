import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "./components/Layout";
import { NotificationPopup } from "./components/NotificationPopup";
import Auth from "./pages/Auth";
import UpdatePassword from "./pages/UpdatePassword";
import Dashboard from "./pages/Dashboard";
import Trilha from "./pages/Trilha";
import Resultados from "./pages/Resultados";
import Membros from "./pages/Membros";
import Mentorados from "./pages/Mentorados";
import MentoradoProfile from "./pages/MentoradoProfile";
import Livraria from "./pages/Livraria";
import Navegador from "./pages/Navegador";
import Links from "./pages/Links";
import Loja from "./pages/Loja";
import Notifications from "./pages/Notifications";
import AdminNotifications from "./pages/AdminNotifications";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/auth" />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <NotificationPopup />
        <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/trilha" element={<ProtectedRoute><Trilha /></ProtectedRoute>} />
          <Route path="/resultados" element={<ProtectedRoute><Resultados /></ProtectedRoute>} />
          <Route path="/agenda" element={<Navigate to="/dashboard" replace />} />
          <Route path="/membros" element={<ProtectedRoute><Membros /></ProtectedRoute>} />
          <Route path="/mentorados" element={<ProtectedRoute><Mentorados /></ProtectedRoute>} />
          <Route path="/mentorados/:id" element={<ProtectedRoute><MentoradoProfile /></ProtectedRoute>} />
          <Route path="/livraria" element={<ProtectedRoute><Livraria /></ProtectedRoute>} />
          <Route path="/navegador" element={<ProtectedRoute><Navegador /></ProtectedRoute>} />
          <Route path="/links" element={<ProtectedRoute><Links /></ProtectedRoute>} />
          <Route path="/loja" element={<ProtectedRoute><Loja /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/admin/notifications/create" element={<ProtectedRoute><AdminNotifications /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;