import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import LazyLoad from "@/components/LazyLoad";

// Eagerly load critical components
import Index from "./pages/Index";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import SignIn from "./pages/login/SignIn";
import SignUp from "./pages/login/SignUp";
import UserProfile from './components/profile/UserProfile';

// Import role-specific dashboards
import FarmerDashboard from './pages/dashboard/FarmerDashboard';
import RetailerDashboard from './pages/dashboard/RetailerDashboard';
import TransporterDashboard from './pages/dashboard/TransporterDashboard';
import ManagerDashboard from './pages/dashboard/ManagerDashboard';
import RegulatorDashboard from './pages/dashboard/RegulatorDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<SignIn />} />
              <Route path="/login/signup" element={<SignUp />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected farmer routes */}
              <Route
                path="/dashboard/farmer"
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <FarmerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected retailer routes */}
              <Route
                path="/dashboard/retailer"
                element={
                  <ProtectedRoute allowedRoles={['retailer']}>
                    <RetailerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected transporter routes */}
              <Route
                path="/dashboard/transporter"
                element={
                  <ProtectedRoute allowedRoles={['transporter']}>
                    <TransporterDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected manager routes */}
              <Route
                path="/dashboard/manager"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected regulator routes */}
              <Route
                path="/dashboard/regulator"
                element={
                  <ProtectedRoute allowedRoles={['regulator']}>
                    <RegulatorDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Profile route */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['farmer', 'retailer', 'transporter', 'manager', 'regulator']}>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </Provider>
  </ErrorBoundary>
);

export default App;
