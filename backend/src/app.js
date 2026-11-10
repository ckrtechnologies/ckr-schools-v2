import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { resolveTenant } from './middlewares/resolveTenant.js';
import { config } from './config/env.js';

// Domain Routers
import authRouter from './domains/auth/routes.js';
import marketplaceRouter from './domains/marketplace/routes.js';
import academicsRouter from './domains/academics/routes.js';
import attendanceRouter from './domains/attendance/routes.js';
import admissionsRouter from './domains/admissions/routes.js';
import financeRouter from './domains/finance/routes.js';
import examsRouter from './domains/exams/routes.js';
import timetableRouter from './domains/timetable/routes.js';
import communicationRouter from './domains/communication/routes.js';
import courseworkRouter from './domains/coursework/routes.js';
import infoRouter from './domains/info/routes.js';
import usersRouter from './domains/users/routes.js';
import uploadRouter from './domains/upload/routes.js';
import tcRouter from './domains/tc/routes.js';
import teachersManagerRouter from './domains/teachers_manager/routes.js';
import academicManagerRouter from './domains/academic_manager/routes.js';
import liveChatRouter from './domains/live_chat/routes.js';
import superadminRouter from './domains/superadmin/routes.js';
import studentOfWeekRouter from './domains/info/studentOfWeekRoutes.js';
import rolesRouter from './domains/roles/routes.js';

// Student & Teacher Mobile App Feature Domains
import studentAppRouter from './domains/student_app/routes.js';
import teacherAppRouter from './domains/teacher_app/routes.js';
import staffAttendanceRouter from './domains/staff_attendance/routes.js';
import staffLeavesRouter from './domains/staff_leaves/routes.js';

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve uploaded assets across both /uploads and /cdn paths using config.cdn.uploadDir
const fallbackUploadsDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(config.cdn.uploadDir));
app.use('/uploads', express.static(fallbackUploadsDir));
app.use('/cdn', express.static(config.cdn.uploadDir));
app.use('/cdn', express.static(fallbackUploadsDir));

// Multi-tenant resolver on all requests
app.use(resolveTenant);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    isSuperAdmin: req.isSuperAdmin || false,
    tenant: req.tenant ? { id: req.tenant.id, slug: req.tenant.slug, name: req.tenant.name } : null
  });
});

// ============================================================================
// MOUNT DOMAIN ROUTES (RESTful & Vision Legacy Endpoints)
// ============================================================================

// Auth
app.use('/api/auth', authRouter);
app.use('/api', authRouter); // Supports legacy /api/loginUser

// Public School Profile for dynamic branding, login screen, title & favicon (unauthenticated)
import { getPublicSchoolProfileHandler, getPublicSchoolsListHandler } from './domains/info/controller.js';
app.get('/api/public-school-profile', getPublicSchoolProfileHandler);
app.get('/api/school-profile', getPublicSchoolProfileHandler);
app.get('/api/public/school-profile', getPublicSchoolProfileHandler);
app.get('/api/public/schools', getPublicSchoolsListHandler);
app.get('/api/public-schools', getPublicSchoolsListHandler);

// Transfer Certificate (TC) Desk (Public verification + Management)
app.use('/api/tc', tcRouter);

// Super Admin Platform Operations
app.use('/api/superadmin', superadminRouter);

// Marketplace (Public Website)
app.use('/api/marketplace', marketplaceRouter);

// User Management (Admin Panel, Teachers, Students, Parents)
app.use('/api/admin_panel/users', usersRouter);
app.use('/api/user', usersRouter);
app.use('/api/users', usersRouter);

// File Upload & CDN Assets
app.use('/api/upload', uploadRouter);

// Academics (Classes, Subjects, 2D Matrix, Rooms)
app.use('/api/academics', academicsRouter);
app.use('/api/admin_panel', academicsRouter);
app.use('/api/rooms', academicsRouter);
app.use('/api/shared/classes', academicsRouter);
app.use('/api/shared/subjects', academicsRouter);
app.use('/api', academicsRouter);

// Attendance & Annual Planner
app.use('/api/attendance', attendanceRouter);
app.use('/api/shared/attendance', attendanceRouter);
app.use('/api/admin_panel', attendanceRouter);

