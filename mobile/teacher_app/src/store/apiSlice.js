import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';
import { API_URL } from '@env';

export const getBaseUrl = () => {
  let url = API_URL || 'http://localhost:5006/api';
  if (Platform.OS === 'android' && url.includes('localhost')) {
    url = url.replace('localhost', '10.0.2.2');
  }
  return url;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: getBaseUrl(),
    prepareHeaders: async (headers, { getState }) => {
      try {
        const state = getState();
        let token = state?.auth?.token;
        const tenantSlug = state?.auth?.tenantSlug || 'arc';

        if (!token) {
          const credentials = await Keychain.getGenericPassword();
          if (credentials && credentials.password) {
            token = credentials.password;
          }
        }
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        if (tenantSlug) {
          headers.set('x-tenant-slug', tenantSlug);
        }
      } catch (error) {
        console.log('Error fetching token for headers:', error);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  
  tagTypes: ['Exams', 'Courses', 'Attendance', 'Timetable', 'Events', 'Students', 'Classes', 'Complaints', 'Grades', 'Notifications', 'Performance', 'Chats', 'Circulars', 'Gallery', 'Newsletters', 'StaffAttendance', 'StaffLeaves'],
  endpoints: (builder) => ({
    getPublicSchools: builder.query({
      query: () => '/public/schools',
    }),
    getPublicSchoolProfile: builder.query({
      query: (slug) => ({
        url: '/public-school-profile',
        headers: slug ? { 'x-tenant-slug': slug } : {},
      }),
    }),
    getTeacherClasses: builder.query({
      query: () => '/teacher_app/classes',
      providesTags: ['Classes'],
    }),
    getTeacherProfile: builder.query({
      query: () => '/teacher_app/profile',
      providesTags: ['Classes'],
    }),
    getClassStudents: builder.query({
      query: (classId) => `/teacher_app/classes/${classId}/students`,
      providesTags: ['Students'],
    }),
    getTimetable: builder.query({
      query: (classId) => `/teacher_app/timetable${classId ? `?classId=${classId}` : ''}`,
      providesTags: ['Timetable'],
    }),
    getExams: builder.query({
      query: (classId) => `/teacher_app/exams${classId ? `?classId=${classId}` : ''}`,
      providesTags: ['Exams'],
    }),
    getCourses: builder.query({
      query: (classId) => `/teacher_app/course${classId ? `?classId=${classId}` : ''}`,
      providesTags: ['Courses'],
    }),
    createCourse: builder.mutation({
      query: (data) => ({
        url: '/teacher_app/course',
        method: 'POST',
        body: { data },
      }),
      invalidatesTags: ['Courses'],
    }),
    deleteCourse: builder.mutation({
      query: (id) => ({
        url: `/teacher_app/course/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Courses'],
    }),
    updateCourse: builder.mutation({
      query: ({ id, data }) => ({
        url: `/teacher_app/course/${id}`,
        method: 'PUT',
        body: { data },
      }),
      invalidatesTags: ['Courses'],
    }),
    getEvents: builder.query({
      query: (classId) => `/teacher_app/events${classId ? `?classId=${classId}` : ''}`,
      providesTags: ['Events'],
    }),
    getNewsletters: builder.query({
      query: () => `/teacher_app/newsletters`,
      providesTags: ['Newsletters'],
    }),
    addNewsletter: builder.mutation({
      query: (data) => ({
        url: '/teacher_app/newsletters',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Newsletters'],
    }),
    deleteNewsletter: builder.mutation({
      query: (id) => ({
        url: `/teacher_app/newsletters/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Newsletters'],
    }),
    getAttendance: builder.query({
      query: (params) => ({
        url: '/attendance',
        params, // e.g., { startDate, endDate, classId }
      }),
      providesTags: ['Attendance'],
    }),
    submitBulkAttendance: builder.mutation({
      query: (data) => ({
        url: '/attendance/bulk',
        method: 'POST',
        body: { data },
      }),
      invalidatesTags: ['Attendance'],
    }),
    changePassword: builder.mutation({
      query: (data) => ({
        url: '/teacher_app/auth/change-password',
        method: 'POST',
        body: data,
      }),
    }),
    submitBulkGrades: builder.mutation({
      query: (grades) => ({
        url: '/teacher_app/exams/grades/bulk',
        method: 'POST',
        body: { grades },
      }),
      invalidatesTags: ['Exams', 'Grades'],
    }),
    getChats: builder.query({
      query: () => '/live_chat/list',
      providesTags: ['Chats'],
    }),
    getLiveChatHistory: builder.query({
      query: (userId) => `/live_chat/history/${userId}`,
      providesTags: (result, error, id) => [{ type: 'Chats', id }],
    }),
    getStudents: builder.query({
      query: () => '/live_chat/students',
    }),
    getPrincipal: builder.query({
      query: () => '/live_chat/principal',
    }),
    getComplaints: builder.query({
      query: (studentId) => `/teacher_app/complaints${studentId ? `?studentId=${studentId}` : ''}`,
      providesTags: ['Complaints'],
    }),
    getStudentGrades: builder.query({
      query: (studentId) => `/teacher_app/exams/grades?studentId=${studentId}`,
      providesTags: ['Grades'],
    }),
    getExamGrades: builder.query({
      query: (examId) => `/teacher_app/exams/grades?examId=${examId}`,
      providesTags: ['Grades'],
    }),
    getExamDistribution: builder.query({
      query: (examId) => `/teacher_app/exams/${examId}/distribution`,
      providesTags: ['Exams'],
    }),
    getDateSheetGrades: builder.query({
      query: ({ title, classId }) => `/teacher_app/exams/datesheet/${encodeURIComponent(title)}/${classId}/grades`,
      providesTags: ['Grades'],
    }),
    registerFcmToken: builder.mutation({
      query: ({ fcm_token, device_type }) => ({
        url: '/teacher_app/notifications/register-token',
        method: 'POST',
        body: { fcm_token, device_type }
      }),
    }),
    getNotifications: builder.query({
      query: () => '/teacher_app/notifications',
      providesTags: ['Notifications'],
    }),
    getClassPerformance: builder.query({
      query: (classId) => `/teacher_app/classes/${classId}/performance`,
      providesTags: ['Performance'],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `/teacher_app/notifications/${id}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Notifications'],
    }),
    getThoughtOfDay: builder.query({
      query: () => '/thoughts/today',
    }),
    getSpotlightOfToday: builder.query({
      query: () => '/spotlight/today',
    }),
    getGalleryItems: builder.query({
      query: () => '/gallery',
      providesTags: ['Gallery'],
    }),
    getStudentOfWeek: builder.query({
      query: (classId) => `/shared/student-of-week/current${classId ? `?classId=${classId}` : ''}`,
    }),
    getCirculars: builder.query({
      query: () => '/circulars',
      providesTags: ['Circulars'],
    }),
    getCoScholasticGrades: builder.query({
      query: ({ classId, term, academicYear = '2026-27' }) =>
        `/teacher_app/co-scholastic?class_id=${classId}&term=${encodeURIComponent(term)}&academic_year=${encodeURIComponent(academicYear)}`,
      providesTags: ['Grades'],
    }),
    submitCoScholasticGrades: builder.mutation({
      query: ({ classId, term, academicYear = '2026-27', grades }) => ({
        url: '/teacher_app/co-scholastic/bulk',
        method: 'POST',
        body: { class_id: classId, term, academic_year: academicYear, grades },
      }),
      invalidatesTags: ['Grades'],
    }),

    // Staff Self Attendance Endpoints
    getTodayStaffAttendance: builder.query({
      query: () => '/staff-attendance/today',
      providesTags: ['StaffAttendance'],
    }),
    staffCheckIn: builder.mutation({
      query: (body = {}) => ({
        url: '/staff-attendance/check-in',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StaffAttendance'],
    }),
    staffCheckOut: builder.mutation({
      query: (body = {}) => ({
        url: '/staff-attendance/check-out',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StaffAttendance'],
    }),
    getStaffAttendanceHistory: builder.query({
      query: (params) => ({
        url: '/staff-attendance/my-history',
        params,
      }),
      providesTags: ['StaffAttendance'],
    }),

    // Staff Leaves Endpoints
    getMyLeavesSummary: builder.query({
      query: (params) => ({
        url: '/staff-leaves/my-summary',
        params,
      }),
      providesTags: ['StaffLeaves'],
    }),
    applyLeave: builder.mutation({
      query: (body) => ({
        url: '/staff-leaves/apply',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StaffLeaves', 'StaffAttendance'],
    }),
    cancelLeave: builder.mutation({
      query: (id) => ({
        url: `/staff-leaves/${id}/cancel`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StaffLeaves'],
    }),
  }),
});

export const {
  useGetTimetableQuery,
  useGetPublicSchoolsQuery,
  useGetPublicSchoolProfileQuery,
  useGetTeacherClassesQuery,
  useGetTeacherProfileQuery,
  useGetClassStudentsQuery,
  useGetExamsQuery,
  useGetCoursesQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useGetEventsQuery,
  useGetNewslettersQuery,
  useAddNewsletterMutation,
  useDeleteNewsletterMutation,
  useGetAttendanceQuery,
  useChangePasswordMutation,
  useSubmitBulkAttendanceMutation,
  useSubmitBulkGradesMutation,
  useGetChatsQuery,
  useGetComplaintsQuery,
  useGetStudentGradesQuery,
  useGetExamGradesQuery,
  useGetExamDistributionQuery,
  useGetDateSheetGradesQuery,
  useRegisterFcmTokenMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useGetClassPerformanceQuery,
  useGetLiveChatHistoryQuery,
  useGetStudentsQuery,
  useGetPrincipalQuery,
  useGetThoughtOfDayQuery,
  useGetSpotlightOfTodayQuery,
  useGetStudentOfWeekQuery,
  useGetCircularsQuery,
  useGetGalleryItemsQuery,
  useGetCoScholasticGradesQuery,
  useSubmitCoScholasticGradesMutation,
  useGetTodayStaffAttendanceQuery,
  useStaffCheckInMutation,
  useStaffCheckOutMutation,
  useGetStaffAttendanceHistoryQuery,
  useGetMyLeavesSummaryQuery,
  useApplyLeaveMutation,
  useCancelLeaveMutation,
} = apiSlice;
