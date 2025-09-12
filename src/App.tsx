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

const queryClient = new QueryClient()

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="producer-prices" element={<ProducerPrices />} />
                <Route path="crops-livestock" element={<CropsLivestock />} />
              </Route>
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </QueryClientProvider>
    </Provider>
  )
}

export default App