// Admissions & Inquiries
app.use('/api/admissions', admissionsRouter);
app.use('/api/admission_panel', admissionsRouter);
app.use('/api', admissionsRouter);

// Finance & Fees
app.use('/api/finance', financeRouter);
app.use('/api/finance_panel', financeRouter);
app.use('/api/fees', financeRouter);

// Staff Roles & Responsibilities
app.use('/api/admin_panel/roles', rolesRouter);
app.use('/api/roles', rolesRouter);

// Student of the Week
app.use('/api/admin/student-of-week', studentOfWeekRouter);
app.use('/api/shared/student-of-week', studentOfWeekRouter);
app.use('/api/student-of-week', studentOfWeekRouter);

// School Info, Social Handles & Highlights
app.use('/api', infoRouter);
app.use('/api/admin_panel', infoRouter);
app.use('/api/spotlight', infoRouter);
app.use('/api/thoughts', infoRouter);
app.use('/api/gallery', infoRouter);

// Examinations & Co-Scholastic
app.use('/api/exams', examsRouter);
app.use('/api/admin_panel/exams', examsRouter);
app.use('/api/admin_panel', examsRouter);

// Timetable, Bell Schedules & Daily Proxies
app.use('/api/timetable', timetableRouter);
app.use('/api/timeTable', timetableRouter);
app.use('/api/teacher_schedule', timetableRouter);
app.use('/api/admin_panel', timetableRouter);

// Communication, Circulars, Complaints & Notifications
app.use('/api', communicationRouter);
app.use('/api/admin_panel', communicationRouter);
app.use('/api/shared', communicationRouter);
app.use('/api/shared/notifications', communicationRouter);
app.use('/api/admin_panel/notifications', communicationRouter);

// Coursework, Homework & Parental Consents
app.use('/api', courseworkRouter);
app.use('/api/admin_panel', courseworkRouter);
app.use('/api/consents', courseworkRouter);
app.use('/api/shared/consents', courseworkRouter);

// Teacher Manager (Evaluation Matrix & Scorecard)
app.use('/api/teachers_manager', teachersManagerRouter);

// Academic Manager (Distributions & Grading Tracker)
app.use('/api/academic_manager', academicManagerRouter);

// Live Chat (Mobile App & Web Messenger)
app.use('/api/live_chat', liveChatRouter);

// Student & Teacher Mobile App Feature Gateways
app.use('/api/student_app', studentAppRouter);
app.use('/api/teacher_app', teacherAppRouter);

// Staff / Teacher Attendance & Leave Management
app.use('/api/staff-attendance', staffAttendanceRouter);
app.use('/api/staff-leaves', staffLeavesRouter);
app.use('/api/teacher_app/staff-attendance', staffAttendanceRouter);
app.use('/api/teacher_app/staff-leaves', staffLeavesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  if (err.name === 'ZodError' || err.issues) {
    const issues = err.issues || err.errors || [];
    const formattedIssues = issues.map((i) => {
      const field = i.path && i.path.length > 0 ? i.path.join('.') : 'request';
      return {
        field,
        message: i.message,
        code: i.code
      };
    });

    const primaryMessage = formattedIssues.length > 0
      ? `${formattedIssues[0].field}: ${formattedIssues[0].message}`
      : (err.message || 'Validation failed');

    const allMessages = formattedIssues.map(i => `${i.field}: ${i.message}`).join('; ');

    return res.status(400).json({
      success: false,
      message: allMessages || primaryMessage,
      error: {
        code: 'VALIDATION_ERROR',
        message: allMessages || primaryMessage,
        details: formattedIssues,
        fields: formattedIssues.reduce((acc, curr) => {
          acc[curr.field] = curr.message;
          return acc;
        }, {})
      }
    });
  }

  // Handle PostgreSQL foreign key violations
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Referenced entity (school tenant or user) does not exist.'
      }
    });
  }

  // Handle PostgreSQL unique violations
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: err.detail || 'A record with these details already exists.',
      error: {
        code: 'DUPLICATE_ENTRY',
        message: err.detail || 'A record with these details already exists.'
      }
    });
  }

  const status = err.status || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred.';

  if (status >= 500) {
    console.error('💥 Server Error:', err);
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

export default app;
