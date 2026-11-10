import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Search,
  BookOpen,
  Award,
  Users,
  Sparkles,
  Download,
  Filter,
  Eye,
  Check,
  Sliders,
  Save,
  X,
  AlertCircle,
  HelpCircle,
  Plus,
  UserPlus,
  UserCheck,
  Edit3,
} from "lucide-react";
import { toast } from "react-toastify";
import { saveSubjectQuotas, assignClassSubjectTeacher } from "../../services/teacherScheduleApi";
import SearchSelectDropdown from "../../components/SearchSelectDropdown";

/**
 * MasterAllotmentMatrix Component
 * Dynamically renders the school master class-subject-teacher allotment chart
 * - 100% dynamic classes, subjects, and teachers from database
 * - Multi-teacher representation (<Name> +X others) with tooltip
 * - Distinct Academic Core & Co-Curricular categories
 * - Interactive Teacher Allotment & Weekly Period Quotas
 * - Zero hardcoded default quotas
 */
const MasterAllotmentMatrix = ({
  classes = [],
  subjects = [],
  matrix = {},
  totals = {},
  teachers = [],
  onSelectTeacher,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("ALL");
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [modalClassId, setModalClassId] = useState("");
  const [editingQuotas, setEditingQuotas] = useState({});
  const [savingQuotas, setSavingQuotas] = useState(false);

  // Interactive Faculty Allotment Modal State
  const [isAllotModalOpen, setIsAllotModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [allotClassId, setAllotClassId] = useState("");
  const [allotSubjectId, setAllotSubjectId] = useState("");
  const [allotTeacherId, setAllotTeacherId] = useState("");
  const [allotQuota, setAllotQuota] = useState("");
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  const [savingAllotment, setSavingAllotment] = useState(false);

  // Normalize classes ensuring label, classTeacher, and lists exist
  const normalizedClasses = useMemo(() => {
    return (classes || []).map((c) => ({
      ...c,
      label: c.label || c.displayName || `${c.name || "Class"}${c.section ? ` ${c.section}` : ""}`.trim(),
      classTeacher: c.classTeacher || "In-Charge",
      classTeachersList: c.classTeachersList || [],
    }));
  }, [classes]);

  // Filter classes dynamically (clean list of all classes, no sections separated)
  const filteredClasses = useMemo(() => {
    if (selectedClassId === "ALL") return normalizedClasses;
    return normalizedClasses.filter((c) => c.id === selectedClassId);
  }, [normalizedClasses, selectedClassId]);

  // Normalize matrix ensuring it is always a key-value dictionary [classId][subjectId]
  const activeMatrix = useMemo(() => {
    if (!matrix) return {};
    if (!Array.isArray(matrix)) return matrix;
    const map = {};
    matrix.forEach((item) => {
      const cid = item.classId || item.id;
      if (!cid) return;
      map[cid] = {};
      (item.allotments || []).forEach((alt) => {
        const sid = alt.subjectId || alt.id;
        if (!sid) return;
        const teacherObj = (alt.assignedTeachers && alt.assignedTeachers[0]) || {};
        map[cid][sid] = {
          periods: alt.scheduledPeriods || 0,
          teacher: teacherObj.name || alt.teacherName || alt.teacher || "",
          shortTeacher: (teacherObj.name || alt.teacherName || alt.teacher || "").split(/\s+/)[0] || "",
          teacherId: teacherObj.id || alt.teacherId || null,
          quota: alt.requiredQuota ?? alt.quota ?? null,
          classId: cid,
          subjectId: sid,
          allTeachers: alt.assignedTeachers || [],
          status: alt.status,
        };
      });
    });
    return map;
  }, [matrix]);

  // Separate subjects into the 2 exact categories from Subject Manager
  const academicSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const cat = (s.category || "").toLowerCase();
      return cat === "academics" || cat === "scholastic" || cat === "academic" || cat === "core";
    });
  }, [subjects]);

  const coCurricularSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const cat = (s.category || "").toLowerCase();
      return !(cat === "academics" || cat === "scholastic" || cat === "academic" || cat === "core");
    });
  }, [subjects]);

  // Search matching
  const isMatch = (sub, cell) => {
    if (!searchTerm.trim()) return false;
    const q = searchTerm.toLowerCase().trim();
    const subMatch = (sub.name || "").toLowerCase().includes(q);
    const teacherMatch = (cell?.teacher || "").toLowerCase().includes(q);
    return subMatch || teacherMatch;
  };

  // Helper to extract clean 2-3 char initials for class avatars (e.g. "1M", "1S", "SR", "2M")
  const getClassInitials = (c) => {
    if (!c) return "CL";
    const name = String(c.name || c.label || "").trim().toUpperCase();
    const sec = String(c.section || "").trim().toUpperCase();
    if (name.includes("SR")) return sec ? `SR${sec[0]}` : "SR";
    if (name.includes("JR")) return sec ? `JR${sec[0]}` : "JR";
    if (name.includes("NUR")) return "NUR";
    if (name.includes("PLAY") || name.includes("PG")) return "PG";
    const num = parseInt(name, 10);
    if (!isNaN(num)) return sec ? `${num}${sec[0]}` : `${num}`;
    return name.slice(0, 2);
  };

  // Compute live allocated workload per teacher from current matrix
  const teacherLoadMap = useMemo(() => {
    const loads = {};
    (teachers || []).forEach((t) => {
      loads[t.id] = 0;
    });

    Object.values(activeMatrix || {}).forEach((subMap) => {
      Object.values(subMap || {}).forEach((cell) => {
        const count = cell.periods || (cell.quota ? Number(cell.quota) : 0);
        if (cell?.teacherId && loads[cell.teacherId] !== undefined) {
          loads[cell.teacherId] += count;
        } else if (cell?.teacher) {
          const match = (teachers || []).find(
            (t) =>
              t.name?.toLowerCase().trim() === cell.teacher.toLowerCase().trim() ||
              cell.teacher.toLowerCase().includes((t.name || "").toLowerCase().trim())
          );
          if (match) {
            loads[match.id] = (loads[match.id] || 0) + count;
          }
        }
      });
    });
    return loads;
  }, [teachers, activeMatrix]);

  // Live dynamic column totals directly derived from the visible matrix cells
  const columnTotals = useMemo(() => {
    const colMap = {};
    (filteredClasses || []).forEach((c) => {
      let acadPeriods = 0;
      let acadQuota = 0;
      let coPeriods = 0;
      let coQuota = 0;

      academicSubjects.forEach((sub) => {
        const cell = activeMatrix[c.id]?.[sub.id];
        if (cell) {
          acadPeriods += Number(cell.periods) || 0;
          if (cell.quota !== null && cell.quota !== undefined && cell.quota !== "") {
            acadQuota += Number(cell.quota) || 0;
          }
        }
      });

      coCurricularSubjects.forEach((sub) => {
        const cell = activeMatrix[c.id]?.[sub.id];
        if (cell) {
          coPeriods += Number(cell.periods) || 0;
          if (cell.quota !== null && cell.quota !== undefined && cell.quota !== "") {
            coQuota += Number(cell.quota) || 0;
          }
        }
      });

      colMap[c.id] = {
        academicsPeriods: acadPeriods,
        academicsQuota: acadQuota,
        coCurricularPeriods: coPeriods,
        coCurricularQuota: coQuota,
        totalPeriods: acadPeriods + coPeriods,
        totalQuota: acadQuota + coQuota,
      };
    });
    return colMap;
  }, [filteredClasses, academicSubjects, coCurricularSubjects, activeMatrix]);

  // Open Allotment Modal for a specific cell or general
  const handleOpenAllotModal = (targetClassId, targetSubjectId) => {
    const cid = targetClassId || (filteredClasses[0]?.id || classes[0]?.id || "");
    const sid = targetSubjectId || (subjects[0]?.id || "");
    const cell = activeMatrix[cid]?.[sid] || {};
    const cls = normalizedClasses.find((c) => c.id === cid) || classes.find((c) => c.id === cid);
    const sub = subjects.find((s) => s.id === sid);

    setAllotClassId(cid);
    setAllotSubjectId(sid);

    let matchedTid = cell.teacherId || "";
    if (!matchedTid && cell.teacher && teachers.length > 0) {
      const match = teachers.find(
        (t) =>
          t.name?.toLowerCase().trim() === cell.teacher.toLowerCase().trim() ||
          cell.teacher.toLowerCase().includes((t.name || "").toLowerCase().trim())
      );
      if (match) matchedTid = match.id;
    }

    setAllotTeacherId(matchedTid);
    setAllotQuota(cell.quota !== null && cell.quota !== undefined ? String(cell.quota) : "");
    setTeacherSearchTerm("");
    setSelectedCell({
      classId: cid,
      className: cls?.label || cls?.name || "Selected Class",
      subjectId: sid,
      subjectName: sub?.name || "Selected Subject",
      currentTeacher: cell.teacher || "",
      currentQuota: cell.quota,
    });
    setIsAllotModalOpen(true);
  };

  // Change class or subject inside the Allotment Modal
  const handleModalClassOrSubjectChange = (newCid, newSid) => {
    setAllotClassId(newCid);
    setAllotSubjectId(newSid);
    const cell = activeMatrix[newCid]?.[newSid] || {};
    const cls = normalizedClasses.find((c) => c.id === newCid) || classes.find((c) => c.id === newCid);
    const sub = subjects.find((s) => s.id === newSid);

    let matchedTid = cell.teacherId || "";
    if (!matchedTid && cell.teacher && teachers.length > 0) {
      const match = teachers.find(
        (t) =>
          t.name?.toLowerCase().trim() === cell.teacher.toLowerCase().trim() ||
          cell.teacher.toLowerCase().includes((t.name || "").toLowerCase().trim())
      );
      if (match) matchedTid = match.id;
    }

    setAllotTeacherId(matchedTid);
    setAllotQuota(cell.quota !== null && cell.quota !== undefined ? String(cell.quota) : "");
    setSelectedCell({
      classId: newCid,
      className: cls?.label || cls?.name || "Selected Class",
      subjectId: newSid,
      subjectName: sub?.name || "Selected Subject",
      currentTeacher: cell.teacher || "",
      currentQuota: cell.quota,
    });
  };

  // Save Teacher Allotment to Database
  const handleSaveAllotment = async () => {
    if (!allotClassId || !allotSubjectId) {
      toast.warning("Class and Subject must be selected");
      return;
    }
    try {
      setSavingAllotment(true);
      const quotaVal = allotQuota !== "" && !isNaN(Number(allotQuota)) ? Number(allotQuota) : null;
      const sub = subjects.find((s) => s.id === allotSubjectId);
      await assignClassSubjectTeacher({
        classId: allotClassId,
        subjectId: allotSubjectId,
        teacherId: allotTeacherId || null,
        quota: quotaVal,
        subjectName: sub?.name,
      });

      const teacherObj = teachers.find((t) => t.id === allotTeacherId);
      const teacherDisplay = teacherObj ? teacherObj.name : "Unassigned";
      const cls = normalizedClasses.find((c) => c.id === allotClassId) || classes.find((c) => c.id === allotClassId);

      toast.success(
        allotTeacherId
          ? `Allotted ${teacherDisplay} to ${cls?.label || "Class"} (${sub?.name || "Subject"})`
          : `Removed teacher assignment for ${cls?.label || "Class"} (${sub?.name || "Subject"})`
      );

      setIsAllotModalOpen(false);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error("Error saving allotment:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to save allotment");
    } finally {
      setSavingAllotment(false);
    }
  };

  // Open Quotas Configuration Modal (Class-specific, stored in DB)
  const handleOpenQuotasModal = (targetClassId) => {
    const activeCid =
      (typeof targetClassId === "string" && targetClassId)
        ? targetClassId
        : (typeof selectedClassId === "string" && selectedClassId !== "ALL"
            ? selectedClassId
            : (classes[0]?.id || ""));
    setModalClassId(String(activeCid));

    // Initialize per-class quotas from matrix
    const current = {};
    classes.forEach((c) => {
      if (!c?.id || typeof c.id !== "string") return;
      current[c.id] = {};
      subjects.forEach((s) => {
        if (!s?.id || typeof s.id !== "string") return;
        const q = activeMatrix[c.id]?.[s.id]?.quota;
        current[c.id][s.id] = q !== undefined && q !== null ? q : "";
      });
    });

    setEditingQuotas(current);
    setIsQuotaModalOpen(true);
  };

  // Copy current selected class quotas to all other classes
  const handleCopyClassQuotasToAll = () => {
    if (!modalClassId) return;
    const sourceQuotas = editingQuotas[modalClassId] || {};
    const sourceClassName = classes.find((c) => c.id === modalClassId)?.label || "selected class";

    setEditingQuotas((prev) => {
      const updated = { ...prev };
      classes.forEach((c) => {
        updated[c.id] = { ...sourceQuotas };
      });
      return updated;
    });

    toast.success(`Copied weekly quotas from ${sourceClassName} to all classes!`);
  };

  // Save Class Quotas to Database (class_subjects table)
  const handleSaveQuotas = async () => {
    try {
      setSavingQuotas(true);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const cleanQuotas = {};

      Object.entries(editingQuotas).forEach(([cId, sMap]) => {
        if (!cId || typeof cId !== "string" || !uuidRegex.test(cId) || typeof sMap !== "object") return;
        cleanQuotas[cId] = {};
        Object.entries(sMap).forEach(([sId, q]) => {
          if (!sId || typeof sId !== "string" || !uuidRegex.test(sId)) return;
          const num = q !== "" && q !== null && !isNaN(Number(q)) ? Number(q) : null;
          cleanQuotas[cId][sId] = num;
        });
      });

      const res = await saveSubjectQuotas({ classSubjectQuotas: cleanQuotas });
      toast.success(res?.message || "Weekly class quotas saved to DB successfully");
      setIsQuotaModalOpen(false);
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save class quotas to database";
      toast.error(msg);
      console.error("Failed to save class quotas:", err);
    } finally {
      setSavingQuotas(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.55rem",
        flex: 1,
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Top Filter & Configuration Bar */}
      <div
        className="glass-panel"
        style={{
          padding: "0.5rem 0.85rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          borderRadius: "8px",
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Search Box */}
          <div style={{ position: "relative", width: "240px" }}>
            <Search
              size={13}
              style={{
                position: "absolute",
                left: "9px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b",
              }}
            />
            <input
              type="text"
              placeholder="Search teacher or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-glass"
              style={{
                width: "100%",
                padding: "0.25rem 0.5rem 0.25rem 1.8rem",
                fontSize: "12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
              }}
            />
          </div>

          {/* Filter Classes Dropdown (Matching Screenshot 3 design) */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>
              Filter Classes:
            </span>
            <SearchSelectDropdown
              value={selectedClassId}
              onChange={setSelectedClassId}
              options={[
                {
                  value: "ALL",
                  label: `All Classes (${classes.length})`,
                  subtext: "Show full master allotment view",
                  badge: `${classes.length} cls`,
                  initials: "ALL",
                },
                ...classes.map((c) => ({
                  value: c.id,
                  label: c.label,
                  subtext: c.classTeacher ? `Class In-Charge: ${c.classTeacher}` : "No teacher assigned",
                  badge: "Class",
                  initials: getClassInitials(c),
                })),
              ]}
              placeholder="Select Class..."
              searchPlaceholder="Search class by name..."
              minWidth="160px"
              dropdownWidth="300px"
              itemLabelSingular="class"
              itemLabelPlural="classes"
            />
          </div>
        </div>

        {/* Legend, DM Quota Configuration Button & Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "11px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                background: "#dcfce7",
                border: "1px solid #86efac",
                borderRadius: "3px",
              }}
            />
            <span style={{ color: "#166534", fontWeight: "700" }}>Assigned Teacher</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                background: "#ede9fe",
                border: "1px solid #c4b5fd",
                borderRadius: "3px",
              }}
            />
            <span style={{ color: "#6b21a8", fontWeight: "700" }}>Academic Core</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                background: "#fef3c7",
                border: "1px solid #fcd34d",
                borderRadius: "3px",
              }}
            />
            <span style={{ color: "#92400e", fontWeight: "700" }}>Co-Curricular</span>
          </div>

          {/* Allot Faculty Button */}
          <button
            onClick={() => handleOpenAllotModal()}
            className="btn-glass"
            style={{
              padding: "0.32rem 0.85rem",
              fontSize: "11.5px",
              fontWeight: "800",
              color: "#ffffff",
              background: "linear-gradient(135deg, #16a34a, #15803d)",
              border: "1.5px solid #16a34a",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(22,163,74,0.25)",
            }}
            title="Allot a teacher to any class and subject"
          >
            <UserPlus size={13} color="#ffffff" strokeWidth={2.5} />
            + Allot Faculty
          </button>

          {/* Quota Configuration Button */}
          <button
            onClick={() => handleOpenQuotasModal()}
            className="btn-glass"
            style={{
              padding: "0.32rem 0.75rem",
              fontSize: "11.5px",
              fontWeight: "800",
              color: "#1e3a8a",
              background: "#dbeafe",
              border: "1.5px solid #60a5fa",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(37,99,235,0.1)",
            }}
            title="Configure weekly period quotas for class subjects"
          >
            <Sliders size={13} color="#1d4ed8" />
            Class Quota
          </button>

          {/* Teacher Quotas Navigation Button */}
          <button
            onClick={() => navigate("/matrix")}
            className="btn-glass"
            style={{
              padding: "0.32rem 0.75rem",
              fontSize: "11.5px",
              fontWeight: "800",
              color: "#6d28d9",
              background: "#ede9fe",
              border: "1.5px solid #a78bfa",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(124,58,237,0.1)",
            }}
            title="View & Configure Weekly Faculty Quotas"
          >
            <Sliders size={13} color="#7c3aed" />
            Teacher Quotas
          </button>

          <span
            style={{
              color: "#64748b",
              fontWeight: "600",
              borderLeft: "1px solid #e2e8f0",
              paddingLeft: "0.5rem",
            }}
          >
            {filteredClasses.length} Classes · {subjects.length} Subjects
          </span>
        </div>
      </div>

      {/* Main Two-Tier Matrix Grid (Sticky Headers & Left Column) */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          height: "100%",
          minHeight: 0,
          overflow: "auto",
          borderRadius: "8px",
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
        }}
      >
        <table
          style={{
            width: "max-content",
            borderCollapse: "separate",
            borderSpacing: 0,
            fontSize: "11.5px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {/* Table Header: Two Rows */}
          <thead>
            {/* ROW 1: Class In-Charge with Multi-Teacher representation (<Name> +X others) */}
            <tr>
              <th
                style={{
                  position: "sticky",
                  top: 0,
                  left: 0,
                  zIndex: 30,
                  background: "#15803d",
                  color: "#ffffff",
                  padding: "0.45rem 0.75rem",
                  textAlign: "left",
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  borderBottom: "1px solid #166534",
                  borderRight: "2px solid #166534",
                  width: "220px",
                  minWidth: "220px",
                  maxWidth: "220px",
                  boxSizing: "border-box",
                }}
              >
                Class In-Charge
              </th>
              {filteredClasses.map((c) => {
                const teachersList = c.classTeachersList || [];
                const tooltipText =
                  teachersList.length > 0
                    ? `Class In-Charge (${teachersList.length} Teachers Assigned):\n${teachersList.join("\n")}`
                    : "No Class Teacher Assigned";

                return (
                  <th
                    key={`ct_${c.id}`}
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 20,
                      background: "#86efac",
                      color: "#14532d",
                      padding: "0.42rem 0.45rem",
                      textAlign: "center",
                      fontSize: "11px",
                      fontWeight: "800",
                      borderBottom: "1px solid #bbf7d0",
                      borderRight: "1px solid #bbf7d0",
                      width: "120px",
                      minWidth: "110px",
                      maxWidth: "135px",
                      boxSizing: "border-box",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      cursor: "help",
                    }}
                    title={tooltipText}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "2px",
                        maxWidth: "100%",
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.classTeacher || "In-Charge"}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* ROW 2: Class & Section (100% Dynamic from Database) */}
            <tr>
              <th
                style={{
                  position: "sticky",
                  top: "31px",
                  left: 0,
                  zIndex: 30,
                  background: "#fed7aa",
                  color: "#9a3412",
                  padding: "0.4rem 0.75rem",
                  textAlign: "left",
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  borderBottom: "2px solid #fdba74",
                  borderRight: "2px solid #fdba74",
                  width: "220px",
                  minWidth: "220px",
                  maxWidth: "220px",
                  boxSizing: "border-box",
                  boxShadow: "0 2px 3px rgba(0,0,0,0.06)",
                }}
              >
                Subjects & Quota
              </th>
              {filteredClasses.map((c) => (
                <th
                  key={`cls_${c.id}`}
                  style={{
                    position: "sticky",
                    top: "31px",
                    zIndex: 20,
                    background: "#ffedd5",
                    color: "#9a3412",
                    padding: "0.4rem 0.5rem",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: "800",
                    borderBottom: "2px solid #fdba74",
                    borderRight: "1px solid #fed7aa",
                    width: "120px",
                    minWidth: "110px",
                    maxWidth: "135px",
                    boxSizing: "border-box",
                    boxShadow: "0 2px 3px rgba(0,0,0,0.06)",
                  }}
                  title={`Live Database Class: ${c.label}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {/* 1. ACADEMIC CORE SECTION BANNER */}
            <tr style={{ background: "#ede9fe" }}>
              <td
                colSpan={filteredClasses.length + 1}
                style={{
                  position: "sticky",
                  left: 0,
                  padding: "0.35rem 0.75rem",
                  fontSize: "11px",
                  fontWeight: "900",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "#5b21b6",
                  background: "#ede9fe",
                  borderBottom: "1px solid #ddd6fe",
                  borderTop: "1px solid #c4b5fd",
                }}
              >
                📘 Academic Core ({academicSubjects.length} Subjects)
              </td>
            </tr>

            {/* ACADEMIC CORE SUBJECT ROWS */}
            {academicSubjects.map((sub, sIdx) => {
              return (
                <React.Fragment key={sub.id}>
                  {/* Row A: Period Count */}
                  <tr style={{ background: sIdx % 2 === 0 ? "#ffffff" : "#fbfcfe" }}>
                    <td
                      rowSpan={2}
                      style={{
                        position: "sticky",
                        left: 0,
                        zIndex: 10,
                        background: "#fed7aa",
                        color: "#7c2d12",
                        padding: "0.45rem 0.75rem",
                        fontWeight: "800",
                        fontSize: "12px",
                        borderBottom: "1px solid #fdba74",
                        borderRight: "2px solid #fdba74",
                        width: "220px",
                        minWidth: "220px",
                        maxWidth: "220px",
                        boxSizing: "border-box",
                        verticalAlign: "middle",
                      }}
                    >
                      <span style={{ color: "#7c2d12", fontWeight: "800", fontSize: "12px" }}>
                        {sub.name}
                      </span>
                    </td>

                    {filteredClasses.map((c) => {
                      const cell = activeMatrix[c.id]?.[sub.id] || null;
                      const matched = isMatch(sub, cell);
                      const periods = cell?.periods || 0;
                      const classQuota = cell?.quota;
                      const hasClassQuota = classQuota !== undefined && classQuota !== null && classQuota !== "";
                      const quotaNum = hasClassQuota ? Number(classQuota) : null;
                      const isTargetMet = hasClassQuota && periods > 0 && periods === quotaNum;
                      const isOverTarget = hasClassQuota && periods > quotaNum;

                      return (
                        <td
                          key={`p_${c.id}_${sub.id}`}
                          onClick={() => handleOpenAllotModal(c.id, sub.id)}
                          style={{
                            padding: "0.35rem 0.4rem",
                            textAlign: "center",
                            width: "120px",
                            minWidth: "110px",
                            maxWidth: "135px",
                            boxSizing: "border-box",
                            cursor: "pointer",
                            color: periods > 0 ? (isOverTarget ? "#b91c1c" : isTargetMet ? "#15803d" : "#0f172a") : "#94a3b8",
                            background: matched
                              ? "#fef08a"
                              : periods > 0
                              ? isTargetMet
                                ? "#f0fdf4"
                                : isOverTarget
                                ? "#fef2f2"
                                : "transparent"
                              : "#fafafa",
                            borderRight: "1px solid #e2e8f0",
                            borderBottom: "1px dashed #e2e8f0",
                            transition: "background 0.15s ease",
                          }}
                          title={
                            hasClassQuota
                              ? `Class ${c.label} · ${sub.name}: ${periods} periods assigned / ${quotaNum} weekly quota. Click to allot teacher or edit quota.`
                              : `Class ${c.label} · ${sub.name}: ${periods} periods assigned. Click to allot teacher & quota.`
                          }
                        >
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "3px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "15px",
                                fontWeight: "900",
                                letterSpacing: "-0.01em",
                              }}
                            >
                              {periods > 0 ? periods : "0"}
                            </span>
                            {hasClassQuota && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "800",
                                  color: isTargetMet ? "#16a34a" : isOverTarget ? "#dc2626" : "#64748b",
                                  opacity: 0.9,
                                }}
                              >
                                /{quotaNum}
                              </span>
                            )}
                            {isTargetMet && (
                              <Check size={11} color="#16a34a" strokeWidth={3.2} />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row B: Assigned Teacher */}
                  <tr style={{ background: "#f0fdf4" }}>
                    {filteredClasses.map((c) => {
                      const cell = activeMatrix[c.id]?.[sub.id] || null;
                      const matched = isMatch(sub, cell);
                      const teacherName = cell?.shortTeacher || cell?.teacher || "";

                      return (
                        <td
                          key={`t_${c.id}_${sub.id}`}
                          onClick={() => handleOpenAllotModal(c.id, sub.id)}
                          style={{
                            padding: "0.22rem 0.35rem",
                            textAlign: "center",
                            fontSize: "10.5px",
                            fontWeight: "700",
                            width: "120px",
                            minWidth: "110px",
                            maxWidth: "135px",
                            boxSizing: "border-box",
                            color: teacherName ? "#166534" : "#94a3b8",
                            background: matched
                              ? "#fde047"
                              : teacherName
                              ? "#dcfce7"
                              : "transparent",
                            borderRight: "1px solid #e2e8f0",
                            borderBottom: "1px solid #cbd5e1",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            transition: "all 0.15s ease",
                          }}
                          title={
                            cell?.teacher
                              ? `Assigned: ${cell.teacher} (${cell.periods || 0} periods). Click to reassign or edit quota.`
                              : `Unassigned. Click to allot teacher & quota.`
                          }
                        >
                          {teacherName ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <span>{teacherName}</span>
                              <Edit3 size={9} style={{ opacity: 0.6 }} />
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                fontSize: "10px",
                                fontWeight: "700",
                                color: "#16a34a",
                                background: "#f0fdf4",
                                border: "1px dashed #86efac",
                              }}
                            >
                              + Allot
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}

            {/* 2. ACADEMICS TOTAL SUMMARY ROW */}
            <tr style={{ background: "#f3e8ff", borderTop: "2px solid #a855f7" }}>
              <td
                style={{
                  position: "sticky",
                  left: 0,
                  zIndex: 10,
                  background: "#d8b4fe",
                  color: "#581c87",
                  padding: "0.45rem 0.75rem",
                  fontWeight: "900",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  borderBottom: "2px solid #a855f7",
                  borderRight: "2px solid #a855f7",
                  width: "220px",
                  minWidth: "220px",
                  maxWidth: "220px",
                  boxSizing: "border-box",
                }}
              >
                Academics Total
              </td>
              {filteredClasses.map((c) => {
                const t = columnTotals[c.id] || { academicsPeriods: 0, academicsQuota: 0 };
                const hasQuota = t.academicsQuota > 0;
                return (
                  <td
                    key={`tot_acad_${c.id}`}
                    style={{
                      padding: "0.45rem 0.4rem",
                      textAlign: "center",
                      fontWeight: "900",
                      fontSize: "14px",
                      color: "#6b21a8",
                      borderRight: "1px solid #d8b4fe",
                      borderBottom: "2px solid #a855f7",
                      background: "#f3e8ff",
                      width: "120px",
                      minWidth: "110px",
                      maxWidth: "135px",
                      boxSizing: "border-box",
                    }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                      <span>{t.academicsPeriods}</span>
                      {hasQuota && (
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#9333ea", opacity: 0.85 }}>
                          /{t.academicsQuota}
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* 3. CO-CURRICULAR SECTION BANNER */}
            <tr style={{ background: "#fef3c7" }}>
              <td
                colSpan={filteredClasses.length + 1}
                style={{
                  position: "sticky",
                  left: 0,
                  padding: "0.35rem 0.75rem",
                  fontSize: "11px",
                  fontWeight: "900",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "#92400e",
                  background: "#fef3c7",
                  borderBottom: "1px solid #fde68a",
                  borderTop: "1px solid #fcd34d",
                }}
              >
                ✨ Co-Curricular & Activities ({coCurricularSubjects.length} Subjects)
              </td>
            </tr>

            {/* CO-CURRICULAR SUBJECT ROWS */}
            {coCurricularSubjects.map((sub, sIdx) => {
              return (
                <React.Fragment key={sub.id}>
                  {/* Row A: Period Count */}
                  <tr style={{ background: sIdx % 2 === 0 ? "#ffffff" : "#fbfcfe" }}>
                    <td
                      rowSpan={2}
                      style={{
                        position: "sticky",
                        left: 0,
                        zIndex: 10,
                        background: "#fed7aa",
                        color: "#7c2d12",
                        padding: "0.45rem 0.75rem",
                        fontWeight: "800",
                        fontSize: "12px",
                        borderBottom: "1px solid #fdba74",
                        borderRight: "2px solid #fdba74",
                        width: "220px",
                        minWidth: "220px",
                        maxWidth: "220px",
                        boxSizing: "border-box",
                        verticalAlign: "middle",
                      }}
                    >
                      <span style={{ color: "#7c2d12", fontWeight: "800", fontSize: "12px" }}>
                        {sub.name}
                      </span>
                    </td>

                    {filteredClasses.map((c) => {
                      const cell = activeMatrix[c.id]?.[sub.id] || null;
                      const matched = isMatch(sub, cell);
                      const periods = cell?.periods || 0;
                      const classQuota = cell?.quota;
                      const hasClassQuota = classQuota !== undefined && classQuota !== null && classQuota !== "";
                      const quotaNum = hasClassQuota ? Number(classQuota) : null;
                      const isTargetMet = hasClassQuota && periods > 0 && periods === quotaNum;
                      const isOverTarget = hasClassQuota && periods > quotaNum;

                      return (
                        <td
                          key={`p_co_${c.id}_${sub.id}`}
                          onClick={() => handleOpenAllotModal(c.id, sub.id)}
                          style={{
                            padding: "0.35rem 0.4rem",
                            textAlign: "center",
                            width: "120px",
                            minWidth: "110px",
                            maxWidth: "135px",
                            boxSizing: "border-box",
                            cursor: "pointer",
                            color: periods > 0 ? (isOverTarget ? "#b91c1c" : isTargetMet ? "#15803d" : "#0f172a") : "#94a3b8",
                            background: matched
                              ? "#fef08a"
                              : periods > 0
                              ? isTargetMet
                                ? "#f0fdf4"
                                : isOverTarget
                                ? "#fef2f2"
                                : "transparent"
                              : "#fafafa",
                            borderRight: "1px solid #e2e8f0",
                            borderBottom: "1px dashed #e2e8f0",
                            transition: "background 0.15s ease",
                          }}
                          title={
                            hasClassQuota
                              ? `Class ${c.label} · ${sub.name}: ${periods} periods assigned / ${quotaNum} weekly quota. Click to allot teacher or edit quota.`
                              : `Class ${c.label} · ${sub.name}: ${periods} periods assigned. Click to allot teacher & quota.`
                          }
                        >
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "3px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "15px",
                                fontWeight: "900",
                                letterSpacing: "-0.01em",
                              }}
                            >
                              {periods > 0 ? periods : "0"}
                            </span>
                            {hasClassQuota && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: "800",
                                  color: isTargetMet ? "#16a34a" : isOverTarget ? "#dc2626" : "#64748b",
                                  opacity: 0.9,
                                }}
                              >
                                /{quotaNum}
                              </span>
                            )}
                            {isTargetMet && (
                              <Check size={11} color="#16a34a" strokeWidth={3.2} />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row B: Assigned Teacher */}
                  <tr style={{ background: "#f0fdf4" }}>
                    {filteredClasses.map((c) => {
                      const cell = activeMatrix[c.id]?.[sub.id] || null;
                      const matched = isMatch(sub, cell);
                      const teacherName = cell?.shortTeacher || cell?.teacher || "";

                      return (
                        <td
                          key={`t_co_${c.id}_${sub.id}`}
                          onClick={() => handleOpenAllotModal(c.id, sub.id)}
                          style={{
                            padding: "0.22rem 0.35rem",
                            textAlign: "center",
                            fontSize: "10.5px",
                            fontWeight: "700",
                            width: "120px",
                            minWidth: "110px",
                            maxWidth: "135px",
                            boxSizing: "border-box",
                            color: teacherName ? "#166534" : "#94a3b8",
                            background: matched
                              ? "#fde047"
                              : teacherName
                              ? "#dcfce7"
                              : "transparent",
                            borderRight: "1px solid #e2e8f0",
                            borderBottom: "1px solid #cbd5e1",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            transition: "all 0.15s ease",
                          }}
                          title={
                            cell?.teacher
                              ? `Assigned: ${cell.teacher} (${cell.periods || 0} periods). Click to reassign or edit quota.`
                              : `Unassigned. Click to allot teacher & quota.`
                          }
                        >
                          {teacherName ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <span>{teacherName}</span>
                              <Edit3 size={9} style={{ opacity: 0.6 }} />
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                fontSize: "10px",
                                fontWeight: "700",
                                color: "#16a34a",
                                background: "#f0fdf4",
                                border: "1px dashed #86efac",
                              }}
                            >
                              + Allot
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}

            {/* 4. CO-CURRICULAR TOTAL SUMMARY ROW */}
            <tr style={{ background: "#fef9c3", borderTop: "2px solid #eab308" }}>
              <td
                style={{
                  position: "sticky",
                  left: 0,
                  zIndex: 10,
                  background: "#fde047",
                  color: "#854d0e",
                  padding: "0.45rem 0.75rem",
                  fontWeight: "900",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  borderBottom: "2px solid #eab308",
                  borderRight: "2px solid #eab308",
                  width: "220px",
                  minWidth: "220px",
                  maxWidth: "220px",
                  boxSizing: "border-box",
                }}
              >
                Co-Curricular Total
              </td>
              {filteredClasses.map((c) => {
                const t = columnTotals[c.id] || { coCurricularPeriods: 0, coCurricularQuota: 0 };
                const hasQuota = t.coCurricularQuota > 0;
                return (
                  <td
                    key={`tot_co_${c.id}`}
                    style={{
                      padding: "0.45rem 0.4rem",
                      textAlign: "center",
                      fontWeight: "900",
                      fontSize: "14px",
                      color: "#854d0e",
                      borderRight: "1px solid #fde047",
                      borderBottom: "2px solid #eab308",
                      background: "#fef9c3",
                      width: "120px",
                      minWidth: "110px",
                      maxWidth: "135px",
                      boxSizing: "border-box",
                    }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                      <span>{t.coCurricularPeriods}</span>
                      {hasQuota && (
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#ca8a04", opacity: 0.85 }}>
                          /{t.coCurricularQuota}
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* 5. GRAND TOTAL ROW */}
            <tr style={{ background: "#e0f2fe", borderTop: "2px solid #0284c7" }}>
              <td
                style={{
                  position: "sticky",
                  left: 0,
                  zIndex: 10,
                  background: "#bae6fd",
                  color: "#0369a1",
                  padding: "0.45rem 0.75rem",
                  fontWeight: "900",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  borderBottom: "1px solid #0284c7",
                  borderRight: "2px solid #0284c7",
                  width: "220px",
                  minWidth: "220px",
                  maxWidth: "220px",
                  boxSizing: "border-box",
                }}
              >
                Total Periods / Wk
              </td>
              {filteredClasses.map((c) => {
                const t = columnTotals[c.id] || { totalPeriods: 0, totalQuota: 0 };
                const hasQuota = t.totalQuota > 0;
                const isMatch = hasQuota && t.totalPeriods === t.totalQuota;
                const isOver = hasQuota && t.totalPeriods > t.totalQuota;
                return (
                  <td
                    key={`tot_all_${c.id}`}
                    style={{
                      padding: "0.45rem 0.4rem",
                      textAlign: "center",
                      fontWeight: "900",
                      fontSize: "15px",
                      color: isMatch ? "#16a34a" : isOver ? "#dc2626" : "#0369a1",
                      borderRight: "1px solid #bae6fd",
                      borderBottom: "1px solid #0284c7",
                      background: isMatch ? "#ecfdf5" : isOver ? "#fef2f2" : "#e0f2fe",
                      width: "120px",
                      minWidth: "110px",
                      maxWidth: "135px",
                      boxSizing: "border-box",
                    }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                      <span>{t.totalPeriods}</span>
                      {hasQuota && (
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "800",
                            color: isMatch ? "#15803d" : isOver ? "#b91c1c" : "#0284c7",
                            opacity: 0.9,
                          }}
                        >
                          /{t.totalQuota}
                        </span>
                      )}
                      {isMatch && <Check size={12} color="#16a34a" strokeWidth={3.2} />}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Interactive Faculty Allotment Modal */}
      {isAllotModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAllotModalOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
              borderRadius: "14px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #cbd5e1",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "10px",
                    background: "#dcfce7",
                    color: "#15803d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UserPlus size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "800",
                      color: "#0f172a",
                      margin: 0,
                    }}
                  >
                    Allot Faculty & Quota
                  </h3>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      margin: 0,
                      marginTop: "2px",
                    }}
                  >
                    Pair teaching faculty to class curriculum and assign weekly lecture quotas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAllotModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                  borderRadius: "6px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: "1.25rem",
                overflowY: "auto",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {/* Class & Subject Selector Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: "800",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "#475569",
                      marginBottom: "4px",
                    }}
                  >
                    Class Division
                  </label>
                  <select
                    value={allotClassId}
                    onChange={(e) => handleModalClassOrSubjectChange(e.target.value, allotSubjectId)}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      fontSize: "13px",
                      fontWeight: "700",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#0f172a",
                      cursor: "pointer",
                    }}
                  >
                    {classes.map((c) => (
                      <option key={`c_sel_${c.id}`} value={c.id}>
                        {c.label || `${c.name} ${c.section || ""}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: "800",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "#475569",
                      marginBottom: "4px",
                    }}
                  >
                    Curriculum Subject
                  </label>
                  <select
                    value={allotSubjectId}
                    onChange={(e) => handleModalClassOrSubjectChange(allotClassId, e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      fontSize: "13px",
                      fontWeight: "700",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#0f172a",
                      cursor: "pointer",
                    }}
                  >
                    <optgroup label="Academic Core">
                      {academicSubjects.map((s) => (
                        <option key={`sub_acad_${s.id}`} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Co-Curricular & Activities">
                      {coCurricularSubjects.map((s) => (
                        <option key={`sub_co_${s.id}`} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Weekly Quota Selector */}
              <div
                style={{
                  background: "#f8fafc",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "11.5px",
                      fontWeight: "800",
                      color: "#1e293b",
                    }}
                  >
                    Weekly Periods Quota
                  </label>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[2, 4, 5, 6, 8, 10].map((preset) => (
                      <button
                        key={`preset_${preset}`}
                        type="button"
                        onClick={() => setAllotQuota(String(preset))}
                        style={{
                          padding: "2px 7px",
                          fontSize: "11px",
                          fontWeight: "700",
                          borderRadius: "4px",
                          border: allotQuota === String(preset) ? "1px solid #16a34a" : "1px solid #cbd5e1",
                          background: allotQuota === String(preset) ? "#dcfce7" : "#ffffff",
                          color: allotQuota === String(preset) ? "#166534" : "#475569",
                          cursor: "pointer",
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    placeholder="e.g. 5"
                    value={allotQuota}
                    onChange={(e) => setAllotQuota(e.target.value)}
                    style={{
                      width: "90px",
                      padding: "0.45rem 0.65rem",
                      fontSize: "14px",
                      fontWeight: "800",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      textAlign: "center",
                    }}
                  />
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                    periods per week required for timetable generation
                  </span>
                </div>

                {Number(allotQuota) > 6 && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "5px 8px",
                      borderRadius: "6px",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      fontSize: "11px",
                      color: "#1e40af",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span>⚡ <strong>Daily Cap Notice:</strong> {allotQuota} periods in a 6-day week will schedule up to {Math.ceil(Number(allotQuota) / 6)} periods per day on some days (Double Period mode enabled).</span>
                  </div>
                )}
              </div>

              {/* Faculty Member Selection */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "800",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "#475569",
                    }}
                  >
                    Assign Faculty Member ({teachers.length} Active Staff)
                  </label>
                  <div style={{ position: "relative", width: "180px" }}>
                    <Search
                      size={12}
                      style={{
                        position: "absolute",
                        left: "7px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Filter staff..."
                      value={teacherSearchTerm}
                      onChange={(e) => setTeacherSearchTerm(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.28rem 0.5rem 0.28rem 1.6rem",
                        fontSize: "11px",
                        borderRadius: "5px",
                        border: "1px solid #cbd5e1",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {/* Teachers List Box */}
                <div
                  style={{
                    maxHeight: "220px",
                    overflowY: "auto",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Option: Unassigned / Remove Allotment */}
                  <div
                    onClick={() => setAllotTeacherId("")}
                    style={{
                      padding: "0.55rem 0.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid #e2e8f0",
                      background: allotTeacherId === "" ? "#fef2f2" : "#ffffff",
                      cursor: "pointer",
                      transition: "background 0.12s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: "14px",
                          height: "14px",
                          borderRadius: "50%",
                          border: allotTeacherId === "" ? "4px solid #ef4444" : "1.5px solid #cbd5e1",
                        }}
                      />
                      <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#b91c1c" }}>
                        🚫 None / Leave Unassigned
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Clear assignment</span>
                  </div>

                  {/* Filtered Faculty Members */}
                  {(teachers || [])
                    .filter((t) => {
                      if (!teacherSearchTerm.trim()) return true;
                      const q = teacherSearchTerm.toLowerCase();
                      return (
                        (t.name || "").toLowerCase().includes(q) ||
                        (t.email || "").toLowerCase().includes(q)
                      );
                    })
                    .map((t) => {
                      const isSelected = allotTeacherId === t.id;
                      const load = teacherLoadMap[t.id] || 0;
                      const maxQuota = t.weeklyQuota || 30;
                      const isHeavy = load >= maxQuota;

                      return (
                        <div
                          key={`staff_opt_${t.id}`}
                          onClick={() => setAllotTeacherId(t.id)}
                          style={{
                            padding: "0.5rem 0.75rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderBottom: "1px solid #f1f5f9",
                            background: isSelected ? "#f0fdf4" : "#ffffff",
                            cursor: "pointer",
                            transition: "background 0.12s ease",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div
                              style={{
                                width: "14px",
                                height: "14px",
                                borderRadius: "50%",
                                border: isSelected ? "4px solid #16a34a" : "1.5px solid #cbd5e1",
                              }}
                            />
                            <div>
                              <div
                                style={{
                                  fontSize: "12.5px",
                                  fontWeight: isSelected ? "800" : "700",
                                  color: isSelected ? "#15803d" : "#1e293b",
                                }}
                              >
                                {t.name}
                              </div>
                              {t.email && (
                                <div style={{ fontSize: "10.5px", color: "#64748b" }}>
                                  {t.email}
                                </div>
                              )}
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "800",
                                padding: "2px 6px",
                                borderRadius: "10px",
                                background: isHeavy ? "#fef2f2" : "#f1f5f9",
                                color: isHeavy ? "#dc2626" : "#475569",
                                border: isHeavy ? "1px solid #fecaca" : "1px solid #e2e8f0",
                              }}
                            >
                              {load}/{maxQuota} periods
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "0.75rem 1.25rem",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "0.65rem",
                background: "#f8fafc",
              }}
            >
              <button
                type="button"
                onClick={() => setIsAllotModalOpen(false)}
                className="btn-glass"
                style={{
                  padding: "0.45rem 0.95rem",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#475569",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAllotment}
                disabled={savingAllotment}
                style={{
                  padding: "0.45rem 1.2rem",
                  fontSize: "12.5px",
                  fontWeight: "800",
                  color: "#ffffff",
                  background: "linear-gradient(135deg, #16a34a, #15803d)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: savingAllotment ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 4px rgba(22, 163, 74, 0.3)",
                }}
              >
                <Save size={13} />
                {savingAllotment ? "Saving Allotment..." : "Save Allotment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Engine / DM Quotas Configuration Modal */}
      {isQuotaModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "600px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "0.85rem 1.25rem",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    padding: "6px",
                    borderRadius: "8px",
                    background: "#dbeafe",
                    color: "#1d4ed8",
                  }}
                >
                  <Sliders size={18} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: "800",
                      color: "#0f172a",
                      margin: 0,
                    }}
                  >
                    Class-Wise Subject Quotas
                  </h3>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      margin: 0,
                      marginTop: "2px",
                    }}
                  >
                    Specify weekly period quotas per class. Stored in database.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuotaModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: "1rem 1.25rem",
                overflowY: "auto",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {/* Class Selector & Copy-to-all Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#f1f5f9",
                  padding: "0.55rem 0.85rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "#1e293b" }}>
                    Configure Class:
                  </span>
                  <SearchSelectDropdown
                    value={modalClassId}
                    onChange={(val) => setModalClassId(typeof val === "object" ? val?.value || "" : String(val))}
                    options={classes.map((c) => ({
                      value: c.id,
                      label: `${c.label} (${c.name} ${c.section || ""})`,
                      subtext: c.classTeacher ? `Class In-Charge: ${c.classTeacher}` : "No teacher assigned",
                      badge: "Class",
                      initials: getClassInitials(c),
                    }))}
                    placeholder="Select Class..."
                    searchPlaceholder="Search class by name..."
                    minWidth="175px"
                    dropdownWidth="280px"
                    itemLabelSingular="class"
                    itemLabelPlural="classes"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCopyClassQuotasToAll}
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#1e40af",
                    background: "#dbeafe",
                    border: "1px solid #93c5fd",
                    borderRadius: "6px",
                    padding: "0.3rem 0.65rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Copy these numbers to all classes in the school"
                >
                  <span>📋 Copy this Class to All</span>
                </button>
              </div>

              <div
                style={{
                  padding: "0.55rem 0.75rem",
                  borderRadius: "6px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  fontSize: "11px",
                  color: "#1e40af",
                  display: "flex",
                  gap: "6px",
                }}
              >
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: "1px" }} />
                <span>
                  Each class has its own weekly period requirement. Quotas are saved to the database (class_subjects) for the Attendance Manager validation engine.
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.65rem",
                }}
              >
                {subjects.map((s) => {
                  const isAcad = s.category === "academics";
                  const val = editingQuotas[modalClassId]?.[s.id] ?? "";

                  return (
                    <div
                      key={`quota_input_${s.id}`}
                      style={{
                        padding: "0.55rem 0.75rem",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        background: isAcad ? "#fbfbfe" : "#fffdfa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "800",
                            color: "#1e293b",
                          }}
                        >
                          {s.name}
                        </div>
                        <div
                          style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            color: isAcad ? "#6b21a8" : "#92400e",
                            textTransform: "uppercase",
                          }}
                        >
                          {isAcad ? "Academic Core" : "Co-Curricular"}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <input
                          type="number"
                          min="0"
                          max="40"
                          placeholder="Quota"
                          value={val}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const parsed = raw === "" ? "" : parseInt(raw, 10);
                            const targetCid = typeof modalClassId === "string" ? modalClassId : (modalClassId?.value || String(modalClassId));
                            setEditingQuotas((prev) => ({
                              ...prev,
                              [targetCid]: {
                                ...(prev[targetCid] || {}),
                                [s.id]: parsed,
                              },
                            }));
                          }}
                          className="input-glass"
                          style={{
                            width: "70px",
                            textAlign: "center",
                            padding: "0.25rem",
                            fontSize: "12px",
                            fontWeight: "800",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                          }}
                        />
                        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
                          /wk
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "0.75rem 1.25rem",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "0.65rem",
                background: "#f8fafc",
              }}
            >
              <button
                onClick={() => setIsQuotaModalOpen(false)}
                className="btn-glass"
                style={{
                  padding: "0.4rem 0.85rem",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#475569",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuotas}
                disabled={savingQuotas}
                style={{
                  padding: "0.4rem 1rem",
                  fontSize: "12px",
                  fontWeight: "800",
                  color: "#ffffff",
                  background: "#2563eb",
                  border: "none",
                  borderRadius: "6px",
                  cursor: savingQuotas ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  boxShadow: "0 1px 2px rgba(37,99,235,0.3)",
                }}
              >
                <Save size={13} />
                {savingQuotas ? "Saving to DB..." : "Save Class Quotas to DB"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterAllotmentMatrix;
