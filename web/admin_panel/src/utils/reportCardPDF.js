import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { schoolLogoBase64 } from "./schoolLogo";
import { cbseLogoBase64 } from "./cbseLogo";

// CBSE Grade calculation evaluated against dynamic scales or standard 9-point scale
const calculateCBSEGrade = (marks, maxMarks = 100, gradingScales = []) => {
  if (marks === null || marks === undefined || !maxMarks || Number(maxMarks) <= 0) return "--";
  const pct = (Number(marks) / Number(maxMarks)) * 100;
  if (Array.isArray(gradingScales) && gradingScales.length > 0) {
    const matched = gradingScales.find(
      (s) => pct >= Number(s.min_percentage) && pct <= Number(s.max_percentage)
    );
    if (matched) return matched.grade;
  }
  if (pct >= 91) return "A1";
  if (pct >= 81) return "A2";
  if (pct >= 71) return "B1";
  if (pct >= 61) return "B2";
  if (pct >= 51) return "C1";
  if (pct >= 41) return "C2";
  if (pct >= 31) return "D1";
  if (pct >= 21) return "D2";
  return "E";
};

// Formats dates to DD/MM/YYYY
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "Unknown" || dateStr === "null") return "--";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateStr);
  }
};

const cleanText = (val, fallback = "--") => {
  if (!val || val === "Unknown" || val === "null" || val === "undefined") return fallback;
  return String(val).trim();
};

export async function loadImageAsBase64(url) {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("data:image")) return url;

  return new Promise((resolve) => {
    let isSettled = false;

    const timeoutId = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        fetchBlobAsBase64(url).then(resolve);
      }
    }, 3500);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timeoutId);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 200;
        canvas.height = img.naturalHeight || img.height || 260;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        resolve(dataUrl);
      } catch {
        fetchBlobAsBase64(url).then(resolve);
      }
    };
    img.onerror = () => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timeoutId);
      fetchBlobAsBase64(url).then(resolve);
    };
    img.src = url;
  });
}

