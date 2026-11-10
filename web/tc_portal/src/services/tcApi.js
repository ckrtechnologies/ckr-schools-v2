import api from "./api.js";

export const fetchClasses = async () => {
  const res = await api.get("/tc/classes");
  return res.data?.data || [];
};

export const fetchClassStudents = async (classId) => {
  const res = await api.get(`/tc/classes/${classId}/students`);
  return res.data?.data || [];
};

export const fetchStudentPrefill = async (studentId) => {
  const res = await api.get(`/tc/prefill/${studentId}`);
  return res.data?.data || null;
};

export const saveCertificate = async (formData) => {
  const res = await api.post("/tc/generate", { data: formData });
  return res.data;
};

export const fetchRecords = async (params = {}) => {
  const res = await api.get("/tc/records", { params });
  return res.data?.data || [];
};

export const fetchTCById = async (id) => {
  const res = await api.get(`/tc/${id}`);
  return res.data?.data || null;
};
