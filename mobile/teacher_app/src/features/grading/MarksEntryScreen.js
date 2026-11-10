import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { 
  useGetClassStudentsQuery, 
  useSubmitBulkGradesMutation, 
  useGetExamGradesQuery,
  useGetExamDistributionQuery 
} from '../../store/apiSlice';
import { colors } from '../../theme/colors';
import CustomHeader from '../../components/CustomHeader';
import CustomModal from '../../components/CustomModal';
import UserAvatar from '../../components/UserAvatar';

// Normalization helpers for component key and human-friendly label
const getCompKey = (c) => c?.key || c?.name || c?.label || 'component';
const getCompLabel = (c) => c?.label || c?.name || c?.key || 'Component';

// Dynamic Grading Scale helper (evaluates against live database scales with CBSE fallback)
const getGradeDetails = (marks, totalMarks, gradingScales = []) => {
  if (marks === '' || marks === null || marks === undefined || !totalMarks || Number(totalMarks) <= 0) {
    return { grade: '--', color: '#94a3b8', bg: '#f1f5f9' };
  }
  const pct = (Number(marks) / Number(totalMarks)) * 100;

  // 1. Evaluate against live database grading scale configured by school
  if (Array.isArray(gradingScales) && gradingScales.length > 0) {
    const matched = gradingScales.find(
      s => pct >= Number(s.min_percentage) && pct <= Number(s.max_percentage)
    );
    if (matched) {
      return {
        grade: matched.grade,
        color: matched.color_hex || '#16a34a',
        bg: matched.color_hex ? `${matched.color_hex}15` : '#dcfce7'
      };
    }
  }

  // 2. Standard CBSE 9-point fallback
  if (pct >= 91) return { grade: 'A1', color: '#16a34a', bg: '#dcfce7' };
  if (pct >= 81) return { grade: 'A2', color: '#0d9488', bg: '#ccfbf1' };
  if (pct >= 71) return { grade: 'B1', color: '#2563eb', bg: '#dbeafe' };
  if (pct >= 61) return { grade: 'B2', color: '#0284c7', bg: '#e0f2fe' };
  if (pct >= 51) return { grade: 'C1', color: '#d97706', bg: '#fef3c7' };
  if (pct >= 41) return { grade: 'C2', color: '#ea580c', bg: '#ffedd5' };
  if (pct >= 33) return { grade: 'D', color: '#b45309', bg: '#fef3c7' };
  return { grade: 'E', color: '#dc2626', bg: '#fee2e2' };
};

