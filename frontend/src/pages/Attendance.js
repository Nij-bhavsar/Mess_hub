import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import attendanceService from "../services/attendanceService";
import UnifiedNavbar from "../components/UnifiedNavbar";
import { readAuthUser } from "../utils/authStorage";

const AVATAR_COLORS = ["blue", "green", "amber", "rose", "purple", "orange", "cyan"];
const STATUS_PILL   = { Present: "sp-present", Absent: "sp-absent", Leave: "sp-leave" };

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
function getColor(id) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}


/* ══════════════════════════════════════════════════════
   ADMIN / STAFF VIEW
   ══════════════════════════════════════════════════════ */
function AdminStaffView() {
  const [students,            setStudents]            = useState([]);
  const [attendance,          setAttendance]          = useState([]);
  const [selectedDate,        setSelectedDate]        = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [loading,             setLoading]             = useState(false);
  const [message,             setMessage]             = useState({ text: "", type: "" });
  const [markingId,           setMarkingId]           = useState(null);
  const [filterStatus,        setFilterStatus]        = useState("all");
  const [search,              setSearch]              = useState("");

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, attendanceData] = await Promise.all([
        API.get("/student").catch(() => ({ data: [] })),
        attendanceService.getAttendance({ date: selectedDate }).catch(() => []),
      ]);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
      setAttendance(Array.isArray(attendanceData) ? attendanceData : []);
    } catch {
      showMsg("Error loading data.", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getStudentStatus = (studentId) => {
    const rec = attendance.find(
      (a) => String(a.studentId) === String(studentId)
    );
    return rec ? rec.status : null;
  };

  const markAttendance = async (studentId, status) => {
    setMarkingId(studentId);
    try {
      const existing = attendance.find(
        (a) => String(a.studentId) === String(studentId)
      );
      const payload = {
        studentId,
        date:     selectedDate,
        status,
        mealType: "Breakfast & Lunch",
      };
      if (existing) {
        await attendanceService.updateAttendance(existing.id, payload);
      } else {
        await attendanceService.createAttendance(payload);
      }
      showMsg(`Marked as ${status}`);
      await fetchData();
    } catch (err) {
      showMsg(`Error: ${err?.message || "Try again"}`, "error");
    } finally {
      setMarkingId(null);
    }
  };

  const stats = {
    present: attendance.filter((a) => a.status === "Present").length,
    absent:  attendance.filter((a) => a.status === "Absent").length,
  };

  const filtered = students.filter((s) => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase());
    const status      = getStudentStatus(s.id);
    const matchFilter =
      filterStatus === "all" ||
      (filterStatus === "unmarked" && !status) ||
      status?.toLowerCase() === filterStatus;
    return matchSearch && matchFilter;
  });

  return (
    <>
      {/* Message */}
      {message.text && (
        <div className={`message ${message.type}`} style={{ marginBottom: "var(--space-4)" }}>
          {message.text}
        </div>
      )}

      {/* Date + Stats */}
      <div style={{ display: "flex", alignItems: "stretch", gap: "var(--space-4)", marginBottom: "var(--space-6)", flexWrap: "wrap" }}>

        {/* Date picker */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-5) var(--space-6)", display: "flex", alignItems: "center", gap: "var(--space-3)", boxShadow: "var(--shadow-xs)" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-brand-primary)" strokeWidth="1.5">
            <rect x="1" y="3" width="14" height="12" rx="2" />
            <path d="M1 7h14M5 1v4M11 1v4" strokeLinecap="round" />
          </svg>
          <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", color: "var(--color-text-secondary)" }}>Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "var(--space-2) var(--space-3)", fontSize: "var(--text-sm)", background: "var(--color-neutral-50)", color: "var(--color-text-primary)", outline: "none", cursor: "pointer" }}
          />
        </div>

        {/* Stat boxes */}
        {[
          { label: "Present", value: stats.present,   color: "var(--color-success)"     },
          { label: "Absent",  value: stats.absent,    color: "var(--color-danger)"      },
          { label: "Total",   value: students.length, color: "var(--color-accent-blue)" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-4) var(--space-6)", display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: "var(--shadow-xs)", minWidth: "90px" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: "var(--font-bold)", color: s.color, lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="grid-toolbar">
        <h2 className="grid-toolbar-title">
          Students <span className="grid-count-badge">{filtered.length}</span>
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

      {/* Student grid */}
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
            const status    = getStudentStatus(student.id);
            const color     = getColor(student.id);
            const isMarking = markingId === student.id;

            return (
              <div className="person-card" key={student.id}>
                <div className={`person-card-bar bar-${color}`} />
                <div className={`person-avatar av-${color}`}>{getInitials(student.name)}</div>
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

                {/* P / A / L buttons */}
                <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                  {[
                    { label: "P", status: "Present" },
                    { label: "A", status: "Absent"  },
                  ].map((btn) => (
                    <button
                      key={btn.status}
                      className={`btn-sm ${btn.status.toLowerCase()} ${status === btn.status ? "active" : ""}`}
                      title={`Mark ${btn.status}`}
                      onClick={() => markAttendance(student.id, btn.status)}
                      disabled={isMarking}
                      style={{ flex: 1, fontWeight: "var(--font-bold)" }}
                    >
                      {isMarking ? "…" : btn.label}
                    </button>
                  ))}
                </div>

                <div className="person-card-footer">
                  <span className={`person-status-pill ${STATUS_PILL[status] || "sp-unmarked"}`}>
                    {status || "Not Marked"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}


/* ══════════════════════════════════════════════════════
   STUDENT VIEW — own attendance history only
   ══════════════════════════════════════════════════════ */
function StudentView({ studentId }) {
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [todayStatus, setTodayStatus] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  const fetchMyAttendance = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      // Today's status
      try {
        const rec = await attendanceService.getAttendanceRecord(studentId, today);
        setTodayStatus(rec?.status || null);
      } catch {
        setTodayStatus(null);
      }

      // Full history — strictly filtered to this student
      try {
        const res     = await attendanceService.getAttendance({ studentId });
        const records = Array.isArray(res) ? res : [];
        const mine    = records.filter(
          (r) => String(r.studentId) === String(studentId)
        );
        setHistory(mine.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, today]);

  useEffect(() => { fetchMyAttendance(); }, [fetchMyAttendance]);

  const present = history.filter(r => r.status === "Present").length;
  const absent  = history.filter(r => r.status === "Absent").length;
  const leave   = history.filter(r => r.status === "Leave").length;
  const total   = present + absent + leave;
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <>
      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>

        {/* Today */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)", boxShadow: "var(--shadow-xs)" }}>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-3)" }}>
            Today's Status
          </div>
          <span className={`person-status-pill ${STATUS_PILL[todayStatus] || "sp-unmarked"}`} style={{ fontSize: "var(--text-base)", padding: "var(--space-2) var(--space-4)" }}>
            {loading ? "…" : (todayStatus || "Not Marked")}
          </span>
        </div>

        {/* Percentage */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)", boxShadow: "var(--shadow-xs)"}}>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-3)"}}>
            Attendance
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "var(--font-bold)", lineHeight: 1, marginBottom: "var(--space-3)", color: pct >= 75 ? "var(--color-success)" : pct >= 50 ? "var(--color-warning)" : "var(--color-danger)" }}>
            {loading ? "—" : `${pct}%`}
          </div>
          <div style={{ height: "6px", background: "var(--color-neutral-200)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: loading ? "0%" : `${pct}%`, borderRadius: "var(--radius-full)", background: pct >= 75 ? "#16A34A" : pct >= 50 ? "#D97706" : "#DC2626", transition: "width 0.8s ease" }} />
          </div>
        </div>

        {/* Total days */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)", boxShadow: "var(--shadow-xs)" }}>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-3)" }}>
            Total Days
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "var(--font-bold)", color: "var(--color-accent-blue)", lineHeight: 1 }}>
            {loading ? "—" : total}
          </div>
        </div>
      </div>

      {/* History table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)", boxShadow: "var(--shadow-xs)"}}>
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-semibold)", color: "var(--color-text-primary)", marginBottom: "var(--space-5)"  }}>
          My Attendance History
          <span style={{ marginLeft: "var(--space-2)", fontSize: "var(--text-xs)", fontWeight: "var(--font-bold)", background: "var(--color-brand-gradient)", color: "white", padding: "2px 8px", borderRadius: "var(--radius-full)" }}>
            {history.length}
          </span>
        </h3>

        {loading ? (
          <div style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-tertiary)", fontSize: "var(--text-sm)" }}>
            Loading your attendance…
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-tertiary)", fontSize: "var(--text-sm)" }}>
            No attendance records found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ textAlign: "center" }}>#</th>
                  <th style={{ textAlign: "center" }}>Date</th>
                  <th style={{ textAlign: "center" }}>Meal Type</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record, idx) => (
                  <tr key={record.id || idx}>
                    <td style={{ color: "var(--color-text-tertiary)", fontSize: "var(--text-xs)" }}>{idx + 1}</td>
                    <td style={{ fontWeight: "var(--font-medium)" }}>
                      {record.date
                        ? new Date(record.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td style={{ color: "var(--color-text-secondary)" }}>
                      {record.mealType || "Breakfast & Lunch"}
                    </td>
                    <td>
                      <span className={`person-status-pill ${STATUS_PILL[record.status] || "sp-unmarked"}`}>
                        {record.status || "Unmarked"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}


/* ══════════════════════════════════════════════════════
   MAIN — reads role synchronously, never redirects
   ══════════════════════════════════════════════════════ */
function Attendance() {

  // Read role synchronously from session storage on first render
  // so there is NO null → value transition that could trigger re-renders
  const authUser = readAuthUser() || {};

  const userRole  = authUser.role  ? authUser.role.toLowerCase()  : "student";
  const studentId = authUser.id    || null;

  const isAdminOrStaff = userRole === "admin" || userRole === "staff";

  return (
    <div className="dashboard">
      <UnifiedNavbar />

      <div className="main-content">

        <h1 style={{
          fontSize:      "var(--text-2xl)",
          fontWeight:    "var(--font-bold)",
          color:         "var(--color-text-primary)",
          marginBottom:  "var(--space-6)",
          letterSpacing: "-0.02em",
        }}>
          {isAdminOrStaff ? "Attendance Management" : "My Attendance"}
        </h1>

        {isAdminOrStaff
          ? <AdminStaffView />
          : <StudentView studentId={studentId} />
        }

      </div>
    </div>
  );
}

export default Attendance;
