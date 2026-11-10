import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
];

const getActiveSchool = (override) => {
  let school = override;
  if (!school) {
    try {
      const stored = localStorage.getItem("adminUser") || localStorage.getItem("user");
      if (stored) school = JSON.parse(stored);
    } catch (e) {}
  }
  const isVision = (school?.schoolSlug || school?.slug || "").toLowerCase() === "vision";
  const schoolName = (school?.schoolName || school?.name || (isVision ? "Vision International School" : "School Campus"));
  const trustName = school?.schoolMotto || school?.trustName || school?.motto || (isVision ? "Pokharana Educational Trust's" : "");
  return { schoolName, trustName };
};

/**
 * Loads image from URL and returns base64 dataURL for jsPDF addImage
 */
const loadLogoAsBase64 = async (url = "/thearcschoollogo.jpeg") => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width || 120;
          canvas.height = img.naturalHeight || img.height || 120;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/jpeg"));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch {
      resolve(null);
    }
  });
};

/**
 * 1. Export Teacher Weekly Routine to Landscape Printable PDF
 */
export const exportTeacherRoutineToPDF = async (teacher, routineByDay = {}, timeSlots = []) => {
  try {
    const doc = new jsPDF("landscape");

    // Add Logo
    const logoBase64 = await loadLogoAsBase64();
    let textX = 14;
    if (logoBase64) {
      doc.addImage(logoBase64, "JPEG", 14, 8, 16, 16);
      textX = 33;
    }

    const { schoolName, trustName } = getActiveSchool();

    // Header Title
    if (trustName) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(trustName, textX, 11);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(21, 128, 61); // Primary green
    doc.text(schoolName.toUpperCase(), textX, trustName ? 16 : 13);

    // Subtitle
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Teacher Weekly Timetable: ${teacher?.name || "Teacher Routine"}`, textX, 21);

    // Teacher metadata line
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const emailInfo = teacher?.email ? ` | Email: ${teacher.email}` : "";
    const phoneInfo = teacher?.phone ? ` | Phone: ${teacher.phone}` : "";
    doc.text(`Staff Details: ${teacher?.name || "N/A"}${emailInfo}${phoneInfo}`, textX, 25.5);
    doc.text(`Exported On: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`, 215, 25);

    // Prepare table headers & body
    const headers = ["Time Slot", ...DAYS.map((d) => d.label)];

    // Derive slots if not provided
    const slots =
      timeSlots.length > 0
        ? timeSlots
        : [
            "08:00 - 08:40",
            "08:40 - 09:20",
            "09:20 - 10:00",
            "10:20 - 11:00",
            "11:00 - 11:40",
            "11:40 - 12:20",
            "12:20 - 01:00",
            "01:20 - 02:00",
          ];

    const body = slots.map((slot) => {
      const row = [slot];
      DAYS.forEach((d) => {
        const period = (routineByDay[d.key] || []).find((p) => p.timeSlot === slot);
        if (period) {
          if (period.isBreak) {
            row.push("BREAK / LUNCH");
          } else {
            const subject = period.subject || "Class";
            const cls = period.className ? `\nClass: ${period.className}` : "";
            const room = period.roomNumber && period.roomNumber !== "-" ? `\nRoom: ${period.roomNumber}` : "";
            row.push(`${subject}${cls}${room}`);
          }
        } else {
          row.push("-");
        }
      });
      return row;
    });

    autoTable(doc, {
      startY: 30,
      head: [headers],
      body,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, halign: "center", valign: "middle" },
      headStyles: { fillColor: [21, 128, 61], textColor: 255, fontStyle: "bold", halign: "center" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: function (data) {
        if (data.section === "body") {
          const text = String(data.cell.text || "").toUpperCase();
          if (text.includes("BREAK") || text.includes("LUNCH")) {
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [180, 83, 9];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    const sanitizedName = (teacher?.name || "Teacher").replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`Weekly_Timetable_${sanitizedName}.pdf`);
  } catch (error) {
    console.error("Error exporting teacher routine to PDF:", error);
    alert("Failed to export PDF: " + error.message);
  }
};

/**
 * 2. Export Teacher Weekly Routine to Excel (.xlsx)
 */
export const exportTeacherRoutineToExcel = (teacher, routineByDay = {}, timeSlots = []) => {
  try {
    const wb = XLSX.utils.book_new();

    const headers = ["Time Slot", ...DAYS.map((d) => d.label)];

    const slots =
      timeSlots.length > 0
        ? timeSlots
        : [
            "08:00 - 08:40",
            "08:40 - 09:20",
            "09:20 - 10:00",
            "10:20 - 11:00",
            "11:00 - 11:40",
            "11:40 - 12:20",
            "12:20 - 01:00",
            "01:20 - 02:00",
          ];

    const rows = slots.map((slot) => {
      const row = [slot];
      DAYS.forEach((d) => {
        const period = (routineByDay[d.key] || []).find((p) => p.timeSlot === slot);
        if (period) {
          if (period.isBreak) {
            row.push("BREAK / LUNCH");
          } else {
            const subject = period.subject || "Class";
            const cls = period.className ? ` (${period.className})` : "";
            const room = period.roomNumber && period.roomNumber !== "-" ? ` [Rm: ${period.roomNumber}]` : "";
            row.push(`${subject}${cls}${room}`);
          }
        } else {
          row.push("-");
        }
      });
      return row;
    });

    const { schoolName } = getActiveSchool();
    const wsData = [
      [`${schoolName} - Weekly Routine: ${teacher?.name || "Teacher"}`],
      [`Staff Details: ${teacher?.name || "N/A"} | Email: ${teacher?.email || "N/A"} | Phone: ${teacher?.phone || "N/A"}`],
      [`Generated on: ${new Date().toLocaleDateString("en-IN")}`],
      [],
      headers,
      ...rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws, "Weekly Timetable");

    const sanitizedName = (teacher?.name || "Teacher").replace(/[^a-zA-Z0-9]/g, "_");
    XLSX.writeFile(wb, `Weekly_Timetable_${sanitizedName}.xlsx`);
  } catch (error) {
    console.error("Error exporting teacher routine to Excel:", error);
    alert("Failed to export Excel: " + error.message);
  }
};

/**
 * 3. Export Full-Year / Annual Schedule to Excel (.xlsx)
 */
export const exportTeacherFullYearToExcel = (teacher, sessions = [], academicYear = "Academic Year") => {
  try {
    const wb = XLSX.utils.book_new();

    const headers = ["Date", "Day", "Time Slot", "Class", "Subject", "Room", "Type"];
    const rows = (sessions || []).map((s) => [
      s.date || "-",
      s.dayOfWeek || "-",
      s.timeSlot || "-",
      s.className || "-",
      s.subject || "-",
      s.roomNumber || "-",
      s.isBreak ? "Break" : "Class Lecture",
    ]);

    const { schoolName } = getActiveSchool();
    const wsData = [
      [`${schoolName} - Annual Schedule for ${teacher?.name || "Teacher"}`],
      [`Academic Session: ${academicYear} | Total Scheduled Lectures: ${sessions.length}`],
      [`Exported on: ${new Date().toLocaleDateString("en-IN")}`],
      [],
      headers,
      ...rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, "Annual Schedule");

    const sanitizedName = (teacher?.name || "Teacher").replace(/[^a-zA-Z0-9]/g, "_");
    XLSX.writeFile(wb, `Annual_Schedule_${sanitizedName}.xlsx`);
  } catch (error) {
    console.error("Error exporting full year schedule to Excel:", error);
    alert("Failed to export Annual Excel: " + error.message);
  }
};

/**
 * 4. Export Full-Year / Annual Schedule to PDF
 */
export const exportTeacherFullYearToPDF = async (teacher, sessions = [], academicYear = "Academic Year") => {
  try {
    const doc = new jsPDF("portrait");

    const logoBase64 = await loadLogoAsBase64();
    let textX = 14;
    if (logoBase64) {
      doc.addImage(logoBase64, "JPEG", 14, 8, 16, 16);
      textX = 33;
    }

    const { schoolName, trustName } = getActiveSchool();

    if (trustName) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(trustName, textX, 11);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14.5);
    doc.setTextColor(21, 128, 61);
    doc.text(schoolName.toUpperCase(), textX, trustName ? 16 : 13);

    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Annual Schedule & Lecture Log: ${teacher?.name || "Teacher"}`, textX, 21);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Academic Session: ${academicYear} | Total Sessions: ${sessions.length}`, textX, 25);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 155, 25);

    const headers = ["Date", "Day", "Time Slot", "Class", "Subject", "Room"];
    const body = (sessions || []).map((s) => [
      s.date || "-",
      s.dayOfWeek || "-",
      s.timeSlot || "-",
      s.className || "-",
      s.subject || "-",
      s.roomNumber || "-",
    ]);

    autoTable(doc, {
      startY: 30,
      head: [headers],
      body,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2, halign: "center" },
      headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: "bold" },
    });

    const sanitizedName = (teacher?.name || "Teacher").replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`Annual_Schedule_${sanitizedName}.pdf`);
  } catch (error) {
    console.error("Error exporting full year schedule to PDF:", error);
    alert("Failed to export Annual PDF: " + error.message);
  }
};

/**
 * 5. Export Master Allotment Matrix to Excel (.xlsx)
 * Supports both exportAllotmentMatrixToExcel(allotmentData) and exportAllotmentMatrixToExcel(classes, subjects, matrix, totals)
 */
export const exportAllotmentMatrixToExcel = (arg1 = [], arg2 = [], arg3 = {}, arg4 = {}) => {
  try {
    let classes = [];
    let subjects = [];
    let matrix = {};
    let totals = {};

    if (arg1 && typeof arg1 === "object" && !Array.isArray(arg1) && arg1.classes) {
      classes = arg1.classes || [];
      subjects = arg1.subjects || [];
      matrix = arg1.matrix || {};
      totals = arg1.totals || {};
    } else {
      classes = Array.isArray(arg1) ? arg1 : [];
      subjects = Array.isArray(arg2) ? arg2 : [];
      matrix = arg3 || {};
      totals = arg4 || {};
    }

    if (classes.length === 0) {
      alert("No classes to export. Please ensure allotment data is loaded.");
      return;
    }

    const wb = XLSX.utils.book_new();
    const rows = [];

    // Title rows
    rows.push([`${getActiveSchool().schoolName} - Master Subject & Teacher Allotment Matrix`]);
    rows.push([`Generated on: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`]);
    rows.push([]);

    // Header 1: Class In-Charge
    rows.push(["Class In-Charge", ...classes.map((c) => c.classTeacher || "In-Charge")]);

    // Header 2: Class & Section
    rows.push(["Subjects & Quota", ...classes.map((c) => c.label)]);

    const academicSubs = subjects.filter((s) => s.category === "academics");
    const coCurrSubs = subjects.filter((s) => s.category !== "academics");

    // 1. Academic Core Subjects
    rows.push([`ACADEMIC CORE (${academicSubs.length} SUBJECTS)`]);
    academicSubs.forEach((sub) => {
      const countRow = [sub.name];
      const teacherRow = [`${sub.name} (Teacher)`];

      classes.forEach((c) => {
        const cell = matrix[c.id]?.[sub.id];
        const periods = cell?.periods || 0;
        const quota = cell?.quota !== undefined && cell?.quota !== null ? ` /${cell.quota}` : "";
        countRow.push(`${periods}${quota}`);
        teacherRow.push(cell?.shortTeacher || cell?.teacher || "-");
      });

      rows.push(countRow);
      rows.push(teacherRow);
    });

    // 2. Academics Total Row
    const acadTotalRow = ["ACADEMICS TOTAL"];
    classes.forEach((c) => {
      acadTotalRow.push(totals[c.id]?.academics || 0);
    });
    rows.push(acadTotalRow);

    // 3. Co-Curricular Subjects
    rows.push([`CO-CURRICULAR & ACTIVITIES (${coCurrSubs.length} SUBJECTS)`]);
    coCurrSubs.forEach((sub) => {
      const countRow = [sub.name];
      const teacherRow = [`${sub.name} (Teacher)`];

      classes.forEach((c) => {
        const cell = matrix[c.id]?.[sub.id];
        const periods = cell?.periods || 0;
        const quota = cell?.quota !== undefined && cell?.quota !== null ? ` /${cell.quota}` : "";
        countRow.push(`${periods}${quota}`);
        teacherRow.push(cell?.shortTeacher || cell?.teacher || "-");
      });

      rows.push(countRow);
      rows.push(teacherRow);
    });

    // 4. Co-Curricular Total Row
    const coTotalRow = ["CO-CURRICULAR TOTAL"];
    classes.forEach((c) => {
      coTotalRow.push(totals[c.id]?.coCurricular || 0);
    });
    rows.push(coTotalRow);

    // 5. Grand Total Row
    const grandTotalRow = ["TOTAL PERIODS / WK"];
    classes.forEach((c) => {
      grandTotalRow.push(totals[c.id]?.total || 0);
    });
    rows.push(grandTotalRow);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 28 }, ...classes.map(() => ({ wch: 15 }))];

    XLSX.utils.book_append_sheet(wb, ws, "Allotment Matrix");
    const sanitizedSchool = getActiveSchool().schoolName.replace(/[^a-zA-Z0-9]/g, "_");
    XLSX.writeFile(wb, `${sanitizedSchool}_Master_Allotment_Matrix.xlsx`);
  } catch (error) {
    console.error("Error exporting Allotment Matrix to Excel:", error);
    alert("Failed to export Allotment Matrix Excel: " + error.message);
  }
};

/**
 * 6. Export Master Allotment Matrix to Landscape A4 PDF
 * Supports both exportAllotmentMatrixToPDF(allotmentData) and exportAllotmentMatrixToPDF(classes, subjects, matrix, totals)
 */
export const exportAllotmentMatrixToPDF = async (arg1 = [], arg2 = [], arg3 = {}, arg4 = {}) => {
  try {
    let classes = [];
    let subjects = [];
    let matrix = {};
    let totals = {};

    if (arg1 && typeof arg1 === "object" && !Array.isArray(arg1) && arg1.classes) {
      classes = arg1.classes || [];
      subjects = arg1.subjects || [];
      matrix = arg1.matrix || {};
      totals = arg1.totals || {};
    } else {
      classes = Array.isArray(arg1) ? arg1 : [];
      subjects = Array.isArray(arg2) ? arg2 : [];
      matrix = arg3 || {};
      totals = arg4 || {};
    }

    if (classes.length === 0) {
      alert("No classes to export. Please ensure allotment data is loaded.");
      return;
    }

    const doc = new jsPDF("landscape", "mm", "a4");

    // Add Official School Logo
    const logoBase64 = await loadLogoAsBase64();
    let textX = 14;

    if (logoBase64) {
      doc.addImage(logoBase64, "JPEG", 14, 7, 16, 16);
      textX = 33;
    }

    const { schoolName, trustName } = getActiveSchool();

    if (trustName) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(trustName, textX, 10.5);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14.5);
    doc.setTextColor(21, 128, 61);
    doc.text(schoolName.toUpperCase(), textX, trustName ? 15 : 12.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("Master Subject & Teacher Allotment Matrix", textX, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Classes: ${classes.length} | Subjects: ${subjects.length} | Exported: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
      textX,
      24
    );

    // Header 1: Class In-Charge
    const headerRow1 = [
      { content: "Class In-Charge", styles: { fillColor: [21, 128, 61], textColor: 255, fontStyle: "bold" } },
      ...classes.map((c) => ({
        content: c.classTeacher || "In-Charge",
        styles: { fillColor: [134, 239, 172], textColor: [20, 83, 45], fontStyle: "bold" },
      })),
    ];

    // Header 2: Class & Section
    const headerRow2 = [
      { content: "Subjects & Quota", styles: { fillColor: [254, 215, 170], textColor: [154, 52, 18], fontStyle: "bold" } },
      ...classes.map((c) => ({
        content: c.label,
        styles: { fillColor: [255, 237, 213], textColor: [154, 52, 18], fontStyle: "bold" },
      })),
    ];

    const body = [];
    const academicSubs = subjects.filter((s) => s.category === "academics");
    const coCurrSubs = subjects.filter((s) => s.category !== "academics");

    // 1. Academic Core Banner
    body.push([
      {
        content: `ACADEMIC CORE (${academicSubs.length} SUBJECTS)`,
        colSpan: classes.length + 1,
        styles: { fillColor: [237, 233, 254], textColor: [91, 33, 182], fontStyle: "bold", halign: "left" },
      },
    ]);

    // Academic Core Subjects
    academicSubs.forEach((sub) => {
      const countRow = [{ content: sub.name, rowSpan: 2, styles: { fillColor: [254, 215, 170], textColor: [124, 45, 18], fontStyle: "bold", valign: "middle" } }];
      const teacherRow = [];

      classes.forEach((c) => {
        const cell = matrix[c.id]?.[sub.id];
        const periods = cell?.periods || 0;
        const quota = cell?.quota !== undefined && cell?.quota !== null ? ` /${cell.quota}` : "";
        countRow.push({ content: `${periods}${quota}`, styles: { halign: "center", fontStyle: "bold" } });
        teacherRow.push({
          content: cell?.shortTeacher || cell?.teacher || "-",
          styles: {
            halign: "center",
            fillColor: cell?.teacher ? [220, 252, 231] : [255, 255, 255],
            textColor: cell?.teacher ? [22, 101, 52] : [148, 163, 184],
            fontStyle: cell?.teacher ? "bold" : "normal",
          },
        });
      });

      body.push(countRow);
      body.push(teacherRow);
    });

    // 2. Academics Total
    body.push([
      { content: "ACADEMICS TOTAL", styles: { fillColor: [216, 180, 254], textColor: [88, 28, 135], fontStyle: "bold" } },
      ...classes.map((c) => ({
        content: String(totals[c.id]?.academics || 0),
        styles: { halign: "center", fillColor: [243, 232, 255], textColor: [107, 33, 168], fontStyle: "bold" },
      })),
    ]);

    // 3. Co-Curricular Banner
    body.push([
      {
        content: `CO-CURRICULAR & ACTIVITIES (${coCurrSubs.length} SUBJECTS)`,
        colSpan: classes.length + 1,
        styles: { fillColor: [254, 243, 199], textColor: [146, 64, 14], fontStyle: "bold", halign: "left" },
      },
    ]);

    // Co-Curricular Subjects
    coCurrSubs.forEach((sub) => {
      const countRow = [{ content: sub.name, rowSpan: 2, styles: { fillColor: [254, 215, 170], textColor: [124, 45, 18], fontStyle: "bold", valign: "middle" } }];
      const teacherRow = [];

      classes.forEach((c) => {
        const cell = matrix[c.id]?.[sub.id];
        const periods = cell?.periods || 0;
        const quota = cell?.quota !== undefined && cell?.quota !== null ? ` /${cell.quota}` : "";
        countRow.push({ content: `${periods}${quota}`, styles: { halign: "center", fontStyle: "bold" } });
        teacherRow.push({
          content: cell?.shortTeacher || cell?.teacher || "-",
          styles: {
            halign: "center",
            fillColor: cell?.teacher ? [220, 252, 231] : [255, 255, 255],
            textColor: cell?.teacher ? [22, 101, 52] : [148, 163, 184],
            fontStyle: cell?.teacher ? "bold" : "normal",
          },
        });
      });

      body.push(countRow);
      body.push(teacherRow);
    });

    // 4. Co-Curricular Total
    body.push([
      { content: "CO-CURRICULAR TOTAL", styles: { fillColor: [253, 224, 71], textColor: [133, 77, 14], fontStyle: "bold" } },
      ...classes.map((c) => ({
        content: String(totals[c.id]?.coCurricular || 0),
        styles: { halign: "center", fillColor: [254, 249, 195], textColor: [133, 77, 14], fontStyle: "bold" },
      })),
    ]);

    // 5. Total Periods
    body.push([
      { content: "TOTAL PERIODS / WK", styles: { fillColor: [186, 230, 253], textColor: [3, 105, 161], fontStyle: "bold" } },
      ...classes.map((c) => ({
        content: String(totals[c.id]?.total || 0),
        styles: { halign: "center", fillColor: [224, 242, 254], textColor: [3, 105, 161], fontStyle: "bold" },
      })),
    ]);

    autoTable(doc, {
      startY: 28,
      head: [headerRow1, headerRow2],
      body,
      theme: "grid",
      styles: {
        fontSize: classes.length > 10 ? 6 : 7,
        cellPadding: classes.length > 10 ? 1 : 1.5,
        overflow: "linebreak",
      },
      headStyles: { halign: "center" },
      columnStyles: {
        0: { cellWidth: 32 },
      },
    });

    const sanitizedSchool = getActiveSchool().schoolName.replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`${sanitizedSchool}_Master_Allotment_Matrix.pdf`);
  } catch (error) {
    console.error("Error exporting Allotment Matrix to PDF:", error);
    alert("Failed to export Allotment Matrix PDF: " + error.message);
  }
};

/**
 * Helper to render a complete single Teacher Diary Slip page on a jsPDF document (US-13 & US-14)
 */
export const renderTeacherDiarySlipPage = (doc, teacher, routineByDay = {}, timeSlots = [], isSubsequentPage = false) => {
  if (isSubsequentPage) {
    doc.addPage("portrait");
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const school = getActiveSchool();

  // 1. Official Letterhead Banner
  if (letterheadBase64) {
    try {
      doc.addImage(letterheadBase64, "PNG", 0, 0, pageWidth, 34);
    } catch (e) {}
  }

  // 2. Slip Heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(27, 139, 59);
  doc.text("TEACHER PERSONAL TIMETABLE & DIARY SLIP", pageWidth / 2, 42, { align: "center" });

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`Academic Session: 2026-2027   |   ${school.schoolName}`, pageWidth / 2, 47, { align: "center" });

  // 3. Faculty Metadata Box
  doc.setDrawColor(200, 210, 220);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, 51, pageWidth - 24, 18, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text(`Faculty Name: ${teacher?.name || "Staff Member"}`, 16, 57);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  const subjectsStr = (teacher?.subjectsTaught || []).join(", ") || "General";
  doc.text(`Primary Subject(s): ${subjectsStr}`, 16, 62);
  doc.text(`Email: ${teacher?.email || "N/A"}  |  Contact: ${teacher?.phone || "N/A"}`, 16, 66);

  const quota = teacher?.weeklyQuota || 28;
  doc.setFont("helvetica", "bold");
  doc.text(`Weekly Period Quota: ${quota} Periods`, pageWidth - 16, 57, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text("Status: Active Regular Faculty", pageWidth - 16, 62, { align: "right" });

  // 4. Matrix Data Preparation
  const standardSlots = timeSlots.length > 0 ? timeSlots : [
    "08:00 AM - 08:50 AM",
    "08:50 AM - 09:40 AM",
    "09:40 AM - 10:30 AM",
    "10:30 AM - 11:20 AM",
    "11:40 AM - 12:30 PM",
    "12:30 PM - 01:20 PM",
    "01:20 PM - 02:10 PM",
    "02:10 PM - 03:00 PM",
  ];

  const headers = ["Period / Slot", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let totalTeachingPeriods = 0;
  let totalFreePeriods = 0;

  const tableBody = standardSlots.map((slot, pIdx) => {
    const pNumber = pIdx + 1;
    const row = [`P${pNumber}\n${slot.split("-")[0].trim()}`];

    DAYS.forEach((d) => {
      const dayPeriods = routineByDay[d.key] || [];
      const match = dayPeriods.find(
        (p) => p.timeSlot === slot || (p.timeSlot && p.timeSlot.includes(slot.split("-")[0].trim()))
      );

      if (match) {
        if (match.isBreak) {
          row.push("BREAK / LUNCH");
        } else {
          totalTeachingPeriods++;
          const sub = match.subject || "Class";
          const cls = match.className || "";
          const rm = match.roomNumber && match.roomNumber !== "-" ? ` (R:${match.roomNumber})` : "";
          row.push(`${sub}\n${cls}${rm}`);
        }
      } else {
        totalFreePeriods++;
        row.push("[ Free / Prep ]");
      }
    });

    return row;
  });

  autoTable(doc, {
    startY: 72,
    head: [headers],
    body: tableBody,
    theme: "grid",
    headStyles: {
      fillColor: [27, 139, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.2,
      textColor: [30, 30, 30],
      cellPadding: 2,
      halign: "center",
      valign: "middle",
      overflow: "linebreak",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
      1: { cellWidth: (pageWidth - 24 - 24) / 6 },
      2: { cellWidth: (pageWidth - 24 - 24) / 6 },
      3: { cellWidth: (pageWidth - 24 - 24) / 6 },
      4: { cellWidth: (pageWidth - 24 - 24) / 6 },
      5: { cellWidth: (pageWidth - 24 - 24) / 6 },
      6: { cellWidth: (pageWidth - 24 - 24) / 6 },
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        const text = String(data.cell.text[0] || "");
        if (text.includes("[ Free / Prep ]")) {
          data.cell.styles.fillColor = [245, 245, 245];
          data.cell.styles.textColor = [140, 140, 140];
          data.cell.styles.fontStyle = "italic";
        } else if (text.includes("BREAK") || text.includes("LUNCH")) {
          data.cell.styles.fillColor = [254, 243, 199];
          data.cell.styles.textColor = [180, 83, 9];
          data.cell.styles.fontStyle = "bold";
        } else if (data.column.index > 0 && text.trim().length > 0) {
          data.cell.styles.fillColor = [240, 253, 244];
          data.cell.styles.textColor = [21, 128, 61];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    margin: { left: 12, right: 12 },
  });

  // 5. Workload Summary & Diary Slip Signature Footer
  const finalY = Math.min((doc.lastAutoTable?.finalY || 220) + 14, pageHeight - 26);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text(`Total Teaching Periods: ${totalTeachingPeriods}   |   Free / Prep Periods: ${totalFreePeriods}   |   Weekly Target: ${quota}`, 14, finalY);

  const sigY = finalY + 14;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);

  doc.line(16, sigY - 3, 56, sigY - 3);
  doc.text("Teacher's Signature", 36, sigY, { align: "center" });

  doc.line(pageWidth / 2 - 22, sigY - 3, pageWidth / 2 + 22, sigY - 3);
  doc.text("Timetable Coordinator", pageWidth / 2, sigY, { align: "center" });

  doc.line(pageWidth - 56, sigY - 3, pageWidth - 16, sigY - 3);
  doc.text("Principal / Head of School", pageWidth - 36, sigY, { align: "center" });

  doc.setFontSize(6.8);
  doc.setTextColor(140);
  doc.text("Note: Keep this official schedule slip affixed to the front page of your teacher daily lesson planning diary.", pageWidth / 2, pageHeight - 5, { align: "center" });
};

/**
 * 13. Export Individual Teacher Diary Slip to Printable PDF (US-13)
 */
export const exportTeacherDiarySlipPDF = async (teacher, routineByDay = {}, timeSlots = []) => {
  try {
    const doc = new jsPDF("portrait");
    renderTeacherDiarySlipPage(doc, teacher, routineByDay, timeSlots, false);
    const safeName = (teacher?.name || "Teacher").replace(/\s+/g, "_");
    doc.save(`Diary_Slip_${safeName}_2026-2027.pdf`);
  } catch (err) {
    console.error("Error exporting Teacher Diary Slip PDF:", err);
    alert("Failed to export Teacher Diary Slip: " + err.message);
  }
};

/**
 * 14. Bulk Export & Compile All Teachers' Diary Routine Slips in 1-Click (US-14)
 */
export const exportAllTeacherSlipsPDF = async (teachers = [], fetchRoutineFn, timeSlots = [], onProgress) => {
  try {
    if (!teachers || teachers.length === 0) {
      alert("No active teachers found to print slips for.");
      return;
    }

    const doc = new jsPDF("portrait");
    const sortedTeachers = [...teachers].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    for (let i = 0; i < sortedTeachers.length; i++) {
      const teacher = sortedTeachers[i];
      if (onProgress) {
        onProgress(i + 1, sortedTeachers.length, teacher.name);
      }

      let routine = {};
      let slots = timeSlots;
      try {
        if (fetchRoutineFn) {
          const res = await fetchRoutineFn(teacher.id);
          if (res?.routine) {
            routine = res.routine;
            if (res.timeSlots && res.timeSlots.length > 0) slots = res.timeSlots;
          }
        }
      } catch (fetchErr) {
        console.warn(`Could not fetch routine for ${teacher.name}:`, fetchErr.message);
      }

      renderTeacherDiarySlipPage(doc, teacher, routine, slots, i > 0);
    }

    const school = getActiveSchool();
    const sanitizedSchool = school.schoolName.replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`${sanitizedSchool}_All_Teacher_Diary_Slips_2026-2027.pdf`);
  } catch (err) {
    console.error("Error bulk exporting Teacher Diary Slips:", err);
    alert("Failed to bulk export teacher diary slips: " + err.message);
  }
};
