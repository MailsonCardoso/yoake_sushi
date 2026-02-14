import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Registrations from "./pages/Registrations";
import Kitchen from "./pages/Kitchen";
import TablesPage from "./pages/TablesPage";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Delivery from "./pages/Delivery";
import OrderHistory from "./pages/OrderHistory";
import TVMonitor from "./pages/TVMonitor";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/sales" element={<Sales />} />
                      <Route path="/registrations" element={<Registrations />} />
                      <Route path="/kitchen" element={<Kitchen />} />
                      <Route path="/tables" element={<TablesPage />} />
                      <Route path="/delivery" element={<Delivery />} />
                      <Route path="/history" element={<OrderHistory />} />
                      <Route path="/monitor" element={<TVMonitor />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
