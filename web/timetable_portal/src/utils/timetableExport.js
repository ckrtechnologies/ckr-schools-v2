import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Export Timetable grid to Excel file
 */
export const exportTimetableToExcel = (className, weekDays, periodRows, fileName = "timetable", schoolNameOverride) => {
  try {
    let school = null;
    try {
      const stored = localStorage.getItem("adminUser") || localStorage.getItem("user");
      if (stored) school = JSON.parse(stored);
    } catch (e) {}
    const schoolName = schoolNameOverride || school?.schoolName || school?.name || "School Campus";

    const wb = XLSX.utils.book_new();

    const headers = ["Time Slot", ...weekDays.map((d) => `${d.dayName} (${d.date})`)];
    const rows = periodRows.map((slot) => {
      const rowData = [slot.time];
      weekDays.forEach((day) => {
        const period = slot.dayPeriods?.[day.date];
        if (period) {
          if (period.isBreak) {
            rowData.push("BREAK / LUNCH");
          } else {
            const subject = period.subject || "-";
            const teacher = period.teacherName ? ` (${period.teacherName})` : "";
            const room = period.roomNumber ? ` [${period.roomNumber}]` : "";
            rowData.push(`${subject}${teacher}${room}`);
          }
        } else {
          rowData.push("-");
        }
      });
      return rowData;
    });

    const wsData = [
      [`${schoolName} - Class Timetable: ${className}`],
      [`Exported on: ${new Date().toLocaleDateString("en-IN")}`],
      [],
      headers,
      ...rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 22 }, ...weekDays.map(() => ({ wch: 24 }))];
    XLSX.utils.book_append_sheet(wb, ws, "Timetable");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Error exporting Timetable to Excel", error);
    alert("Failed to export Excel: " + error.message);
  }
};

/**
 * Export Timetable grid to formatted printable PDF
 */
export const exportTimetableToPDF = (className, weekDays, periodRows, fileName = "timetable", schoolNameOverride) => {
  try {
    let school = null;
    try {
      const stored = localStorage.getItem("adminUser") || localStorage.getItem("user");
      if (stored) school = JSON.parse(stored);
    } catch (e) {}
    const schoolName = schoolNameOverride || school?.schoolName || school?.name || "School Campus";

    const doc = new jsPDF("landscape");

    // Title & Header
    doc.setFontSize(16);
    doc.setTextColor(27, 139, 59);
    doc.text(schoolName, 14, 16);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Official Class Timetable: ${className}`, 14, 23);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 29);

    const headers = ["Time Slot", ...weekDays.map((d) => `${d.dayName}\n${d.date}`)];
    const body = periodRows.map((slot) => {
      const rowData = [slot.time];
      weekDays.forEach((day) => {
        const period = slot.dayPeriods?.[day.date];
        if (period) {
          if (period.isBreak) {
            rowData.push("BREAK");
          } else {
            const subject = period.subject || "-";
            const teacher = period.teacherName ? `\n${period.teacherName}` : "";
            const room = period.roomNumber ? `\nRoom: ${period.roomNumber}` : "";
            rowData.push(`${subject}${teacher}${room}`);
          }
        } else {
          rowData.push("-");
        }
      });
      return rowData;
    });

    autoTable(doc, {
      startY: 34,
      head: [headers],
      body,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, halign: "center", valign: "middle" },
      headStyles: { fillColor: [27, 139, 59], textColor: 255, fontStyle: "bold", halign: "center" },
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

    doc.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("Error exporting Timetable to PDF", error);
    alert("Failed to export PDF: " + error.message);
  }
};
