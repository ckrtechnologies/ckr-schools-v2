/**
 * Utility to generate cleanly formatted, unclipped, professional PDF reports
 * via an isolated print window with exact CSS page sizing and print color preservation.
 */
import { SCHOOL_LOGO_BASE64 } from "./logoBase64.js";

export const exportEntireSchoolToPdf = ({ month, academicYear, parameters, rows }) => {
  const printWindow = window.open("", "_blank", "width=1200,height=850");
  if (!printWindow) {
    alert("Please allow popups to export the PDF.");
    return;
  }

  let school = null;
  try {
    const stored = localStorage.getItem("adminUser") || localStorage.getItem("user");
    if (stored) school = JSON.parse(stored);
  } catch (e) {}

  const isVision = (school?.schoolSlug || school?.slug || "").toLowerCase() === "vision";
  const schoolName = (school?.schoolName || school?.name || (isVision ? "VISION INTERNATIONAL SCHOOL" : "SCHOOL CAMPUS")).toUpperCase();
  const trustName = school?.schoolMotto || school?.trustName || school?.motto || (isVision ? "Pokharana Educational Trust's" : "");
  const codes = [
    school?.boardAffiliationNumber ? `CBSE Affil No: ${school.boardAffiliationNumber}` : (isVision ? "CBSE Affil No: 1131336" : null),
    school?.schoolCode ? `School Code: ${school.schoolCode}` : (isVision ? "School Code: 31323" : null),
    school?.schoolCity || (isVision ? "Shirur, Pune" : null)
  ].filter(Boolean).join(" | ");

  // Generate table headers
  const paramCols = parameters
    .map(
      (p, i) => `
      <th style="background:#1b8b3b; color:#ffffff; font-size:7pt; padding:4px 2px; border:1px solid #14532d; text-align:center; min-width:38px; line-height:1.1;">
        <div style="font-weight:700;">${p.title}</div>
        <div style="font-size:6pt; color:#bbf7d0;">[${p.min_points}-${p.max_points}]</div>
      </th>`
    )
    .join("");

  const numCols = parameters
    .map(
      (_, i) => `
      <th style="background:#14532d; color:#ffffff; font-size:7pt; padding:2px; border:1px solid #166534; text-align:center;">
        ${i + 1}
      </th>`
    )
    .join("");

  // Generate table rows
  const tableRows = rows
    .map((r, idx) => {
      const cellScores = parameters
        .map((p) => {
          const cell = r.scores ? r.scores[p.id] : null;
          let val = "-";
          let bg = "#ffffff";
          let color = "#334155";

          if (cell === "NA" || cell?.is_na) {
            val = "NA";
            bg = "#f1f5f9";
            color = "#64748b";
          } else if (cell?.score !== undefined && cell?.score !== null) {
            val = cell.score;
            color = "#0f172a";
            if (val === 3) color = "#15803d";
            if (val === 0) color = "#e11d48";
          } else if (typeof cell === "number") {
            val = cell;
          }

          return `
            <td style="border:1px solid #cbd5e1; padding:3px 2px; font-size:7.5pt; text-align:center; background:${bg}; color:${color}; font-weight:600;">
              ${val}
            </td>
          `;
        })
        .join("");

      const isEven = idx % 2 === 1;
      const rowBg = isEven ? "#f8fafc" : "#ffffff";

      return `
        <tr style="background:${rowBg};">
          <td style="border:1px solid #cbd5e1; padding:3px 4px; font-size:8pt; text-align:center; font-weight:700; color:#475569;">
            ${idx + 1}
          </td>
          <td style="border:1px solid #cbd5e1; padding:3px 6px; font-size:8pt; font-weight:700; color:#0f172a; text-align:left; white-space:nowrap;">
            ${r.teacher_name}
          </td>
          ${cellScores}
          <td style="border:1px solid #cbd5e1; padding:3px; font-size:8pt; text-align:center; font-weight:700; background:#fff1f2; color:#9f1239;">
            ${r.out_of > 0 ? r.out_of : "-"}
          </td>
          <td style="border:1px solid #cbd5e1; padding:3px; font-size:8pt; text-align:center; font-weight:800; background:#e0e7ff; color:#3730a3;">
            ${r.out_of > 0 ? r.total : "-"}
          </td>
          <td style="border:1px solid #cbd5e1; padding:3px; font-size:8pt; text-align:center; font-weight:800; background:#ecfdf5; color:#065f46;">
            ${r.out_of > 0 ? `${r.percentage}%` : "-"}
          </td>
          <td style="border:1px solid #cbd5e1; padding:3px; font-size:8pt; text-align:center; font-weight:800; background:#fef3c7; color:#92400e;">
            ${r.rank ? `#${r.rank}` : "-"}
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${schoolName}_Teacher_ScoreBoard_${month}_${academicYear}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 6mm 6mm 6mm 6mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #0f172a;
          }
          .header-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 8px;
            margin-bottom: 8px;
            border-bottom: 2px solid #15803d;
          }
          .header-title-box h1 {
            margin: 0;
            font-size: 15pt;
            color: #14532d;
            font-weight: 800;
            letter-spacing: -0.01em;
          }
          .header-title-box p {
            margin: 2px 0 0 0;
            font-size: 8.5pt;
            color: #15803d;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .header-badge-box {
            text-align: right;
            font-size: 8pt;
          }
          .badge-pill {
            display: inline-block;
            background: #14532d;
            color: #ffffff;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 8.5pt;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7.5pt;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          .footer-note {
            margin-top: 8px;
            display: flex;
            justify-content: space-between;
            font-size: 7pt;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div style="display:flex; align-items:center; gap:12px;">
            <img
              src="${SCHOOL_LOGO_BASE64}"
              alt="${schoolName}"
              style="width:52px; height:52px; border-radius:50%; object-fit:cover; border:2px solid #15803d; background:#ffffff; box-shadow:0 1px 4px rgba(0,0,0,0.12); flex-shrink:0;"
            />
            <div class="header-title-box">
              ${trustName ? `<div style="font-size:8pt; font-weight:700; color:#15803d; text-transform:uppercase; letter-spacing:0.4px;">${trustName}</div>` : ""}
              <h1 style="margin:1px 0; font-size:13.5pt; font-weight:900; color:#0f172a;">${schoolName}</h1>
              ${codes ? `<div style="font-size:7pt; color:#475569; font-weight:600;">${codes}</div>` : ""}
              <p style="margin-top:2px; font-size:7.5pt; color:#1e293b; font-weight:600;">Teacher Monthly Score Board & Evaluation Register</p>
            </div>
          </div>
          <div class="header-badge-box">
            <span class="badge-pill">Month: ${month} | Academic Year: ${academicYear}</span>
            <div style="margin-top:3px; color:#475569; font-weight:600;">Total Evaluated Teachers: ${rows.length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="background:#14532d; color:#ffffff; font-size:7pt; padding:2px; border:1px solid #166534; width:25px;">#</th>
              <th style="background:#14532d; color:#ffffff; font-size:7pt; padding:2px 6px; border:1px solid #166534; text-align:left; min-width:140px;">TEACHERS NAME</th>
              ${numCols}
              <th style="background:#881337; color:#ffe4e6; font-size:7pt; padding:2px; border:1px solid #be123c; width:35px;">${parameters.length + 1}</th>
              <th style="background:#312e81; color:#e0e7ff; font-size:7pt; padding:2px; border:1px solid #4338ca; width:35px;">${parameters.length + 2}</th>
              <th style="background:#064e3b; color:#d1fae5; font-size:7pt; padding:2px; border:1px solid #059669; width:40px;">${parameters.length + 3}</th>
              <th style="background:#78350f; color:#fef3c7; font-size:7pt; padding:2px; border:1px solid #d97706; width:35px;">${parameters.length + 4}</th>
            </tr>
            <tr>
              <th style="background:#1b8b3b; color:#ffffff; font-size:7pt; padding:4px 2px; border:1px solid #14532d;">Sr.no</th>
              <th style="background:#1b8b3b; color:#ffffff; font-size:7.5pt; padding:4px 6px; border:1px solid #14532d; text-align:left;">Teacher Details</th>
              ${paramCols}
              <th style="background:#be123c; color:#ffffff; font-size:7.5pt; padding:4px 2px; border:1px solid #9f1239;">Out of</th>
              <th style="background:#4338ca; color:#ffffff; font-size:7.5pt; padding:4px 2px; border:1px solid #3730a3;">Total</th>
              <th style="background:#059669; color:#ffffff; font-size:7.5pt; padding:4px 2px; border:1px solid #047857;">Percentage</th>
              <th style="background:#d97706; color:#ffffff; font-size:7.5pt; padding:4px 2px; border:1px solid #b45309;">Rank</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer-note">
          <div>Generated on: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
          <div>${schoolName} Evaluation System — Confidential & Official Record</div>
          <div>Principal Signature: _______________________</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

export const exportTeacherAnalyticsToPdf = ({ analytics }) => {
  const { teacher, academic_year, summary, monthly_history, parameter_performance } = analytics;

  let school = null;
  try {
    const stored = localStorage.getItem("adminUser") || localStorage.getItem("user");
    if (stored) school = JSON.parse(stored);
  } catch (e) {}

  const isVision = (school?.schoolSlug || school?.slug || "").toLowerCase() === "vision";
  const schoolName = (school?.schoolName || school?.name || (isVision ? "VISION INTERNATIONAL SCHOOL" : "SCHOOL CAMPUS")).toUpperCase();
  const trustName = school?.schoolMotto || school?.trustName || school?.motto || (isVision ? "Pokharana Educational Trust's" : "");
  const codes = [
    school?.boardAffiliationNumber ? `CBSE Affil No: ${school.boardAffiliationNumber}` : (isVision ? "CBSE Affil No: 1131336" : null),
    school?.schoolCode ? `School Code: ${school.schoolCode}` : (isVision ? "School Code: 31323" : null),
    school?.schoolCity || (isVision ? "Shirur, Pune" : null)
  ].filter(Boolean).join(" | ");

  const printWindow = window.open("", "_blank", "width=1000,height=900");
  if (!printWindow) {
    alert("Please allow popups to export the PDF.");
    return;
  }

  // Month rows
  const monthRows = monthly_history
    .map((m, idx) => {
      const isEvaluated = m.has_data;
      const pctColor = m.percentage >= 80 ? "#15803d" : m.percentage >= 60 ? "#d97706" : "#e11d48";
      const isEven = idx % 2 === 1;

      return `
        <tr style="background:${isEven ? "#f8fafc" : "#ffffff"};">
          <td style="border:1px solid #cbd5e1; padding:5px 8px; font-weight:700; color:#334155; text-align:center;">${idx + 1}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 10px; font-weight:700; color:#0f172a;">${m.month}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; text-align:center; font-weight:600; color:${isEvaluated ? "#15803d" : "#94a3b8"};">
            ${isEvaluated ? "Evaluated" : "Pending"}
          </td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; text-align:center; font-weight:700; color:#9f1239;">${isEvaluated ? m.max_possible : "-"}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; text-align:center; font-weight:800; color:#3730a3;">${isEvaluated ? m.total_score : "-"}</td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; text-align:center; font-weight:800; color:${pctColor};">
            ${isEvaluated ? `${m.percentage}%` : "-"}
          </td>
          <td style="border:1px solid #cbd5e1; padding:5px 8px; text-align:center; font-weight:800; color:#92400e;">
            ${isEvaluated && m.rank ? `#${m.rank}` : "-"}
          </td>
        </tr>
      `;
    })
    .join("");

  // Parameter Performance Rows
  const paramRows = parameter_performance
    .map((p, idx) => {
      const isEven = idx % 2 === 1;
      const perfPct = p.performance_pct;
      const tagColor = perfPct >= 80 ? "#15803d" : perfPct >= 60 ? "#d97706" : "#b91c1c";
      const tagBg = perfPct >= 80 ? "#ecfdf5" : perfPct >= 60 ? "#fffbeb" : "#fef2f2";

      return `
        <tr style="background:${isEven ? "#f8fafc" : "#ffffff"};">
          <td style="border:1px solid #cbd5e1; padding:4px 6px; font-weight:700; text-align:center; color:#475569;">${idx + 1}</td>
          <td style="border:1px solid #cbd5e1; padding:4px 8px; font-weight:600; color:#0f172a; text-align:left;">${p.title}</td>
          <td style="border:1px solid #cbd5e1; padding:4px 6px; text-align:center; color:#64748b; font-weight:600;">[${p.min_points}-${p.max_points}]</td>
          <td style="border:1px solid #cbd5e1; padding:4px 6px; text-align:center; font-weight:800; color:#1e293b;">${p.avg_points}</td>
          <td style="border:1px solid #cbd5e1; padding:4px 6px; text-align:center;">
            <span style="display:inline-block; padding:2px 6px; border-radius:4px; font-weight:800; font-size:7.5pt; color:${tagColor}; background:${tagBg};">
              ${perfPct}%
            </span>
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Teacher_Analytics_${teacher.name.replace(/\s+/g, "_")}_${academic_year}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 8mm 8mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #0f172a;
          }
          .header-box {
            border-bottom: 2px solid #15803d;
            padding-bottom: 10px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .title-area h1 {
            margin: 0;
            font-size: 16pt;
            color: #14532d;
            font-weight: 800;
          }
          .title-area p {
            margin: 2px 0 0 0;
            font-size: 9pt;
            color: #15803d;
            font-weight: 700;
            text-transform: uppercase;
          }
          .teacher-card {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .teacher-info h2 {
            margin: 0 0 4px 0;
            font-size: 13pt;
            color: #0f172a;
            font-weight: 800;
          }
          .teacher-info div {
            font-size: 8.5pt;
            color: #475569;
          }
          .kpi-row {
            display: flex;
            gap: 10px;
            margin-bottom: 12px;
          }
          .kpi-tile {
            flex: 1;
            padding: 8px 10px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            text-align: center;
          }
          .kpi-val {
            font-size: 14pt;
            font-weight: 800;
            color: #0f172a;
          }
          .kpi-label {
            font-size: 7.5pt;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            margin-top: 2px;
          }
          .section-title {
            font-size: 10.5pt;
            font-weight: 800;
            color: #14532d;
            margin: 10px 0 6px 0;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
            margin-bottom: 12px;
          }
          th {
            background: #15803d;
            color: #ffffff;
            padding: 6px 8px;
            border: 1px solid #14532d;
            font-size: 8pt;
            text-align: center;
          }
          .signature-box {
            margin-top: 18px;
            display: flex;
            justify-content: space-between;
            padding-top: 15px;
            font-size: 8pt;
            color: #334155;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div style="display:flex; align-items:center; gap:14px;">
            <img
              src="${SCHOOL_LOGO_BASE64}"
              alt="${schoolName}"
              style="width:58px; height:58px; border-radius:50%; object-fit:cover; border:2px solid #15803d; background:#ffffff; box-shadow:0 1px 4px rgba(0,0,0,0.12); flex-shrink:0;"
            />
            <div class="title-area">
              ${trustName ? `<div style="font-size:8pt; font-weight:700; color:#15803d; text-transform:uppercase; letter-spacing:0.4px;">${trustName}</div>` : ""}
              <h1 style="margin:1px 0; font-size:14pt; font-weight:900; color:#0f172a;">${schoolName}</h1>
              ${codes ? `<div style="font-size:7.5pt; color:#475569; font-weight:600;">${codes}</div>` : ""}
              <p style="margin-top:2px; font-size:8pt; color:#1e293b; font-weight:600;">Annual Teacher Performance & Historical Analytics Report</p>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800; color:#14532d; font-size:10pt;">Session: ${academic_year}</div>
            <div style="font-size:7.5pt; color:#64748b; margin-top:2px;">Official Document</div>
          </div>
        </div>

        <div class="teacher-card">
          <div class="teacher-info">
            <h2>${teacher.name}</h2>
            <div>Email: ${teacher.email || "-"} | Phone: ${teacher.phone || "-"}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:8pt; color:#64748b; font-weight:700;">Employee ID / Staff No.</div>
            <div style="font-size:11pt; font-weight:800; color:#14532d;">${teacher.roll_no || teacher.id.substring(0, 8)}</div>
          </div>
        </div>

        <div class="kpi-row">
          <div class="kpi-tile" style="border-top:3px solid #15803d;">
            <div class="kpi-val" style="color:#15803d;">${summary.avg_percentage}%</div>
            <div class="kpi-label">Annual Avg Percentage</div>
          </div>
          <div class="kpi-tile" style="border-top:3px solid #4338ca;">
            <div class="kpi-val" style="color:#4338ca;">${summary.avg_score}</div>
            <div class="kpi-label">Annual Avg Score</div>
          </div>
          <div class="kpi-tile" style="border-top:3px solid #d97706;">
            <div class="kpi-val" style="color:#d97706;">#${summary.best_rank}</div>
            <div class="kpi-label">Best School Rank</div>
          </div>
          <div class="kpi-tile" style="border-top:3px solid #059669;">
            <div class="kpi-val" style="color:#059669;">${summary.evaluated_months_count} / ${summary.total_months}</div>
            <div class="kpi-label">Months Evaluated</div>
          </div>
        </div>

        <div class="section-title">1. Month-by-Month Historical Evaluation Records</div>
        <table>
          <thead>
            <tr>
              <th style="width:30px;">#</th>
              <th style="text-align:left;">Month</th>
              <th>Status</th>
              <th>Out of</th>
              <th>Total Score</th>
              <th>Percentage</th>
              <th>Rank</th>
            </tr>
          </thead>
          <tbody>
            ${monthRows}
          </tbody>
        </table>

        <div class="section-title">2. Criteria Performance Breakdown (Annual Average)</div>
        <table>
          <thead>
            <tr>
              <th style="width:30px;">#</th>
              <th style="text-align:left;">Scoring Criteria / Topic</th>
              <th style="width:70px;">Limits</th>
              <th style="width:80px;">Avg Points</th>
              <th style="width:90px;">Performance</th>
            </tr>
          </thead>
          <tbody>
            ${paramRows}
          </tbody>
        </table>

        <div class="signature-box">
          <div>Teacher Signature: __________________</div>
          <div>Evaluation Coordinator: __________________</div>
          <div>Principal Signature: __________________</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
