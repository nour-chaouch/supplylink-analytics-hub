import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import AuthProvider from './components/AuthProvider';
import Layout from './components/Layout';
import GuestLayout from './components/GuestLayout';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Search from './pages/Search';
import ProducerPrices from './pages/ProducerPrices';
import CropsLivestock from './pages/CropsLivestock';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import ElasticsearchAdmin from './pages/ElasticsearchAdmin';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Guest routes - accessible to all users */}
              <Route path="/" element={<GuestLayout />}>
                <Route index element={<Home />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="search" element={<Search />} />
                <Route path="producer-prices" element={<ProducerPrices />} />
                <Route path="crops-livestock" element={<CropsLivestock />} />
              </Route>
              
              {/* Authenticated routes - require login */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
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
              </Route>
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </Provider>
  );
}

export default App;
