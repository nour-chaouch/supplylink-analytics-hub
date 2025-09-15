import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '@/services/api'

interface User {
  _id: string
  email: string
  name: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  tokenExpiry: number | null
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: false,
  loading: false,
  error: null,
  tokenExpiry: null,
}

// Async thunks for JWT authentication
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials)
      const data = response.data

      // Store tokens in localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('refreshToken', data.refreshToken)

      return {
        user: data.data,
        token: data.token,
        refreshToken: data.refreshToken,
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: { name: string; email: string; password: string; role: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData)
      const data = response.data

      // Store tokens in localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('refreshToken', data.refreshToken)

      return {
        user: data.data,
        token: data.token,
        refreshToken: data.refreshToken,
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed')
    }
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState }
      const refreshTokenValue = state.auth.refreshToken

      if (!refreshTokenValue) {
        return rejectWithValue('No refresh token available')
      }

      const response = await authAPI.refreshToken(refreshTokenValue)
      const data = response.data

      // Update tokens in localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('refreshToken', data.refreshToken)

      return {
        token: data.token,
        refreshToken: data.refreshToken,
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed')
    }
  }
)

export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState }
      const token = state.auth.token

      if (!token) {
        return rejectWithValue('No token available')
      }

      const response = await authAPI.verifyToken()
      const data = response.data

      return data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Token verification failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null
      state.tokenExpiry = null
      // Clear localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    },
    clearError: (state) => {
      state.error = null
    },
    setTokens: (state, action: PayloadAction<{ token: string; refreshToken: string }>) => {
      state.token = action.payload.token
      state.refreshToken = action.payload.refreshToken
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('refreshToken', action.payload.refreshToken)
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })
      // Refresh Token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
      })
      .addCase(refreshToken.rejected, (state) => {
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.user = null
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
      })
      // Verify Token
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(verifyToken.rejected, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.token = null
        state.refreshToken = null
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
      })
  },
})

export const { logout, clearError, setTokens } = authSlice.actions

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated
export const selectIsAdmin = (state: { auth: AuthState }) => state.auth.user?.role === 'admin'
export const selectUserRole = (state: { auth: AuthState }) => state.auth.user?.role
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error
export const selectToken = (state: { auth: AuthState }) => state.auth.token
export const selectRefreshToken = (state: { auth: AuthState }) => state.auth.refreshToken

export default authSlice.reducer

