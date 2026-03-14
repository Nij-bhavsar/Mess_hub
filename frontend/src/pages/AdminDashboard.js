import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import UnifiedNavbar from "../components/UnifiedNavbar";
import API from "../services/api";
import attendanceService from "../services/attendanceService";

const AVATAR_COLORS = ["blue", "green", "amber", "rose", "purple", "orange", "cyan"];

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function getColor(id) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

const STATUS_PILL = {
  Present:  "sp-present",
  Absent:   "sp-absent",
  Leave:    "sp-leave",
  unmarked: "sp-unmarked",
};

function AdminDashboard() {
  const [stats, setStats]               = useState({ totalStudents: 0, totalMenus: 0, todayPresent: 0, todayAbsent: 0, todayLeave: 0 });
  const [students, setStudents]         = useState([]);
  const [attendance, setAttendance]     = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showStudentList, setShowStudentList] = useState(false);
  const [search, setSearch]             = useState("");

  const today      = new Date().toISOString().split("T")[0];
  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const studentsRes  = await API.get("/student");
      const studentsList = studentsRes.data || [];
      setStudents(studentsList);

      const attendanceData = await attendanceService.getAttendance({ date: today });
      const todayAtt       = Array.isArray(attendanceData) ? attendanceData : [];
      setAttendance(todayAtt);

      const newStats = {
        totalStudents: studentsList.length,
        totalMenus:    0,
        todayPresent:  todayAtt.filter(a => a.status === "Present").length,
        todayAbsent:   todayAtt.filter(a => a.status === "Absent").length,
        todayLeave:    todayAtt.filter(a => a.status === "Leave").length,
      };
      try {
        const menusRes      = await API.get("/menu");
        newStats.totalMenus = menusRes.data?.length || 0;
      } catch { /* ignore */ }

      setStats(newStats);
    } catch { /* ignore */ }
  };

  const getStudentsByStatus = (status) => {
    if (status === "all") return students;
    return students.filter((student) => {
      const record = attendance.find((a) => a.studentId === student.id);
      if (status === "unmarked") return !record;
      return record?.status === status;
    });
  };

  const handleStatClick = (status) => {
    setSelectedStatus(status);
    setShowStudentList(true);
    setSearch("");
  };

  const listStudents = getStudentsByStatus(selectedStatus)
    .filter((s) => s.name?.toLowerCase().includes(search.toLowerCase()));

  const listTitle = {
    all:     "All Students",
    Present: "Present Today",
    Absent:  "Absent Today",
    Leave:   "On Leave Today",
  }[selectedStatus] || "Students";

  const statCards = [
    { key: "all",     value: stats.totalStudents, label: "Total Students", bg: "linear-gradient(135deg,#4F7EF7 0%,#2D5BE3 100%)", shadow: "rgba(79,126,247,0.25)",  icon: "👥" },
    { key: "Present", value: stats.todayPresent,  label: "Present Today",  bg: "linear-gradient(135deg,#10B981 0%,#059669 100%)", shadow: "rgba(16,185,129,0.25)", icon: "✓"  },
    { key: "Absent",  value: stats.todayAbsent,   label: "Absent Today",   bg: "linear-gradient(135deg,#EF4444 0%,#DC2626 100%)", shadow: "rgba(239,68,68,0.25)",  icon: "✗"  },
    { key: "Leave",   value: stats.todayLeave,    label: "On Leave Today", bg: "linear-gradient(135deg,#F59E0B 0%,#D97706 100%)", shadow: "rgba(245,158,11,0.25)", icon: "📋" },
  ];

  return (
    <div className="dashboard">
      <UnifiedNavbar />

      <div className="main-content">

        {!showStudentList ? (
          <>
            {/* Welcome banner */}
            <div style={{
              background:   "var(--color-brand-gradient)",
              borderRadius: "var(--radius-xl)",
              padding:      "var(--space-8) var(--space-10)",
              marginBottom: "var(--space-8)",
              position:     "relative",
              overflow:     "hidden",
            }}>
              <div style={{ position:"absolute", right:"-40px", top:"-40px", width:"200px", height:"200px", borderRadius:"50%", background:"rgba(255,255,255,0.07)", pointerEvents:"none" }} />
              <div style={{ position:"absolute", right:"80px", bottom:"-70px", width:"150px", height:"150px", borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }} />
              <div style={{ position:"relative", zIndex:1 }}>
                <div style={{ fontSize:"var(--text-sm)", color:"rgba(255,255,255,0.75)", fontWeight:"var(--font-medium)", marginBottom:"var(--space-1)" }}>
                  Welcome back 👋
                </div>
                <div style={{ fontSize:"var(--text-3xl)", fontFamily:"var(--font-display)", fontWeight:"var(--font-bold)", color:"white", letterSpacing:"-0.02em", lineHeight:"var(--leading-tight)", marginBottom:"var(--space-2)" }}>
                  Admin Dashboard
                </div>
                <div style={{ fontSize:"var(--text-xs)", color:"rgba(255,255,255,0.6)" }}>
                  {todayLabel}
                </div>
              </div>
            </div>

            {/* Stat cards — click to drill down */}
            <div className="stats-overview" style={{ marginBottom:"var(--space-8)" }}>
              {statCards.map((s) => (
                <div
                  key={s.key}
                  className="stat-card"
                  style={{ background: s.bg, boxShadow:`0 6px 20px ${s.shadow}`, cursor:"pointer" }}
                  onClick={() => handleStatClick(s.key)}
                  title={`View ${s.label}`}
                >
                  <span className="stat-icon">{s.icon}</span>
                  <div className="stat-info">
                    <span className="stat-value">{s.value}</span>
                    <span className="stat-label">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick-action cards */}
            <div className="cards">
              <div className="card">
                <h3>Student List</h3>
                <p style={{ color:"var(--color-text-secondary)", fontSize:"var(--text-sm)", margin:"var(--space-3) 0 var(--space-4)", lineHeight:"var(--leading-relaxed)" }}>
                  View and manage all registered students
                </p>
                <Link to="/students" className="card-link">View Students →</Link>
              </div>
              <div className="card">
                <h3>Manage Menu</h3>
                <p style={{ color:"var(--color-text-secondary)", fontSize:"var(--text-sm)", margin:"var(--space-3) 0 var(--space-4)", lineHeight:"var(--leading-relaxed)" }}>
                  Create, edit, and manage daily menus
                </p>
                <Link to="/edit-menu" className="card-link">Manage Menu →</Link>
              </div>
              <div className="card">
                <h3>Attendance</h3>
                <p style={{ color:"var(--color-text-secondary)", fontSize:"var(--text-sm)", margin:"var(--space-3) 0 var(--space-4)", lineHeight:"var(--leading-relaxed)" }}>
                  Track and manage student attendance
                </p>
                <Link to="/attendance" className="card-link">View Attendance →</Link>
              </div>
              <div className="card">
                <h3>User Management</h3>
                <p style={{ color:"var(--color-text-secondary)", fontSize:"var(--text-sm)", margin:"var(--space-3) 0 var(--space-4)", lineHeight:"var(--leading-relaxed)" }}>
                  Manage admin, staff, and student accounts
                </p>
                <Link to="/users" className="card-link">Manage Users →</Link>
              </div>
            </div>
          </>
        ) : (

          /* ── Drill-down student grid ── */
          <div className="student-list-view">

            {/* Back button */}
            <button
              onClick={() => { setShowStudentList(false); setSearch(""); }}
              style={{
                display:      "inline-flex",
                alignItems:   "center",
                gap:          "var(--space-2)",
                padding:      "var(--space-2) var(--space-4)",
                marginBottom: "var(--space-6)",
                background:   "var(--color-neutral-100)",
                border:       "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                cursor:       "pointer",
                fontSize:     "var(--text-sm)",
                fontWeight:   "var(--font-semibold)",
                color:        "var(--color-text-secondary)",
                transition:   "all 150ms ease",
              }}
              onMouseOver={e => e.currentTarget.style.background = "var(--color-neutral-200)"}
              onMouseOut={e  => e.currentTarget.style.background = "var(--color-neutral-100)"}
            >
              ← Back to Dashboard
            </button>

            {/* Toolbar */}
            <div className="grid-toolbar">
              <h2 className="grid-toolbar-title">
                {listTitle}
                <span className="grid-count-badge">{listStudents.length}</span>
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
            </div>

            {/* Grid */}
            {listStudents.length === 0 ? (
              <div className="person-grid">
                <div className="person-grid-empty">No students found.</div>
              </div>
            ) : (
              <div className="person-grid">
                {listStudents.map((student) => {
                  const record = attendance.find((a) => a.studentId === student.id);
                  const status = record?.status || "unmarked";
                  const color  = getColor(student.id);

                  return (
                    <div className="person-card" key={student.id}>
                      <div className={`person-card-bar bar-${color}`} />
                      <div className={`person-avatar av-${color}`}>
                        {getInitials(student.name)}
                      </div>
                      <div className="person-card-name">{student.name}</div>
                      <div className="person-card-role">{student.course || "—"}</div>
                      <div className="person-card-meta">
                        <div className="person-meta-row">
                          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <rect x="1" y="3" width="12" height="9" rx="1.5" />
                            <path d="M1 6h12M4.5 3V1.5M9.5 3V1.5" strokeLinecap="round" />
                          </svg>
                          ID: {student.id}
                        </div>
                        <div className="person-meta-row">
                          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <rect x="1" y="2.5" width="12" height="9" rx="1.5" />
                            <path d="M1 5.5l6 3.5 6-3.5" />
                          </svg>
                          {student.email || "No email"}
                        </div>
                      </div>
                      <div className="person-card-footer">
                        <span className={`person-status-pill ${STATUS_PILL[status] || "sp-unmarked"}`}>
                          {status === "unmarked" ? "Not Marked" : status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;