const MarksEntryScreen = ({ route, navigation }) => {
  const { examId, examDetails } = route.params;
  const isReadOnly = examDetails?.can_grade === false;
  const [students, setStudents] = useState([]);
  const [modalState, setModalState] = useState({ 
    visible: false, 
    type: 'info', 
    title: '', 
    message: '', 
    primaryButtonText: 'OK', 
    onPrimaryPress: null, 
    secondaryButtonText: null, 
    onSecondaryPress: null 
  });
  
  const [submitBulkGrades, { isLoading: saving }] = useSubmitBulkGradesMutation();

  const classId = examDetails?.class_id || examDetails?.classId || examDetails?.class; 
  const { data: studentsData, isLoading: loadingStudents, refetch, isFetching } = useGetClassStudentsQuery(classId, {
    skip: !classId
  });

  const { data: examGradesData, refetch: refetchGrades } = useGetExamGradesQuery(examId);
  const { data: distributionData, refetch: refetchDist, isLoading: loadingDist } = useGetExamDistributionQuery(examId);

  const distribution = distributionData?.distribution;
  const gradingScales = distributionData?.grading_scales || [];
  const components = useMemo(() => {
    return Array.isArray(distribution?.components) ? distribution.components : [];
  }, [distribution]);

  const maxTotalMarks = distribution?.total_marks || examDetails?.marks || 100;

  const onRefresh = React.useCallback(() => {
    if (classId) refetch();
    if (examId) {
      refetchGrades();
      refetchDist();
    }
  }, [refetch, classId, refetchGrades, refetchDist, examId]);

  useEffect(() => {
    if (studentsData?.students) {
      const gradesMap = {};
      const componentScoresMap = {};

      if (examGradesData?.grades) {
        examGradesData.grades.forEach(g => {
          gradesMap[g.student_id] = g.marks;
          componentScoresMap[g.student_id] = g.component_scores || {};
        });
      }

      setStudents(studentsData.students.map(s => {
        const studentCompScores = componentScoresMap[s.id] || {};
        const savedMarks = gradesMap[s.id] !== undefined && gradesMap[s.id] !== null ? String(gradesMap[s.id]) : '';

        return { 
          ...s, 
          _id: s.id, 
          marks: savedMarks,
          component_scores: studentCompScores
        };
      }));
    }
  }, [studentsData, examGradesData]);

  // Handler for multi-component breakdown entry with strict key isolation
  const handleComponentScoreChange = (studentId, compKey, value, maxMarks) => {
    let cleanVal = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimals
    const parts = cleanVal.split('.');
    if (parts.length > 2) {
      cleanVal = parts[0] + '.' + parts.slice(1).join('');
    }

    // Clamp to component max marks
    if (cleanVal !== '' && parseFloat(cleanVal) > maxMarks) {
      cleanVal = String(maxMarks);
    }

    setStudents(prev => prev.map(s => {
      if (s._id !== studentId) return s;

      const updatedScores = { ...(s.component_scores || {}), [compKey]: cleanVal };
      
      // Calculate live total sum across normalized component keys
      let sum = 0;
      let hasAnyEntry = false;
      components.forEach(comp => {
        const k = getCompKey(comp);
        const v = updatedScores[k] !== undefined ? updatedScores[k] : updatedScores[getCompLabel(comp)];
        if (v !== '' && v !== undefined && v !== null) {
          sum += parseFloat(v) || 0;
          hasAnyEntry = true;
        }
      });

      // Round to 2 decimals
      const totalMarksStr = hasAnyEntry ? String(Math.round(sum * 100) / 100) : '';

      return {
        ...s,
        component_scores: updatedScores,
        marks: totalMarksStr
      };
    }));
  };

  // Fallback handler for flat marks entry (when no distribution is configured)
  const handleMarksChange = (id, value) => {
    let numericValue = value.replace(/[^0-9.]/g, '');
    const maxMarks = maxTotalMarks ? parseFloat(maxTotalMarks) : 100;
    if (numericValue !== '' && parseFloat(numericValue) > maxMarks) {
       numericValue = String(maxMarks);
    }
    
    const updated = students.map(s => s._id === id ? { ...s, marks: numericValue } : s);
    setStudents(updated);
  };

  const processSubmit = async () => {
    try {
      const payload = students.map(s => ({
        student_id: s._id,
        exam_id: examId,
        marks: s.marks !== '' && s.marks !== undefined && s.marks !== null ? Number(s.marks) : 0,
        component_scores: components.length > 0 ? (s.component_scores || {}) : null
      }));

      await submitBulkGrades(payload).unwrap();
      
      setModalState({
        visible: true,
        type: 'success',
        title: 'Marks Saved',
        message: components.length > 0 
          ? `Component-wise assessment marks for ${students.length} students saved successfully.`
          : 'Marks saved successfully',
        primaryButtonText: 'OK',
        onPrimaryPress: () => navigation.goBack(),
        secondaryButtonText: null,
        onSecondaryPress: null
      });
    } catch (error) {
      setModalState({
        visible: true,
        type: 'error',
        title: 'Error Saving Marks',
        message: error?.data?.message || 'Failed to save marks. Please check input values and retry.',
        primaryButtonText: 'OK',
        onPrimaryPress: () => setModalState(prev => ({ ...prev, visible: false })),
        secondaryButtonText: null,
        onSecondaryPress: null
      });
    }
  };

  const handleSubmit = () => {
    const hasBlanks = students.some(s => s.marks === '' || s.marks === undefined || s.marks === null);

    if (hasBlanks) {
      setModalState({
        visible: true,
        type: 'warning',
        title: 'Unrecorded Student Marks',
        message: 'Some students do not have marks entered. These will be recorded as 0. Do you want to proceed?',
        primaryButtonText: 'Proceed & Save',
        onPrimaryPress: () => {
          setModalState(prev => ({ ...prev, visible: false }));
          processSubmit();
        },
        secondaryButtonText: 'Cancel & Review',
        onSecondaryPress: () => setModalState(prev => ({ ...prev, visible: false }))
      });
    } else {
      processSubmit();
    }
  };

  const isLoading = loadingStudents || loadingDist;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <CustomHeader title={examDetails?.title || 'Enter Marks'} showBack={true} />
      
      {/* Context Banner */}
      <View style={styles.contextBanner}>
        <View style={styles.contextRow}>
          <Text style={styles.contextText}>{examDetails?.class} • {examDetails?.subject}</Text>
          {distribution ? (
            <View style={styles.schemeTag}>
              <Icon name="check-circle" size={12} color="#16a34a" />
              <Text style={styles.schemeTagText}>{distribution.term || 'CBSE Scheme'}</Text>
            </View>
          ) : (
            <View style={[styles.schemeTag, { backgroundColor: '#f1f5f9' }]}>
              <Text style={[styles.schemeTagText, { color: '#64748b' }]}>Standard Entry</Text>
            </View>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.warning} size="large" />
          <Text style={styles.loadingText}>Loading grading scheme & student roster...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} colors={[colors.warning]} />}
        >
          {/* Read-Only Notice for Class Teachers */}
          {isReadOnly && (
            <View style={styles.readOnlyNoticeBox}>
              <Icon name="info" size={20} color="#0284c7" style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.readOnlyNoticeTitle}>Class Teacher Oversight (Read-Only)</Text>
                <Text style={styles.readOnlyNoticeText}>
                  You are viewing student grades as Class Teacher. Marks entry is restricted to the assigned Subject Teacher{examDetails?.subject_teacher_name ? ` (${examDetails.subject_teacher_name})` : ''}.
                </Text>
              </View>
            </View>
          )}

          {/* Information / Scheme Header Banner */}
          {components.length > 0 ? (
            <View style={styles.distributionInfoCard}>
              <View style={styles.distribHeader}>
                <View style={styles.distribTitleGroup}>
                  <Icon name="sliders" size={16} color="#0f766e" />
                  <Text style={styles.distribTitle}>Dynamic Multi-Component Assessment</Text>
                </View>
                <Text style={styles.distribTotalBadge}>Max: {maxTotalMarks}M</Text>
              </View>
              <Text style={styles.distribDesc}>
                Scores auto-sum to Total. Individual component fields clamp to maximum permitted marks.
              </Text>
              <View style={styles.componentPillRow}>
                {components.map((c, i) => {
                  const label = getCompLabel(c);
                  return (
                    <View key={i} style={styles.componentPill}>
                      <Text style={styles.componentPillName}>{label}:</Text>
                      <Text style={styles.componentPillMarks}>{c.max_marks}M</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.infoBanner}>
              <Icon name="info" size={18} color={colors.warning} />
              <Text style={styles.infoText}>Enter total marks out of {maxTotalMarks}.</Text>
            </View>
          )}

          {/* Student Cards List */}
          {students.map((student, index) => {
            const gradeInfo = getGradeDetails(student.marks, maxTotalMarks, gradingScales);

            return (
              <View key={student._id} style={styles.studentCard}>
                {/* Header Row: Student Avatar + Info + Total + Grade */}
                <View style={styles.studentHeaderRow}>
                  <UserAvatar
                    url={student.avatar_url}
                    name={student.name || 'S'}
                    size={44}
                    borderWidth={1.5}
                    borderColor="#e2e8f0"
                    style={styles.avatarStyle}
                  />

                  <TouchableOpacity 
                    style={styles.studentInfo}
                    onPress={() => navigation.navigate('StudentProfile', { student })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.studentName} numberOfLines={1}>{student.name}</Text>
                    <View style={styles.studentMetaRow}>
                      <View style={styles.rollBadge}>
                        <Text style={styles.rollBadgeText}>
                          Roll: {student.roll_number ? student.roll_number : (index + 1)}
                        </Text>
                      </View>
                      <Text style={styles.admText}>
                        Adm: {student.admission_number || '--'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.scoreSummaryGroup}>
                    <View style={styles.totalBadgeBox}>
                      <Text style={styles.totalLabel}>TOTAL</Text>
                      <Text style={styles.totalValue}>
                        {student.marks !== '' ? student.marks : '--'}
                        <Text style={styles.totalMax}>/{maxTotalMarks}</Text>
                      </Text>
                    </View>

                    <View style={[styles.gradePill, { backgroundColor: gradeInfo.bg }]}>
                      <Text style={[styles.gradeText, { color: gradeInfo.color }]}>
                        {gradeInfo.grade}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Body Row: Either Component Breakdown or Flat Marks Box */}
                {components.length > 0 ? (
                  <View style={styles.componentsGrid}>
                    {components.map((comp) => {
                      const k = getCompKey(comp);
                      const label = getCompLabel(comp);
                      
                      // Support both key and label lookups for saved records
                      const compVal = student.component_scores?.[k] !== undefined
                        ? String(student.component_scores[k])
                        : (student.component_scores?.[label] !== undefined ? String(student.component_scores[label]) : '');

                      return (
                        <View key={k} style={styles.compBox}>
                          <Text style={styles.compLabel} numberOfLines={1}>
                            {label}
                          </Text>
                          <View style={styles.compInputRow}>
                            <TextInput
                              style={[styles.compInput, isReadOnly && styles.readOnlyInput]}
                              keyboardType="numeric"
                              maxLength={4}
                              value={compVal}
                              editable={!isReadOnly}
                              onChangeText={(val) => handleComponentScoreChange(student._id, k, val, comp.max_marks)}
                              placeholder={isReadOnly ? "--" : "0"}
                              placeholderTextColor="#94a3b8"
                            />
                            <Text style={styles.compMaxMarks}>/{comp.max_marks}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.flatMarksRow}>
                    <Text style={styles.flatMarksPrompt}>Marks Obtained:</Text>
                    <View style={styles.marksContainer}>
                      <TextInput
                        style={[styles.marksInput, isReadOnly && styles.readOnlyInput]}
                        keyboardType="numeric"
                        maxLength={4}
                        value={student.marks}
                        editable={!isReadOnly}
                        onChangeText={(val) => handleMarksChange(student._id, val)}
                        placeholder="--"
                        placeholderTextColor={colors.textMuted}
                      />
                      <Text style={styles.maxMarks}>/ {maxTotalMarks}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Sticky Bottom Actions */}
      <View style={styles.footer}>
        {isReadOnly ? (
          <View style={styles.readOnlyFooterBox}>
            <Icon name="lock" size={16} color="#64748b" style={{ marginRight: 8 }} />
            <Text style={styles.readOnlyFooterText}>
              Read-Only: Subject Teacher ({examDetails?.subject_teacher_name || 'Assigned Faculty'}) manages marks
            </Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.submitButton, saving && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={saving || isLoading || students.length === 0}
          >
            {saving ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <View style={styles.btnRow}>
                <Icon name="check" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.submitText}>
                  Save {components.length > 0 ? 'Assessment Grades' : 'Marks'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      <CustomModal
        visible={modalState.visible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        primaryButtonText={modalState.primaryButtonText}
        onPrimaryPress={modalState.onPrimaryPress}
        secondaryButtonText={modalState.secondaryButtonText}
        onSecondaryPress={modalState.onSecondaryPress}
        onClose={() => setModalState(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contextBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  contextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contextText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  schemeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  schemeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  scrollContent: { padding: 16, paddingBottom: 32 },
  
  // Scheme description banner
  distributionInfoCard: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#99f6e4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  distribHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  distribTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distribTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f766e',
  },
  distribTotalBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f766e',
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distribDesc: {
    fontSize: 12,
    color: '#115e59',
    marginBottom: 10,
    lineHeight: 16,
  },
  componentPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  componentPill: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    alignItems: 'center',
    gap: 4,
  },
  componentPillName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f766e',
  },
  componentPillMarks: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0d9488',
  },

  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.warning + '15',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  infoText: { marginLeft: 8, color: colors.warning, fontWeight: '600', fontSize: 13 },
  
  // Student Card
  studentCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  studentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatarStyle: {
    marginRight: 10,
  },
  studentInfo: { flex: 1, marginRight: 8 },
  studentName: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 3 },
  studentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rollBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  rollBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  admText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  scoreSummaryGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalBadgeBox: {
    alignItems: 'flex-end',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  totalLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  totalMax: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
  },
  gradePill: {
    minWidth: 32,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  gradeText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Dynamic Components Grid
  componentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
  },
  compBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  compLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  compInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 38,
  },
  compInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    paddingVertical: 0,
    textAlign: 'center',
  },
  compMaxMarks: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginLeft: 2,
  },

  // Classic Flat Input Row
  flatMarksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  flatMarksPrompt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  marksContainer: { flexDirection: 'row', alignItems: 'center' },
  marksInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    width: 64,
    height: 42,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  maxMarks: { marginLeft: 8, fontSize: 14, color: '#64748b', fontWeight: '600' },

  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#16a34a',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.6 },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  readOnlyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  readOnlyNoticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369a1',
    marginBottom: 2,
  },
  readOnlyNoticeText: {
    fontSize: 12,
    color: '#0284c7',
    lineHeight: 18,
  },
  readOnlyInput: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    color: '#64748b',
  },
  readOnlyFooterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  readOnlyFooterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
});

export default MarksEntryScreen;
