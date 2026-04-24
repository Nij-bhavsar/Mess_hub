import { useEffect, useState } from "react";
import API from "../services/api";
import UnifiedNavbar from "../components/UnifiedNavbar";
import { readAuthUser } from "../utils/authStorage";

function StudentAttendance() {
  const [attendance, setAttendance] = useState(null);
  const [message, setMessage] = useState("");
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

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
    if (attendanceHistory.length === 0) return 0;
    const presentCount = attendanceHistory.filter(a => a.status === "Present").length;
    return Math.round((presentCount / attendanceHistory.length) * 100);
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
            <h2>Monthly Summary</h2>
            <div className="summary-stats">
              <div className="stat-box">
                <div className="stat-number">{attendanceHistory.filter(a => a.status === "Present").length}</div>
                <div className="stat-label">Present</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">{attendanceHistory.filter(a => a.status === "Absent").length}</div>
                <div className="stat-label">Absent</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">{attendanceHistory.filter(a => a.status === "Leave").length}</div>
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
          <h2>Attendance History</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Meal Type</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.length === 0 ? (
                <tr>
                  <td colSpan="3" className="no-data">No attendance records</td>
                </tr>
              ) : (
                attendanceHistory.map((record, idx) => (
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
