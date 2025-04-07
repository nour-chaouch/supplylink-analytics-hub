// src/store/api/faostatApiSlice.ts

import { apiSlice } from "../api/apiSlice";

export const faostatApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAvailableCrops: builder.query({
      query: () => '/crops',
    }),
    getAvailableCountries: builder.query({
      query: () => '/countries',
    }),
    getCropData: builder.query({
      query: ({ cropCode, countryCode = '212', yearStart = 2010, yearEnd = 2023 }) => 
        `/crop-data/${cropCode}?year_start=${yearStart}&year_end=${yearEnd}&countryCode=${countryCode}`,
    }),
  }),
});

export const {
  useGetAvailableCropsQuery,
  useGetAvailableCountriesQuery,
  useGetCropDataQuery,
} = faostatApiSlice;