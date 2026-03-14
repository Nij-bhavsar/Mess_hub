import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import UnifiedNavbar from "../components/UnifiedNavbar";
import API from "../services/api";
import attendanceService from "../services/attendanceService";

function StaffDashboard() {
  const [stats, setStats] = useState({ todayPresent: 0, todayAbsent: 0, todayLeave: 0, totalStudents: 0 });
  const [loading, setLoading] = useState(true);

  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const today      = new Date().toISOString().split("T")[0];

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
          position:     "relative",
          overflow:     "hidden",
        }}>
          <div style={{ position:"absolute", right:"-40px", top:"-40px", width:"180px", height:"180px", borderRadius:"50%", background:"rgba(255,255,255,0.08)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", right:"60px", bottom:"-60px", width:"140px", height:"140px", borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none" }} />
          <div style={{ position:"relative", zIndex:1 }}>
            <div style={{ fontSize:"var(--text-sm)", color:"rgba(255,255,255,0.8)", fontWeight:"var(--font-medium)", marginBottom:"var(--space-1)" }}>
              Welcome back 👋
            </div>
            <div style={{ fontSize:"var(--text-3xl)", fontFamily:"var(--font-display)", fontWeight:"var(--font-bold)", color:"white", letterSpacing:"-0.02em", lineHeight:"var(--leading-tight)", marginBottom:"var(--space-2)" }}>
              Staff Dashboard
            </div>
            <div style={{ fontSize:"var(--text-xs)", color:"rgba(255,255,255,0.65)" }}>
              {todayLabel}
            </div>
          </div>
        </div>

        {/* Today's quick stats */}
        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap:                 "var(--space-4)",
          marginBottom:        "var(--space-8)",
        }}>
          {[
            { label: "Total Students", value: stats.totalStudents, color: "var(--color-accent-blue)"  },
            { label: "Present Today",  value: stats.todayPresent,  color: "var(--color-success)"      },
            { label: "Absent Today",   value: stats.todayAbsent,   color: "var(--color-danger)"       },
            { label: "On Leave",       value: stats.todayLeave,    color: "var(--color-warning)"      },
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
            <h3>Manage Menu</h3>
            <p style={{ color:"var(--color-text-secondary)", fontSize:"var(--text-sm)", margin:"var(--space-3) 0 var(--space-4)", lineHeight:"var(--leading-relaxed)" }}>
              Create, edit, and delete daily menu items
            </p>
            <Link to="/edit-menu" className="card-link">Go to Menu Management →</Link>
          </div>

          <div className="card">
            <h3>Attendance</h3>
            <p style={{ color:"var(--color-text-secondary)", fontSize:"var(--text-sm)", margin:"var(--space-3) 0 var(--space-4)", lineHeight:"var(--leading-relaxed)" }}>
              Track student attendance and meals
            </p>
            <Link to="/attendance" className="card-link">View Attendance →</Link>
          </div>

          <div className="card">
            <h3>Today's Menu</h3>
            <p style={{ color:"var(--color-text-secondary)", fontSize:"var(--text-sm)", margin:"var(--space-3) 0 var(--space-4)", lineHeight:"var(--leading-relaxed)" }}>
              View today's meal plan for students
            </p>
            <Link to="/today-menu" className="card-link">View Today's Menu →</Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;