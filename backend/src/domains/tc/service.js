import { TCRepository } from './repository.js';

const CLASS_WORDS_MAP = {
  "NUR": "NURSERY",
  "NURSERY": "NURSERY",
  "LKG": "LOWER KINDERGARTEN",
  "UKG": "UPPER KINDERGARTEN",
  "KG": "KINDERGARTEN",
  "1": "FIRST",
  "2": "SECOND",
  "3": "THIRD",
  "4": "FOURTH",
  "5": "FIFTH",
  "6": "SIXTH",
  "7": "SEVENTH",
  "8": "EIGHTH",
  "9": "NINTH",
  "10": "TENTH",
  "11": "ELEVENTH",
  "12": "TWELFTH",
  "I": "FIRST",
  "II": "SECOND",
  "III": "THIRD",
  "IV": "FOURTH",
  "V": "FIFTH",
  "VI": "SIXTH",
  "VII": "SEVENTH",
  "VIII": "EIGHTH",
  "IX": "NINTH",
  "X": "TENTH",
  "XI": "ELEVENTH",
  "XII": "TWELFTH"
};

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const TEENS = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const ORDINAL_DAYS = [
  "", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth",
  "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", "Nineteenth", "Twentieth",
  "Twenty First", "Twenty Second", "Twenty Third", "Twenty Fourth", "Twenty Fifth", "Twenty Sixth", "Twenty Seventh", "Twenty Eighth", "Twenty Ninth", "Thirtieth", "Thirty First"
];
const MONTHS = [
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
];

function numberToWordsBelowThousand(n) {
  let str = "";
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + " Hundred ";
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 20)] + " ";
    n %= 20;
  } else if (n >= 10) {
    str += TEENS[n - 10] + " ";
    n = 0;
  }
  if (n > 0) {
    str += ONES[n] + " ";
  }
  return str.trim();
}

function yearToWords(year) {
  if (year >= 2000 && year < 2100) {
    const remainder = year - 2000;
    if (remainder === 0) return "Two Thousand";
    return `Two Thousand ${numberToWordsBelowThousand(remainder)}`;
  }
  const century = Math.floor(year / 100);
  const rem = year % 100;
  return `${numberToWordsBelowThousand(century)} Hundred ${rem ? numberToWordsBelowThousand(rem) : ""}`.trim();
}

export function convertDateToWords(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();

  const dayWord = ORDINAL_DAYS[day] || `${day}`;
  const yearWord = yearToWords(year);

  return `${dayWord} ${month} ${yearWord}`;
}

export function classToWords(className) {
  if (!className) return "";
  const clean = String(className).replace(/Grade|Class/gi, '').trim().toUpperCase();
  return CLASS_WORDS_MAP[clean] || clean;
}

export function getNextClass(className) {
  if (!className) return { figure: "", words: "" };
  const num = parseInt(String(className).replace(/\D/g, ''), 10);
  if (!isNaN(num) && num < 12) {
    const nextNum = String(num + 1);
    return {
      figure: nextNum,
      words: CLASS_WORDS_MAP[nextNum] || nextNum
    };
  }
  return { figure: "", words: "" };
}

export class TCService {
  static async getClasses(tenantId, userId, role) {
    return TCRepository.getClasses(tenantId, userId, role);
  }

  static async getClassStudents(tenantId, classId) {
    return TCRepository.getClassStudents(tenantId, classId);
  }

