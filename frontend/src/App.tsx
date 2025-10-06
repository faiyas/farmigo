import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import { AuthProvider } from "@/context/AuthContext";
import CustomerDashboard from "./pages/CustomerDashboard";
import FarmerDashboard from "./pages/FarmerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import Helpinbot from "./pages/Helpinbot";
import CropDisease from "./pages/CropDisease";
import CropSuggestion from "./pages/CropSuggestion";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/customer" element={<CustomerDashboard />} />
            <Route path="/farmer" element={<FarmerDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/helpinbot" element={<Helpinbot />} />
            <Route path="/crop-disease" element={<CropDisease />} />
            <Route path="/crop-suggestion" element={<CropSuggestion />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;