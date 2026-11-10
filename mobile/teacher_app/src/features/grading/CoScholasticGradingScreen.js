import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import {
  useGetTeacherClassesQuery,
  useGetCoScholasticGradesQuery,
  useSubmitCoScholasticGradesMutation,
} from '../../store/apiSlice';
import { colors, shadows } from '../../theme/colors';
import CustomHeader from '../../components/CustomHeader';
import CustomModal from '../../components/CustomModal';
import UserAvatar from '../../components/UserAvatar';

const GRADE_PILLS = ['A', 'B', 'C', 'D'];
const ACTIVITIES = [
  { key: 'physical_education', label: 'Physical & Health' },
  { key: 'discipline', label: 'Discipline' },
  { key: 'work_education', label: 'Work Education' },
  { key: 'art_education', label: 'Art Education' },
  { key: 'gk', label: 'General Knowledge' },
];

const CoScholasticGradingScreen = ({ navigation, route }) => {
  const { activeClassId, activeClassName } = useSelector((state) => state.app);
  const { data: classesData } = useGetTeacherClassesQuery();
  
  const [selectedClassId, setSelectedClassId] = useState(activeClassId || '');
  const [selectedTerm, setSelectedTerm] = useState('Term1');
  const [students, setStudents] = useState([]);

  const [modalState, setModalState] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    primaryButtonText: 'OK',
    onPrimaryPress: null,
  });

  const {
    data: gradesData,
    isLoading: loading,
    refetch,
    isFetching,
  } = useGetCoScholasticGradesQuery(
    { classId: selectedClassId, term: selectedTerm },
    { skip: !selectedClassId || !selectedTerm }
  );

  const [submitCoScholasticGrades, { isLoading: saving }] =
    useSubmitCoScholasticGradesMutation();

  useEffect(() => {
    const list = Array.isArray(gradesData) ? gradesData : (gradesData?.data || []);
    if (Array.isArray(list)) {
      setStudents(list);
    }
  }, [gradesData]);

  // Keep selectedClassId synced with activeClassId from header dropdown
  useEffect(() => {
    if (activeClassId) {
      setSelectedClassId(activeClassId);
    }
  }, [activeClassId]);

  // Set default class if not set
  useEffect(() => {
    if (!selectedClassId && classesData?.classes && classesData.classes.length > 0) {
      setSelectedClassId(classesData.classes[0].id);
    }
  }, [classesData, selectedClassId]);

  const allowedKeys = gradesData?.allowed_activities;
  const isClassTeacher = gradesData?.is_class_teacher;

  // Activities the logged-in teacher can edit
  const editableActivities = React.useMemo(() => {
    if (Array.isArray(allowedKeys) && allowedKeys.length > 0) {
      return ACTIVITIES.filter((a) => allowedKeys.includes(a.key));
    }
    return ACTIVITIES;
  }, [allowedKeys]);

  // Keep visibleActivities for quick-fill and save payload (editable ones only)
  const visibleActivities = editableActivities;

  const handleGradeSelect = (studentId, activityKey, grade) => {
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, [activityKey]: grade } : s))
    );
  };

  const handleQuickFillAll = (gradeVal = 'A') => {
    setStudents((prev) =>
      prev.map((s) => {
        const updated = { ...s };
        visibleActivities.forEach((act) => {
          updated[act.key] = gradeVal;
        });
        return updated;
      })
    );
    setModalState({
      visible: true,
      type: 'success',
      title: 'Quick Fill Applied',
      message: `Set your assigned activity grades to "${gradeVal}". Tap "Save Grades" to persist.`,
      primaryButtonText: 'Got It',
      onPrimaryPress: () => setModalState({ visible: false }),
    });
  };

  const handleSave = async () => {
    if (!selectedClassId || !selectedTerm || students.length === 0) return;

    try {
      const payload = students.map((s) => {
        const item = { student_id: s.student_id };
        visibleActivities.forEach((act) => {
          item[act.key] = s[act.key] || 'A';
        });
        return item;
      });

      await submitCoScholasticGrades({
        classId: selectedClassId,
        term: selectedTerm,
        grades: payload,
      }).unwrap();

      setModalState({
        visible: true,
        type: 'success',
        title: 'Grades Saved Successfully',
        message: `Your ratings for ${students.length} students have been saved.`,
        primaryButtonText: 'Done',
        onPrimaryPress: () => {
          setModalState({ visible: false });
          refetch();
        },
      });
    } catch (err) {
      setModalState({
        visible: true,
        type: 'error',
        title: 'Save Failed',
        message: err.data?.message || err.message || 'Could not save grades.',
        primaryButtonText: 'OK',
        onPrimaryPress: () => setModalState({ visible: false }),
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <CustomHeader title="Co-Scholastic Grading" showBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} colors={[colors.primary]} />}
      >
        {/* Term & Quick Fill Header */}
        <View style={styles.topControlCard}>
          <View style={styles.termSelectorRow}>
            <Text style={styles.controlLabel}>Select Term:</Text>
            <View style={styles.termPills}>
              {['Term1', 'Term2'].map((term) => (
                <TouchableOpacity
                  key={term}
                  style={[styles.termPill, selectedTerm === term && styles.termPillActive]}
                  onPress={() => setSelectedTerm(term)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.termPillText, selectedTerm === term && styles.termPillTextActive]}>
                    {term}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.quickFillBtn}
            onPress={() => handleQuickFillAll('A')}
            activeOpacity={0.8}
          >
            <Icon name="sparkles" size={14} color={colors.primary} />
            <Text style={styles.quickFillBtnText}>Set All to "A"</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.roleBanner}>
          <Icon name="user-check" size={14} color={colors.primary} />
          <Text style={styles.roleBannerText}>
            Your Assigned Activity: {visibleActivities.map((a) => a.label).join(", ")}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Students Assessment ({students.length})</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : students.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="users" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No students found for this class.</Text>
          </View>
        ) : (
          students.map((student, idx) => (
            <View key={student.student_id} style={styles.studentCard}>
              <View style={styles.studentHeader}>
                <UserAvatar url={student.avatar_url} name={student.name || 'S'} size={40} />
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {student.name}
                  </Text>
                  <Text style={styles.studentMeta}>
                    Roll: {student.roll_number || idx + 1} • GR: {student.admission_number || '--'}
                  </Text>
                </View>
                {student.is_persisted && (
                  <View style={styles.savedBadge}>
                    <Icon name="check-circle" size={12} color={colors.success} />
                    <Text style={styles.savedBadgeText}>Saved</Text>
                  </View>
                )}
              </View>

              {/* Activities Grade Selector - editable for assigned, read-only for others */}
              <View style={styles.activitiesContainer}>
                {ACTIVITIES.map((act) => {
                  const currentGrade = student[act.key] || 'A';
                  const isEditable = visibleActivities.some(a => a.key === act.key);
                  return (
                    <View key={act.key} style={styles.activityRow}>
                      <View style={styles.activityLabelRow}>
                        <Text style={[styles.activityLabel, !isEditable && styles.activityLabelReadOnly]}>
                          {act.label}
                        </Text>
                        {!isEditable && (
                          <View style={styles.readOnlyTag}>
                            <Icon name="eye" size={9} color="#94a3b8" />
                            <Text style={styles.readOnlyTagText}>View</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.gradePillsContainer}>
                        {GRADE_PILLS.map((g) => {
                          const isSelected = currentGrade === g;
                          if (!isEditable) {
                            // Read-only: only show the saved grade as a static chip
                            return isSelected ? (
                              <View key={g} style={[styles.gradePill, styles.gradePillReadOnly]}>
                                <Text style={styles.gradePillTextReadOnly}>{g}</Text>
                              </View>
                            ) : null;
                          }
                          return (
                            <TouchableOpacity
                              key={g}
                              style={[styles.gradePill, isSelected && styles.gradePillActive]}
                              onPress={() => handleGradeSelect(student.student_id, act.key, g)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.gradePillText, isSelected && styles.gradePillTextActive]}>
                                {g}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Sticky Save CTA */}
      {students.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Icon name="check" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnText}>Save All Co-Scholastic Grades</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <CustomModal
        visible={modalState.visible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        primaryButtonText={modalState.primaryButtonText}
        onPrimaryPress={modalState.onPrimaryPress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 16, paddingBottom: 110 },
  topControlCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  termSelectorRow: { flexDirection: 'row', alignItems: 'center' },
  controlLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginRight: 8 },
  termPills: { flexDirection: 'row', gap: 6 },
  termPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
  },
  termPillActive: { backgroundColor: colors.primary },
  termPillText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  termPillTextActive: { color: '#ffffff' },
  quickFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '50',
    backgroundColor: colors.primary + '10',
  },
  quickFillBtnText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  roleBannerText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 12 },
  emptyState: { alignItems: 'center', padding: 32, marginTop: 40 },
  emptyText: { color: colors.textMuted, marginTop: 12, textAlign: 'center' },
  studentCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  studentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  studentInfo: { marginLeft: 10, flex: 1 },
  studentName: { fontSize: 14, fontWeight: '700', color: colors.text },
  studentMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  savedBadgeText: { fontSize: 10, fontWeight: '700', color: colors.success },
  activitiesContainer: { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 10 },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  activityLabelRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
  activityLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  activityLabelReadOnly: { color: colors.textMuted },
  readOnlyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  readOnlyTagText: { fontSize: 9, color: '#94a3b8', fontWeight: '700' },
  gradePillsContainer: { flexDirection: 'row', gap: 6 },
  gradePill: {
    width: 32,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  gradePillReadOnly: {
    backgroundColor: '#e2e8f0',
    borderColor: '#cbd5e1',
    width: 32,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  gradePillTextReadOnly: { fontSize: 12, fontWeight: '700', color: '#475569' },
  gradePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  gradePillText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  gradePillTextActive: { color: '#ffffff' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...shadows.card,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
});

export default CoScholasticGradingScreen;

