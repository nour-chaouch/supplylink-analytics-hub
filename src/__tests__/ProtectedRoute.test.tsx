import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect } from 'vitest';
import ProtectedRoute from '../components/ProtectedRoute';
import authReducer from '../store/slices/authSlice';

const createMockStore = (initialState: any) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: initialState,
    },
  });
};

describe('ProtectedRoute', () => {
  const TestComponent = () => <div>Protected Content</div>;

  it('redirects to login when user is not authenticated', () => {
    const store = createMockStore({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ProtectedRoute allowedRoles={['farmer']}>
            <TestComponent />
          </ProtectedRoute>
        </BrowserRouter>
      </Provider>
    );

    expect(window.location.pathname).toBe('/login');
  });

  it('shows loading state when authentication is being checked', () => {
    const store = createMockStore({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ProtectedRoute allowedRoles={['farmer']}>
            <TestComponent />
          </ProtectedRoute>
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders children when user has correct role', () => {
    const store = createMockStore({
      user: { role: 'farmer' },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ProtectedRoute allowedRoles={['farmer']}>
            <TestComponent />
          </ProtectedRoute>
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to unauthorized when user has wrong role', () => {
    const store = createMockStore({
      user: { role: 'retailer' },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ProtectedRoute allowedRoles={['farmer']}>
            <TestComponent />
          </ProtectedRoute>
        </BrowserRouter>
      </Provider>
    );

    expect(window.location.pathname).toBe('/unauthorized');
  });
});
