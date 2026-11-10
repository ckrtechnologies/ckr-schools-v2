import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL || '';

export const schoolApi = createApi({
  reducerPath: 'schoolApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const state = getState();
      const token = state.auth.token;
      const tenantSlug = state.auth.tenantSlug || 'vision';

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('x-tenant-slug', tenantSlug);
      return headers;
    }
  }),
  tagTypes: ['DashboardStats', 'Classes', 'Class', 'Subjects', 'Rooms', 'Students', 'Staff', 'User', 'Enquiries', 'FeeStructures', 'Payments', 'FinanceStats'],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/api/auth/login',
        method: 'POST',
        body: credentials
      })
    }),

    getDashboardStats: builder.query({
      query: () => '/api/academics/dashboard-stats',
      providesTags: ['DashboardStats']
    }),

    // Classes
    getClasses: builder.query({
      query: () => '/api/academics/classes',
      providesTags: ['Classes']
    }),

    getClassById: builder.query({
      query: (id) => `/api/academics/classes/${id}`,
      providesTags: (result, error, id) => [{ type: 'Class', id }]
    }),

    createClass: builder.mutation({
      query: (body) => ({
        url: '/api/academics/classes',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Classes', 'DashboardStats']
    }),

    updateClass: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/academics/classes/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Classes', 'DashboardStats']
    }),

    deleteClass: builder.mutation({
      query: (id) => ({
        url: `/api/academics/classes/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Classes', 'DashboardStats']
    }),

    // Subjects
    getSubjects: builder.query({
      query: () => '/api/academics/subjects',
      providesTags: ['Subjects']
    }),

    createSubject: builder.mutation({
      query: (body) => ({
        url: '/api/academics/subjects',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Subjects', 'DashboardStats']
    }),

    updateSubject: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/academics/subjects/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Subjects']
    }),

    deleteSubject: builder.mutation({
      query: (id) => ({
        url: `/api/academics/subjects/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Subjects', 'DashboardStats']
    }),

    // Rooms
    getRooms: builder.query({
      query: () => '/api/academics/rooms',
      providesTags: ['Rooms']
    }),

    createRoom: builder.mutation({
      query: (body) => ({
        url: '/api/academics/rooms',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Rooms']
    }),

    deleteRoom: builder.mutation({
      query: (id) => ({
        url: `/api/academics/rooms/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Rooms']
    }),

    // People & Directory (Students & Staff)
    getStudents: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams({ type: 'student' });
        if (params.search) queryParams.set('search', params.search);
        return `/api/users?${queryParams.toString()}`;
      },
      providesTags: ['Students']
    }),

    getStaff: builder.query({
      query: () => '/api/users?type=teacher',
      providesTags: ['Staff']
    }),

    getUserById: builder.query({
      query: (id) => `/api/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }]
    }),

    createUser: builder.mutation({
      query: (body) => ({
        url: '/api/users',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Students', 'Staff', 'DashboardStats']
    }),

    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/users/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, { id }) => ['Students', 'Staff', { type: 'User', id }, 'DashboardStats']
    }),

    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/api/users/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Students', 'Staff', 'DashboardStats']
    }),

    // Admissions Desk
    getEnquiries: builder.query({
      query: () => '/api/admission_panel/getAllNewUser',
      providesTags: ['Enquiries']
    }),

    createEnquiry: builder.mutation({
      query: (data) => ({
        url: '/api/admission_panel/createNewUser',
        method: 'POST',
        body: { data }
      }),
      invalidatesTags: ['Enquiries']
    }),

    updateEnquiry: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/admission_panel/updateNewUser/${id}`,
        method: 'PUT',
        body: { data }
      }),
      invalidatesTags: ['Enquiries']
    }),

    approveEnquiry: builder.mutation({
      query: (data) => ({
        url: '/api/admission_panel/approveNewUser',
        method: 'POST',
        body: { data }
      }),
      invalidatesTags: ['Enquiries', 'Students', 'Classes', 'DashboardStats']
    }),

    deleteEnquiry: builder.mutation({
      query: (id) => ({
        url: `/api/admission_panel/deleteNewUser/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Enquiries']
    }),

    // Finance & Fees
    getFeeStructures: builder.query({
      query: () => '/api/finance/feeStructures',
      providesTags: ['FeeStructures']
    }),

    createFeeStructure: builder.mutation({
      query: (body) => ({
        url: '/api/finance/feeStructures',
        method: 'POST',
        body
      }),
      invalidatesTags: ['FeeStructures', 'FinanceStats']
    }),

    updateFeeStructure: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/finance/feeStructures/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['FeeStructures', 'FinanceStats']
    }),

    deleteFeeStructure: builder.mutation({
      query: (id) => ({
        url: `/api/finance/feeStructures/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['FeeStructures', 'FinanceStats']
    }),

    getAllPayments: builder.query({
      query: () => '/api/finance/getAllPayments',
      providesTags: ['Payments']
    }),

    getStudentFees: builder.query({
      query: (studentId) => `/api/finance/student-fees/${studentId}`,
      providesTags: (result, error, studentId) => [{ type: 'Payments', id: studentId }]
    }),

    collectFee: builder.mutation({
      query: (body) => ({
        url: '/api/finance/collect',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Payments', 'FinanceStats', 'DashboardStats', 'Students']
    }),

    getFinanceStats: builder.query({
      query: () => '/api/finance/dashboardStats',
      providesTags: ['FinanceStats']
    })
  })
});

export const {
  useLoginMutation,
  useGetDashboardStatsQuery,
  useGetClassesQuery,
  useGetClassByIdQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useGetSubjectsQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
  useGetRoomsQuery,
  useCreateRoomMutation,
  useDeleteRoomMutation,
  useGetStudentsQuery,
  useGetStaffQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetEnquiriesQuery,
  useCreateEnquiryMutation,
  useUpdateEnquiryMutation,
  useApproveEnquiryMutation,
  useDeleteEnquiryMutation,
  useGetFeeStructuresQuery,
  useCreateFeeStructureMutation,
  useUpdateFeeStructureMutation,
  useDeleteFeeStructureMutation,
  useGetAllPaymentsQuery,
  useLazyGetStudentFeesQuery,
  useGetStudentFeesQuery,
  useCollectFeeMutation,
  useGetFinanceStatsQuery
} = schoolApi;

