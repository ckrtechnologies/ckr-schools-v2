import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors, shadows } from '../../theme/colors';
import CustomHeader from '../../components/CustomHeader';
import CustomModal from '../../components/CustomModal';
import {
  useGetMyLeavesSummaryQuery,
  useApplyLeaveMutation,
  useCancelLeaveMutation
} from '../../store/apiSlice';

const LEAVE_TYPES = [
  { key: 'Casual Leave', label: 'Casual Leave', icon: 'coffee', color: colors.primary },
  { key: 'Sick Leave', label: 'Sick Leave', icon: 'activity', color: '#e11d48' },
  { key: 'Earned Leave', label: 'Earned Leave', icon: 'award', color: '#2563eb' },
  { key: 'Half Day', label: 'Half Day', icon: 'clock', color: '#d97706' },
  { key: 'Unpaid Leave', label: 'Unpaid Leave', icon: 'alert-circle', color: '#64748b' }
];

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDatePretty = (dateStr) => {
  if (!dateStr) return '';
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [y, m, day] = clean.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(day, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
};

const LeavesScreen = ({ navigation }) => {
  const today = useMemo(() => getTodayString(), []);
  const { data: leavesData, isLoading, refetch, isFetching } = useGetMyLeavesSummaryQuery();
  const [applyLeave, { isLoading: isApplying }] = useApplyLeaveMutation();
  const [cancelLeave, { isLoading: isCancelling }] = useCancelLeaveMutation();

  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Pending', 'Approved', 'Rejected'
  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);

  // Form State
  const [selectedType, setSelectedType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState('');

  // Feedback Modal
  const [feedbackModal, setFeedbackModal] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onPrimaryPress: null
  });

  const balance = leavesData?.data?.balance;
  const applications = leavesData?.data?.applications || [];

  const filteredApplications = useMemo(() => {
    if (activeTab === 'All') return applications;
    return applications.filter(
      (app) => (app.status || '').toLowerCase() === activeTab.toLowerCase()
    );
  }, [applications, activeTab]);

  const handleOpenApplyModal = () => {
    setSelectedType('Casual Leave');
    setStartDate(today);
    setEndDate(today);
    setReason('');
    setIsApplyModalVisible(true);
  };

  const handleSubmitLeave = async () => {
    if (!reason.trim()) {
      setFeedbackModal({
        visible: true,
        type: 'error',
        title: 'Reason Required',
        message: 'Please provide a brief reason for your leave request.',
        onPrimaryPress: () => setFeedbackModal({ visible: false })
      });
      return;
    }

    if (endDate < startDate) {
      setFeedbackModal({
        visible: true,
        type: 'error',
        title: 'Invalid Dates',
        message: 'End date cannot be earlier than start date.',
        onPrimaryPress: () => setFeedbackModal({ visible: false })
      });
      return;
    }

    try {
      await applyLeave({
        leave_type: selectedType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim()
      }).unwrap();

      setIsApplyModalVisible(false);
      setFeedbackModal({
        visible: true,
        type: 'success',
        title: 'Application Submitted',
        message: 'Your leave application has been submitted to Admin for approval.',
        onPrimaryPress: () => {
          setFeedbackModal({ visible: false });
          refetch();
        }
      });
    } catch (err) {
      setFeedbackModal({
        visible: true,
        type: 'error',
        title: 'Submission Failed',
        message: err?.data?.error?.message || err?.message || 'Could not submit leave request.',
        onPrimaryPress: () => setFeedbackModal({ visible: false })
      });
    }
  };

  const handleCancelApplication = (appId) => {
    Alert.alert(
      'Cancel Leave Application',
      'Are you sure you want to cancel this pending leave request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelLeave(appId).unwrap();
              refetch();
            } catch (err) {
              setFeedbackModal({
                visible: true,
                type: 'error',
                title: 'Cancel Failed',
                message: err?.data?.error?.message || 'Could not cancel application.',
                onPrimaryPress: () => setFeedbackModal({ visible: false })
              });
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'approved':
        return colors.success;
      case 'rejected':
        return colors.danger;
      case 'pending':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <CustomHeader title="Leave Management" showBack={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            colors={[colors.primary]}
          />
        }
      >
        {/* Top Balance Summary Cards */}
        <View style={styles.balanceSection}>
          <Text style={styles.sectionHeader}>Leave Entitlements (2026-27)</Text>
          <View style={styles.balanceGrid}>
            <View style={[styles.balanceCard, { borderColor: colors.primary + '30' }]}>
              <View style={[styles.balanceIconBox, { backgroundColor: colors.primary + '15' }]}>
                <Icon name="coffee" size={18} color={colors.primary} />
              </View>
              <Text style={styles.balanceCount}>
                {balance ? balance.casual.remaining : '--'}
              </Text>
              <Text style={styles.balanceLabel}>Casual Leave</Text>
              <Text style={styles.balanceSub}>
                {balance ? `${balance.casual.used} used of ${balance.casual.total}` : ''}
              </Text>
            </View>

            <View style={[styles.balanceCard, { borderColor: '#e11d4830' }]}>
              <View style={[styles.balanceIconBox, { backgroundColor: '#e11d4815' }]}>
                <Icon name="activity" size={18} color="#e11d48" />
              </View>
              <Text style={[styles.balanceCount, { color: '#e11d48' }]}>
                {balance ? balance.sick.remaining : '--'}
              </Text>
              <Text style={styles.balanceLabel}>Sick Leave</Text>
              <Text style={styles.balanceSub}>
                {balance ? `${balance.sick.used} used of ${balance.sick.total}` : ''}
              </Text>
            </View>

            <View style={[styles.balanceCard, { borderColor: '#2563eb30' }]}>
              <View style={[styles.balanceIconBox, { backgroundColor: '#2563eb15' }]}>
                <Icon name="award" size={18} color="#2563eb" />
              </View>
              <Text style={[styles.balanceCount, { color: '#2563eb' }]}>
                {balance ? balance.earned.remaining : '--'}
              </Text>
              <Text style={styles.balanceLabel}>Earned Leave</Text>
              <Text style={styles.balanceSub}>
                {balance ? `${balance.earned.used} used of ${balance.earned.total}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Apply CTA Card */}
        <TouchableOpacity
          style={styles.applyCtaCard}
          onPress={handleOpenApplyModal}
          activeOpacity={0.85}
        >
          <View style={styles.applyIconBox}>
            <Icon name="plus-circle" size={24} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.applyTitle}>Apply for Leave</Text>
            <Text style={styles.applySub}>Submit a new leave application to administration</Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Applications History Section */}
        <View style={styles.historySection}>
          <View style={styles.historyHeaderRow}>
            <Text style={styles.sectionHeader}>Leave Applications</Text>
            <Text style={styles.historyCount}>{applications.length} Total</Text>
          </View>

          {/* Filter Pills */}
          <View style={styles.tabPillsRow}>
            {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    activeTab === tab && styles.tabPillTextActive
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isLoading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: 30 }}
              size="large"
            />
          ) : filteredApplications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="calendar" size={40} color={colors.border} />
              <Text style={styles.emptyTitle}>No Applications Found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'All'
                  ? 'You have not submitted any leave applications yet.'
                  : `No ${activeTab.toLowerCase()} leave applications.`}
              </Text>
            </View>
          ) : (
            filteredApplications.map((app) => {
              const statusColor = getStatusColor(app.status);
              const isPending = (app.status || '').toLowerCase() === 'pending';

              return (
                <View key={app.id} style={styles.appCard}>
                  <View style={styles.appHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.appType}>{app.leave_type}</Text>
                      <Text style={styles.appDates}>
                        {formatDatePretty(app.start_date)}
                        {app.start_date !== app.end_date
                          ? ` → ${formatDatePretty(app.end_date)}`
                          : ''}
                        {'  '}
                        <Text style={{ fontWeight: '800', color: colors.text }}>
                          ({app.days_count} {Number(app.days_count) > 1 ? 'Days' : 'Day'})
                        </Text>
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusColor + '18' }
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {app.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonLabel}>Reason:</Text>
                    <Text style={styles.reasonText}>{app.reason}</Text>
                  </View>

                  {app.admin_remarks ? (
                    <View style={styles.adminRemarksBox}>
                      <Icon
                        name="message-square"
                        size={12}
                        color={colors.textMuted}
                        style={{ marginTop: 2, marginRight: 6 }}
                      />
                      <Text style={styles.adminRemarksText}>
                        Admin: {app.admin_remarks}
                      </Text>
                    </View>
                  ) : null}

                  {isPending && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancelApplication(app.id)}
                      disabled={isCancelling}
                      activeOpacity={0.7}
                    >
                      <Icon name="x-circle" size={13} color={colors.danger} />
                      <Text style={styles.cancelBtnText}>Cancel Request</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Apply Leave Modal */}
      <Modal
        visible={isApplyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsApplyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Apply for Leave</Text>
                <Text style={styles.modalSubtitle}>Select leave category and dates</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsApplyModalVisible(false)}
              >
                <Icon name="x" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* Leave Type Selector */}
              <Text style={styles.inputLabel}>Leave Type</Text>
              <View style={styles.leaveTypeGrid}>
                {LEAVE_TYPES.map((type) => {
                  const isSelected = selectedType === type.key;
                  return (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.leaveTypePill,
                        isSelected && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary
                        }
                      ]}
                      onPress={() => setSelectedType(type.key)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.leaveTypePillText,
                          isSelected && { color: '#ffffff' }
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Start Date */}
              <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.dateInput}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />

              {/* End Date */}
              <Text style={styles.inputLabel}>End Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.dateInput}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />

              {/* Reason */}
              <Text style={styles.inputLabel}>Reason / Remarks *</Text>
              <TextInput
                style={[styles.dateInput, styles.reasonInput]}
                value={reason}
                onChangeText={setReason}
                placeholder="Explain the purpose of your leave..."
                placeholderTextColor={colors.textMuted}
                multiline={true}
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setIsApplyModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitModalBtn, isApplying && { opacity: 0.6 }]}
                onPress={handleSubmitLeave}
                disabled={isApplying}
                activeOpacity={0.8}
              >
                {isApplying ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Icon name="check" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.submitModalText}>Submit Application</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <CustomModal
        visible={feedbackModal.visible}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        primaryButtonText="OK"
        onPrimaryPress={feedbackModal.onPrimaryPress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 18, paddingBottom: 50 },

  balanceSection: { marginBottom: 16 },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 12 },
  balanceGrid: { flexDirection: 'row', gap: 10 },
  balanceCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm
  },
  balanceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6
  },
  balanceCount: { fontSize: 20, fontWeight: '900', color: colors.primary },
  balanceLabel: { fontSize: 11, fontWeight: '700', color: colors.text, marginTop: 2, textAlign: 'center' },
  balanceSub: { fontSize: 9, color: colors.textMuted, marginTop: 2, textAlign: 'center' },

  applyCtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    ...shadows.card
  },
  applyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  applyTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  applySub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  historySection: { marginTop: 4 },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  historyCount: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  tabPillsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  tabPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  tabPillText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  tabPillTextActive: { color: '#ffffff' },

  emptyContainer: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 10 },
  emptySubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: 'center' },

  appCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm
  },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  appType: { fontSize: 15, fontWeight: '800', color: colors.text },
  appDates: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  statusText: { fontSize: 11, fontWeight: '800' },
  reasonBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  reasonLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  reasonText: { fontSize: 13, color: colors.text, marginTop: 2, lineHeight: 18 },
  adminRemarksBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 8,
    marginTop: 8
  },
  adminRemarksText: { fontSize: 11, color: colors.textSecondary, flex: 1, fontStyle: 'italic' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  cancelBtnText: { fontSize: 11, fontWeight: '700', color: colors.danger },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    ...shadows.card
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  modalCloseBtn: { padding: 4 },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 10
  },
  leaveTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  leaveTypePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  leaveTypePillText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  dateInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600'
  },
  reasonInput: { height: 75, textAlignVertical: 'top' },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelModalText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  submitModalBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitModalText: { fontSize: 14, fontWeight: '800', color: '#ffffff' }
});

export default LeavesScreen;
