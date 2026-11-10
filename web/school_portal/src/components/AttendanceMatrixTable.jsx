import React from 'react';
import { useNavigate } from 'react-router-dom';

const AttendanceMatrixTable = ({
  gridDays,
  loadingUsers,
  loadingAttendance,
  classStudents
}) => {
  const navigate = useNavigate();

  return (
    <div style={{ background: "white", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.05)", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#1b8b3b", color: "#ffffff" }}>
              <th style={{ padding: "0.85rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.1)", textAlign: "left", position: "sticky", left: 0, background: "#15803d", color: "#ffffff", zIndex: 10, minWidth: "200px", fontWeight: "700" }}>Student Name</th>
              {gridDays.map(day => (
                <th key={day.fullDateString} style={{ padding: "0.45rem 0.25rem", borderBottom: "1px solid rgba(0,0,0,0.1)", borderLeft: "1px solid rgba(255,255,255,0.15)", minWidth: "36px", fontSize: "12px", background: day.isWeekend ? "#15803d" : "#1b8b3b", textAlign: "center" }}>
                  <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>{day.dayName}</div>
                  <div style={{ color: "#ffffff", fontSize: "13px", fontWeight: "800", margin: "1px 0" }}>{day.dateNumber}</div>
                  <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.75)", textTransform: "uppercase", fontWeight: "600" }}>{day.monthName}</div>
                </th>
              ))}
              <th style={{ padding: "0.85rem 1rem", borderBottom: "1px solid rgba(0,0,0,0.1)", minWidth: "90px", position: "sticky", right: 0, background: "#15803d", color: "#ffffff", zIndex: 10, fontWeight: "700", textAlign: "center" }}>% Present</th>
            </tr>
          </thead>
          <tbody>
            {loadingUsers || loadingAttendance ? (
              <tr><td colSpan={gridDays.length + 2} style={{ padding: "2rem", textAlign: "center" }}>Loading...</td></tr>
            ) : classStudents.length === 0 ? (
              <tr><td colSpan={gridDays.length + 2} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>No students found in this class.</td></tr>
            ) : (
              classStudents.map(user => {
                let totalDays = 0;
                let presentDays = 0;
                gridDays.forEach(day => {
                  if (!day.isWeekend && !day.isPublicHoliday) {
                    totalDays++;
                    const record = user.records?.find(r => r.date === day.fullDateString);
                    if (record && record.status === 'present') presentDays++;
                  }
                });
                const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
                
                return (
                  <tr key={user.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "left", position: "sticky", left: 0, background: "white", zIndex: 1, borderRight: "1px solid rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "500", cursor: "pointer" }} onClick={() => navigate(`/attendance/student/${user.id}`)}>
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--primary-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px" }}>
                          {user.name?.charAt(0) || "-"}
                        </div>
                        <span style={{ fontSize: "14px" }}>{user.name}</span>
                      </div>
                    </td>
                    {gridDays.map(day => {
                      const record = user.records?.find(r => r.date === day.fullDateString);
                      const status = record?.status;
                      let label = "-";
                      let cellColor = "var(--text-secondary)";
                      let cellBg = "transparent";

                      if (day.isWeekend) {
                        cellBg = "rgba(0,0,0,0.03)";
                        label = "W";
                      } else if (day.isPublicHoliday) {
                        cellBg = "rgba(16, 185, 129, 0.05)";
                        cellColor = "#10b981";
                        label = "H";
                      } else {
                        if (status === "present") { cellBg = "rgba(16, 185, 129, 0.2)"; cellColor = "#10b981"; label = "P"; }
                        else if (status === "absent") { cellBg = "rgba(239, 68, 68, 0.2)"; cellColor = "#ef4444"; label = "A"; }
                        else if (status === "late") { cellBg = "rgba(245, 158, 11, 0.2)"; cellColor = "#f59e0b"; label = "L"; }
                      }
                      return (
                        <td key={day.fullDateString} style={{ padding: "0.25rem", background: cellBg, color: cellColor, fontWeight: "700", fontSize: "12px", borderRight: "1px solid rgba(0,0,0,0.02)" }} title={day.fullDateString}>
                          {label}
                        </td>
                      );
                    })}
                    <td style={{ padding: "0.5rem 1rem", position: "sticky", right: 0, background: "white", zIndex: 1, borderLeft: "1px solid rgba(0,0,0,0.05)", fontWeight: "700", color: percentage >= 85 ? "#10b981" : percentage >= 70 ? "#f59e0b" : "#ef4444" }}>
                      {percentage}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceMatrixTable;
