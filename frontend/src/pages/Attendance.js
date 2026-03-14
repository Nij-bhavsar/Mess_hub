import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import attendanceService from "../services/attendanceService";
import UnifiedNavbar from "../components/UnifiedNavbar";

const AVATAR_COLORS = ["blue", "green", "amber", "rose", "purple", "orange", "cyan"];

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function getColor(id) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function Attendance() {
  const [userRole, setUserRole] = useState("student");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [markingAttendanceId, setMarkingAttendanceId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserRole(user.role ? user.role.toLowerCase() : "student");
      } catch {
        setUserRole("student");
      }
    }
  }, []);

  const fetchStudentsAndAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const studentsRes = await API.get("/student");
      setStudents(studentsRes.data || []);
      const attendanceData = await attendanceService.getAttendance({ date: selectedDate });
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
    } catch (error) {
      showMsg("Error loading data.", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (userRole === "admin" || userRole === "staff") {
      fetchStudentsAndAttendance();
    }
  }, [selectedDate, userRole, fetchStudentsAndAttendance]);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const markAttendance = async (studentId, status) => {
    try {
      setMarkingAttendanceId(studentId);
      const existingRecord = attendance.find((a) => a.studentId === studentId);
      const attendanceData = { studentId, date: selectedDate, status, mealType: "Breakfast & Lunch" };
      if (existingRecord) {
        await attendanceService.updateAttendance(existingRecord.id, attendanceData);
      } else {
        await attendanceService.createAttendance(attendanceData);
      }
      showMsg(`Attendance marked as ${status}`);
      await fetchStudentsAndAttendance();
    } catch (error) {
      showMsg(`Error: ${error.message || "Unknown error"}`, "error");
    } finally {
      setMarkingAttendanceId(null);
    }
  };

  const getStudentStatus = (studentId) => {
    const record = attendance.find((a) => a.studentId === studentId);
    return record ? record.status : null;
  };

  const stats = {
    present: attendance.filter((a) => a.status === "Present").length,
    absent:  attendance.filter((a) => a.status === "Absent").length,
    leave:   attendance.filter((a) => a.status === "Leave").length,
  };

  const statusPillClass = { Present: "sp-present", Absent: "sp-absent", Leave: "sp-leave" };

  const filtered = students
    .filter((s) => {
      const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase());
      const status = getStudentStatus(s.id);
      const matchFilter =
        filterStatus === "all" ||
        (filterStatus === "unmarked" && !status) ||
        status?.toLowerCase() === filterStatus;
      return matchSearch && matchFilter;
    });

  return (
    <div className="dashboard">
      <UnifiedNavbar />

      <div className="main-content">

        {/* Page heading */}
        <h1 style={{
          fontSize: "var(--text-2xl)",
          fontWeight: "var(--font-bold)",
          color: "var(--color-text-primary)",
          marginBottom: "var(--space-6)",
          letterSpacing: "-0.02em",
        }}>
          Attendance Management
        </h1>

        {/* Message */}
        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        {(userRole === "admin" || userRole === "staff") ? (
          <>
            {/* Date + Stats Row */}
            <div style={{ display: "flex", alignItems: "stretch", gap: "var(--space-4)", marginBottom: "var(--space-6)", flexWrap: "wrap" }}>

              {/* Date picker card */}
              <div style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-5) var(--space-6)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                boxShadow: "var(--shadow-xs)",
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-brand-primary)" strokeWidth="1.5">
                  <rect x="1" y="3" width="14" height="12" rx="2" />
                  <path d="M1 7h14M5 1v4M11 1v4" strokeLinecap="round" />
                </svg>
                <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", color: "var(--color-text-secondary)" }}>
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    border: "1.5px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "var(--space-2) var(--space-3)",
                    fontSize: "var(--text-sm)",
                    background: "var(--color-neutral-50)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                    cursor: "pointer",
                  }}
                />
              </div>

              {/* Stat cards */}
              {[
                { label: "Present", value: stats.present, cls: "sp-present", color: "var(--color-success)" },
                { label: "Absent",  value: stats.absent,  cls: "sp-absent",  color: "var(--color-danger)" },
                { label: "Leave",   value: stats.leave,   cls: "sp-leave",   color: "var(--color-warning)" },
                { label: "Total",   value: students.length, cls: "", color: "var(--color-accent-blue)" },
              ].map((s) => (
                <div key={s.label} style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--space-4) var(--space-6)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  boxShadow: "var(--shadow-xs)",
                  minWidth: "90px",
                }}>
                  <div style={{ fontSize: "1.75rem", fontWeight: "var(--font-bold)", color: s.color, lineHeight: 1.1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "4px" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="grid-toolbar">
              <h2 className="grid-toolbar-title">
                Students
                <span className="grid-count-badge">{filtered.length}</span>
              </h2>

              <div className="grid-search-wrap">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="6.5" cy="6.5" r="4.5" />
                  <path d="M10 10l3.5 3.5" strokeLinecap="round" />
                </svg>
                <input
                  className="grid-search"
                  type="text"
                  placeholder="Search students…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="grid-filter-tabs">
                {["all", "present", "absent", "leave", "unmarked"].map((f) => (
                  <button
                    key={f}
                    className={`grid-filter-btn ${filterStatus === f ? "active" : ""}`}
                    onClick={() => setFilterStatus(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "var(--space-16)", color: "var(--color-text-tertiary)", fontSize: "var(--text-sm)" }}>
                Loading attendance data…
              </div>
            ) : filtered.length === 0 ? (
              <div className="person-grid">
                <div className="person-grid-empty">No students match your filter.</div>
              </div>
            ) : (
              <div className="person-grid">
                {filtered.map((student) => {
                  const status = getStudentStatus(student.id);
                  const color = getColor(student.id);
                  const isMarking = markingAttendanceId === student.id;

                  return (
                    <div className="person-card" key={student.id}>
                      <div className={`person-card-bar bar-${color}`} />
                      <div className={`person-avatar av-${color}`}>
                        {getInitials(student.name)}
                      </div>
                      <div className="person-card-name">{student.name}</div>
                      <div className="person-card-role">ID: {student.id}</div>

                      <div className="person-card-meta">
                        <div className="person-meta-row">
                          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <rect x="1" y="3" width="12" height="9" rx="1.5" />
                            <path d="M1 6h12M4.5 3V1.5M9.5 3V1.5" strokeLinecap="round" />
                          </svg>
                          {selectedDate}
                        </div>
                      </div>

                      {/* Attendance action buttons */}
                      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                        {[
                          { label: "P", status: "Present", title: "Present", activeClass: "btn-present active" },
                          { label: "A", status: "Absent",  title: "Absent",  activeClass: "btn-absent active" },
                          { label: "L", status: "Leave",   title: "Leave",   activeClass: "btn-leave active" },
                        ].map((btn) => (
                          <button
                            key={btn.status}
                            className={`btn-sm ${btn.status.toLowerCase()} ${status === btn.status ? "active" : ""}`}
                            title={`Mark ${btn.title}`}
                            onClick={() => markAttendance(student.id, btn.status)}
                            disabled={isMarking}
                            style={{ flex: 1, fontWeight: "var(--font-bold)" }}
                          >
                            {isMarking ? "…" : btn.label}
                          </button>
                        ))}
                      </div>

                      <div className="person-card-footer">
                        <span className={`person-status-pill ${status ? statusPillClass[status] : "sp-unmarked"}`}>
                          {status || "Not Marked"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="attendance-card" style={{ maxWidth: "480px" }}>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
              Attendance is being managed by admin or staff. Please check your dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Attendance;