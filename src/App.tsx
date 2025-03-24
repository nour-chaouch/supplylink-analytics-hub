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
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import SignIn from "./pages/login/SignIn";
import SignUp from "./pages/login/SignUp";

// Lazy load dashboard components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RegulatorCompliance = lazy(() => import('./components/RegulatorCompliance'));

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
              <Route path="/login" element={<SignIn />} />
              <Route path="/login/signup" element={<SignUp />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected farmer routes */}
              <Route
                path="/dashboard/farmer"
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <LazyLoad>
                      <Suspense fallback={<div>Loading...</div>}>
                        <Dashboard />
                      </Suspense>
                    </LazyLoad>
                  </ProtectedRoute>
                }
              />

              {/* Protected retailer routes */}
              <Route
                path="/dashboard/retailer"
                element={
                  <ProtectedRoute allowedRoles={['retailer']}>
                    <LazyLoad>
                      <Suspense fallback={<div>Loading...</div>}>
                        <Dashboard />
                      </Suspense>
                    </LazyLoad>
                  </ProtectedRoute>
                }
              />

              {/* Protected transporter routes */}
              <Route
                path="/dashboard/transporter"
                element={
                  <ProtectedRoute allowedRoles={['transporter']}>
                    <LazyLoad>
                      <Suspense fallback={<div>Loading...</div>}>
                        <Dashboard />
                      </Suspense>
                    </LazyLoad>
                  </ProtectedRoute>
                }
              />

              {/* Protected manager routes */}
              <Route
                path="/dashboard/manager"
                element={
                  <ProtectedRoute allowedRoles={['manager']}>
                    <LazyLoad>
                      <Suspense fallback={<div>Loading...</div>}>
                        <Dashboard />
                      </Suspense>
                    </LazyLoad>
                  </ProtectedRoute>
                }
              />

              {/* Protected regulator routes */}
              <Route
                path="/dashboard/regulator"
                element={
                  <ProtectedRoute allowedRoles={['regulator']}>
                    <LazyLoad>
                      <Suspense fallback={<div>Loading...</div>}>
                        <Dashboard />
                      </Suspense>
                    </LazyLoad>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/regulator/compliance"
                element={
                  <ProtectedRoute allowedRoles={['regulator']}>
                    <LazyLoad>
                      <Suspense fallback={<div>Loading...</div>}>
                        <RegulatorCompliance />
                      </Suspense>
                    </LazyLoad>
                  </ProtectedRoute>
                }
              />

              {/* Redirect /dashboard to role-specific dashboard if authenticated */}
              <Route
                path="/dashboard"
                element={<Navigate to="/login" replace />}
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
