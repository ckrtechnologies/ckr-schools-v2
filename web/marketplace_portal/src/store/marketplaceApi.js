import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const marketplaceApi = createApi({
  reducerPath: 'marketplaceApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  tagTypes: ['Schools', 'SchoolDetail', 'Reviews', 'PressReleases'],
  endpoints: (builder) => ({
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

    getSchoolBySlug: builder.query({
      query: (slug) => `/api/marketplace/schools/${slug}`,
      providesTags: (result, error, slug) => [{ type: 'SchoolDetail', id: slug }]
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
    }),

    getPressReleases: builder.query({
      query: (slug) => `/api/marketplace/schools/${slug}/press-releases`,
      providesTags: (result, error, slug) => [{ type: 'PressReleases', id: slug }]
    })
  })
});

export const {
  useGetSchoolsQuery,
  useGetSchoolBySlugQuery,
  useSubmitEnquiryMutation,
  useSubmitBrochureDownloadMutation,
  useSubmitMultiEnquiryMutation,
  useGetSchoolReviewsQuery,
  useSubmitSchoolReviewMutation,
  useUpvoteReviewHelpfulMutation,
  useGetPressReleasesQuery
} = marketplaceApi;

