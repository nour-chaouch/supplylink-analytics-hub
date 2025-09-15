import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { selectIsAuthenticated, selectToken, verifyToken } from '@/store/slices/authSlice'
import { RootState } from '@/store/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Shield, AlertTriangle } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  allowedRoles?: string[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true, 
  allowedRoles = [] 
}) => {
  const dispatch = useDispatch()
  const location = useLocation()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const token = useSelector(selectToken)
  const user = useSelector((state: RootState) => state.auth.user)
  const loading = useSelector((state: RootState) => state.auth.loading)

  useEffect(() => {
    // If we have a token but user is not authenticated, verify the token
    if (token && !isAuthenticated && !loading) {
      dispatch(verifyToken())
    }
  }, [token, isAuthenticated, loading, dispatch])

  // Show loading spinner while verifying token
  if (token && !isAuthenticated && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Verifying authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If user is authenticated but doesn't have required role
  if (requireAuth && isAuthenticated && allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Access Denied
              </CardTitle>
              <CardDescription className="text-gray-600">
                You don't have the required permissions to access this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
                <AlertTriangle className="h-4 w-4" />
                <span>Insufficient permissions</span>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => window.history.back()}
                  className="w-full"
                >
                  Go Back
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  return <>{children}</>
}

export default ProtectedRoute
