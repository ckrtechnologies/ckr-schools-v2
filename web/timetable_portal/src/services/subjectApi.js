import api from "./api";

/**
 * Subject Management API Service
 * Powered purely by CKR Express 5 REST APIs with multi-tenant PostgreSQL isolation
 */

export const getSubjects = async () => {
  const res = await api.get("/subjects");
  return res.data?.subjects || res.data?.data || [];
};

export const createSubject = async ({ name, category = "academics", classIds = [] }) => {
  const res = await api.post("/subjects", {
    name: name.trim(),
    category,
    classIds,
  });
  return res.data?.subject || res.data?.data;
};

export const updateSubject = async (id, { name, category, classIds = [] }) => {
  const res = await api.put(`/subjects/${id}`, {
    name: name.trim(),
    category,
    classIds,
  });
  return res.data?.subject || res.data?.data;
};

export const deleteSubject = async (id) => {
  const res = await api.delete(`/subjects/${id}`);
  return res.data?.success || true;
};
