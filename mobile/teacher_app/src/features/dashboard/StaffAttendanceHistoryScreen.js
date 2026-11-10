import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors, shadows } from '../../theme/colors';
import CustomHeader from '../../components/CustomHeader';
import { useGetStaffAttendanceHistoryQuery } from '../../store/apiSlice';

export default function StaffAttendanceHistoryScreen({ navigation }) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const yearMonth = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [currentDate]);

  const monthLabel = useMemo(() => {
    return currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  const { data, isLoading, isFetching, refetch } = useGetStaffAttendanceHistoryQuery({ month: yearMonth });

  const historyData = data?.data || {};
  const stats = historyData.stats || { total: 0, present: 0, leave: 0, absent: 0, half_day: 0 };
  const records = historyData.records || [];

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const formatTimeStr = (isoStr) => {
    if (!isoStr) return '--:--';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '--:--';
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const formatDayName = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { weekday: 'long' });
    } catch (e) {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        title="My Attendance"
        showBack
        onBack={() => navigation.goBack()}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
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
          {/* Month Selector Bar */}
          <View style={styles.monthSelectorCard}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
              <Icon name="chevron-left" size={20} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.monthTitleBox}>
              <Icon name="calendar" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.monthTitleText}>{monthLabel}</Text>
            </View>

            <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn} activeOpacity={0.7}>
              <Icon name="chevron-right" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* 4 Summary Stats Pills */}
          <View style={styles.statsRow}>
            {/* Present */}
            <View style={[styles.statBox, { borderColor: colors.success + '40' }]}>
              <View style={[styles.statIconBox, { backgroundColor: colors.success + '15' }]}>
                <Icon name="check-circle" size={16} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: colors.success }]}>{stats.present || 0}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>

            {/* Leave */}
            <View style={[styles.statBox, { borderColor: (colors.warning || '#f59e0b') + '40' }]}>
              <View style={[styles.statIconBox, { backgroundColor: (colors.warning || '#f59e0b') + '15' }]}>
                <Icon name="calendar" size={16} color={colors.warning || '#d97706'} />
              </View>
              <Text style={[styles.statValue, { color: colors.warning || '#d97706' }]}>{stats.leave || 0}</Text>
              <Text style={styles.statLabel}>On Leave</Text>
            </View>

            {/* Half Day */}
            <View style={[styles.statBox, { borderColor: colors.primary + '40' }]}>
              <View style={[styles.statIconBox, { backgroundColor: colors.primary + '15' }]}>
                <Icon name="clock" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.half_day || 0}</Text>
              <Text style={styles.statLabel}>Half Day</Text>
            </View>

            {/* Absent */}
            <View style={[styles.statBox, { borderColor: colors.danger + '40' }]}>
              <View style={[styles.statIconBox, { backgroundColor: colors.danger + '15' }]}>
                <Icon name="x-circle" size={16} color={colors.danger} />
              </View>
              <Text style={[styles.statValue, { color: colors.danger }]}>{stats.absent || 0}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
          </View>

          {/* Section Title */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Daily Attendance Log</Text>
            <Text style={styles.sectionSubtitle}>{records.length} records</Text>
          </View>

          {/* Log List */}
          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading attendance records...</Text>
            </View>
          ) : records.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Icon name="calendar" size={32} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Records Found</Text>
              <Text style={styles.emptySub}>
                You have no attendance activity logged for {monthLabel}.
              </Text>
            </View>
          ) : (
            records.map((rec) => {
              const isPresent = rec.status === 'Present';
              const isLeave = rec.status === 'Leave';
              const isHalfDay = rec.status === 'Half-day';
              const isAbsent = rec.status === 'Absent';

              const badgeColor = isPresent ? colors.success
                : isLeave ? colors.warning || '#d97706'
                : isHalfDay ? colors.primary
                : colors.danger;

              const badgeBg = isPresent ? colors.success + '15'
                : isLeave ? (colors.warning || '#f59e0b') + '15'
                : isHalfDay ? colors.primary + '15'
                : colors.danger + '15';

              return (
                <View key={rec.id || rec.date} style={styles.recordCard}>
                  {/* Top: Date & Status Badge */}
                  <View style={styles.recordTopRow}>
                    <View>
                      <Text style={styles.recordDateText}>{formatDateDisplay(rec.date)}</Text>
                      <Text style={styles.recordDayName}>{formatDayName(rec.date)}</Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                      <View style={[styles.statusDot, { backgroundColor: badgeColor }]} />
                      <Text style={[styles.statusBadgeText, { color: badgeColor }]}>{rec.status}</Text>
                    </View>
                  </View>

                  {/* Punch In / Out Times */}
                  <View style={styles.punchDetailsRow}>
                    <View style={styles.punchItem}>
                      <View style={styles.punchIconCircle}>
                        <Icon name="log-in" size={13} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.punchLabel}>Punch In</Text>
                        <Text style={styles.punchTime}>{formatTimeStr(rec.check_in_time)}</Text>
                      </View>
                    </View>

                    <View style={styles.punchDivider} />

                    <View style={styles.punchItem}>
                      <View style={styles.punchIconCircle}>
                        <Icon name="log-out" size={13} color={colors.secondary} />
                      </View>
                      <View>
                        <Text style={styles.punchLabel}>Punch Out</Text>
                        <Text style={styles.punchTime}>{formatTimeStr(rec.check_out_time)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Source & Remarks */}
                  {rec.remarks ? (
                    <View style={styles.remarksBox}>
                      <Icon name="info" size={12} color={colors.textMuted} style={{ marginRight: 6, marginTop: 2 }} />
                      <Text style={styles.remarksText} numberOfLines={2}>{rec.remarks}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  monthSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 16,
    ...shadows.sm,
  },
  monthNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    ...shadows.sm,
  },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    ...shadows.sm,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  recordCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    ...shadows.sm,
  },
  recordTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recordDateText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  recordDayName: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  punchDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10,
  },
  punchItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  punchIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  punchLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  punchTime: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 1,
  },
  punchDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderLight || '#e2e8f0',
    marginHorizontal: 8,
  },
  remarksBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  remarksText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary || colors.textMuted,
    lineHeight: 15,
  },
});
