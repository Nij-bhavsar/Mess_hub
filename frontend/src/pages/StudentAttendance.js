import { useEffect, useState } from "react";
import API from "../services/api";
import UnifiedNavbar from "../components/UnifiedNavbar";
import { readAuthUser } from "../utils/authStorage";

function getMonthValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getRecordMonth(record) {
  if (!record?.date) return "";
  return String(record.date).slice(0, 7);
}

function formatMonth(monthValue) {
  if (!monthValue) return "Selected Month";
  const [year, month] = monthValue.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function getAvailableMonths(records) {
  const currentMonth = getMonthValue();
  const months = new Set([currentMonth]);

  records.forEach(record => {
    const month = getRecordMonth(record);
    if (month) months.add(month);
  });

  return Array.from(months).sort((a, b) => b.localeCompare(a));
}

function StudentAttendance() {
  const [attendance, setAttendance] = useState(null);
  const [message, setMessage] = useState("");
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getMonthValue());

  const studentId = readAuthUser()?.id || null;

  useEffect(() => {
    fetchTodayAttendance();
    fetchAttendanceHistory();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const res = await API.get(`/attendance/${studentId}/${today}`);
      if (res.data) {
        setTodayStatus(res.data.status);
        setAttendance(res.data);
      } else {
        setTodayStatus(null);
      }
    } catch (error) {
      console.log("No attendance record yet");
      setTodayStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const res = await API.get(`/attendance`, {
        params: { studentId }
      });
      setAttendanceHistory(res.data || []);
    } catch (error) {
      console.log("Could not fetch history");
    }
  };

  const monthlyAttendance = attendanceHistory.filter(
    record => getRecordMonth(record) === selectedMonth
  );
  const availableMonths = getAvailableMonths(attendanceHistory);

  const getMonthlyCount = (status) => {
    return monthlyAttendance.filter(a => a.status === status).length;
  };

  const markAttendance = async (status) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (todayStatus) {
        // Update existing
        await API.put(`/attendance/${attendance.id}`, {
          studentId,
          date: today,
          status: status,
          mealType: "Breakfast & Lunch"
        });
        setMessage("✓ Attendance updated successfully!");
      } else {
        // Create new
        await API.post("/attendance", {
          studentId,
          date: today,
          status: status,
          mealType: "Breakfast & Lunch"
        });
        setMessage("✓ Attendance marked successfully!");
      }

      setTodayStatus(status);
      setTimeout(() => setMessage(""), 3000);
      fetchAttendanceHistory();
    } catch (error) {
      setMessage("✗ Error marking attendance");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const getAttendancePercentage = () => {
    if (monthlyAttendance.length === 0) return 0;
    const presentCount = monthlyAttendance.filter(a => a.status === "Present").length;
    return Math.round((presentCount / monthlyAttendance.length) * 100);
  };

  return (
    <div className="dashboard">
      <UnifiedNavbar />
      <div className="main-content">
        <h1>My Attendance</h1>

        {message && <div className={`message ${message.includes("✓") ? "success" : "error"}`}>{message}</div>}

        <div className="attendance-container">
          {/* Today's Mark */}
          <div className="attendance-card">
            <h2>Mark Today's Attendance</h2>
            <div className="today-status">
              {loading ? (
                <p>Loading...</p>
              ) : todayStatus ? (
                <div className={`status-badge ${todayStatus.toLowerCase()}`}>
                  {todayStatus}
                </div>
              ) : (
                <p className="not-marked">Not marked yet</p>
              )}
            </div>
            <div className="attendance-buttons">
              <button 
                className={`btn-present ${todayStatus === "Present" ? "active" : ""}`}
                onClick={() => markAttendance("Present")}
              >
                ✓ Present
              </button>
              <button 
                className={`btn-absent ${todayStatus === "Absent" ? "active" : ""}`}
                onClick={() => markAttendance("Absent")}
              >
                ✗ Absent
              </button>
              <button 
                className={`btn-leave ${todayStatus === "Leave" ? "active" : ""}`}
                onClick={() => markAttendance("Leave")}
              >
                📋 Leave
              </button>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="attendance-summary">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:"var(--space-4)", marginBottom:"var(--space-4)", flexWrap:"wrap" }}>
              <div>
                <h2 style={{ marginBottom:"4px" }}>Monthly Summary</h2>
                <div style={{ fontSize:"var(--text-sm)", color:"var(--color-text-tertiary)", fontWeight:"var(--font-medium)" }}>
                  {formatMonth(selectedMonth)}
                </div>
              </div>
              <label style={{ display:"flex", flexDirection:"column", gap:"var(--space-1)", minWidth:"190px" }}>
                <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)", fontWeight:"var(--font-bold)", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  View Month
                </span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    padding:"var(--space-3) var(--space-4)",
                    border:"1px solid var(--color-border)",
                    borderRadius:"var(--radius-md)",
                    background:"var(--color-neutral-50)",
                    color:"var(--color-text-primary)",
                    fontWeight:"var(--font-semibold)",
                    cursor:"pointer",
                  }}
                  aria-label="View attendance month wise"
                >
                  {availableMonths.map(month => (
                    <option key={month} value={month}>
                      {formatMonth(month)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="summary-stats">
              <div className="stat-box">
                <div className="stat-number">{getMonthlyCount("Present")}</div>
                <div className="stat-label">Present</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">{getMonthlyCount("Absent")}</div>
                <div className="stat-label">Absent</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">{getMonthlyCount("Leave")}</div>
                <div className="stat-label">Leave</div>
              </div>
              <div className="stat-box percentage">
                <div className="stat-number">{getAttendancePercentage()}%</div>
                <div className="stat-label">Percentage</div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance History */}
        <div className="attendance-history">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:"var(--space-4)", marginBottom:"var(--space-4)", flexWrap:"wrap" }}>
            <div>
              <h2 style={{ marginBottom:"4px" }}>Attendance History</h2>
              <div style={{ fontSize:"var(--text-sm)", color:"var(--color-text-tertiary)" }}>
                Showing {formatMonth(selectedMonth)} records
              </div>
            </div>
            <div style={{ fontSize:"var(--text-sm)", color:"var(--color-text-secondary)", fontWeight:"var(--font-semibold)" }}>
              Total: {monthlyAttendance.length}
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Meal Type</th>
              </tr>
            </thead>
            <tbody>
              {monthlyAttendance.length === 0 ? (
                <tr>
                  <td colSpan="3" className="no-data">No attendance records for {formatMonth(selectedMonth)}</td>
                </tr>
              ) : (
                monthlyAttendance.map((record, idx) => (
                  <tr key={idx}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${record.status.toLowerCase()}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>{record.mealType || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StudentAttendance;
