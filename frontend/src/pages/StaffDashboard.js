import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import UnifiedNavbar from "../components/UnifiedNavbar";
import API from "../services/api";
import attendanceService from "../services/attendanceService";

function StaffDashboard() {
  const [stats, setStats]   = useState({ todayPresent: 0, todayAbsent: 0, todayLeave: 0, totalStudents: 0 });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const today      = new Date().toISOString().split("T")[0];

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const studentsRes    = await API.get("/student");
        const studentsList   = studentsRes.data || [];
        const attendanceData = await attendanceService.getAttendance({ date: today });
        const todayAtt       = Array.isArray(attendanceData) ? attendanceData : [];

        setStats({
          totalStudents: studentsList.length,
          todayPresent:  todayAtt.filter(a => a.status === "Present").length,
          todayAbsent:   todayAtt.filter(a => a.status === "Absent").length,
          todayLeave:    todayAtt.filter(a => a.status === "Leave").length,
        });
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [today]);

  const statItems = [
    { label: "Total Students", value: stats.totalStudents, color: "var(--color-accent-blue)",  bg: "#EFF6FF", icon: "👥" },
    { label: "Present Today",  value: stats.todayPresent,  color: "var(--color-success)",      bg: "#ECFDF5", icon: "✓"  },
    { label: "Absent Today",   value: stats.todayAbsent,   color: "var(--color-danger)",        bg: "#FEF2F2", icon: "✗"  },
    { label: "On Leave",       value: stats.todayLeave,    color: "var(--color-warning)",       bg: "#FFFBEB", icon: "📋" },
  ];

  const attendancePct = stats.totalStudents > 0
    ? Math.round((stats.todayPresent / stats.totalStudents) * 100)
    : 0;

  return (
    <div className="dashboard">
      <UnifiedNavbar />

      <div className="main-content">

        {/* ── Welcome Banner ── */}
        <div
          className="welcome-banner"
          style={{
            opacity:    mounted ? 1 : 0,
            transform:  mounted ? "none" : "translateY(16px)",
            transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div className="banner-orb banner-orb-1" />
          <div className="banner-orb banner-orb-2" />
          <div className="banner-orb banner-orb-3" />

          <div className="banner-content">
            <div className="banner-left">
              <div className="banner-staff-icon">🧑‍🍳</div>
              <div>
                <div className="banner-eyebrow">{greeting} 👋</div>
                <div className="banner-title">Staff Dashboard</div>
                <div className="banner-meta">
                  <span className="banner-role-pill">Staff</span>
                  <span className="banner-date">{todayLabel}</span>
                </div>
              </div>
            </div>

            {/* Live attendance rate */}
            <div className="banner-right-stat">
              <div className="banner-big-number" style={{
                color: attendancePct >= 75 ? "#A7F3D0" : attendancePct >= 50 ? "#FDE68A" : "#FCA5A5"
              }}>
                {loading ? "—" : `${attendancePct}%`}
              </div>
              <div className="banner-big-label">Attendance Rate</div>
            </div>
          </div>
        </div>

        {/* ── Stat Pills Row ── */}
        <div className="staff-stats-row" style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap:                 "var(--space-4)",
          marginBottom:        "var(--space-8)",
        }}>
          {statItems.map((s, i) => (
            <div
              key={s.label}
              className="stat-mini-card"
              style={{
                background:  s.bg,
                border:      `1px solid ${s.color}22`,
                opacity:     mounted ? 1 : 0,
                transform:   mounted ? "none" : "translateY(16px)",
                transition:  `all 0.45s cubic-bezier(0.4,0,0.2,1) ${i * 70}ms`,
              }}
            >
              <div className="stat-mini-icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="stat-mini-value" style={{ color: s.color }}>
                {loading ? "—" : s.value}
              </div>
              <div className="stat-mini-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Progress bar ── */}
        {!loading && (
          <div
            className="attendance-progress-wrap"
            style={{
              opacity:    mounted ? 1 : 0,
              transition: "opacity 0.5s ease 0.4s",
              marginBottom: "var(--space-8)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)", fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span>Today's Attendance Progress</span>
              <span style={{ color: attendancePct >= 75 ? "var(--color-success)" : attendancePct >= 50 ? "var(--color-warning)" : "var(--color-danger)" }}>
                {attendancePct}%
              </span>
            </div>
            <div style={{ height: "8px", background: "var(--color-neutral-200)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
              <div style={{
                height:       "100%",
                width:        `${attendancePct}%`,
                borderRadius: "var(--radius-full)",
                background:   attendancePct >= 75
                  ? "linear-gradient(90deg,#16A34A,#22C55E)"
                  : attendancePct >= 50
                  ? "linear-gradient(90deg,#D97706,#FBBF24)"
                  : "linear-gradient(90deg,#DC2626,#EF4444)",
                transition:   "width 1s cubic-bezier(0.4,0,0.2,1)",
              }} />
            </div>
          </div>
        )}

        {/* ── Section Header ── */}
        <div className="section-header">
          <div>
            <h2 className="section-title">Your Tools</h2>
            <p className="section-subtitle">Everything you need to manage today</p>
          </div>
        </div>

        {/* ── Action Cards ── */}
        <div className="cards">

          {/* Menu Management */}
          <div
            className="card card-premium"
            style={{
              opacity:    mounted ? 1 : 0,
              transform:  mounted ? "none" : "translateY(20px)",
              transition: "all 0.5s cubic-bezier(0.4,0,0.2,1) 0.35s",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,#0D9488,#14B8A6)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }} />
            <div className="card-icon-row">
              <div className="card-icon" style={{ background: "#F0FDFA" }}>🍽️</div>
            </div>
            <h3 className="card-title-premium">Manage Menu</h3>
            <p className="card-desc-premium">Create, edit, and delete daily menu items for students</p>
            <Link to="/edit-menu" className="card-cta">
              Go to Menu Management <span className="card-cta-arrow">→</span>
            </Link>
          </div>

          {/* Mark Attendance */}
          <div
            className="card card-premium"
            style={{
              opacity:    mounted ? 1 : 0,
              transform:  mounted ? "none" : "translateY(20px)",
              transition: "all 0.5s cubic-bezier(0.4,0,0.2,1) 0.43s",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,#16A34A,#22C55E)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }} />
            <div className="card-icon-row">
              <div className="card-icon" style={{ background: "#F0FDF4" }}>✅</div>
            </div>
            <h3 className="card-title-premium">Mark Attendance</h3>
            <p className="card-desc-premium">Mark and track student attendance for today's meals</p>

            <div className="card-attendance-chips">
              <span className="chip chip-present">✓ {loading ? "—" : stats.todayPresent} Present</span>
              <span className="chip chip-absent">✗ {loading ? "—" : stats.todayAbsent} Absent</span>
              <span className="chip chip-leave">📋 {loading ? "—" : stats.todayLeave} Leave</span>
            </div>

            <Link to="/attendance" className="card-cta">
              Mark Attendance <span className="card-cta-arrow">→</span>
            </Link>
          </div>

          {/* Today's Menu */}
          <div
            className="card card-premium"
            style={{
              opacity:    mounted ? 1 : 0,
              transform:  mounted ? "none" : "translateY(20px)",
              transition: "all 0.5s cubic-bezier(0.4,0,0.2,1) 0.51s",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,#D97706,#FCD34D)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }} />
            <div className="card-icon-row">
              <div className="card-icon" style={{ background: "#FFFBEB" }}>🥘</div>
            </div>
            <h3 className="card-title-premium">Today's Menu</h3>
            <p className="card-desc-premium">View the meal plan being served to students today</p>
            <Link to="/today-menu" className="card-cta">
              View Today's Menu <span className="card-cta-arrow">→</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;