export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const DEFAULT_PERIOD_SLOTS = [
  { name: "Period 1", time: "08:00 AM - 08:45 AM" },
  { name: "Period 2", time: "08:45 AM - 09:30 AM" },
  { name: "Period 3", time: "09:30 AM - 10:15 AM" },
  { name: "Recess / Break", time: "10:15 AM - 10:45 AM", isBreak: true },
  { name: "Period 4", time: "10:45 AM - 11:30 AM" },
  { name: "Period 5", time: "11:30 AM - 12:15 PM" },
  { name: "Lunch", time: "12:15 PM - 12:45 PM", isBreak: true },
  { name: "Period 6", time: "12:45 PM - 01:30 PM" },
  { name: "Period 7", time: "01:30 PM - 02:15 PM" },
];

export const SUBJECT_COLORS = [
  { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" }, // Blue
  { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" }, // Green
  { bg: "#fef3c7", text: "#b45309", border: "#fde68a" }, // Amber
  { bg: "#f3e8ff", text: "#6b21a8", border: "#e9d5ff" }, // Purple
  { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" }, // Red
  { bg: "#e0e7ff", text: "#3730a3", border: "#c7d2fe" }, // Indigo
  { bg: "#ffedd5", text: "#c2410c", border: "#fed7aa" }, // Orange
  { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" }, // Emerald
];

export const getSubjectColor = (subjectName) => {
  if (!subjectName) return { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" };
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[index];
};
