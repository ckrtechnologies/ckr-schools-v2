import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Building, Clock, Calendar, CheckCircle2 } from "lucide-react";
import { loadMasterData, loadTimeTables } from "../features/timetableSlice";
import SearchSelectDropdown from "../components/SearchSelectDropdown";

const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const RoomSchedulesPage = () => {
  const dispatch = useDispatch();
  const { timeTables, rooms, classes, teachers } = useSelector((state) => state.timetable);

  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedRoom, setSelectedRoom] = useState("all");

  useEffect(() => {
    dispatch(loadMasterData());
    dispatch(loadTimeTables());
  }, [dispatch]);

  // Teacher map
  const teacherMap = useMemo(() => {
    const map = new Map();
    teachers.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [teachers]);

  // Aggregate all room allocations on the selected date
  const roomAllocations = useMemo(() => {
    const allocations = [];

    timeTables.forEach((classTT) => {
      const periods = classTT.dates?.[selectedDate] || [];
      periods.forEach((p) => {
        if (p.roomNumber && !p.isBreak) {
          allocations.push({
            id: p.id,
            room: p.roomNumber,
            time: p.time,
            subject: p.subject,
            className: `${classTT.className} - ${classTT.section}`,
            teacherName: teacherMap.get(p.teacher) || "Unassigned",
          });
        }
      });
    });

    return allocations.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [timeTables, selectedDate, teacherMap]);

  // Distinct room names
  const allRoomNames = useMemo(() => {
    const names = new Set(rooms.map((r) => r.name || `Room ${r.room_number}`).filter(Boolean));
    roomAllocations.forEach((a) => names.add(a.room));
    return Array.from(names).sort();
  }, [rooms, roomAllocations]);

  const filteredAllocations = useMemo(() => {
    if (selectedRoom === "all") return roomAllocations;
    return roomAllocations.filter((a) => a.room === selectedRoom);
  }, [roomAllocations, selectedRoom]);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: "700" }}>Room & Facility Allocations</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
          Track classroom occupancy, lab schedules, and facility availability
        </p>
      </div>

      {/* Control Bar */}
      <div
        className="glass-panel"
        style={{
          padding: "1rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar size={15} style={{ color: "var(--accent-primary)" }} />
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
              Date:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-glass"
              style={{ width: "160px" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Building size={15} style={{ color: "var(--accent-primary)" }} />
            <SearchSelectDropdown
              value={selectedRoom}
              onChange={setSelectedRoom}
              options={[
                { value: "all", label: "All Rooms", badge: `${allRoomNames.length} rms`, initials: "ALL" },
                ...allRoomNames.map((r) => ({
                  value: r,
                  label: r,
                  badge: "Room",
                  initials: r.slice(0, 3).toUpperCase(),
                })),
              ]}
              placeholder="Select Room..."
              searchPlaceholder="Search room..."
              minWidth="180px"
              dropdownWidth="260px"
              itemLabelSingular="room"
              itemLabelPlural="rooms"
            />
          </div>
        </div>

        <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
          {filteredAllocations.length} periods booked on {selectedDate}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Room Number</th>
                <th>Time Slot</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Teacher</th>
              </tr>
            </thead>
            <tbody>
              {filteredAllocations.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    No room occupancy booked for this date.
                  </td>
                </tr>
              ) : (
                filteredAllocations.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: "700", color: "var(--accent-primary)" }}>
                      {row.room}
                    </td>
                    <td style={{ fontWeight: "600" }}>{row.time}</td>
                    <td>{row.className}</td>
                    <td style={{ fontWeight: "600" }}>{row.subject}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{row.teacherName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoomSchedulesPage;
