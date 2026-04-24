import { Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import UnifiedNavbar from "../components/UnifiedNavbar";
import API from "../services/api";
import attendanceService from "../services/attendanceService";
import { readAuthUser } from "../utils/authStorage";

const AVATAR_COLORS = ["blue", "green", "amber", "rose", "purple", "orange", "cyan"];

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function getColor(id) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function formatDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDate(value = "") {
  return String(value).split("T")[0];
}

function isDateInRange(date, fromDate, toDate) {
  const current = normalizeDate(date);
  const from = normalizeDate(fromDate);
  const to = normalizeDate(toDate);

  if (!current || !from || !to) return false;
  return current >= from && current <= to;
}

const STATUS_PILL = {
  Present:  "sp-present",
  Absent:   "sp-absent",
  Leave:    "sp-leave",
  unmarked: "sp-unmarked",
};

const ACTION_CARDS = [
  {
    title: "Student List",
    desc: "View and manage all registered students",
    link: "/students",
    label: "View Students",
    icon: "👥",
    accent: "linear-gradient(135deg,#4F7EF7 0%,#2D5BE3 100%)",
    accentLight: "#EFF6FF",
  },
  {
    title: "Manage Menu",
    desc: "Create, edit, and manage daily meal menus",
    link: "/edit-menu",
    label: "Manage Menu",
    icon: "🍽️",
    accent: "linear-gradient(135deg,#0D9488 0%,#14B8A6 100%)",
    accentLight: "#F0FDFA",
  },
  {
    title: "Item Requests",
    desc: "Review and approve student item requests",
    link: "/item-requests",
    label: "View Requests",
    icon: "📋",
    accent: "linear-gradient(135deg,#D97706 0%,#FCD34D 100%)",
    accentLight: "#FFFBEB",
  },
  {
    title: "Mark Attendance",
    desc: "Mark and manage student attendance records",
    link: "/attendance",
    label: "Mark Attendance",
    icon: "✅",
    accent: "linear-gradient(135deg,#16A34A 0%,#22C55E 100%)",
    accentLight: "#F0FDF4",
    attendance: true,
  },
  {
    title: "User Management",
    desc: "Manage admin, staff, and student accounts",
    link: "/users",
    label: "Manage Users",
    icon: "⚙️",
    accent: "linear-gradient(135deg,#4F46E5 0%,#818CF8 100%)",
    accentLight: "#EEF2FF",
  },
  {
    title: "Payments",
    desc: "View all student mess fee payment records",
    link: "/payments",
    label: "View Payments",
    icon: "💳",
    accent: "linear-gradient(135deg,#059669 0%,#34D399 100%)",
    accentLight: "#ECFDF5",
  },
];

function AdminDashboard() {
  const [stats, setStats]                   = useState({ totalStudents: 0, totalMenus: 0, todayPresent: 0, todayAbsent: 0, todayLeave: 0 });
  const [students, setStudents]             = useState([]);
  const [attendance, setAttendance]         = useState([]);
  const [todayLeavePeople, setTodayLeavePeople] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showStudentList, setShowStudentList] = useState(false);
  const [search, setSearch]                 = useState("");
  const [mounted, setMounted]               = useState(false);

  const authUser    = readAuthUser() || {};
  const adminName   = authUser.name || authUser.email || "Admin";

  const today      = formatDateKey(new Date());
  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const fetchStats = useCallback(async () => {
    try {
      const studentsRes  = await API.get("/student");
      const studentsList = studentsRes.data || [];
      setStudents(studentsList);

      const attendanceData = await attendanceService.getAttendance({ date: today });
      const todayAtt       = Array.isArray(attendanceData) ? attendanceData : [];
      setAttendance(todayAtt);

      let todayLeaveList = [];

      try {
        const [leavesRes, usersRes] = await Promise.all([
          API.get("/leave", { params: { status: "Approved" } }),
          API.get("/user"),
        ]);

        const approvedLeaves = Array.isArray(leavesRes.data) ? leavesRes.data : [];
        const users = Array.isArray(usersRes.data) ? usersRes.data : [];
        const userMap = new Map(users.map((user) => [String(user.id), user]));
        const leaveMap = new Map();

        approvedLeaves.forEach((leave) => {
          if (!isDateInRange(today, leave.fromDate, leave.toDate)) return;

          const role = String(leave.userRole || "").toLowerCase();
          if (role !== "student" && role !== "staff") return;

          const matchedUser = userMap.get(String(leave.userId));
          const dedupeKey = `${role}-${leave.userId}`;

          leaveMap.set(dedupeKey, {
            id: leave.userId,
            name: leave.userName || matchedUser?.name || "Unknown",
            email: matchedUser?.email || "",
            role: leave.userRole || matchedUser?.role || "User",
            course: role === "student" ? (matchedUser?.course || "") : "",
            leaveType: leave.leaveType || "",
            fromDate: leave.fromDate,
            toDate: leave.toDate,
          });
        });

        todayLeaveList = Array.from(leaveMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      } catch {
        todayLeaveList = [];
      }

      setTodayLeavePeople(todayLeaveList);

      const newStats = {
        totalStudents: studentsList.length,
        totalMenus:    0,
        todayPresent:  todayAtt.filter(a => a.status === "Present").length,
        todayAbsent:   todayAtt.filter(a => a.status === "Absent").length,
        todayLeave:    todayLeaveList.length,
      };

      try {
        const menusRes      = await API.get("/menu");
        newStats.totalMenus = menusRes.data?.length || 0;
      } catch { /* ignore */ }

      setStats(newStats);
    } catch { /* ignore */ }
  }, [today]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const getStudentsByStatus = (status) => {
    if (status === "Leave") return todayLeavePeople;
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
    .filter((s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.role?.toLowerCase().includes(search.toLowerCase())
    );

  const listTitle = {
    all:     "All Students",
    Present: "Present Today",
    Absent:  "Absent Today",
    Leave:   "People On Leave Today",
  }[selectedStatus] || "People";

  const statCards = [
    { key: "all",     value: stats.totalStudents, label: "Total Students", bg: "linear-gradient(135deg,#4F7EF7 0%,#2D5BE3 100%)", shadow: "rgba(79,126,247,0.28)",  icon: "👥", trend: "+2 this week" },
    { key: "Present", value: stats.todayPresent,  label: "Present Today",  bg: "linear-gradient(135deg,#10B981 0%,#059669 100%)", shadow: "rgba(16,185,129,0.28)", icon: "✓",  trend: "Today"        },
    { key: "Absent",  value: stats.todayAbsent,   label: "Absent Today",   bg: "linear-gradient(135deg,#EF4444 0%,#DC2626 100%)", shadow: "rgba(239,68,68,0.28)",  icon: "✗",  trend: "Today"        },
    { key: "Leave",   value: stats.todayLeave,    label: "On Leave Today", bg: "linear-gradient(135deg,#F59E0B 0%,#D97706 100%)", shadow: "rgba(245,158,11,0.28)", icon: "📋", trend: "Today"        },
  ];

  return (
    <div className="dashboard">
      <UnifiedNavbar />

      <div className="main-content">

        {!showStudentList ? (
          <>
            {/* ── Welcome Banner ── */}
            <div className="welcome-banner" style={{ opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(16px)", transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)" }}>
              {/* Background orbs */}
              <div className="banner-orb banner-orb-1" />
              <div className="banner-orb banner-orb-2" />
              <div className="banner-orb banner-orb-3" />

              <div className="banner-content">
                <div className="banner-left">
                  <div className="banner-admin-avatar">
                    {getInitials(adminName)}
                  </div>
                  <div>
                    <div className="banner-eyebrow">Welcome back 👋</div>
                    <div className="banner-title">{adminName}</div>
                    <div className="banner-meta">
                      <span className="banner-role-pill">Admin</span>
                      <span className="banner-date">{todayLabel}</span>
                    </div>
                  </div>
                </div>
                <div className="banner-right-stat">
                  <div className="banner-big-number">{stats.totalStudents}</div>
                  <div className="banner-big-label">Total Students</div>
                </div>
              </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="stats-overview" style={{ marginBottom: "var(--space-8)" }}>
              {statCards.map((s, i) => (
                <div
                  key={s.key}
                  className="stat-card stat-card-premium"
                  style={{
                    background:  s.bg,
                    boxShadow:   `0 8px 24px ${s.shadow}`,
                    cursor:      "pointer",
                    opacity:     mounted ? 1 : 0,
                    transform:   mounted ? "none" : "translateY(20px)",
                    transition:  `all 0.5s cubic-bezier(0.4,0,0.2,1) ${i * 80}ms`,
                  }}
                  onClick={() => handleStatClick(s.key)}
                  title={`View ${s.label}`}
                >
                  <div className="stat-card-inner">
                    <div className="stat-icon-wrap">{s.icon}</div>
                    <div className="stat-info">
                      <span className="stat-value">{s.value}</span>
                      <span className="stat-label">{s.label}</span>
                    </div>
                    <div className="stat-arrow">→</div>
                  </div>
                  <div className="stat-card-shine" />
                </div>
              ))}
            </div>

            {/* ── Section Header ── */}
            <div className="section-header">
              <div>
                <h2 className="section-title">Quick Actions</h2>
                <p className="section-subtitle">Manage all aspects of your institution</p>
              </div>
            </div>

            {/* ── Action Cards ── */}
            <div className="cards">
              {ACTION_CARDS.map((card, i) => (
                <div
                  key={card.title}
                  className="card card-premium"
                  style={{
                    opacity:    mounted ? 1 : 0,
                    transform:  mounted ? "none" : "translateY(20px)",
                    transition: `all 0.5s cubic-bezier(0.4,0,0.2,1) ${200 + i * 60}ms`,
                  }}
                >
                  {/* Top accent bar */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: card.accent, borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }} />

                  <div className="card-icon-row">
                    <div className="card-icon" style={{ background: card.accentLight }}>
                      {card.icon}
                    </div>
                  </div>

                  <h3 className="card-title-premium">{card.title}</h3>
                  <p className="card-desc-premium">{card.desc}</p>

                  {card.attendance && (
                    <div className="card-attendance-chips">
                      <span className="chip chip-present">✓ {stats.todayPresent} Present</span>
                      <span className="chip chip-absent">✗ {stats.todayAbsent} Absent</span>
                      <span className="chip chip-leave">📋 {stats.todayLeave} Leave</span>
                    </div>
                  )}

                  <Link to={card.link} className="card-cta">
                    {card.label}
                    <span className="card-cta-arrow">→</span>
                  </Link>
                </div>
              ))}
            </div>
          </>
        ) : (

          /* ── Student Drill-Down View ── */
          <div className="student-list-view">

            <button
              className="back-btn"
              onClick={() => { setShowStudentList(false); setSearch(""); }}
            >
              <span>←</span> Back to Dashboard
            </button>

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
