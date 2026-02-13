import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Registrations from "./pages/Registrations";
import Kitchen from "./pages/Kitchen";
import TablesPage from "./pages/TablesPage";
import ERP from "./pages/ERP";
import Operations from "./pages/Operations";
import Vouchers from "./pages/Vouchers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/registrations" element={<Registrations />} />
              <Route path="/kitchen" element={<Kitchen />} />
              <Route path="/tables" element={<TablesPage />} />
              <Route path="/erp" element={<ERP />} />
              <Route path="/operations" element={<Operations />} />
              <Route path="/vouchers" element={<Vouchers />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
