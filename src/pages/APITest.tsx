import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogin, useRegister, useHealthCheck, useAdminStats } from '@/hooks/useAPI'
import { authAPI } from '@/services/api'
import { toast } from 'react-hot-toast'

const APITest = () => {
  const [testEmail, setTestEmail] = useState('admin@supplylink.com')
  const [testPassword, setTestPassword] = useState('admin123')
  const [testResults, setTestResults] = useState<any[]>([])

  const loginMutation = useLogin()
  const registerMutation = useRegister()
  const { data: healthData, isLoading: healthLoading, error: healthError } = useHealthCheck()
  const { data: adminData, isLoading: adminLoading, error: adminError } = useAdminStats()

  const addTestResult = (test: string, status: 'success' | 'error', message: string, data?: any) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const testHealthCheck = async () => {
    try {
      addTestResult('Health Check', 'success', 'Health check passed', healthData)
    } catch (error: any) {
      addTestResult('Health Check', 'error', error.message)
    }
  }

  const testLogin = async () => {
    try {
      const response = await authAPI.login({ email: testEmail, password: testPassword })
      addTestResult('Login API', 'success', 'Login successful', response.data)
    } catch (error: any) {
      addTestResult('Login API', 'error', error.response?.data?.message || error.message)
    }
  }

  const testRegister = async () => {
    try {
      const testUser = {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'test123456',
        role: 'farmer'
      }
      const response = await authAPI.register(testUser)
      addTestResult('Register API', 'success', 'Registration successful', response.data)
    } catch (error: any) {
      addTestResult('Register API', 'error', error.response?.data?.message || error.message)
    }
  }

  const testAdminStats = async () => {
    try {
      if (adminData) {
        addTestResult('Admin Stats', 'success', 'Admin stats retrieved', adminData)
      } else if (adminError) {
        addTestResult('Admin Stats', 'error', adminError.message)
      } else {
        addTestResult('Admin Stats', 'error', 'No admin data available')
      }
    } catch (error: any) {
      addTestResult('Admin Stats', 'error', error.message)
    }
  }

  const testTokenVerification = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        addTestResult('Token Verification', 'error', 'No token found in localStorage')
        return
      }

      const response = await authAPI.verifyToken()
      addTestResult('Token Verification', 'success', 'Token verified successfully', response.data)
    } catch (error: any) {
      addTestResult('Token Verification', 'error', error.response?.data?.message || error.message)
    }
  }

  const runAllTests = async () => {
    setTestResults([])
    
    await testHealthCheck()
    await testLogin()
    await testRegister()
    await testAdminStats()
    await testTokenVerification()
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Test Dashboard</h1>
          <p className="text-gray-600">Test all API endpoints to ensure axios is working correctly</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={runAllTests} variant="default">
            Run All Tests
          </Button>
          <Button onClick={clearResults} variant="outline">
            Clear Results
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Credentials</CardTitle>
            <CardDescription>Configure test credentials for API testing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Test Email</Label>
              <Input
                id="testEmail"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter test email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testPassword">Test Password</Label>
              <Input
                id="testPassword"
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="Enter test password"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Individual Tests</CardTitle>
            <CardDescription>Run specific API tests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={testHealthCheck} className="w-full" variant="outline">
              Test Health Check
            </Button>
            <Button onClick={testLogin} className="w-full" variant="outline">
              Test Login API
            </Button>
            <Button onClick={testRegister} className="w-full" variant="outline">
              Test Register API
            </Button>
            <Button onClick={testAdminStats} className="w-full" variant="outline">
              Test Admin Stats
            </Button>
            <Button onClick={testTokenVerification} className="w-full" variant="outline">
              Test Token Verification
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            Results of API tests - {testResults.length} tests completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tests run yet. Click "Run All Tests" to start.</p>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === 'success' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          result.status === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.status.toUpperCase()}
                        </span>
                        <span className="font-medium">{result.test}</span>
                        <span className="text-gray-500 text-sm">{result.timestamp}</span>
                      </div>
                      <p className="mt-1 text-sm">{result.message}</p>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-sm text-gray-600 cursor-pointer">
                            View Response Data
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
          <CardDescription>Real-time status of various API endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Health Check</h4>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  healthLoading ? 'bg-yellow-400' : 
                  healthError ? 'bg-red-400' : 
                  'bg-green-400'
                }`} />
                <span className="text-sm">
                  {healthLoading ? 'Loading...' : 
                   healthError ? 'Error' : 
                   'Connected'}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Admin Stats</h4>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  adminLoading ? 'bg-yellow-400' : 
                  adminError ? 'bg-red-400' : 
                  'bg-green-400'
                }`} />
                <span className="text-sm">
                  {adminLoading ? 'Loading...' : 
                   adminError ? 'Error' : 
                   'Available'}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Authentication</h4>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  localStorage.getItem('token') ? 'bg-green-400' : 'bg-gray-400'
                }`} />
                <span className="text-sm">
                  {localStorage.getItem('token') ? 'Authenticated' : 'Not authenticated'}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Refresh Token</h4>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  localStorage.getItem('refreshToken') ? 'bg-green-400' : 'bg-gray-400'
                }`} />
                <span className="text-sm">
                  {localStorage.getItem('refreshToken') ? 'Available' : 'Not available'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default APITest
