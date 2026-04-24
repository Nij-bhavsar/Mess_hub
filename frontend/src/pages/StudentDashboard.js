import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import UnifiedNavbar from "../components/UnifiedNavbar";
import attendanceService from "../services/attendanceService";
import { readAuthUser } from "../utils/authStorage";

function getInitials(name = "") {
  return name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const STATUS_CONFIG = {
  Present: { pill: "sp-present", barColor: "#16A34A", label: "Present", icon: "P", accentBg: "#F0FDF4" },
  Absent: { pill: "sp-absent", barColor: "#DC2626", label: "Absent", icon: "A", accentBg: "#FEF2F2" },
  Leave: { pill: "sp-leave", barColor: "#D97706", label: "On Leave", icon: "L", accentBg: "#FFFBEB" },
  unmarked: { pill: "sp-unmarked", barColor: "var(--color-brand-primary)", label: "Not Marked", icon: "-", accentBg: "#F8FAFC" },
};

function StudentDashboard() {
  const authUser = readAuthUser() || {};
  const studentId = authUser.id || null;
  const authName = authUser.name || "Student";
  const authCourse = authUser.course || "";

  const [profile, setProfile] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, leave: 0 });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [mounted, setMounted] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    setTimeout(() => setMounted(true), 60);
  }, []);

  const fetchData = useCallback(async () => {
    if (!studentId) return;

    try {
      setLoading(true);

      try {
        const profileRes = await API.get(`/student/${studentId}`);
        const data = profileRes.data;
        setProfile({ ...data, course: data?.course || authCourse || "" });
      } catch {
        setProfile({ id: studentId, name: authName, email: authUser.email || "", course: authCourse });
      }

      try {
        const todayRes = await attendanceService.getAttendanceRecord(studentId, today);
        setTodayAttendance(todayRes?.status || null);
      } catch {
        setTodayAttendance(null);
      }

      try {
        let records = [];

        try {
          const historyRes = await attendanceService.getAttendance({ studentId });
          const all = Array.isArray(historyRes) ? historyRes : [];
          records = all.filter((r) => String(r.studentId) === String(studentId));
        } catch {
          try {
            const directRes = await API.get(`/attendance?studentId=${studentId}`);
            const all = Array.isArray(directRes.data) ? directRes.data : [];
            records = all.filter((r) => String(r.studentId) === String(studentId));
          } catch {
            records = [];
          }
        }

        setAttendanceHistory(records);
        setAttendanceStats({
          present: records.filter((a) => a.status === "Present").length,
          absent: records.filter((a) => a.status === "Absent").length,
          leave: records.filter((a) => a.status === "Leave").length,
        });
      } catch {
        setAttendanceStats({ present: 0, absent: 0, leave: 0 });
      }
    } catch (err) {
      console.error("StudentDashboard fetchData error:", err);
    } finally {
      setLoading(false);
    }
  }, [studentId, today, authName, authCourse, authUser.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statusKey = todayAttendance || "unmarked";
  const sc = STATUS_CONFIG[statusKey] || STATUS_CONFIG.unmarked;
  const total = attendanceStats.present + attendanceStats.absent + attendanceStats.leave;
  const pct = total > 0 ? Math.round((attendanceStats.present / total) * 100) : 0;
  const displayName = profile?.name || authName;

  const sortedHistory = [...attendanceHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

  const formatHistoryDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const pctColor = pct >= 75 ? "var(--color-success)" : pct >= 50 ? "var(--color-warning)" : "var(--color-danger)";
  const pctGradient = pct >= 75
    ? "linear-gradient(90deg,#16A34A,#22C55E)"
    : pct >= 50
      ? "linear-gradient(90deg,#D97706,#FBBF24)"
      : "linear-gradient(90deg,#DC2626,#EF4444)";

  return (
    <div className="dashboard">
      <UnifiedNavbar />

      <div className="main-content">
        <div
          className="welcome-banner"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "none" : "translateY(16px)",
            transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div className="banner-orb banner-orb-1" />
          <div className="banner-orb banner-orb-2" />
          <div className="banner-orb banner-orb-3" />

          <div className="banner-content">
            <div className="banner-left">
              <div className="banner-student-avatar">
                {loading ? "..." : getInitials(displayName)}
              </div>
              <div>
                <div className="banner-eyebrow">{greeting}</div>
                <div className="banner-title">{loading ? "Loading..." : displayName}</div>
                <div className="banner-meta">
                  <span className="banner-role-pill">Student</span>
                  {profile?.course && <span className="banner-course">{profile.course}</span>}
                  <span className="banner-date">{todayLabel}</span>
                </div>
              </div>
            </div>

            <div className="banner-status-box" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
              <div className="banner-status-icon">{sc.icon}</div>
              <div className="banner-status-label">Today</div>
              <div className="banner-status-value">{loading ? "-" : sc.label}</div>
            </div>
          </div>
        </div>

        <div
          className="attendance-overview-card"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "none" : "translateY(16px)",
            transition: "all 0.5s cubic-bezier(0.4,0,0.2,1) 0.12s",
            marginBottom: "var(--space-8)",
          }}
        >
          <div className="aov-header">
            <div>
              <div className="aov-title">Attendance Overview</div>
              <div className="aov-subtitle">{total} total records</div>
            </div>
            <div className="aov-pct-badge" style={{ color: pctColor, borderColor: `${pctColor}33`, background: `${pctColor}0D` }}>
              {loading ? "-" : `${pct}%`}
            </div>
          </div>

          <div className="aov-bar-wrap">
            <div className="aov-bar-track">
              <div className="aov-bar-fill" style={{ width: loading ? "0%" : `${pct}%`, background: pctGradient }} />
            </div>
            <div className="aov-bar-labels">
              <span>0%</span>
              <span style={{ color: pctColor, fontWeight: "var(--font-semibold)" }}>
                {pct >= 75 ? "Good standing" : pct >= 50 ? "Needs improvement" : "Low attendance"}
              </span>
              <span>100%</span>
            </div>
          </div>

          <div className="aov-chips">
            <div className="aov-chip aov-chip-present">
              <span className="aov-chip-num">{loading ? "-" : attendanceStats.present}</span>
              <span className="aov-chip-label">Present</span>
            </div>
            <div className="aov-chip-divider" />
            <div className="aov-chip aov-chip-absent">
              <span className="aov-chip-num">{loading ? "-" : attendanceStats.absent}</span>
              <span className="aov-chip-label">Absent</span>
            </div>
            <div className="aov-chip-divider" />
            <div className="aov-chip aov-chip-leave">
              <span className="aov-chip-num">{loading ? "-" : attendanceStats.leave}</span>
              <span className="aov-chip-label">Leave</span>
            </div>
          </div>
        </div>

        <div className="section-header">
          <div>
            <h2 className="section-title">Quick Access</h2>
            <p className="section-subtitle">Your daily essentials at a glance</p>
          </div>
        </div>

        <div className="cards" style={{ marginBottom: "var(--space-8)" }}>
          <div className="card card-premium" style={{ opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(20px)", transition: "all 0.5s cubic-bezier(0.4,0,0.2,1) 0.28s" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: sc.barColor, borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }} />
            <div className="card-icon-row">
              <div className="card-icon" style={{ background: sc.accentBg, fontSize: "1.4rem" }}>{sc.icon}</div>
            </div>
            <h3 className="card-title-premium">Today's Attendance</h3>
            <div style={{ margin: "var(--space-3) 0 var(--space-4)" }}>
              <span className={`person-status-pill ${sc.pill}`} style={{ fontSize: "var(--text-sm)", padding: "var(--space-2) var(--space-4)" }}>
                {loading ? "Loading..." : sc.label}
              </span>
            </div>
            <Link to="/attendance" className="card-cta">
              View Attendance <span className="card-cta-arrow">-&gt;</span>
            </Link>
          </div>

          <div className="card card-premium" style={{ opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(20px)", transition: "all 0.5s cubic-bezier(0.4,0,0.2,1) 0.36s" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,#4F46E5,#818CF8)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }} />
            <div className="card-icon-row">
              <div className="card-icon" style={{ background: "#EEF2FF" }}>S</div>
            </div>
            <h3 className="card-title-premium">Monthly Summary</h3>
            <div className="card-attendance-chips" style={{ marginBottom: "var(--space-4)" }}>
              <span className="chip chip-present">Present {attendanceStats.present}</span>
              <span className="chip chip-absent">Absent {attendanceStats.absent}</span>
              <span className="chip chip-leave">Leave {attendanceStats.leave}</span>
            </div>
            <button onClick={() => setShowHistory(!showHistory)} className="card-cta" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {showHistory ? "Hide History" : "View History"} <span className="card-cta-arrow">{showHistory ? "^" : "->"}</span>
            </button>
          </div>

          <div className="card card-premium" style={{ opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(20px)", transition: "all 0.5s cubic-bezier(0.4,0,0.2,1) 0.44s" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,#D97706,#FCD34D)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }} />
            <div className="card-icon-row">
              <div className="card-icon" style={{ background: "#FFFBEB" }}>M</div>
            </div>
            <h3 className="card-title-premium">Today's Menu</h3>
            <p className="card-desc-premium">Breakfast and lunch being served today</p>
            <Link to="/today-menu" className="card-cta">
              View Menu <span className="card-cta-arrow">-&gt;</span>
            </Link>
          </div>
        </div>

        {showHistory && (
          <div className="history-panel" style={{ animation: "slideInUp 0.3s cubic-bezier(0.4,0,0.2,1)", marginBottom: "var(--space-8)" }}>
            <div className="history-header">
              <div className="history-heading-group">
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
                  <h3 className="history-title">My Attendance History</h3>
                  <span className="grid-count-badge">{sortedHistory.length}</span>
                </div>
                <p className="history-subtitle">Your latest meal attendance records in a cleaner format.</p>
              </div>
              <button onClick={() => setShowHistory(false)} className="history-close-btn">x</button>
            </div>

            {sortedHistory.length === 0 ? (
              <p className="history-empty">No attendance records found.</p>
            ) : (
              <div className="history-table-wrap">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Meal Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHistory.map((record, idx) => (
                      <tr key={record.id || idx}>
                        <td data-label="#"><span className="history-index">{idx + 1}</span></td>
                        <td data-label="Date" className="history-date-cell">{formatHistoryDate(record.date)}</td>
                        <td data-label="Meal Type" className="history-meal-cell">{record.mealType || "Breakfast & Lunch"}</td>
                        <td data-label="Status" className="history-status-cell">
                          <span className={`person-status-pill history-status-pill ${STATUS_CONFIG[record.status]?.pill || "sp-unmarked"}`}>
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
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;
