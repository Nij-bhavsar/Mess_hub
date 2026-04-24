const BASE = "http://localhost:5155/api/attendance";

class AttendanceService {
  constructor() {
    this.storageKey = "attendanceRecords";
  }

  // GET /api/attendance?date=X&studentId=Y
  async getAttendance(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.date)      query.append("date",      params.date);
      if (params.studentId) query.append("studentId", String(params.studentId));

      const res = await fetch(`${BASE}?${query}`, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) return await res.json();
      throw new Error("API error " + res.status);
    } catch {
      return this.getLocalAttendance(params);
    }
  }

  // GET /api/attendance/{studentId}/{date}
  async getAttendanceRecord(studentId, date) {
    try {
      const res = await fetch(`${BASE}/${studentId}/${date}`, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) return await res.json();
      throw new Error("API error " + res.status);
    } catch {
      return this.getLocalAttendanceRecord(studentId, date);
    }
  }

  // POST /api/attendance
  async createAttendance(data) {
    try {
      const res = await fetch(BASE, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });

      if (res.ok) return await res.json();
      throw new Error("API error " + res.status);
    } catch {
      return this.saveLocalAttendance(data);
    }
  }

  // PUT /api/attendance/{id}
  async updateAttendance(id, data) {
    try {
      const res = await fetch(`${BASE}/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });

      if (res.ok) return await res.json();
      throw new Error("API error " + res.status);
    } catch {
      return this.updateLocalAttendance(id, data);
    }
  }

  // ── localStorage fallback ──

  getLocalAttendance(params = {}) {
    const records = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
    return records.filter(r => {
      const matchStudent = params.studentId
        ? String(r.studentId) === String(params.studentId)
        : true;
      const matchDate = params.date
        ? r.date === params.date
        : true;
      return matchStudent && matchDate;
    });
  }

  getLocalAttendanceRecord(studentId, date) {
    const records = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
    return records.find(
      r => String(r.studentId) === String(studentId) && r.date === date
    ) || null;
  }

  saveLocalAttendance(data) {
    const records  = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
    const newRecord = { id: "local_" + Date.now(), ...data };
    records.push(newRecord);
    localStorage.setItem(this.storageKey, JSON.stringify(records));
    return newRecord;
  }

  updateLocalAttendance(id, data) {
    const records = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
    const index   = records.findIndex(r => String(r.id) === String(id));
    if (index !== -1) {
      records[index] = { ...records[index], ...data };
      localStorage.setItem(this.storageKey, JSON.stringify(records));
      return records[index];
    }
    return null;
  }
}

const attendanceService = new AttendanceService();
export default attendanceService;