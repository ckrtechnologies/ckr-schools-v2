import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import KPITiles from './components/KPITiles.jsx';
import ClassesView from './components/ClassesView.jsx';
import SubjectsTable from './components/SubjectsTable.jsx';
import RoomsView from './components/RoomsView.jsx';
import StudentsTable from './components/StudentsTable.jsx';
import StudentProfileDrawer from './components/StudentProfileDrawer.jsx';
import EnrollStudentModal from './components/EnrollStudentModal.jsx';
import StaffView from './components/StaffView.jsx';
import AdmissionsDesk from './components/AdmissionsDesk.jsx';
import NewEnquiryModal from './components/NewEnquiryModal.jsx';
import ApproveAdmissionModal from './components/ApproveAdmissionModal.jsx';
import FinanceDesk from './components/FinanceDesk.jsx';
import LoginView from './components/LoginView.jsx';

import {
  useGetDashboardStatsQuery,
  useGetClassesQuery,
  useCreateClassMutation,
  useDeleteClassMutation,
  useGetSubjectsQuery,
  useCreateSubjectMutation,
  useDeleteSubjectMutation,
  useGetRoomsQuery,
  useCreateRoomMutation,
  useDeleteRoomMutation,
  useGetStudentsQuery,
  useGetStaffQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetEnquiriesQuery,
  useCreateEnquiryMutation,
  useApproveEnquiryMutation,
  useDeleteEnquiryMutation,
  useGetFeeStructuresQuery,
  useCreateFeeStructureMutation,
  useDeleteFeeStructureMutation,
  useGetAllPaymentsQuery,
  useCollectFeeMutation,
  useGetFinanceStatsQuery
} from './store/schoolApi.js';

import { setSelectedClassId, setActiveTab } from './store/filtersSlice.js';

