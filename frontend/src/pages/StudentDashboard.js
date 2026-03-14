import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import UnifiedNavbar from "../components/UnifiedNavbar";
import attendanceService from "../services/attendanceService";

const STATUS_CONFIG = {
  Present:  { pill: "sp-present",  barColor: "#10B981" },
  Absent:   { pill: "sp-absent",   barColor: "#EF4444" },
  Leave:    { pill: "sp-leave",    barColor: "#F59E0B" },
  unmarked: { pill: "sp-unmarked", barColor: "var(--color-brand-primary)" },
};

function StudentDashboard() {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, leave: 0 });
  const [loading, setLoading]                 = useState(true);

  const storedUser  = localStorage.getItem("user");
  const user        = storedUser ? JSON.parse(storedUser) : {};
  const studentId   = user.id   || null;
  const studentName = user.name || "Student";

  const today      = new Date().toISOString().split("T")[0];
  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const hour       = new Date().getHours();
  const greeting   = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      try {
        const rec = await attendanceService.getAttendanceRecord(studentId, today);
        setTodayAttendance(rec?.status || null);
      } catch { setTodayAttendance(null); }

      try {
        const hist    = await attendanceService.getAttendance({ studentId });
        const records = Array.isArray(hist) ? hist : [];
        setAttendanceStats({
          present: records.filter(a => a.status === "Present").length,
          absent:  records.filter(a => a.status === "Absent").length,
          leave:   records.filter(a => a.status === "Leave").length,
        });
      } catch { setAttendanceStats({ present: 0, absent: 0, leave: 0 }); }
    } finally {
      setLoading(false);
    }
  }, [studentId, today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statusKey = todayAttendance || "unmarked";
  const sc        = STATUS_CONFIG[statusKey] || STATUS_CONFIG.unmarked;
  const total     = attendanceStats.present + attendanceStats.absent + attendanceStats.leave;
  const pct       = total > 0 ? Math.round((attendanceStats.present / total) * 100) : 0;

  return (
    <div className="dashboard">
      <UnifiedNavbar />

      <div className="main-content">

        {/* Welcome banner */}
        <div style={{
          background:   "var(--color-brand-gradient)",
          borderRadius: "var(--radius-xl)",
          padding:      "var(--space-8) var(--space-10)",
          marginBottom: "var(--space-8)",
          display:      "flex",
          alignItems:   "center",
          justifyContent: "space-between",
          flexWrap:     "wrap",
          gap:          "var(--space-4)",
          position:     "relative",
          overflow:     "hidden",
        }}>
          <div style={{ position:"absolute", right:"-40px", top:"-40px", width:"180px", height:"180px", borderRadius:"50%", background:"rgba(255,255,255,0.08)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", right:"60px", bottom:"-60px", width:"140px", height:"140px", borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none" }} />

          <div style={{ position:"relative", zIndex:1 }}>
            <div style={{ fontSize:"var(--text-sm)", color:"rgba(255,255,255,0.8)", fontWeight:"var(--font-medium)", marginBottom:"var(--space-1)" }}>
              {greeting} 👋
            </div>
            <div style={{ fontSize:"var(--text-3xl)", fontFamily:"var(--font-display)", fontWeight:"var(--font-bold)", color:"white", letterSpacing:"-0.02em", lineHeight:"var(--leading-tight)" }}>
              {studentName}
            </div>
            <div style={{ fontSize:"var(--text-xs)", color:"rgba(255,255,255,0.65)", marginTop:"var(--space-2)" }}>
              {todayLabel}
            </div>
          </div>

          {/* Today status badge */}
          <div style={{
            background:    "rgba(255,255,255,0.15)",
            backdropFilter:"blur(8px)",
            border:        "1px solid rgba(255,255,255,0.25)",
            borderRadius:  "var(--radius-lg)",
            padding:       "var(--space-4) var(--space-6)",
            textAlign:     "center",
            position:      "relative",
            zIndex:        1,
          }}>
            <div style={{ fontSize:"var(--text-xs)", color:"rgba(255,255,255,0.7)", fontWeight:"var(--font-semibold)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"var(--space-2)" }}>
              Today's status
            </div>
            <div style={{ fontSize:"var(--text-lg)", color:"white", fontWeight:"var(--font-bold)", textTransform:"capitalize" }}>
              {loading ? "…" : (todayAttendance || "Not Marked")}
            </div>
          </div>
        </div>

        {/* Mini stat row */}
        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap:                 "var(--space-4)",
          marginBottom:        "var(--space-8)",
        }}>
          {[
            { label: "Present",      value: attendanceStats.present, color: "var(--color-success)"    },
            { label: "Absent",       value: attendanceStats.absent,  color: "var(--color-danger)"     },
            { label: "Leave",        value: attendanceStats.leave,   color: "var(--color-warning)"    },
            { label: "Attendance %", value: `${pct}%`,               color: "var(--color-accent-blue)"},
          ].map((s) => (
            <div key={s.label} style={{
              background:   "var(--color-surface)",
              border:       "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding:      "var(--space-5)",
              boxShadow:    "var(--shadow-xs)",
            }}>
              <div style={{ fontSize:"1.75rem", fontWeight:"var(--font-bold)", color:s.color, lineHeight:1.1, letterSpacing:"-0.02em" }}>
                {loading ? "—" : s.value}
              </div>
              <div style={{ fontSize:"var(--text-xs)", fontWeight:"var(--font-semibold)", color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.06em", marginTop:"var(--space-1)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Action cards */}
        <div className="cards">

          <div className="card">
            <div style={{ position:"absolute", top:0, left:0, right:0, height:"3px", background: sc.barColor, borderRadius:"var(--radius-lg) var(--radius-lg) 0 0" }} />
            <h3>Today's Attendance</h3>
            <div style={{ margin:"var(--space-3) 0 var(--space-4)" }}>
              <span className={`person-status-pill ${sc.pill}`} style={{ fontSize:"var(--text-sm)", padding:"var(--space-2) var(--space-4)" }}>
                {loading ? "Loading…" : (todayAttendance || "Not Marked")}
              </span>
            </div>
            <Link to="/attendance" className="card-link">Mark Attendance →</Link>
          </div>

          <div className="card">
            <h3>Monthly Summary</h3>
            <div className="attendance-mini-stats" style={{ margin:"var(--space-3) 0 var(--space-4)" }}>
              <span className="present">✓ {attendanceStats.present} Present</span>
              <span className="absent">✗ {attendanceStats.absent} Absent</span>
              <span className="leave">📋 {attendanceStats.leave} Leave</span>
            </div>
            <Link to="/attendance" className="card-link">View Details →</Link>
          </div>

          <div className="card">
            <h3>Today's Menu</h3>
            <p style={{ color:"var(--color-text-secondary)", fontSize:"var(--text-sm)", margin:"var(--space-3) 0 var(--space-4)", lineHeight:"var(--leading-relaxed)" }}>
              Breakfast + Lunch served today
            </p>
            <Link to="/today-menu" className="card-link">View Menu →</Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;