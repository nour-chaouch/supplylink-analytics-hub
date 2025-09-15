import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectToken, selectIsAuthenticated, verifyToken, refreshToken } from '@/store/slices/authSlice'
import { RootState } from '@/store/store'

interface AuthProviderProps {
  children: React.ReactNode
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch()
  const token = useSelector(selectToken)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const refreshTokenValue = useSelector((state: RootState) => state.auth.refreshToken)

  useEffect(() => {
    // Check if user has a token on app load
    if (token && !isAuthenticated) {
      // Try to verify the token first
      dispatch(verifyToken())
    }
  }, [token, isAuthenticated, dispatch])

  useEffect(() => {
    // Set up automatic token refresh
    const setupTokenRefresh = () => {
      if (refreshTokenValue && isAuthenticated) {
        // Refresh token every 6 days (token expires in 7 days)
        const refreshInterval = setInterval(() => {
          dispatch(refreshToken())
        }, 6 * 24 * 60 * 60 * 1000) // 6 days in milliseconds

        return () => clearInterval(refreshInterval)
      }
    }

    const cleanup = setupTokenRefresh()
    return cleanup
  }, [refreshTokenValue, isAuthenticated, dispatch])

  // Intercept API calls to handle token expiration
  useEffect(() => {
    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      
      // If we get a 401, try to refresh the token
      if (response.status === 401 && refreshTokenValue) {
        try {
          await dispatch(refreshToken()).unwrap()
          // Retry the original request with new token
          const newToken = localStorage.getItem('token')
          if (newToken && args[1]) {
            const newHeaders = {
              ...args[1].headers,
              'Authorization': `Bearer ${newToken}`
            }
            return originalFetch(args[0], { ...args[1], headers: newHeaders })
          }
        } catch (error) {
          // Refresh failed, user needs to login again
          console.error('Token refresh failed:', error)
        }
      }
      
      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [refreshTokenValue, dispatch])

  return <>{children}</>
}

export default AuthProvider
