// Fallback service for attendance using localStorage
// This allows the app to work offline and stores data locally

class AttendanceService {
  constructor() {
    this.storageKey = "attendanceRecords";
  }

  // Get attendance records
  async getAttendance(params = {}) {
    try {
      // Try API first
      const response = await fetch(
        `http://localhost:5155/api/attendance?${new URLSearchParams(params)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        }
      );
      
      if (response.ok) {
        return await response.json();
      }
      throw new Error("API not available");
    } catch (error) {
      console.log("Using local storage for attendance");
      // Fallback to localStorage
      return this.getLocalAttendance(params);
    }
  }

  // Get specific attendance record
  async getAttendanceRecord(studentId, date) {
    try {
      const response = await fetch(
        `http://localhost:5155/api/attendance/${studentId}/${date}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        }
      );
      
      if (response.ok) {
        return await response.json();
      }
      throw new Error("API not available");
    } catch (error) {
      console.log("Using local storage for attendance record");
      return this.getLocalAttendanceRecord(studentId, date);
    }
  }

  // Create attendance record
  async createAttendance(data) {
    try {
      const response = await fetch("http://localhost:5155/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        return await response.json();
      }
      throw new Error("API error: " + response.status);
    } catch (error) {
      console.log("Saving to local storage instead");
      return this.saveLocalAttendance(data);
    }
  }

  // Update attendance record
  async updateAttendance(id, data) {
    try {
      const response = await fetch(`http://localhost:5155/api/attendance/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        return await response.json();
      }
      throw new Error("API error: " + response.status);
    } catch (error) {
      console.log("Updating local storage instead");
      return this.updateLocalAttendance(id, data);
    }
  }

  // Local storage methods
  getLocalAttendance(params = {}) {
    const records = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
    
    if (params.studentId) {
      return records.filter(r => r.studentId === params.studentId);
    }
    if (params.date) {
      return records.filter(r => r.date === params.date);
    }
    
    return records;
  }

  getLocalAttendanceRecord(studentId, date) {
    const records = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
    return records.find(r => r.studentId === studentId && r.date === date) || null;
  }

  saveLocalAttendance(data) {
    const records = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
    const newRecord = {
      id: "local_" + Date.now(),
      ...data
    };
    records.push(newRecord);
    localStorage.setItem(this.storageKey, JSON.stringify(records));
    return newRecord;
  }

  updateLocalAttendance(id, data) {
    const records = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
    const index = records.findIndex(r => r.id === id);
    
    if (index !== -1) {
      records[index] = { ...records[index], ...data };
      localStorage.setItem(this.storageKey, JSON.stringify(records));
      return records[index];
    }
    
    return null;
  }
}

const attendanceServiceInstance = new AttendanceService();
export default attendanceServiceInstance;
