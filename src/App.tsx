import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { store } from './store/store'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Layout from './components/Layout'
import Analytics from './pages/Analytics'
import SearchPage from './pages/Search'
import ProducerPrices from './pages/ProducerPrices'
import CropsLivestock from './pages/CropsLivestock'
import AdminRoute from './components/AdminRoute'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminPanel from './pages/AdminPanel'
import APITest from './pages/APITest'
import AuthProvider from './components/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'

const queryClient = new QueryClient()

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute requireAuth={true}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="search" element={<SearchPage />} />
                  <Route path="producer-prices" element={<ProducerPrices />} />
                  <Route path="crops-livestock" element={<CropsLivestock />} />
                  <Route path="api-test" element={<APITest />} />
                </Route>
                
                {/* Admin Routes - Protected by AdminRoute component */}
                <Route path="/admin-panel" element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                } />
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
                <Route path="/admin/users" element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                } />
              </Routes>
              <Toaster position="top-right" />
            </div>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </Provider>
  )
}

export default App