async function fetchBlobAsBase64(url) {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export const generateReportCardPDF = async (studentResult, schoolInfo) => {
  if (!studentResult) return;

  let school = schoolInfo;
  if (!school) {
    try {
      const stored = localStorage.getItem("adminUser") || localStorage.getItem("user");
      if (stored) school = JSON.parse(stored);
    } catch (e) {}
  }

  const isVision = (school?.schoolSlug || school?.slug || "").toLowerCase() === "vision";
  const schoolName = (school?.schoolName || school?.name || (isVision ? "VISION INTERNATIONAL SCHOOL, SHIRUR" : "SCHOOL CAMPUS")).toUpperCase();
  const trustName = school?.schoolMotto || school?.trustName || school?.motto || (isVision ? "Pokharana Educational Trust's" : "");

  const address = [
    school?.schoolAddress || school?.address,
    school?.schoolCity || school?.city,
    school?.schoolState || school?.state,
    school?.schoolPincode || school?.pincode
  ].filter(Boolean).join(", ") || (isVision ? "Survey NO.1155/26/5A, Gujar Mala, Shirur, Dist-Pune, 412210" : "");

  const contactPhone = school?.schoolPhone || school?.officialPhone || (isVision ? "9168003333" : "");
  const contactEmail = school?.schoolEmail || school?.officialEmail || (isVision ? "vis.shirur@gmail.com" : "");
  const contactWeb = school?.schoolWebsite || school?.website || (isVision ? "www.visionshirur.com" : "");

  const board = school?.affiliationBoard || "CBSE";
  const affilNo = school?.boardAffiliationNumber || (isVision ? "1131336" : "");
  const schoolCode = school?.schoolCode || (isVision ? "31323" : "");
  const udise = school?.udiseCode || (isVision ? "27251210534" : "");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

  // -------------------------------------------------------------
  // 1. DUAL BORDER (CBSE Certificate Outer & Inner Borders)
  // -------------------------------------------------------------
  doc.setDrawColor(15, 23, 42); // Solid dark slate
  doc.setLineWidth(0.8);
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10); // Outer border

  doc.setLineWidth(0.3);
  doc.rect(6.5, 6.5, pageWidth - 13, pageHeight - 13); // Inner border

  let currentY = 8.5;

  // -------------------------------------------------------------
  // 2. HEADER: SCHOOL IDENTITY & LOGOS (CBSE EMBLEM & SCHOOL CREST)
  // -------------------------------------------------------------
  // Left CBSE Emblem (Official Emblem matching client spec)
  if (cbseLogoBase64) {
    try {
      doc.addImage(cbseLogoBase64, "PNG", 9.5, 8.5, 15.5, 17.8);
    } catch {
      // Fallback
    }
  }

  // Right School Logo
  if (schoolLogoBase64) {
    try {
      doc.addImage(schoolLogoBase64, "JPEG", pageWidth - 26, 8.5, 17, 17);
    } catch {
      // Fallback
    }
  }

  // School Center Title Block
  if (trustName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52); // Forest Green
    doc.text(trustName, pageWidth / 2, currentY + 3.2, { align: "center" });
  }

  doc.setFontSize(13.5);
  doc.setTextColor(190, 18, 60); // Deep Rose/Red
  doc.text(schoolName, pageWidth / 2, currentY + (trustName ? 8.5 : 6), { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  doc.text(address, pageWidth / 2, currentY + (trustName ? 12.8 : 10.5), { align: "center" });

  currentY += trustName ? 14.5 : 12;

  // Contact, Affiliation & UDISE Grid
  autoTable(doc, {
    startY: currentY,
    body: [
      [`Contact: ${contactPhone}`, `Email: ${contactEmail}`, `Website: ${contactWeb}`],
      [`${board} Affiliation No:- ${affilNo}`, `School Code:- ${schoolCode}`, `UDISE NO:- ${udise}`],
    ],
    theme: "grid",
    styles: {
      fontSize: 7.2,
      font: "helvetica",
      textColor: [15, 23, 42],
      lineColor: [51, 65, 85],
      lineWidth: 0.2,
      cellPadding: 1.4,
      halign: "center",
      valign: "middle",
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 62 },
      1: { halign: "center", cellWidth: 68 },
      2: { halign: "right", cellWidth: 63 },
    },
    margin: { left: 8.5, right: 8.5 },
  });

  currentY = doc.lastAutoTable.finalY + 1;

  // -------------------------------------------------------------
  // 3. SESSION & REPORT CARD BANNERS
  // -------------------------------------------------------------
  const sessionYear = studentResult.academic_year || "2026-27";
  const termName = String(studentResult.term || "TERM 1").toUpperCase();

  // Academic Session Banner (Soft Green #bbf7d0)
  doc.setFillColor(187, 247, 208);
  doc.setDrawColor(22, 101, 52);
  doc.setLineWidth(0.2);
  doc.rect(8.5, currentY, pageWidth - 17, 5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(20, 83, 45);
  doc.text(`ACADEMIC SESSION: ${sessionYear}`, pageWidth / 2, currentY + 3.5, { align: "center" });

  currentY += 5;

  // Report Card Banner (Soft Pink #f472b6)
  doc.setFillColor(244, 114, 182);
  doc.setDrawColor(157, 23, 77);
  doc.rect(8.5, currentY, pageWidth - 17, 5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(131, 24, 67);
  doc.text("REPORT CARD", pageWidth / 2, currentY + 3.5, { align: "center" });

  currentY += 6;

  // -------------------------------------------------------------
  // 4. STUDENT DEMOGRAPHIC PROFILE BOX (WITH PHOTO)
  // -------------------------------------------------------------
  const photoW = 21;
  const photoH = 26;
  const photoX = 8.5;
  const photoY = currentY;

  // Photo frame
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.3);
  doc.setFillColor(241, 245, 249);
  doc.rect(photoX, photoY, photoW, photoH, "FD");

  let avatarData = null;
  if (studentResult.avatar_url) {
    try {
      avatarData = await loadImageAsBase64(studentResult.avatar_url);
    } catch {
      avatarData = null;
    }
  }

  if (avatarData && typeof avatarData === "string" && avatarData.startsWith("data:image")) {
    try {
      const isPng = avatarData.startsWith("data:image/png");
      doc.addImage(avatarData, isPng ? "PNG" : "JPEG", photoX + 0.5, photoY + 0.5, photoW - 1, photoH - 1);
    } catch {
      // Silhouette placeholder fallback
      doc.setFillColor(203, 213, 225);
      doc.circle(photoX + photoW / 2, photoY + 9.5, 4.5, "F");
      doc.ellipse(photoX + photoW / 2, photoY + 19, 7, 4.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text("STUDENT PHOTO", photoX + photoW / 2, photoY + photoH - 2, { align: "center" });
    }
  } else {
    // Silhouette placeholder
    doc.setFillColor(203, 213, 225);
    doc.circle(photoX + photoW / 2, photoY + 9.5, 4.5, "F");
    doc.ellipse(photoX + photoW / 2, photoY + 19, 7, 4.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text("STUDENT PHOTO", photoX + photoW / 2, photoY + photoH - 2, { align: "center" });
  }

  // Demographic table right of photo
  const studentName = cleanText(studentResult.studentName, "STUDENT").toUpperCase();
  const dobStr = formatDate(studentResult.dob);
  const fatherName = cleanText(studentResult.father_name, "--").toUpperCase();
  const motherName = cleanText(studentResult.mother_name, "--").toUpperCase();
  const className = cleanText(studentResult.class, "--").toUpperCase();
  const sectionName = cleanText(studentResult.section, "--").toUpperCase();
  const rollNumber = cleanText(studentResult.roll_number, "--");
  const grNumber = cleanText(studentResult.admissionNumber, "--").toUpperCase();

  autoTable(doc, {
    startY: photoY,
    body: [
      [
        { content: "NAME  :", styles: { fontStyle: "bold" } },
        { content: studentName, styles: { fontStyle: "bold" } },
        { content: "CLASS  :", styles: { fontStyle: "bold" } },
        { content: className, styles: { fontStyle: "bold" } },
      ],
      [
        { content: "DATE OF BIRTH :", styles: { fontStyle: "bold" } },
        { content: dobStr },
        { content: "DIVISION:", styles: { fontStyle: "bold" } },
        { content: sectionName, styles: { fontStyle: "bold" } },
      ],
      [
        { content: "FATHER'S NAME :", styles: { fontStyle: "bold" } },
        { content: fatherName },
        { content: "ROLL NO.", styles: { fontStyle: "bold" } },
        { content: rollNumber, styles: { fontStyle: "bold" } },
      ],
      [
        { content: "MOTHER'S NAME:", styles: { fontStyle: "bold" } },
        { content: motherName },
        { content: "GR.NO:", styles: { fontStyle: "bold" } },
        { content: grNumber, styles: { fontStyle: "bold" } },
      ],
    ],
    theme: "grid",
    styles: {
      fontSize: 7.6,
      font: "helvetica",
      textColor: [15, 23, 42],
      lineColor: [51, 65, 85],
      lineWidth: 0.2,
      cellPadding: 1.6,
      valign: "middle",
      fillColor: [255, 253, 240], // Light cream tint matching client sample
    },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: "bold" },
      1: { cellWidth: 76 },
      2: { cellWidth: 24, fontStyle: "bold" },
      3: { cellWidth: 44 },
    },
    margin: { left: photoX + photoW + 0.5, right: 8.5 },
  });

  currentY = Math.max(photoY + photoH, doc.lastAutoTable.finalY) + 2;

  // -------------------------------------------------------------
  // 5. PART - 1 : SCHOLASTIC AREA (ASSESSMENT TABLE)
  // -------------------------------------------------------------
  // Part 1 Banner (GREEN in client sample!)
  doc.setFillColor(187, 247, 208);
  doc.setDrawColor(22, 101, 52);
  doc.rect(8.5, currentY, pageWidth - 17, 5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(20, 83, 45);
  doc.text("PART - 1 : SCHOLASTIC AREA", pageWidth / 2, currentY + 3.5, { align: "center" });

  currentY += 5;

  const rawSubjects = studentResult.subjects || [];

  // Detect components dynamically from the student's actual subjects
  const componentMap = new Map();
  rawSubjects.forEach((sub) => {
    if (sub.component_scores && typeof sub.component_scores === "object") {
      Object.keys(sub.component_scores).forEach((k) => {
        if (!componentMap.has(k)) {
          let label = k.replace(/_/g, " ").trim();
          label = label.replace(/\b\w/g, (c) => c.toUpperCase());
          if (k.toLowerCase().includes("periodic")) label = "PERIODIC\nM-10";
          else if (k.toLowerCase().includes("enrichment")) label = "Subject\nM-5";
          else if (k.toLowerCase().includes("multiple")) label = "Multiple\nM-5";
          else if (k.toLowerCase().includes("term")) label = "TERM -1\nM-80";
          componentMap.set(k, label);
        }
      });
    }
  });

  // Default standard 4 CBSE components if present or standard
  const activeComponents =
    componentMap.size > 0
      ? Array.from(componentMap.entries()).map(([key, label]) => ({ key, label }))
      : [
          { key: "periodic_test", label: "PERIODIC\nM-10" },
          { key: "subject_enrichment", label: "Subject\nM-5" },
          { key: "multiple_assessment", label: "Multiple\nM-5" },
          { key: "term_exam", label: "TERM -1\nM-80" },
        ];

  let componentTotals = {};
  activeComponents.forEach((c) => (componentTotals[c.key] = 0));
  let grandTotalMarks = 0;
  let grandMaxMarks = 0;

  let scholasticRows = [];

  if (rawSubjects.length === 0) {
    scholasticRows.push([
      "No exams recorded for this term",
      ...activeComponents.map(() => "--"),
      "--",
      "--",
    ]);
  } else {
    scholasticRows = rawSubjects.map((sub) => {
      const scores = sub?.component_scores || {};
      const hasMarks = sub && sub.marksObtained !== null && sub.marksObtained !== undefined;
      const totalMarks = hasMarks ? Number(sub.marksObtained) : 0;
      const maxMarks = Number(sub?.maxMarks || 100);

      grandTotalMarks += totalMarks;
      grandMaxMarks += maxMarks;

      const compCells = activeComponents.map((c) => {
        let val = scores[c.key];
        if (val === undefined || val === null) {
          // Fallback key lookups
          if (c.key.includes("periodic")) val = scores["Periodic"] ?? scores["periodic"];
          else if (c.key.includes("enrichment")) val = scores["Subject"] ?? scores["enrichment"] ?? scores["subject_enrichment"];
          else if (c.key.includes("multiple")) val = scores["Multiple"] ?? scores["multiple"] ?? scores["multiple_assessment"];
          else if (c.key.includes("term")) val = scores["Term"] ?? scores["term_exam"] ?? scores["term"];
        }
        if (val !== undefined && val !== null && val !== "") {
          const num = Number(val);
          componentTotals[c.key] = (componentTotals[c.key] || 0) + (isNaN(num) ? 0 : num);
          return isNaN(num) ? String(val) : String(num);
        }
        return "--";
      });

      const grade = sub.grade || calculateCBSEGrade(totalMarks, maxMarks);

      return [
        String(sub.subject || "Subject").toUpperCase(),
        ...compCells,
        totalMarks.toFixed(1).replace(/\.0$/, ""),
        grade,
      ];
    });

    const overallGrade = grandMaxMarks > 0 ? calculateCBSEGrade(grandTotalMarks, grandMaxMarks) : "--";

    // Footer Row: TOTAL MARKS
    scholasticRows.push([
      { content: "TOTAL MARKS", styles: { fontStyle: "bold", halign: "left", fillColor: [219, 234, 254] } },
      ...activeComponents.map((c) => ({
        content: componentTotals[c.key] > 0 ? componentTotals[c.key].toFixed(1).replace(/\.0$/, "") : "--",
        styles: { fontStyle: "bold", fillColor: [219, 234, 254] },
      })),
      { content: grandTotalMarks > 0 ? grandTotalMarks.toFixed(1).replace(/\.0$/, "") : "--", styles: { fontStyle: "bold", fillColor: [219, 234, 254] } },
      { content: overallGrade, styles: { fontStyle: "bold", fillColor: [219, 234, 254] } },
    ]);
  }

  const overallGrade = grandMaxMarks > 0 ? calculateCBSEGrade(grandTotalMarks, grandMaxMarks) : "--";

  const numComponents = activeComponents.length;
  const compColWidth = numComponents > 0 ? 110 / numComponents : 27.5;
  const colStyles = {
    0: { halign: "left", fontStyle: "bold", cellWidth: 53 },
  };
  activeComponents.forEach((_, idx) => {
    colStyles[idx + 1] = { cellWidth: compColWidth };
  });
  colStyles[numComponents + 1] = { cellWidth: 16, fontStyle: "bold" };
  colStyles[numComponents + 2] = { cellWidth: 14, fontStyle: "bold" };

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        { content: "SUBJECT", rowSpan: 2, styles: { halign: "center", valign: "middle", fillColor: [254, 240, 138], textColor: [133, 77, 14], fontStyle: "bold" } },
        { content: termName, colSpan: numComponents, styles: { halign: "center", valign: "middle", fillColor: [244, 114, 182], textColor: [131, 24, 67], fontStyle: "bold" } },
        { content: "TOTAL\nM-100", rowSpan: 2, styles: { halign: "center", valign: "middle", fillColor: [254, 215, 170], textColor: [154, 52, 18], fontStyle: "bold" } },
        { content: "Grade", rowSpan: 2, styles: { halign: "center", valign: "middle", fillColor: [254, 215, 170], textColor: [154, 52, 18], fontStyle: "bold" } },
      ],
      activeComponents.map((c) => ({
        content: c.label,
        styles: { halign: "center", valign: "middle", fillColor: [254, 215, 170], textColor: [154, 52, 18], fontStyle: "bold" },
      })),
    ],
    body: scholasticRows,
    theme: "grid",
    headStyles: {
      textColor: [15, 23, 42],
      fontSize: 7.5,
      fontStyle: "bold",
      lineColor: [51, 65, 85],
      lineWidth: 0.2,
      cellPadding: 1.4,
    },
    styles: {
      fontSize: 7.5,
      font: "helvetica",
      textColor: [15, 23, 42],
      lineColor: [51, 65, 85],
      lineWidth: 0.2,
      cellPadding: 1.8,
      halign: "center",
      valign: "middle",
    },
    columnStyles: colStyles,
    alternateRowStyles: {
      fillColor: [240, 249, 255],
    },
    margin: { left: 8.5, right: 8.5 },
  });

  currentY = doc.lastAutoTable.finalY + 1.5;

  // -------------------------------------------------------------
  // 6. SUMMARY METRICS (OVERALL MARKS & CONDITIONAL BEST OF 5)
  // -------------------------------------------------------------
  const overallPct = grandMaxMarks > 0 ? (grandTotalMarks / grandMaxMarks) * 100 : 0;

  // Best of 5 calculation
  const gradedSubjectScores = rawSubjects
    .filter((s) => s.marksObtained !== null && s.marksObtained !== undefined)
    .map((s) => Number(s.marksObtained || 0))
    .sort((a, b) => b - a);

  const showBestOf5 = gradedSubjectScores.length >= 5;
  const summaryBody = [
    [
      { content: `Overall Marks :   ${grandTotalMarks.toFixed(1).replace(/\.0$/, "")} /${grandMaxMarks}`, styles: { fontStyle: "bold" } },
      { content: `Percentage :   ${overallPct.toFixed(2)} %`, styles: { fontStyle: "bold" } },
      { content: `Overall Grade :   ${overallGrade}`, styles: { fontStyle: "bold" } },
    ],
  ];

  if (showBestOf5) {
    const best5Count = 5;
    const best5Sum = gradedSubjectScores.slice(0, best5Count).reduce((acc, v) => acc + v, 0);
    const best5Max = best5Count * 100;
    const best5Pct = best5Max > 0 ? (best5Sum / best5Max) * 100 : 0;
    const best5Grade = calculateCBSEGrade(best5Sum, best5Max);

    summaryBody.push([
      { content: `Best of 5 Marks :   ${best5Sum.toFixed(1).replace(/\.0$/, "")} /${best5Max}`, styles: { fontStyle: "bold" } },
      { content: `Best of 5 Percentage :   ${best5Pct.toFixed(1)} %`, styles: { fontStyle: "bold" } },
      { content: `Overall Grade :   ${best5Grade}`, styles: { fontStyle: "bold" } },
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    body: summaryBody,
    theme: "grid",
    styles: {
      fontSize: 7.6,
      font: "helvetica",
      textColor: [15, 23, 42],
      lineColor: [51, 65, 85],
      lineWidth: 0.2,
      cellPadding: 1.8,
      halign: "left",
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 63 },
      2: { cellWidth: 60 },
    },
    margin: { left: 8.5, right: 8.5 },
  });

  currentY = doc.lastAutoTable.finalY + 1.5;

  // -------------------------------------------------------------
  // 7. SCHOLASTIC GRADE DETAILS (9-POINT SCALE REFERENCE)
  // -------------------------------------------------------------
  autoTable(doc, {
    startY: currentY,
    head: [
      [
        { content: "GRADE DETAILS", rowSpan: 2, styles: { halign: "center", valign: "middle", fillColor: [224, 242, 254], fontStyle: "bold" } },
        { content: "SCHOLASTIC GRADE DETAILS", colSpan: 9, styles: { halign: "center", valign: "middle", fillColor: [187, 247, 208], textColor: [20, 83, 45], fontStyle: "bold" } },
      ],
      [
        { content: "A1", styles: { halign: "center", fillColor: [191, 219, 254], fontStyle: "bold" } },
        { content: "A2", styles: { halign: "center", fillColor: [191, 219, 254], fontStyle: "bold" } },
        { content: "B1", styles: { halign: "center", fillColor: [191, 219, 254], fontStyle: "bold" } },
        { content: "B2", styles: { halign: "center", fillColor: [191, 219, 254], fontStyle: "bold" } },
        { content: "C1", styles: { halign: "center", fillColor: [191, 219, 254], fontStyle: "bold" } },
        { content: "C2", styles: { halign: "center", fillColor: [191, 219, 254], fontStyle: "bold" } },
        { content: "D1", styles: { halign: "center", fillColor: [191, 219, 254], fontStyle: "bold" } },
        { content: "D2", styles: { halign: "center", fillColor: [191, 219, 254], fontStyle: "bold" } },
        { content: "E", styles: { halign: "center", fillColor: [191, 219, 254], fontStyle: "bold" } },
      ],
    ],
    body: [
      [
        "",
        "91 to 100",
        "81 to 90",
        "71 to 80",
        "61 to 70",
        "51 to 60",
        "41 to 50",
        "31 to 40",
        "21 to 30",
        "0 to 20",
      ],
    ],
    theme: "grid",
    styles: {
      fontSize: 6.8,
      font: "helvetica",
      textColor: [15, 23, 42],
      lineColor: [51, 65, 85],
      lineWidth: 0.2,
      cellPadding: 1.2,
      halign: "center",
      valign: "middle",
      fillColor: [240, 249, 255],
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 15.3 },
      2: { cellWidth: 15.3 },
      3: { cellWidth: 15.3 },
      4: { cellWidth: 15.3 },
      5: { cellWidth: 15.3 },
      6: { cellWidth: 15.3 },
      7: { cellWidth: 15.3 },
      8: { cellWidth: 15.3 },
      9: { cellWidth: 15.6 },
    },
    margin: { left: 8.5, right: 8.5 },
  });

  currentY = doc.lastAutoTable.finalY + 1.5;

  // -------------------------------------------------------------
  // 8. PART - 2 : CO-SCHOLASTIC AREA & ATTENDANCE / RESULT
  // -------------------------------------------------------------
  const leftTableWidth = 110;
  const rightTableWidth = 82;
  const splitY = currentY;

  // Left: Co-Scholastic Area
  autoTable(doc, {
    startY: splitY,
    head: [
      [
        { content: "PART - 2 : CO-SCHOLASTIC AREA", colSpan: 2, styles: { halign: "center", fillColor: [244, 114, 182], textColor: [131, 24, 67], fontStyle: "bold" } },
      ],
      [
        { content: termName, colSpan: 2, styles: { halign: "center", fillColor: [251, 207, 232], textColor: [131, 24, 67], fontStyle: "bold" } },
      ],
      [
        { content: "ACTIVITIES", styles: { halign: "center", fillColor: [254, 215, 170], textColor: [154, 52, 18], fontStyle: "bold" } },
        { content: "GRADE", styles: { halign: "center", fillColor: [254, 215, 170], textColor: [154, 52, 18], fontStyle: "bold" } },
      ],
    ],
    body: [
      ["Physical and Health Education", studentResult.coScholastic?.physical || "A"],
      ["Discipline", studentResult.coScholastic?.discipline || "A"],
      ["Work Education", studentResult.coScholastic?.work_edu || "A"],
      ["Art Education", studentResult.coScholastic?.art_edu || "A"],
      ["G.K", studentResult.coScholastic?.gk || "A"],
    ],
    theme: "grid",
    styles: {
      fontSize: 7.2,
      font: "helvetica",
      textColor: [15, 23, 42],
      lineColor: [51, 65, 85],
      lineWidth: 0.2,
      cellPadding: 1.8,
      halign: "center",
      valign: "middle",
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 80 },
      1: { halign: "center", fontStyle: "bold", cellWidth: 30 },
    },
    margin: { left: 8.5, right: pageWidth - 8.5 - leftTableWidth },
  });

  // Right: Attendance & Result (Real DB Attendance or fallback '--')
  const workingDays = studentResult.totalWorkingDays !== null && studentResult.totalWorkingDays !== undefined
    ? String(studentResult.totalWorkingDays)
    : "--";
  const presentDays = studentResult.presentDays !== null && studentResult.presentDays !== undefined
    ? String(studentResult.presentDays)
    : "--";
  const absentDays = studentResult.absentDays !== null && studentResult.absentDays !== undefined
    ? String(studentResult.absentDays)
    : "--";

  // Dynamic Rank: real rank or '--'
  const studentRank = studentResult.rank ? String(studentResult.rank) : "--";
  const resultStatus = grandTotalMarks > 0 ? (overallPct >= 33 ? "PASS" : "PROMOTED") : "--";

  autoTable(doc, {
    startY: splitY,
    head: [
      [
        { content: "ATTENDANCE", colSpan: 2, styles: { halign: "center", fillColor: [244, 114, 182], textColor: [131, 24, 67], fontStyle: "bold" } },
      ],
    ],
    body: [
      [{ content: "Total No. Working Days", styles: { fontStyle: "bold", halign: "left" } }, { content: workingDays, styles: { halign: "center" } }],
      [{ content: "Present Days", styles: { fontStyle: "bold", halign: "left" } }, { content: presentDays, styles: { halign: "center" } }],
      [{ content: "Absent Days", styles: { fontStyle: "bold", halign: "left" } }, { content: absentDays, styles: { halign: "center" } }],
      [
        { content: "RANK", styles: { halign: "center", valign: "middle", fontStyle: "bold", textColor: [20, 83, 45], fontSize: 8 } },
        { content: "RESULT", styles: { halign: "center", valign: "middle", fontStyle: "bold", textColor: [157, 23, 77], fontSize: 8 } },
      ],
      [
        { content: studentRank, styles: { halign: "center", valign: "middle", fontStyle: "bold", textColor: [20, 83, 45], fontSize: 14 } },
        { content: resultStatus, styles: { halign: "center", valign: "middle", fontStyle: "bold", textColor: [157, 23, 77], fontSize: 14 } },
      ],
    ],
    theme: "grid",
    styles: {
      fontSize: 7.2,
      font: "helvetica",
      textColor: [15, 23, 42],
      lineColor: [51, 65, 85],
      lineWidth: 0.2,
      cellPadding: 1.8,
      halign: "center",
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 40 },
    },
    margin: { left: pageWidth - 8.5 - rightTableWidth, right: 8.5 },
  });

  const finalBlockY = Math.max(doc.lastAutoTable.finalY, splitY + 42);

  // -------------------------------------------------------------
  // 9. SIGNATURES & OFFICIAL SEAL (MATCHING CLIENT SAMPLE)
  // -------------------------------------------------------------
  // Positioned directly below the tables without awkward gap or invented remarks box
  const sigY = Math.min(pageHeight - 16, Math.max(finalBlockY + 16, pageHeight - 22));
  const colWidth = (pageWidth - 17) / 3;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  // 1. Class Teacher
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.3);
  doc.line(8.5 + 10, sigY - 6, 8.5 + colWidth - 10, sigY - 6);
  doc.text("Class Teacher", 8.5 + colWidth * 0.5, sigY, { align: "center" });

  // 2. Parent / Guardian
  doc.line(8.5 + colWidth + 10, sigY - 6, 8.5 + colWidth * 2 - 10, sigY - 6);
  doc.text("Parent / Guardian", 8.5 + colWidth * 1.5, sigY, { align: "center" });

  // 3. Principal
  doc.line(8.5 + colWidth * 2 + 10, sigY - 6, 8.5 + colWidth * 3 - 10, sigY - 6);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Principal", 8.5 + colWidth * 2.5, sigY, { align: "center" });

  // -------------------------------------------------------------
  // 10. SAVE / DOWNLOAD PDF
  // -------------------------------------------------------------
  const cleanStudentName = studentName.replace(/\s+/g, "_");
  const cleanTerm = termName.replace(/\s+/g, "_");
  const filename = `${cleanStudentName}_${cleanTerm}_Official_Report_Card.pdf`;
  doc.save(filename);
};
