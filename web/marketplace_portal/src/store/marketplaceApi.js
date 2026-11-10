import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const marketplaceApi = createApi({
  reducerPath: 'marketplaceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    }
  }),
  tagTypes: ['Schools', 'SchoolDetail', 'Reviews', 'Facets', 'Auth', 'PressReleases'],
  endpoints: (builder) => ({
    getFacets: builder.query({
      query: () => '/api/marketplace/facets',
      providesTags: ['Facets']
    }),

    getSchools: builder.query({
      query: (filters = {}) => {
        const q = new URLSearchParams();
        if (filters.board && filters.board !== 'all') q.set('board', filters.board);
        if (filters.city && filters.city !== 'all') q.set('city', filters.city);
        if (filters.minFee) q.set('minFee', filters.minFee);
        if (filters.maxFee) q.set('maxFee', filters.maxFee);
        if (filters.search) q.set('search', filters.search);
        return `/api/marketplace/schools?${q.toString()}`;
      },
      providesTags: ['Schools']
    }),

    getPressReleases: builder.query({
      query: (slug) => `/api/marketplace/schools/${slug}/press-releases`,
      providesTags: (result, error, slug) => [{ type: 'PressReleases', id: slug }]
    }),

    getSchoolBySlug: builder.query({
      query: (slug) => `/api/marketplace/schools/${slug}`,
      providesTags: (result, error, slug) => [{ type: 'SchoolDetail', id: slug }]
    }),

    login: builder.mutation({
      query: (body) => ({
        url: '/api/marketplace/auth/login',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Auth']
    }),

    getMe: builder.query({
      query: () => '/api/marketplace/auth/me',
      providesTags: ['Auth']
    }),

    submitEnquiry: builder.mutation({
      query: ({ slug, ...body }) => ({
        url: `/api/marketplace/schools/${slug}/enquiry`,
        method: 'POST',
        body
      })
    }),

    submitBrochureDownload: builder.mutation({
      query: ({ slug, ...body }) => ({
        url: `/api/marketplace/schools/${slug}/brochure`,
        method: 'POST',
        body
      })
    }),

    submitMultiEnquiry: builder.mutation({
      query: (body) => ({
        url: '/api/marketplace/multi-enquiry',
        method: 'POST',
        body
      })
    }),

    getSchoolReviews: builder.query({
      query: (slug) => `/api/marketplace/schools/${slug}/reviews`,
      providesTags: (result, error, slug) => [{ type: 'Reviews', id: slug }]
    }),

    submitSchoolReview: builder.mutation({
      query: ({ slug, ...body }) => ({
        url: `/api/marketplace/schools/${slug}/reviews`,
        method: 'POST',
        body
      }),
      invalidatesTags: (result, error, { slug }) => [
        'Schools',
        { type: 'SchoolDetail', id: slug },
        { type: 'Reviews', id: slug }
      ]
    }),

    upvoteReviewHelpful: builder.mutation({
      query: (reviewId) => ({
        url: `/api/marketplace/reviews/${reviewId}/helpful`,
        method: 'POST'
      }),
      invalidatesTags: ['Reviews']
    })
  })
});

export const {
  useGetFacetsQuery,
  useGetSchoolsQuery,
  useGetSchoolBySlugQuery,
  useGetPressReleasesQuery,
  useLoginMutation,
  useGetMeQuery,
  useSubmitEnquiryMutation,
  useSubmitBrochureDownloadMutation,
  useSubmitMultiEnquiryMutation,
  useGetSchoolReviewsQuery,
  useSubmitSchoolReviewMutation,
  useUpvoteReviewHelpfulMutation
} = marketplaceApi;
