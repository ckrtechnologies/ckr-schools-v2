import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL || '';

export const superadminApi = createApi({
  reducerPath: 'superadminApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      // Ensure host header resolves to superadmin
      headers.set('x-tenant-subdomain', 'superadmin');
      return headers;
    }
  }),
  tagTypes: ['Stats', 'Tenants', 'Tenant', 'MarketplaceLeads', 'MarketplaceDossier', 'AuditLogs'],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/api/auth/login',
        method: 'POST',
        body: credentials
      })
    }),

    getStats: builder.query({
      query: () => '/api/superadmin/stats',
      providesTags: ['Stats']
    }),

    getTenants: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.set('search', params.search);
        if (params.planTier && params.planTier !== 'all') queryParams.set('planTier', params.planTier);
        if (params.isActive && params.isActive !== 'all') queryParams.set('isActive', params.isActive);
        if (params.page) queryParams.set('page', params.page);
        if (params.limit) queryParams.set('limit', params.limit || 50);
        if (params.sortBy) queryParams.set('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
        return `/api/superadmin/tenants?${queryParams.toString()}`;
      },
      providesTags: ['Tenants']
    }),

    getTenantById: builder.query({
      query: (id) => `/api/superadmin/tenants/${id}`,
      providesTags: (result, error, id) => [{ type: 'Tenant', id }]
    }),

    createTenant: builder.mutation({
      query: (body) => ({
        url: '/api/superadmin/tenants',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Tenants', 'Stats']
    }),

    updateTenant: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/superadmin/tenants/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, { id }) => ['Tenants', 'Stats', { type: 'Tenant', id }]
    }),

    toggleTenantStatus: builder.mutation({
      query: ({ id, isActive }) => ({
        url: `/api/superadmin/tenants/${id}/status`,
        method: 'PATCH',
        body: { isActive }
      }),
      invalidatesTags: (result, error, { id }) => ['Tenants', 'Stats', { type: 'Tenant', id }]
    }),

    deleteTenant: builder.mutation({
      query: (id) => ({
        url: `/api/superadmin/tenants/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Tenants', 'Stats']
    }),

    getMarketplaceLeads: builder.query({
      query: (params = {}) => {
        const q = new URLSearchParams();
        if (params.tenantId && params.tenantId !== 'all') q.set('tenantId', params.tenantId);
        if (params.status && params.status !== 'all') q.set('status', params.status);
        if (params.leadType && params.leadType !== 'all') q.set('leadType', params.leadType);
        if (params.search) q.set('search', params.search);
        if (params.page) q.set('page', params.page);
        if (params.limit) q.set('limit', params.limit || 50);
        return `/api/superadmin/marketplace/leads?${q.toString()}`;
      },
      providesTags: ['MarketplaceLeads']
    }),

    updateMarketplaceLead: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/superadmin/marketplace/leads/${id}`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['MarketplaceLeads']
    }),

    getSchoolLeadDossier: builder.query({
      query: (tenantId) => `/api/superadmin/marketplace/leads/export/${tenantId}`,
      providesTags: ['MarketplaceDossier']
    }),

    transferMarketplaceLead: builder.mutation({
      query: ({ id, admin_notes }) => ({
        url: `/api/superadmin/marketplace/leads/${id}/transfer-to-school`,
        method: 'POST',
        body: { admin_notes }
      }),
      invalidatesTags: ['MarketplaceLeads', 'MarketplaceDossier']
    }),

    getMarketplaceReviews: builder.query({
      query: (params = {}) => {
        const q = new URLSearchParams();
        if (params.tenantId && params.tenantId !== 'all') q.set('tenantId', params.tenantId);
        if (params.isApproved !== undefined && params.isApproved !== 'all') q.set('isApproved', params.isApproved);
        return `/api/superadmin/marketplace/reviews?${q.toString()}`;
      },
      providesTags: ['MarketplaceReviews']
    }),

    updateMarketplaceReviewStatus: builder.mutation({
      query: ({ id, is_approved }) => ({
        url: `/api/superadmin/marketplace/reviews/${id}/status`,
        method: 'PATCH',
        body: { is_approved }
      }),
      invalidatesTags: ['MarketplaceReviews']
    }),

    deleteMarketplaceReview: builder.mutation({
      query: (id) => ({
        url: `/api/superadmin/marketplace/reviews/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['MarketplaceReviews']
    }),

    toggleSchoolFeatured: builder.mutation({
      query: ({ tenantId, is_featured }) => ({
        url: `/api/superadmin/marketplace/schools/${tenantId}/feature`,
        method: 'PATCH',
        body: { is_featured }
      }),
      invalidatesTags: ['Tenants', 'MarketplaceReviews']
    }),

    getAuditLogs: builder.query({
      query: (params = {}) => {
        const q = new URLSearchParams();
        if (params.limit) q.set('limit', params.limit);
        return `/api/superadmin/audit-logs?${q.toString()}`;
      },
      providesTags: ['AuditLogs']
    })
  })
});

export const {
  useLoginMutation,
  useGetStatsQuery,
  useGetTenantsQuery,
  useGetTenantByIdQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useToggleTenantStatusMutation,
  useDeleteTenantMutation,
  useGetMarketplaceLeadsQuery,
  useUpdateMarketplaceLeadMutation,
  useGetSchoolLeadDossierQuery,
  useTransferMarketplaceLeadMutation,
  useGetMarketplaceReviewsQuery,
  useUpdateMarketplaceReviewStatusMutation,
  useDeleteMarketplaceReviewMutation,
  useToggleSchoolFeaturedMutation,
  useGetAuditLogsQuery
} = superadminApi;

