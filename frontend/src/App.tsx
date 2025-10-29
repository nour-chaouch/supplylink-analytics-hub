import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import AuthProvider from './components/AuthProvider';
import { SystemSettingsProvider } from './contexts/SystemSettingsContext';
import Layout from './components/Layout';
import GuestLayout from './components/GuestLayout';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Charts from './pages/Charts';
import ChartView from './pages/ChartView';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import ElasticsearchAdmin from './pages/ElasticsearchAdmin';
import AllSettings from './components/ImportSettings';
import MaintenanceCheck from './components/MaintenanceCheck';
import ProtectedRoute from './components/ProtectedRoute';
import ChartCreate from './pages/ChartCreate';
import AdminRoute from './components/AdminRoute';
import RegistrationRoute from './components/RegistrationRoute';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <SystemSettingsProvider>
          <Router>
            <MaintenanceCheck>
              <div className="min-h-screen bg-gray-50">
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={
                    <RegistrationRoute>
                      <Register />
                    </RegistrationRoute>
                  } />
                  
                  {/* Guest routes - accessible to all users */}
                  <Route path="/" element={<GuestLayout />}>
                    <Route index element={<Home />} />
                    <Route path="search" element={<Search />} />
                  </Route>
                  
                  {/* Authenticated routes - require login */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Dashboard />} />
                  </Route>

                  {/* Charts routes - require login */}
                  <Route path="/charts" element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Charts />} />
                    <Route path="create" element={<ChartCreate />} />
                    <Route path=":id" element={<ChartView />} />
                    <Route path=":id/edit" element={<ChartCreate />} />
                  </Route>
                  
                  {/* Admin routes - require authentication and admin role */}
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    </ProtectedRoute>
                  }>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="elasticsearch" element={<ElasticsearchAdmin />} />
                    <Route path="all-settings" element={<AllSettings />} />
                  </Route>
                </Routes>
              </div>
            </MaintenanceCheck>
          </Router>
        </SystemSettingsProvider>
      </AuthProvider>
    </Provider>
  );
}

export default App;
