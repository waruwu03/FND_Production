import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';

// We get the base URL dynamically or from env, similar to the Axios setup in services/api.ts
const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.15:5000/api/v1';

export const apiSlice = createApi({
  reducerPath: 'apiSlice',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Event', 'Equipment'],
  endpoints: (builder) => ({
    getEvents: builder.query<any, void>({
      query: () => '/events',
      providesTags: ['Event'],
      // Standardize response by returning data array
      transformResponse: (response: any) => response.data || [],
    }),
    getEquipment: builder.query<any, void>({
      query: () => '/equipment',
      providesTags: ['Equipment'],
      transformResponse: (response: any) => response.data || [],
    }),
  }),
});

export const { useGetEventsQuery, useGetEquipmentQuery } = apiSlice;
