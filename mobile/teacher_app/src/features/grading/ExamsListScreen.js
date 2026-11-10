import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { useGetExamsQuery } from '../../store/apiSlice';
import { colors, shadows } from '../../theme/colors';
import CustomHeader from '../../components/CustomHeader';

const ExamsListScreen = ({ navigation }) => {
  const { activeClassId, availableClasses } = useSelector((state) => state.app);
  const { data: examsResponse, isLoading: loading, refetch, isFetching } = useGetExamsQuery(activeClassId);
  const [exams, setExams] = useState([]);

  const onRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (examsResponse?.exams) {
      // Only keep exams the teacher can grade (their own subjects). Never show read-only rows.
      setExams(examsResponse.exams.filter(e => e.can_grade !== false));
    }
  }, [examsResponse]);

  // Co-Scholastic card: show only to Class Teachers and teachers of co-scholastic subjects.
  // Determine from availableClasses (populated by teacher profile API) or from exams data.
  const activeClassEntry = (availableClasses || []).find(c => c.classId === activeClassId);
  const isClassTeacherOfActive = activeClassEntry?.isClassTeacher === true;

  // Also detect if any exam in the FULL response (before filtering) marks is_class_teacher
  const anyExamIsClassTeacher = examsResponse?.exams?.some(e => e.is_class_teacher) || false;

  // Co-scholastic subjects list (PE, Art, etc. map to co-scholastic activities)
  const CO_SCHOLASTIC_SUBJECTS = ['physical education', 'art', 'art education', 'music', 'supw', 'health', 'work education'];
  const teachesCoScholasticSubject = examsResponse?.exams?.some(
    e => e.is_subject_teacher && CO_SCHOLASTIC_SUBJECTS.includes((e.subject || '').toLowerCase().trim())
  ) || false;

  const showCoScholastic = isClassTeacherOfActive || anyExamIsClassTeacher || teachesCoScholasticSubject;

  const handleSelectExam = (exam) => {
    navigation.navigate('MarksEntryScreen', { examId: exam.id, examDetails: exam });
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Grading & Marks" />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => navigation.navigate('DateSheetScreen')}
          activeOpacity={0.8}
        >
          <View style={styles.actionIconContainer}>
            <Icon name="calendar" size={24} color={colors.primary} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Date Sheet Calendar</Text>
            <Text style={styles.actionSubtitle}>View upcoming exams and schedules</Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.border} />
        </TouchableOpacity>

        {showCoScholastic && (
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('CoScholasticGrading')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.warning + '15' }]}>
              <Icon name="award" size={24} color={colors.warning} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Co-Scholastic Grading</Text>
              <Text style={styles.actionSubtitle}>CBSE Part-2: Health, Art, Discipline & SUPW</Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.border} />
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Active Assessments</Text>
        
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : exams.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="award" size={32} color={colors.primary} />
            <Text style={styles.emptyTitle}>No Subjects Assigned to You</Text>
            <Text style={styles.emptyText}>
              {showCoScholastic
                ? 'You have no written exam subjects for this class. Use Co-Scholastic Grading above to grade health, art, and discipline areas.'
                : 'No active assessments are assigned to you for this class.'}
            </Text>
          </View>
        ) : (
          exams.map((exam) => (
            <TouchableOpacity key={exam.id} style={styles.examCard} onPress={() => handleSelectExam(exam)}>
              <View style={styles.examHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.examTitle}>{exam.title}</Text>
                  <Text style={styles.examTerm}>{exam.term || (exam.date ? `Date: ${exam.date}` : 'Assessment')}</Text>
                </View>
                <View style={[
                  styles.statusBadge, 
                  exam.can_grade === false
                    ? styles.readOnlyBadge
                    : (exam.status === 'Completed' ? styles.completedBadge : styles.gradeBadge)
                ]}>
                  <Icon 
                    name={exam.can_grade === false ? 'eye' : 'edit-3'} 
                    size={12} 
                    color={exam.can_grade === false ? '#475569' : (exam.status === 'Completed' ? colors.success : colors.primary)} 
                    style={{ marginRight: 4 }} 
                  />
                  <Text style={[
                    styles.statusText,
                    { color: exam.can_grade === false ? '#475569' : (exam.status === 'Completed' ? colors.success : colors.primary) }
                  ]}>
                    {exam.can_grade === false ? 'Read Only' : (exam.status === 'Completed' ? 'Completed' : 'Grade Subject')}
                  </Text>
                </View>
              </View>
              
              <View style={styles.examDetails}>
                <View style={styles.detailBox}>
                  <Icon name="users" size={15} color={colors.textMuted} style={styles.detailIcon} />
                  <Text style={styles.detailText}>Class {exam.className || exam.class}</Text>
                </View>
                <View style={styles.detailBox}>
                  <Icon name="book-open" size={15} color={colors.textMuted} style={styles.detailIcon} />
                  <Text style={styles.detailText}>{exam.subject}</Text>
                </View>
                {exam.subject_teacher_name ? (
                  <View style={styles.detailBox}>
                    <Icon name="user-check" size={15} color={exam.is_subject_teacher ? colors.primary : colors.textMuted} style={styles.detailIcon} />
                    <Text style={[styles.detailText, exam.is_subject_teacher && { color: colors.primary, fontWeight: '700' }]}>
                      {exam.is_subject_teacher ? 'You (Subject Teacher)' : `Teacher: ${exam.subject_teacher_name}`}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 24, paddingBottom: 100 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContainer: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
  actionSubtitle: { fontSize: 13, color: colors.textMuted },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  emptyState: { alignItems: 'center', padding: 32, textAlign: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 12 },
  emptyText: { color: colors.textMuted, marginTop: 6, textAlign: 'center', fontSize: 13, lineHeight: 18 },
  examCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  examTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  examTerm: { fontSize: 12, color: colors.textMuted },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  readOnlyBadge: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  completedBadge: {
    backgroundColor: colors.success + '20',
  },
  gradeBadge: {
    backgroundColor: colors.primary + '18',
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  examDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  detailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  detailIcon: { marginRight: 8 },
  detailText: { fontSize: 14, color: colors.text, fontWeight: '500' },
});

export default ExamsListScreen;
