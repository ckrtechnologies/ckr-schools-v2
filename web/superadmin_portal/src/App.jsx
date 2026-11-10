import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import KPITiles from './components/KPITiles.jsx';
import SchoolsTable from './components/SchoolsTable.jsx';
import OnboardSchoolModal from './components/OnboardSchoolModal.jsx';
import EditSchoolModal from './components/EditSchoolModal.jsx';
import DeleteSchoolModal from './components/DeleteSchoolModal.jsx';
import SchoolDetailModal from './components/SchoolDetailModal.jsx';
import BillingView from './components/BillingView.jsx';
import AuditView from './components/AuditView.jsx';
import MarketplaceLeadsView from './components/MarketplaceLeadsView.jsx';
import MarketplaceReviewsView from './components/MarketplaceReviewsView.jsx';
import LoginView from './components/LoginView.jsx';

import {
  useGetStatsQuery,
  useGetTenantsQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useToggleTenantStatusMutation,
  useDeleteTenantMutation,
  useToggleSchoolFeaturedMutation
} from './store/superadminApi.js';

import {
  setSearchQuery,
  setPlanFilter
} from './store/filtersSlice.js';

export default function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const activeTab = useSelector((state) => state.filters.activeTab);
  const dateRange = useSelector((state) => state.filters.dateRange);
  const searchQuery = useSelector((state) => state.filters.searchQuery);
  const planFilter = useSelector((state) => state.filters.planFilter);

  // Pagination & Sorting state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50); // CKR Standard default: 50
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [editingSchool, setEditingSchool] = useState(null);
  const [deletingSchool, setDeletingSchool] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [editErrorMessage, setEditErrorMessage] = useState('');

  // RTK Queries
  const { data: statsData, isLoading: isStatsLoading } = useGetStatsQuery(undefined, {
    skip: !isAuthenticated
  });

  const { data: tenantsData, isLoading: isTenantsLoading } = useGetTenantsQuery({
    search: searchQuery,
    planTier: planFilter,
    page,
    limit,
    sortBy,
    sortOrder
  }, {
    skip: !isAuthenticated
  });

  const [createTenant, { isLoading: isCreating }] = useCreateTenantMutation();
  const [updateTenant, { isLoading: isUpdating }] = useUpdateTenantMutation();
  const [toggleTenantStatus] = useToggleTenantStatusMutation();
  const [deleteTenant, { isLoading: isDeleting }] = useDeleteTenantMutation();
  const [toggleSchoolFeatured] = useToggleSchoolFeaturedMutation();

  const handleToggleFeatured = async (tenantId, currentFeatured) => {
    try {
      await toggleSchoolFeatured({ tenantId, is_featured: !currentFeatured }).unwrap();
    } catch (err) {
      alert('Failed to update featured status: ' + (err.data?.message || err.message));
    }
  };

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const stats = statsData?.data;
  const schools = tenantsData?.data || [];
  const pagination = tenantsData?.pagination || {};

  const handleCreateSchool = async (formData) => {
    setErrorMessage('');
    try {
      const res = await createTenant(formData).unwrap();
      if (res.success) {
        setIsOnboardOpen(false);
      }
    } catch (err) {
      setErrorMessage(err.data?.error?.message || err.data?.message || 'Failed to onboard school.');
    }
  };

  const handleUpdateSchool = async (formData) => {
    setEditErrorMessage('');
    try {
      const { id, ...body } = formData;
      const res = await updateTenant({ id, ...body }).unwrap();
      if (res.success) {
        setEditingSchool(null);
        if (selectedSchool && selectedSchool.id === id) {
          setSelectedSchool(res.data);
        }
      }
    } catch (err) {
      setEditErrorMessage(err.data?.error?.message || err.data?.message || 'Failed to update school.');
    }
  };

  const handleDeleteSchool = async (id) => {
    try {
      const res = await deleteTenant(id).unwrap();
      if (res.success) {
        setDeletingSchool(null);
        if (selectedSchool && selectedSchool.id === id) {
          setSelectedSchool(null);
        }
      }
    } catch (err) {
      alert('Failed to delete school: ' + (err.data?.message || err.message));
    }
  };

  const handleToggleStatus = async (id, isActive) => {
    try {
      await toggleTenantStatus({ id, isActive }).unwrap();
      if (selectedSchool && selectedSchool.id === id) {
        setSelectedSchool(prev => ({ ...prev, is_active: isActive }));
      }
    } catch (err) {
      alert('Failed to update status: ' + (err.data?.message || err.message));
    }
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

              <div style={{ marginTop: '20px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                    Campus Registry (Recently Provisioned)
                  </h2>
                </div>

                <SchoolsTable
                  schools={schools}
                  pagination={pagination}
                  isLoading={isTenantsLoading}
                  search={searchQuery}
                  onSearchChange={(q) => dispatch(setSearchQuery(q))}
                  planFilter={planFilter}
                  onPlanFilterChange={(p) => dispatch(setPlanFilter(p))}
                  page={page}
                  onPageChange={setPage}
                  limit={limit}
                  onLimitChange={setLimit}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={(col, ord) => {
                    setSortBy(col);
                    setSortOrder(ord);
                  }}
                  onOpenOnboard={() => setIsOnboardOpen(true)}
                  onSelectSchool={setSelectedSchool}
                  onEditSchool={(s) => setEditingSchool(s)}
                  onDeleteSchool={(s) => setDeletingSchool(s)}
                  onToggleStatus={handleToggleStatus}
                  onToggleFeatured={handleToggleFeatured}
                />
              </div>
            </div>
          )}

          {activeTab === 'Schools' && (
            <div>
              <SchoolsTable
                schools={schools}
                pagination={pagination}
                isLoading={isTenantsLoading}
                search={searchQuery}
                onSearchChange={(q) => dispatch(setSearchQuery(q))}
                planFilter={planFilter}
                onPlanFilterChange={(p) => dispatch(setPlanFilter(p))}
                page={page}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={setLimit}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={(col, ord) => {
                  setSortBy(col);
                  setSortOrder(ord);
                }}
                onOpenOnboard={() => setIsOnboardOpen(true)}
                onSelectSchool={setSelectedSchool}
                onEditSchool={(s) => setEditingSchool(s)}
                onDeleteSchool={(s) => setDeletingSchool(s)}
                onToggleStatus={handleToggleStatus}
                onToggleFeatured={handleToggleFeatured}
              />
            </div>
          )}

          {activeTab === 'Leads' && (
            <MarketplaceLeadsView />
          )}

          {activeTab === 'Reviews' && (
            <MarketplaceReviewsView />
          )}

          {activeTab === 'Billing' && (
            <BillingView stats={stats} />
          )}

          {activeTab === 'Audit' && (
            <AuditView />
          )}
        </main>
      </div>

      {/* Onboard School Modal */}
      <OnboardSchoolModal
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        onSubmit={handleCreateSchool}
        isLoading={isCreating}
        errorMessage={errorMessage}
      />

      {/* Edit School Modal */}
      <EditSchoolModal
        school={editingSchool}
        isOpen={Boolean(editingSchool)}
        onClose={() => setEditingSchool(null)}
        onUpdate={handleUpdateSchool}
        isLoading={isUpdating}
        errorMessage={editErrorMessage}
      />

      {/* Delete School Modal */}
      <DeleteSchoolModal
        school={deletingSchool}
        isOpen={Boolean(deletingSchool)}
        onClose={() => setDeletingSchool(null)}
        onConfirmDelete={handleDeleteSchool}
        isLoading={isDeleting}
      />

      {/* Dedicated Entity Detail Modal */}
      <SchoolDetailModal
        school={selectedSchool}
        isOpen={Boolean(selectedSchool)}
        onClose={() => setSelectedSchool(null)}
        onToggleStatus={handleToggleStatus}
        onEditSchool={(s) => setEditingSchool(s)}
        onDeleteSchool={(s) => setDeletingSchool(s)}
      />
    </div>
  );
}

