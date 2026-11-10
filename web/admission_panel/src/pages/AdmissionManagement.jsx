import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { fetchNewUsers, fetchUsers, fetchClasses } from "../features/dataSlice";
import { toast } from "react-toastify";
import api, { uploadFile } from "../services/api";
import { FileText, CheckCircle, XCircle, Plus, Edit, Trash2, FileSpreadsheet, ChevronUp, ChevronDown, ChevronsUpDown, X, Printer } from "lucide-react";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";
import TableFilterHeader from "../components/TableFilterHeader";
import DateRangePicker from "../components/DateRangePicker";
import { useSortableData } from "../hooks/useSortableData";
import AdmissionEnquiryPrintout from "../components/AdmissionEnquiryPrintout";
import UserAvatar from "../components/UserAvatar";

const AdmissionManagement = () => {
  const dispatch = useDispatch();
  const { newUsers, loadingNewUsers, users, classes } = useSelector((state) => state.data);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get("status") || "All");
  const [genderFilter, setGenderFilter] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);

  // Sync dates to URL
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    let changed = false;
    
    if (startDate && newParams.get("startDate") !== startDate) { newParams.set("startDate", startDate); changed = true; }
    else if (!startDate && newParams.has("startDate")) { newParams.delete("startDate"); changed = true; }
    
    if (endDate && newParams.get("endDate") !== endDate) { newParams.set("endDate", endDate); changed = true; }
    else if (!endDate && newParams.has("endDate")) { newParams.delete("endDate"); changed = true; }
    
    // Sync filter to URL status
    if (filter && filter !== "All" && newParams.get("status") !== filter) { newParams.set("status", filter); changed = true; }
    else if ((!filter || filter === "All") && newParams.has("status")) { newParams.delete("status"); changed = true; }

    if (changed) {
      setSearchParams(newParams, { replace: true });
    }
  }, [startDate, endDate, filter, searchParams, setSearchParams]);

  // Sync from URL changes (like sidebar clicks)
  useEffect(() => {
    const urlStatus = searchParams.get("status");
    if (urlStatus && urlStatus !== filter) {
      setFilter(urlStatus);
    } else if (!urlStatus && filter !== "All") {
      setFilter("All");
    }
  }, [searchParams]);

  const [selectedColumns, setSelectedColumns] = useState([
    "sno", "name", "email", "parent", "class_id", "status", "assigned_to", "documents"
  ]);

  const initialFormData = {
    name: "",
    email: "",
    parent: "",
    parentEmail: "",
    phone: "",
    status: "Pending",
    dob: "",
    gender: "",
    documents: [],
    class_id: "",
    bus_fee: "",
    monthly_fee: "",
    fee_exempted: false,
    admission_date: "",
    address: "",
    house: "",
    assigned_to: "",
    academic_year: "2026-2027",
    prev_school: "",
    prev_board: "",
    father_name: "",
    father_occupation: "",
    father_mobile: "",
    mother_name: "",
    mother_occupation: "",
    mother_mobile: "",
    alternate_phone: "",
    referral_source: "",
    preferred_visit_date: "",
    enquiry_remarks: "",
    school_tour_status: "Pending",
    principal_meet_status: "Pending",
    follow_up_date: "",
    office_remarks: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [printData, setPrintData] = useState(null);

  const [selectedFiles, setSelectedFiles] = useState({
    aadhar: null,
    pan: null,
    birthCertificate: null,
    avatar: null,
  });

  useEffect(() => {
    dispatch(fetchNewUsers());
    dispatch(fetchUsers());
    dispatch(fetchClasses());
  }, [dispatch]);

  const counsellors = users?.filter(
    (u) => u.type === "admission" || u.type === "counselor" || u.type === "counsellor"
  ) || [];

  const handlePrintEnquiry = (enquiry) => {
    if (!enquiry || Object.keys(enquiry).length === 0) {
      setPrintData({ isBlank: true, academic_year: "2026-2027" });
    } else {
      setPrintData(enquiry);
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleFileUpload = async (fileUpload) => {
    if (!fileUpload) return null;
    try {
      const url = await uploadFile(fileUpload);
      return url;
    } catch (err) {
      console.error("Upload failed", err);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let documentsArray = [];

      for (const key in selectedFiles) {
        if (selectedFiles[key]) {
          const url = await handleFileUpload(selectedFiles[key]);
          if (url) {
            documentsArray.push({
              type: key,
              name: selectedFiles[key].name,
              url,
            });
          } else {
            toast.error(`Failed to upload ${key} document. Please try again.`);
            setLoading(false);
            return;
          }
        }
      }

      const rawPhone = formData.father_mobile || formData.phone || "";
      const cleanPhone = String(rawPhone).replace(/\D/g, "");
      if (cleanPhone.length < 10) {
        toast.error("Valid 10-digit mobile number is required for Parent / Mobile Number");
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        parent: formData.father_name || formData.parent,
        phone: cleanPhone,
        father_mobile: cleanPhone,
        parentEmail: formData.email || formData.parentEmail,
        documents: [...(formData.documents || []), ...documentsArray],
        assigned_to: editingId ? formData.assigned_to : (formData.assigned_to || currentUser?.id),
      };

      if (editingId) {
        await api.put(`/admission_panel/updateNewUser/${editingId}`, { data: payload });
        toast.success("Enquiry updated successfully");
      } else {
        await api.post("/admission_panel/createNewUser", { data: payload });
        toast.success("Enquiry registered successfully");
        const todayStr = new Date().toISOString().split("T")[0];
        if (endDate && endDate < todayStr) {
          setEndDate(todayStr);
        }
      }

      dispatch(fetchNewUsers());
      closeModal();
    } catch (error) {
      const respData = error.response?.data;
      const errorMsg = respData?.error?.message || respData?.message || error.message || "Failed to save enquiry";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (user, status) => {
    setLoading(true);
    try {
      const payload = {
        name: user.name,
        email: user.email,
        type: "student",
        documents: user.documents || [],
        phone: String(user.phone),
        class_id: user.class_id || null,
        bus_fee: user.bus_fee || 0,
        monthly_fee: user.monthly_fee || 0,
        fee_exempted: user.fee_exempted || false,
        admission_date: user.admission_date || null,
        address: user.address || "",
        house: user.house || "",
        dob: user.dob || null,
        gender: user.gender || null,
      };

      await api.post("/admission_panel/approveNewUser", { data: { payload, id: user.id, status } });
      toast.success(`Application ${status} successfully`);
      dispatch(fetchNewUsers());
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this application?")) {
      try {
        await api.delete(`/admission_panel/deleteNewUser/${id}`);
        toast.success("Application deleted successfully");
        dispatch(fetchNewUsers());
      } catch (error) {
        toast.error("Failed to delete application");
      }
    }
  };

  const closeModal = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setSelectedFiles({ aadhar: null, pan: null, birthCertificate: null, avatar: null });
    setOpenModal(false);
  };

  const removeDocument = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      ...initialFormData,
      ...user,
      father_name: user.father_name || user.parent || "",
      father_mobile: user.father_mobile || user.phone || "",
      father_occupation: user.father_occupation || "",
      class_id: user.class_id || "",
      assigned_to: user.assigned_to || "",
      academic_year: user.academic_year || "2026-2027",
      prev_school: user.prev_school || "",
      prev_board: user.prev_board || "",
      mother_name: user.mother_name || "",
      mother_occupation: user.mother_occupation || "",
      mother_mobile: user.mother_mobile || "",
      alternate_phone: user.alternate_phone || "",
      referral_source: user.referral_source || "",
      preferred_visit_date: user.preferred_visit_date || "",
      enquiry_remarks: user.enquiry_remarks || "",
      school_tour_status: user.school_tour_status || "Pending",
      principal_meet_status: user.principal_meet_status || "Pending",
      follow_up_date: user.follow_up_date || "",
      office_remarks: user.office_remarks || "",
    });
    setOpenModal(true);
  };

  const filteredUsers = newUsers?.filter(
    (user) => {
      // Data privacy: Counselors see their assigned leads OR unassigned leads awaiting allocation
      if (currentUser?.type === "admission" || currentUser?.type === "counselor") {
        if (user.assigned_to && currentUser?.id && String(user.assigned_to) !== String(currentUser.id)) {
          return false;
        }
      }

      const matchFilter = (filter === "All" || user.status?.toLowerCase() === filter.toLowerCase());
      const matchGender = (genderFilter === "" || user.gender === genderFilter);
      const matchSearch = user.name?.toLowerCase().includes(search.toLowerCase());
      let matchDate = true;
      if ((startDate || endDate) && user.created_at) {
        const dDate = new Date(user.created_at);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (dDate < start) matchDate = false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (dDate > end) matchDate = false;
        }
      }
      return matchFilter && matchGender && matchSearch && matchDate;
    }
  );

  const { items: sortedUsers, requestSort, sortConfig } = useSortableData(filteredUsers || []);

  const exportColumnsList = [
    { key: "sno", label: "S.No" },
    { key: "name", label: "Applicant Name" },
    { key: "email", label: "Email" },
    { key: "parent", label: "Parent Name" },
    { key: "parentEmail", label: "Parent Email" },
    { key: "phone", label: "Phone" },
    { key: "class_id", label: "Class" },
    { key: "status", label: "Status" },
    { key: "documents", label: "Documents" },
    { key: "assigned_to", label: "Assigned Counselor" },
    { key: "dob", label: "Date of Birth" },
    { key: "gender", label: "Gender" },
    { key: "created_at", label: "Applied Date" }
  ];

  const handleExportExcel = (selectedKeys) => {
    const dataToExport = filteredUsers?.map(u => {
      const row = {};
      const addIfSelected = (key, value) => {
        if (!selectedKeys || selectedKeys.includes(key)) {
          const colDef = exportColumnsList.find(c => c.key === key);
          if (colDef) row[colDef.label] = value || "N/A";
        }
      };

      addIfSelected("name", u.name);
      addIfSelected("email", u.email);
      addIfSelected("parent", u.parent);
      addIfSelected("parentEmail", u.parentEmail);
      addIfSelected("phone", u.phone);
      addIfSelected("class_id", classes?.find(c => c.id === u.class_id)?.name || "N/A");
      addIfSelected("status", u.status);
      addIfSelected("documents", Array.isArray(u.documents) ? u.documents.map(d => d.type).join(", ") : "N/A");
      addIfSelected("dob", u.dob);
      addIfSelected("gender", u.gender);
      addIfSelected("created_at", u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/A");
      return row;
    }) || [];
    exportToExcel(dataToExport, "Admissions_Report");
    toast.success("Excel downloaded");
  };

  const handleExportPDF = (selectedKeys) => {
    const activeColumns = exportColumnsList.filter(c => !selectedKeys || selectedKeys.includes(c.key));
    const columnLabels = activeColumns.map(c => c.label);

    const dataToExport = filteredUsers?.map(u => {
      const row = [];
      const addIfSelected = (key, value) => {
        if (!selectedKeys || selectedKeys.includes(key)) row.push(value || "N/A");
      };

      addIfSelected("name", u.name);
      addIfSelected("email", u.email);
      addIfSelected("parent", u.parent);
      addIfSelected("parentEmail", u.parentEmail);
      addIfSelected("phone", u.phone);
      addIfSelected("class_id", classes?.find(c => c.id === u.class_id)?.name || "N/A");
      addIfSelected("status", u.status);
      addIfSelected("documents", Array.isArray(u.documents) ? u.documents.map(d => d.type).join(", ") : "N/A");
      addIfSelected("dob", u.dob);
      addIfSelected("gender", u.gender);
      addIfSelected("created_at", u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/A");
      return row;
    }) || [];
    exportToPDF(columnLabels, dataToExport, "Admissions_Report", "Admissions Report");
    toast.success("PDF downloaded");
  };

  const renderCell = (user, key) => {
    switch (key) {
      case "name": 
        const photoUrl = user.avatar_url || (Array.isArray(user.documents) ? user.documents.find(d => d.type === "avatar" || d.name?.toLowerCase().includes("photo"))?.url : null);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <UserAvatar src={photoUrl} name={user.name} size={32} />
            <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{user.name}</span>
          </div>
        );
      case "email": return <div style={{ color: "var(--text-secondary)" }}>{user.email}</div>;
      case "parent": return user.parent || "N/A";
      case "parentEmail": return user.parentEmail || "N/A";
      case "phone": return user.phone || "N/A";
      case "class_id": return classes?.find(c => c.id === user.class_id)?.name || "N/A";
      case "status": return (
        <span
          style={{
            background: user.status?.toLowerCase() === "approved" ? "rgba(16, 185, 129, 0.15)" : user.status?.toLowerCase() === "rejected" ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
            color: user.status?.toLowerCase() === "approved" ? "#047857" : user.status?.toLowerCase() === "rejected" ? "#b91c1c" : "#b45309",
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: "600",
            textTransform: "capitalize",
            border: `1px solid ${user.status?.toLowerCase() === "approved" ? "rgba(16, 185, 129, 0.3)" : user.status?.toLowerCase() === "rejected" ? "rgba(239, 68, 68, 0.3)" : "rgba(245, 158, 11, 0.3)"}`
          }}
        >
          {user.status}
        </span>
      );
      case "documents": 
        if (!user.documents || !Array.isArray(user.documents) || user.documents.length === 0) return <span style={{ color: "var(--text-secondary)" }}>None</span>;
        return (
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {user.documents.map((doc, idx) => (
              <span key={idx} style={{ background: "rgba(59, 130, 246, 0.1)", color: "#1d4ed8", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", textTransform: "uppercase", fontWeight: "600" }}>
                {doc.type || doc.name || "Doc"}
              </span>
            ))}
          </div>
        );
      case "assigned_to": {
        const counselor = users?.find(u => String(u.id) === String(user.assigned_to));
        return counselor ? <div style={{ color: "#3b82f6", fontWeight: "500" }}>{counselor.name}</div> : <div style={{ color: "var(--text-secondary)" }}>Unassigned</div>;
      }
      case "dob": return user.dob || "N/A";
      case "gender": return user.gender || "N/A";
      case "created_at": return user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A";
      default: return "N/A";
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700" }}>Admissions</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Manage student applications</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => handlePrintEnquiry({})}
            className="btn btn-secondary"
            style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
            title="Print blank enquiry form for department circulation"
          >
            <Printer size={16} /> Print Blank Form
          </button>
          <button onClick={() => setOpenModal(true)} className="btn btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}>
            <Plus size={16} /> New Application
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "1rem" }}>
        <div style={{ flexShrink: 0 }}>
          <TableFilterHeader
          searchQuery={search}
          setSearchQuery={setSearch}
          searchPlaceholder="Search applications..."
          exportColumns={exportColumnsList}
          selectedColumns={selectedColumns}
          setSelectedColumns={setSelectedColumns}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          filters={[
            {
              // label: "All Statuses",
              value: filter,
              onChange: setFilter,
              options: [
                { value: "All", label: "All" },
                { value: "Pending", label: "Pending" },
                { value: "Approved", label: "Approved" },
                { value: "Rejected", label: "Rejected" }
              ]
            },
            {
              label: "All Genders",
              value: genderFilter,
              onChange: setGenderFilter,
              options: [
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" }
              ]
            }
          ]}
        >
          <DateRangePicker 
            startDate={startDate} 
            endDate={endDate} 
            setStartDate={setStartDate} 
            setEndDate={setEndDate} 
            defaultRange="mtd" 
          />
        </TableFilterHeader>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                {selectedColumns.includes("sno") && <th style={{ padding: "0.5rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)" }}>S.No</th>}
                {exportColumnsList.map(col => (col.key !== "sno" && selectedColumns.includes(col.key)) && (
                  <th key={col.key} style={{ padding: "0.5rem 1rem", cursor: "pointer" }} onClick={() => requestSort(col.key)}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                      {col.label}
                      {sortConfig?.key === col.key ? (
                        sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : (
                        <ChevronsUpDown size={14} style={{ opacity: 0.3 }} />
                      )}
                    </div>
                  </th>
                ))}
                <th style={{ padding: "0.5rem 1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingNewUsers ? (
                <tr>
                  <td colSpan={selectedColumns.length + 1} style={{ padding: "2rem", textAlign: "center" }}>Loading...</td>
                </tr>
              ) : filteredUsers?.length === 0 ? (
                <tr>
                  <td colSpan={selectedColumns.length + 1} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>No applications found.</td>
                </tr>
              ) : (
                sortedUsers?.map((user, index) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    {selectedColumns.includes("sno") && <td style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>{index + 1}</td>}
                    {exportColumnsList.map(col => {
                      if (col.key === "sno" || !selectedColumns.includes(col.key)) return null;
                      return <td key={col.key} style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>{renderCell(user, col.key)}</td>;
                    })}
                    <td style={{ padding: "0.5rem 1rem", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <button onClick={() => handlePrintEnquiry(user)} className="btn-ghost" title="Print Enquiry Form" style={{ display: "flex", alignItems: "center", fontSize: "0.75rem", padding: "0.25rem 0.5rem", color: "#6366f1", background: "rgba(99, 102, 241, 0.1)", borderRadius: "4px" }}>
                          <Printer size={14} style={{ marginRight: "0.25rem" }}/> Print
                        </button>
                        <button onClick={() => handleEdit(user)} className="btn-ghost" style={{ display: "flex", alignItems: "center", fontSize: "0.75rem", padding: "0.25rem 0.5rem", color: "#3b82f6", background: "rgba(59, 130, 246, 0.1)", borderRadius: "4px" }}>
                          <Edit size={14} style={{ marginRight: "0.25rem" }}/> Edit
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="btn-ghost" style={{ display: "flex", alignItems: "center", fontSize: "0.75rem", padding: "0.25rem 0.5rem", color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", borderRadius: "4px" }}>
                          <Trash2 size={14} style={{ marginRight: "0.25rem" }}/> Delete
                        </button>
                        {(user.status?.toLowerCase() === "pending" || !user.status) && (
                          <>
                            <button onClick={() => handleStatusUpdate(user, "Approved")} className="btn-ghost" style={{ display: "flex", alignItems: "center", fontSize: "0.75rem", padding: "0.25rem 0.5rem", color: "#10b981", background: "rgba(16, 185, 129, 0.1)", borderRadius: "4px" }}>
                              <CheckCircle size={14} style={{ marginRight: "0.25rem" }}/> Approve
                            </button>
                            <button onClick={() => handleStatusUpdate(user, "Rejected")} className="btn-ghost" style={{ display: "flex", alignItems: "center", fontSize: "0.75rem", padding: "0.25rem 0.5rem", color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", borderRadius: "4px" }}>
                              <XCircle size={14} style={{ marginRight: "0.25rem" }}/> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openModal && (
        <div
          className="animate-fade-in"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "stretch",
            justifyContent: "flex-end",
            zIndex: 1000,
          }}
        >
          <div
            className="drawer-right"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
              width: "720px",
              maxWidth: "96vw",
              height: "100vh",
              boxShadow: "-10px 0 35px rgba(0,0,0,0.2)",
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.25rem 1.75rem",
                borderBottom: "1px solid #e2e8f0",
                background: "#f8fafc",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                  {editingId ? "Update Admission Enquiry" : "New Admission Enquiry Form"}
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                  Vision International School, Shirur • Academic Session 2026-2027
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="btn-ghost"
                title="Close"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  color: "#64748b",
                  background: "#e2e8f0",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body - Scrollable */}
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                overflowY: "auto",
                padding: "1.5rem 1.75rem",
                gap: "1.25rem",
              }}
            >
              {/* SECTION 1: Student Details */}
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "1rem 1.25rem",
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: "700",
                    color: "#8b1d1d",
                    marginBottom: "1rem",
                    borderBottom: "1.5px solid #fee2e2",
                    paddingBottom: "0.35rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  1. Student Details
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Academic Session
                    </label>
                    <input
                      className="input-glass"
                      value={formData.academic_year || "2026-2027"}
                      onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                      placeholder="e.g. 2026-2027"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Seeking Class *
                    </label>
                    <select
                      required
                      className="input-glass"
                      value={formData.class_id}
                      onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    >
                      <option value="">Select Class</option>
                      {(classes ? classes.filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i) : []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Student's Full Name *
                    </label>
                    <input
                      required
                      className="input-glass"
                      placeholder="First Name Middle Name Surname"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Gender *
                    </label>
                    <select
                      required
                      className="input-glass"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Date of Birth *
                    </label>
                    <input
                      required
                      type="date"
                      className="input-glass"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Previous School Attended
                    </label>
                    <input
                      className="input-glass"
                      placeholder="School name & city"
                      value={formData.prev_school}
                      onChange={(e) => setFormData({ ...formData, prev_school: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Previous Board
                    </label>
                    <select
                      className="input-glass"
                      value={formData.prev_board}
                      onChange={(e) => setFormData({ ...formData, prev_board: e.target.value })}
                    >
                      <option value="">Select Board</option>
                      <option value="CBSE">CBSE</option>
                      <option value="State Board">State Board</option>
                      <option value="ICSE">ICSE</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Residential Address
                    </label>
                    <input
                      className="input-glass"
                      placeholder="Area, Street, Landmark, Shirur"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Parent / Guardian Details */}
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "1rem 1.25rem",
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: "700",
                    color: "#8b1d1d",
                    marginBottom: "1rem",
                    borderBottom: "1.5px solid #fee2e2",
                    paddingBottom: "0.35rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  2. Parent / Guardian Details
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Father's Full Name *
                    </label>
                    <input
                      required
                      className="input-glass"
                      placeholder="Father's Name"
                      value={formData.father_name}
                      onChange={(e) => setFormData({ ...formData, father_name: e.target.value, parent: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Father's Occupation
                    </label>
                    <input
                      className="input-glass"
                      placeholder="Business / Service / Farming"
                      value={formData.father_occupation}
                      onChange={(e) => setFormData({ ...formData, father_occupation: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Father's Mobile No *
                    </label>
                    <input
                      required
                      type="tel"
                      maxLength={10}
                      className="input-glass"
                      placeholder="10-digit mobile number"
                      value={formData.father_mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, father_mobile: val, phone: val });
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Mother's Full Name
                    </label>
                    <input
                      className="input-glass"
                      placeholder="Mother's Name"
                      value={formData.mother_name}
                      onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Mother's Occupation
                    </label>
                    <input
                      className="input-glass"
                      placeholder="Homemaker / Service"
                      value={formData.mother_occupation}
                      onChange={(e) => setFormData({ ...formData, mother_occupation: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Mother's Mobile No
                    </label>
                    <input
                      className="input-glass"
                      placeholder="Mobile number"
                      value={formData.mother_mobile}
                      onChange={(e) => setFormData({ ...formData, mother_mobile: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Alternate / Emergency Contact
                    </label>
                    <input
                      className="input-glass"
                      placeholder="Emergency contact number"
                      value={formData.alternate_phone}
                      onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="input-glass"
                      placeholder="parent@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value, parentEmail: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Requirements & Referral */}
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "1rem 1.25rem",
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: "700",
                    color: "#8b1d1d",
                    marginBottom: "1rem",
                    borderBottom: "1.5px solid #fee2e2",
                    paddingBottom: "0.35rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  3. Admission Requirements & Referral
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      How did you learn about VIS?
                    </label>
                    <select
                      className="input-glass"
                      value={formData.referral_source}
                      onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })}
                    >
                      <option value="">Select Referral Source</option>
                      <option value="Friends / Relatives">Friends / Relatives</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Newspaper / Advertisement">Newspaper / Advertisement</option>
                      <option value="Walk-in / Hoarding">Walk-in / Hoarding</option>
                      <option value="Existing Student / Alumni">Existing Student / Alumni</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Preferred Campus Visit Date
                    </label>
                    <input
                      type="date"
                      className="input-glass"
                      value={formData.preferred_visit_date}
                      onChange={(e) => setFormData({ ...formData, preferred_visit_date: e.target.value })}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Parent's Notes / Special Interests / Sports / Medical
                    </label>
                    <input
                      className="input-glass"
                      placeholder="Any specific interests, queries or requirements..."
                      value={formData.enquiry_remarks}
                      onChange={(e) => setFormData({ ...formData, enquiry_remarks: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: For Office Use Only */}
              <div
                style={{
                  border: "1.5px dashed #64748b",
                  borderRadius: "8px",
                  padding: "1rem 1.25rem",
                  background: "#f8fafc",
                }}
              >
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: "700",
                    color: "#0f172a",
                    marginBottom: "1rem",
                    borderBottom: "1.5px solid #cbd5e1",
                    paddingBottom: "0.35rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  4. For Office Use Only (Administrative Desk)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Enquiry Handled By (Counsellor)
                    </label>
                    <select
                      className="input-glass"
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    >
                      <option value="">Select Counsellor</option>
                      {counsellors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.email} ({c.type || "Counsellor"})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Application Status
                    </label>
                    <select
                      className="input-glass"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      School Tour Status
                    </label>
                    <select
                      className="input-glass"
                      value={formData.school_tour_status}
                      onChange={(e) => setFormData({ ...formData, school_tour_status: e.target.value })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Principal Meet Status
                    </label>
                    <select
                      className="input-glass"
                      value={formData.principal_meet_status}
                      onChange={(e) => setFormData({ ...formData, principal_meet_status: e.target.value })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Next Follow-up Date
                    </label>
                    <input
                      type="date"
                      className="input-glass"
                      value={formData.follow_up_date}
                      onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Admission Date
                    </label>
                    <input
                      type="date"
                      className="input-glass"
                      value={formData.admission_date}
                      onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                      Office / Counsellor Remarks
                    </label>
                    <input
                      className="input-glass"
                      placeholder="Follow-up notes, discussion outcome..."
                      value={formData.office_remarks}
                      onChange={(e) => setFormData({ ...formData, office_remarks: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Previously Uploaded Documents (Read-only if present) */}
              {formData.documents && formData.documents.length > 0 && (
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.75rem" }}>
                  <h3 style={{ marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: "600", color: "#475569" }}>
                    Uploaded Documents
                  </h3>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    {formData.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.8rem",
                          padding: "0.35rem 0.75rem",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          background: "#f1f5f9",
                        }}
                      >
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            textDecoration: "none",
                            color: "#0284c7",
                            fontWeight: "500",
                          }}
                        >
                          <FileText size={14} />
                          {doc.type ? doc.type.toUpperCase() : "Document"}
                        </a>
                        <button
                          type="button"
                          onClick={() => removeDocument(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            padding: "0.2rem",
                            color: "#ef4444",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drawer Footer Actions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "auto",
                  paddingTop: "1rem",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <div>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => handlePrintEnquiry({ ...formData, id: editingId })}
                      className="btn-ghost"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        fontSize: "0.85rem",
                        padding: "0.5rem 0.85rem",
                        color: "#4f46e5",
                        background: "rgba(79, 70, 229, 0.1)",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <Printer size={16} /> Print Enquiry Sheet
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button type="button" onClick={closeModal} className="btn btn-ghost" style={{ cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ cursor: "pointer", minWidth: "130px" }}
                  >
                    {loading ? "Saving..." : editingId ? "Update Enquiry" : "Save Enquiry"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Print Sheet (Visible on window.print()) */}
      <AdmissionEnquiryPrintout
        data={printData}
        counsellorName={users?.find((u) => String(u.id) === String(printData?.assigned_to))?.name || (printData?.assigned_to ? "" : "")}
        className={classes?.find((c) => String(c.id) === String(printData?.class_id) || c.name === printData?.class_id)?.name || printData?.class_id || ""}
      />
    </div>
  );
};

export default AdmissionManagement;
