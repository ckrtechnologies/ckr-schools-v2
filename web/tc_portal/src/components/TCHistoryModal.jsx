import React, { useState, useEffect } from "react";
import { X, Search, FileCheck, Eye, Printer, Calendar } from "lucide-react";
import { fetchRecords } from "../services/tcApi.js";
import { formatDateDisplay } from "../utils/numberToWords.js";

export default function TCHistoryModal({ isOpen, onClose, onSelectRecord }) {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRecords();
    }
  }, [isOpen]);

  async function loadRecords() {
    setLoading(true);
    try {
      const data = await fetchRecords({ search });
      setRecords(data);
    } catch (err) {
      console.warn("Failed to fetch records:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const filtered = records.filter((r) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      r.pupil_name?.toLowerCase().includes(q) ||
      r.tc_number?.toLowerCase().includes(q) ||
      r.father_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="modal-backdrop">
      <div className="modal-container card-glass">
        <div className="modal-header">
          <div className="modal-title">
            <FileCheck className="icon-gold" size={20} />
            <span>Issued Transfer Certificates History</span>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by student name, TC serial number, or father's name..."
            className="input-field search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="modal-body-table">
          {loading ? (
            <div className="loading-state-pill">Loading records...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state-pill">No transfer certificates found.</div>
          ) : (
            <table className="tc-records-table">
              <thead>
                <tr>
                  <th>TC Number</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Father's Name</th>
                  <th>Issue Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <strong className="tc-num-highlight">{rec.tc_number}</strong>
                    </td>
                    <td>{rec.pupil_name}</td>
                    <td>{rec.last_studied_class_figure || "—"}</td>
                    <td>{rec.father_name || "—"}</td>
                    <td>{formatDateDisplay(rec.issue_date)}</td>
                    <td>
                      <span className="status-badge-issued">{rec.status || "ISSUED"}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => {
                          onSelectRecord(rec);
                          onClose();
                        }}
                        title="Load into Certificate Preview & Editor"
                      >
                        <Eye size={14} />
                        <span>Load & Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