  static async getStudentPrefill(tenantId, studentId) {
    const data = await TCRepository.getStudentPrefill(tenantId, studentId);
    if (!data || !data.student) {
      throw new Error('Student not found');
    }

    const { student, classData, attendanceStats, latestFee, existingTC, tenant } = data;
    const className = classData ? classData.name : '';
    const section = classData ? (classData.section || '') : '';
    const classFigure = className ? (section ? `${className} - ${section}` : className) : '';
    const classWord = className ? classToWords(className) : '';
    const nextClass = getNextClass(className);

    const schoolPrefix = (tenant?.slug || 'SCH').toUpperCase();
    const currentYear = new Date().getFullYear();
    const nextYearShort = String(currentYear + 1).slice(-2);
    const defaultAcademicYear = `${currentYear - 1}–${currentYear}`;
    const admNo = student.admission_number || '';
    const autoTcNumber = `${schoolPrefix}/${currentYear}-${nextYearShort}/${admNo || Math.floor(1000 + Math.random() * 9000)}`;

    const isFemale = student.gender?.toLowerCase() === 'female' || student.gender?.toLowerCase() === 'f';
    const genderPrefix = isFemale ? 'Miss' : 'Master';
    const relationPrefix = isFemale ? 'daughter' : 'son';
    const pronounPossessive = isFemale ? 'her' : 'his';
    const pronounObjective = isFemale ? 'her' : 'him';

    const dobIso = student.dob ? new Date(student.dob).toISOString().split('T')[0] : '';
    const dobWords = convertDateToWords(student.dob);
    const todayIso = new Date().toISOString().split('T')[0];

    const feePaid = latestFee && (latestFee.payment_status === 'paid' || latestFee.payment_status === 'PAID');
    const feeTotalPaid = latestFee?.total_paid_amount ? Number(latestFee.total_paid_amount).toLocaleString('en-IN') : '0';

    return {
      // Identity & Student Snapshot
      id: existingTC?.id || null,
      student_id: student.id,
      student_name: student.name || '',
      pupil_name: student.name || '',
      admission_no: admNo,
      admission_number: admNo,
      gr_no: existingTC?.gr_no || admNo,
      pen_no: existingTC?.pen_no || student.pen_number || student.pen_no || '',
      udise_no: existingTC?.udise_no || tenant?.udise_code || '',
      aadhar_no: existingTC?.aadhar_no || student.aadhar_card_number || student.aadhaar_number || student.aadhar_number || '',
      aadhar_card_no: existingTC?.aadhar_card_no || student.aadhar_card_number || student.aadhaar_number || student.aadhar_number || '',
      father_name: student.father_name || '',
      mother_name: student.mother_name || '',
      parent_name: student.father_name || student.mother_name || '',
      parent_salutation: 'Shri',
      dob: dobIso,
      dob_words: dobWords,
      birth_place: existingTC?.birth_place || '',
      nationality: existingTC?.nationality || 'Indian',
      mother_tongue: existingTC?.mother_tongue || student.mother_tongue || 'Hindi',
      religion_caste: existingTC?.category || student.house || 'General',
      category: existingTC?.category || student.house || 'General',

      // Academic details
      class_id: classData ? classData.id : null,
      class_name: className,
      section: section,
      academic_year: defaultAcademicYear,
      first_admission_date: student.admission_date ? new Date(student.admission_date).toISOString().split('T')[0] : '',
      first_admission_class: existingTC?.first_admission_class || (className ? `Class - ${className}` : ''),
      admission_date_class: student.admission_date ? `${new Date(student.admission_date).toISOString().split('T')[0]} and Class - ${className}` : '',
      last_studied_class_figure: existingTC?.last_studied_class_figure || classFigure || className,
      last_studied_class_words: existingTC?.last_studied_class_words || classWord,
      annual_exam_result: existingTC?.annual_exam_result || `March-${currentYear} / Passed`,
      failed_status: existingTC?.failed_status || 'NA',
      subjects_studied: existingTC?.subjects_studied || 'English, Hindi, Mathematics, Science, Social Science & IT',
      qualified_for_promotion: existingTC?.qualified_for_promotion || 'Yes',
      promotion_class_figure: existingTC?.promotion_class_figure || nextClass.figure,
      promotion_class_words: existingTC?.promotion_class_words || nextClass.words,

      // Conduct & Attendance
      dues_paid_month: existingTC?.dues_paid_month || (feePaid ? `Up to date (March ${currentYear})` : 'Dues Pending'),
      fee_concession: existingTC?.fee_concession || (student.fee_exempted ? 'Full Fee Concession' : 'NA'),
      total_working_days: existingTC?.total_working_days !== undefined ? existingTC.total_working_days : (attendanceStats.total || 0),
      days_present: existingTC?.days_present !== undefined ? existingTC.days_present : (attendanceStats.present || 0),
      ncc_scout: existingTC?.ncc_scout || 'NA',
      extra_curricular: existingTC?.extra_curricular || 'Annual Day, Sports Day & Cultural Events',
      general_conduct: existingTC?.general_conduct || 'Good',
      conduct: existingTC?.general_conduct || 'Good',
      application_date: existingTC?.application_date ? new Date(existingTC.application_date).toISOString().split('T')[0] : todayIso,
      issue_date: existingTC?.issue_date ? new Date(existingTC.issue_date).toISOString().split('T')[0] : todayIso,
      reason_for_leaving: existingTC?.reason_for_leaving || 'Parents Request / Relocation',
      remarks: existingTC?.remarks || (existingTC?.birth_place ? `Place of Birth - ${existingTC.birth_place}` : 'Best wishes for future studies'),
      status: existingTC?.status || 'ISSUED',
      is_existing: !!existingTC,

      // Certificate serial numbers
      tc_number: existingTC?.tc_number || autoTcNumber,
      sr_no: existingTC?.tc_number || autoTcNumber,
      bonafide_cert_no: `${schoolPrefix}/BON/${currentYear}/${admNo || '001'}`,
      character_cert_no: `${schoolPrefix}/CC/${currentYear}/${admNo || '001'}`,
      academic_cert_no: `${schoolPrefix}/APC/${currentYear}/${admNo || '001'}`,
      attendance_cert_no: `${schoolPrefix}/ATC/${currentYear}/${admNo || '001'}`,
      fee_cert_no: `${schoolPrefix}/FPC/${currentYear}/${admNo || '001'}`,
      structure_cert_no: `${schoolPrefix}/FSC/${currentYear}/${admNo || '001'}`,

      // Grammatical Pronouns & Salutations
      gender_prefix: genderPrefix,
      relation_prefix: relationPrefix,
      pronoun_possessive: pronounPossessive,
      pronoun_objective: pronounObjective,

      // Certificate custom purposes
      bonafide_purpose: 'Official verification and higher educational admission',
      character_conduct: 'Satisfactory and Exemplary',
      academic_result: 'Passed with First Class / Distinction',
      exam_assessment: `Annual Examination March ${currentYear}`,
      marks_grade: 'Grade A1 (91.4%)',
      academic_purpose: 'Higher secondary admission and official verification',
      attendance_purpose: 'Official administrative verification and academic records',
      fee_total_paid: feeTotalPaid,
      fee_as_of_date: todayIso,
      fee_period_covered: 'Comprehensive Annual Fees (Tuition, Development & Term Charges)',
      fee_purpose: 'Income tax rebate (Section 10/80C) and employer education allowance claim',
      fee_tuition_amount: '',
      fee_other_amount: '',
      fee_total_structure: feeTotalPaid,
      fee_payment_notes: '',
      structure_purpose: 'Education Loan Sanctioning and Admission Documentation'
    };
  }

  static async saveCertificate(tenantId, userId, payload) {
    const pupilName = (payload.pupil_name || payload.student_name || '').trim();
    if (!pupilName) throw new Error('Pupil name is required');
    if (!payload.student_id) throw new Error('Student ID is required');

    const tcNumber = (payload.tc_number || payload.sr_no || '').trim() || `TC-${Date.now().toString().slice(-6)}`;

    const tcRecord = {
      ...payload,
      tc_number: tcNumber,
      pupil_name: pupilName,
      dob_words: payload.dob_words || convertDateToWords(payload.dob),
      last_studied_class_words: payload.last_studied_class_words || classToWords(payload.last_studied_class_figure)
    };

    return TCRepository.saveCertificate(tenantId, userId, tcRecord);
  }

  static async getRecords(tenantId, filters) {
    return TCRepository.getRecords(tenantId, filters);
  }

  static async getTCById(tenantId, id) {
    return TCRepository.getTCById(tenantId, id);
  }
}
