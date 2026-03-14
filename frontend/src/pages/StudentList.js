import { useEffect, useState } from "react";
import API from "../services/api";
import UnifiedNavbar from "../components/UnifiedNavbar";

const AVATAR_COLORS = ["blue", "green", "amber", "rose", "purple", "orange", "cyan"];

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getColor(id) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function StudentList() {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [course, setCourse] = useState("");
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await API.get("/student");
      setStudents(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const saveStudent = async () => {
    if (!name.trim()) return;
    try {
      if (editId) {
        await API.put(`/student/${editId}`, { name, email, course });
        showMsg("Student updated successfully.");
      } else {
        await API.post("/student", { name, email, course });
        showMsg("Student added successfully.");
      }
      setName(""); setEmail(""); setCourse(""); setEditId(null); setShowForm(false);
      fetchStudents();
    } catch (error) {
      showMsg("Something went wrong.", "error");
    }
  };

  const editStudent = (student) => {
    setEditId(student.id);
    setName(student.name);
    setEmail(student.email);
    setCourse(student.course);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteStudent = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await API.delete(`/student/${id}`);
      showMsg("Student deleted.");
      fetchStudents();
    } catch (error) {
      showMsg("Delete failed.", "error");
    }
  };

  const cancelEdit = () => {
    setEditId(null); setName(""); setEmail(""); setCourse(""); setShowForm(false);
  };

  const filtered = students
    .filter(
      (s) =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.course?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sortAsc ? a.name?.localeCompare(b.name) : b.name?.localeCompare(a.name)
    );

  return (
    <div className="dashboard">
      <UnifiedNavbar />

      <div className="main-content">

        {/* Message */}
        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        {/* Add / Edit Form */}
        {showForm && (
          <div className="student-form" style={{ marginBottom: "var(--space-8)", animation: "slideInUp 0.3s ease" }}>
            <input
              type="text"
              placeholder="Student Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="text"
              placeholder="Course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
            <button onClick={saveStudent}>
              {editId ? "Update Student" : "Add Student"}
            </button>
            <button
              onClick={cancelEdit}
              style={{
                background: "none",
                border: "1.5px solid var(--color-border)",
                color: "var(--color-text-secondary)",
                padding: "var(--space-3) var(--space-6)",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                fontWeight: "var(--font-semibold)",
                fontSize: "var(--text-sm)",
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="grid-toolbar">
          <h2 className="grid-toolbar-title">
            Students
            <span className="grid-count-badge">{filtered.length}</span>
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

          <button
            className="grid-sort-btn"
            onClick={() => setSortAsc(!sortAsc)}
          >
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <path d="M1 3h10M3 6h6M5 9h2" />
            </svg>
            {sortAsc ? "A–Z" : "Z–A"}
          </button>

          <button
            className="grid-add-btn"
            onClick={() => { setShowForm(true); setEditId(null); setName(""); setEmail(""); setCourse(""); }}
          >
            + Add Student
          </button>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="person-grid">
            <div className="person-grid-empty">No students found.</div>
          </div>
        ) : (
          <div className="person-grid">
            {filtered.map((s) => {
              const color = getColor(s.id);
              return (
                <div className="person-card" key={s.id}>
                  <div className={`person-card-bar bar-${color}`} />
                  <div className={`person-avatar av-${color}`}>
                    {getInitials(s.name)}
                  </div>
                  <div className="person-card-name">{s.name}</div>
                  <div className="person-card-role">{s.course || "No course"}</div>

                  <div className="person-card-meta">
                    <div className="person-meta-row">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <rect x="1" y="3" width="12" height="9" rx="1.5" />
                        <path d="M1 6h12M4.5 3V1.5M9.5 3V1.5" strokeLinecap="round" />
                      </svg>
                      ID: {s.id}
                    </div>
                    <div className="person-meta-row">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <rect x="1" y="2.5" width="12" height="9" rx="1.5" />
                        <path d="M1 5.5l6 3.5 6-3.5" />
                      </svg>
                      {s.email || "No email"}
                    </div>
                  </div>

                  <div className="person-card-footer">
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-tertiary)",
                        fontWeight: "var(--font-medium)",
                      }}
                    >
                      #{String(s.id).padStart(3, "0")}
                    </span>
                    <div className="person-card-actions">
                      <button
                        className="person-icon-btn edit-icon"
                        title="Edit"
                        onClick={() => editStudent(s)}
                      >
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
                          <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" />
                        </svg>
                      </button>
                      <button
                        className="person-icon-btn delete-icon"
                        title="Delete"
                        onClick={() => deleteStudent(s.id)}
                      >
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 4h10M5 4V2.5h4V4M6 7v4M8 7v4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentList;