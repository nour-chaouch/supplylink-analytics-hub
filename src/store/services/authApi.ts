import { apiSlice } from '../api/apiSlice';
import { UserRole } from '../slices/authSlice';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
  role: UserRole;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  company?: string;
  bio?: string;
  // Role-specific fields
  farmSize?: number;
  mainCrops?: string;
  storeLocation?: string;
  businessType?: string;
  token: string; 
}

export interface UpdateUserRequest {
  userId: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  bio?: string;
  // Role-specific fields
  farmSize?: number;
  mainCrops?: string;
  storeLocation?: string;
  businessType?: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<User, LoginRequest>({
      query: (credentials: LoginRequest) => ({
        url: '/users/signin',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<User, RegisterRequest>({
      query: (data: RegisterRequest) => ({
        url: '/users/signup',
        method: 'POST',
        body: data,
      }),
    }),
    getProfile: builder.query<User, void>({
      query: () => ({
        url: '/users/profile',
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
    updateUser: builder.mutation<User, UpdateUserRequest>({
      query: (data) => ({
        url: '/users/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateUserMutation,
} = authApi;