export default function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const activeTab = useSelector((state) => state.filters.activeTab);

  // Modals state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [isNewEnquiryOpen, setIsNewEnquiryOpen] = useState(false);
  const [approvingEnquiry, setApprovingEnquiry] = useState(null);

  // RTK Queries
  const { data: statsData, isLoading: isStatsLoading } = useGetDashboardStatsQuery(undefined, {
    skip: !isAuthenticated
  });

  const { data: classesData, isLoading: isClassesLoading } = useGetClassesQuery(undefined, {
    skip: !isAuthenticated
  });

  const { data: subjectsData, isLoading: isSubjectsLoading } = useGetSubjectsQuery(undefined, {
    skip: !isAuthenticated
  });

  const { data: roomsData, isLoading: isRoomsLoading } = useGetRoomsQuery(undefined, {
    skip: !isAuthenticated
  });

  const { data: studentsData, isLoading: isStudentsLoading } = useGetStudentsQuery(undefined, {
    skip: !isAuthenticated
  });

  const { data: staffData, isLoading: isStaffLoading } = useGetStaffQuery(undefined, {
    skip: !isAuthenticated
  });

  const { data: enquiriesData, isLoading: isEnquiriesLoading } = useGetEnquiriesQuery(undefined, {
    skip: !isAuthenticated
  });

  const { data: feeStructuresData, isLoading: isStructuresLoading } = useGetFeeStructuresQuery(undefined, {
    skip: !isAuthenticated
  });

  const { data: paymentsData, isLoading: isPaymentsLoading } = useGetAllPaymentsQuery(undefined, {
    skip: !isAuthenticated
  });

  const { data: financeStatsData } = useGetFinanceStatsQuery(undefined, {
    skip: !isAuthenticated
  });

  // Mutations
  const [createClass] = useCreateClassMutation();
  const [deleteClass] = useDeleteClassMutation();
  const [createSubject] = useCreateSubjectMutation();
  const [deleteSubject] = useDeleteSubjectMutation();
  const [createRoom] = useCreateRoomMutation();
  const [deleteRoom] = useDeleteRoomMutation();
  const [createUser, { isLoading: isEnrolling }] = useCreateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [createEnquiry, { isLoading: isCreatingEnquiry }] = useCreateEnquiryMutation();
  const [approveEnquiry, { isLoading: isApprovingEnquiry }] = useApproveEnquiryMutation();
  const [deleteEnquiry] = useDeleteEnquiryMutation();
  const [createFeeStructure] = useCreateFeeStructureMutation();
  const [deleteFeeStructure] = useDeleteFeeStructureMutation();
  const [collectFee, { isLoading: isCollectingFee }] = useCollectFeeMutation();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const stats = statsData?.data;
  const classes = classesData?.data || classesData || [];
  const subjects = subjectsData?.data || subjectsData || [];
  const rooms = roomsData?.data || roomsData || [];
  const students = studentsData?.users || studentsData?.data || [];
  const staff = staffData?.users || staffData?.data || [];
  const enquiries = enquiriesData?.newUsers || enquiriesData?.data || [];
  const feeStructures = feeStructuresData?.feeStructures || feeStructuresData?.data || [];
  const payments = paymentsData?.payments || paymentsData?.data || [];
  const financeStats = financeStatsData?.data || null;

  const handleCreateClass = async (payload) => {
    await createClass(payload).unwrap();
  };

  const handleDeleteClass = async (id) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      await deleteClass(id).unwrap();
    }
  };

  const handleCreateSubject = async (payload) => {
    await createSubject(payload).unwrap();
  };

  const handleDeleteSubject = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      await deleteSubject(id).unwrap();
    }
  };

  const handleCreateRoom = async (payload) => {
    await createRoom(payload).unwrap();
  };

  const handleDeleteRoom = async (id) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      await deleteRoom(id).unwrap();
    }
  };

  const handleEnrollStudent = async (payload) => {
    try {
      await createUser(payload).unwrap();
      setIsEnrollOpen(false);
    } catch (err) {
      alert('Failed to enroll student: ' + (err.data?.message || err.message));
    }
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm('Are you sure you want to delete this student record?')) {
      await deleteUser(id).unwrap();
      if (selectedStudent && selectedStudent.id === id) {
        setSelectedStudent(null);
      }
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (window.confirm('Are you sure you want to remove this teacher from staff roster?')) {
      await deleteUser(id).unwrap();
    }
  };

  const handleCreateEnquiry = async (formData) => {
    try {
      await createEnquiry(formData).unwrap();
      setIsNewEnquiryOpen(false);
    } catch (err) {
      alert('Failed to register application: ' + (err.data?.message || err.message));
    }
  };

  const handleApproveEnquiry = async (approvalData) => {
    try {
      await approveEnquiry(approvalData).unwrap();
      setApprovingEnquiry(null);
    } catch (err) {
      alert('Failed to matriculate student: ' + (err.data?.message || err.message));
    }
  };

  const handleDeleteEnquiry = async (id) => {
    if (window.confirm('Are you sure you want to delete this application lead?')) {
      await deleteEnquiry(id).unwrap();
    }
  };

  const handleCollectFee = async (payload) => {
    return await collectFee(payload);
  };

  const handleCreateFeeStructure = async (payload) => {
    await createFeeStructure(payload).unwrap();
  };

  const handleDeleteFeeStructure = async (id) => {
    if (window.confirm('Are you sure you want to delete this fee head structure?')) {
      await deleteFeeStructure(id).unwrap();
    }
  };

  const handleSelectClass = (cls) => {
    dispatch(setSelectedClassId(cls.id));
    dispatch(setActiveTab('Students'));
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* 2.1 One-word Sidebar */}
      <Sidebar />

      {/* Main Canvas (Full-Canvas Zero-Margin Layout: 100% width, sleek 16px 20px padding) */}
      <div style={{
        marginLeft: '220px',
        width: 'calc(100% - 220px)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 2.2 Sticky Top Title Bar with Mouseover Avatar Menu */}
        <TopBar />

        {/* Dynamic Center Canvas Content */}
        <main style={{ padding: '16px 20px', flex: 1 }}>
          {activeTab === 'Overview' && (
            <div>
              {/* 3.1 Overview Dashboard: Strictly ≤ 4 KPI Tiles */}
              <KPITiles stats={stats} isLoading={isStatsLoading} />

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                      Campus Classes & Active Sections
                    </h3>
                  </div>
                  <ClassesView
                    classes={classes.slice(0, 6)}
                    isLoading={isClassesLoading}
                    onCreateClass={handleCreateClass}
                    onDeleteClass={handleDeleteClass}
                    onSelectClass={handleSelectClass}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                      Scholastic Subject Master
                    </h3>
                  </div>
                  <SubjectsTable
                    subjects={subjects}
                    isLoading={isSubjectsLoading}
                    onCreateSubject={handleCreateSubject}
                    onDeleteSubject={handleDeleteSubject}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Classes' && (
            <ClassesView
              classes={classes}
              isLoading={isClassesLoading}
              onCreateClass={handleCreateClass}
              onDeleteClass={handleDeleteClass}
              onSelectClass={handleSelectClass}
            />
          )}

          {activeTab === 'Subjects' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                  Scholastic & Co-Scholastic Subject Directory
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  Master catalog of academic disciplines, departments, and course curricula
                </p>
              </div>
              <SubjectsTable
                subjects={subjects}
                isLoading={isSubjectsLoading}
                onCreateSubject={handleCreateSubject}
                onDeleteSubject={handleDeleteSubject}
              />
            </div>
          )}

          {activeTab === 'Rooms' && (
            <RoomsView
              rooms={rooms}
              isLoading={isRoomsLoading}
              onCreateRoom={handleCreateRoom}
              onDeleteRoom={handleDeleteRoom}
            />
          )}

          {activeTab === 'Students' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                  Enrolled Students Directory
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  Academic roster with roll numbers, parent contact details, and student 360° profiles
                </p>
              </div>
              <StudentsTable
                students={students}
                classes={classes}
                isLoading={isStudentsLoading}
                onSelectStudent={setSelectedStudent}
                onOpenEnroll={() => setIsEnrollOpen(true)}
                onDeleteStudent={handleDeleteStudent}
              />
            </div>
          )}

          {activeTab === 'Staff' && (
            <StaffView
              staff={staff}
              isLoading={isStaffLoading}
              onOpenAddTeacher={() => alert('Onboard teacher modal trigger')}
              onDeleteTeacher={handleDeleteTeacher}
            />
          )}

          {activeTab === 'Admissions' && (
            <AdmissionsDesk
              enquiries={enquiries}
              classes={classes}
              isLoading={isEnquiriesLoading}
              onOpenNewEnquiry={() => setIsNewEnquiryOpen(true)}
              onOpenApproveModal={(item) => setApprovingEnquiry(item)}
              onDeleteEnquiry={handleDeleteEnquiry}
            />
          )}

          {activeTab === 'Finance' && (
            <FinanceDesk
              students={students}
              classes={classes}
              payments={payments}
              structures={feeStructures}
              stats={financeStats}
              isLoadingPayments={isPaymentsLoading}
              isLoadingStructures={isStructuresLoading}
              onCollectFee={handleCollectFee}
              onCreateStructure={handleCreateFeeStructure}
              onDeleteStructure={handleDeleteFeeStructure}
            />
          )}

          {/* Fallback for subsequent planned surfaces */}
          {!['Overview', 'Classes', 'Subjects', 'Rooms', 'Students', 'Staff', 'Admissions', 'Finance'].includes(activeTab) && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '60px 20px',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                {activeTab} Management Desk
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
                Surface mapped in Phase Roadmap. Backend endpoints ready on port 5006.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Dedicated Student 360° Profile Drawer */}
      <StudentProfileDrawer
        student={selectedStudent}
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
      />

      {/* Enroll Student Modal */}
      <EnrollStudentModal
        isOpen={isEnrollOpen}
        onClose={() => setIsEnrollOpen(false)}
        classes={classes}
        onEnroll={handleEnrollStudent}
        isLoading={isEnrolling}
      />

      {/* New Admission Enquiry Modal */}
      <NewEnquiryModal
        isOpen={isNewEnquiryOpen}
        onClose={() => setIsNewEnquiryOpen(false)}
        classes={classes}
        onSubmit={handleCreateEnquiry}
        isLoading={isCreatingEnquiry}
      />

      {/* Approve & Matriculate Modal */}
      <ApproveAdmissionModal
        isOpen={Boolean(approvingEnquiry)}
        onClose={() => setApprovingEnquiry(null)}
        enquiry={approvingEnquiry}
        classes={classes}
        onApprove={handleApproveEnquiry}
        isLoading={isApprovingEnquiry}
      />
    </div>
  );
}
