import { apiSlice } from '../api/apiSlice';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
  role: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials: LoginRequest) => ({
        url: '/users/signin',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (data: RegisterRequest) => ({
        url: '/users/signup',
        method: 'POST',
        body: data,
      }),
    }),
    getProfile: builder.query({
      query: () => ({
        url: '/users/profile',
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
} = authApi;
