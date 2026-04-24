import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import UnifiedNavbar from "../components/UnifiedNavbar";

const AVATAR_COLORS = ["blue", "green", "amber", "rose", "purple", "orange", "cyan"];

const COURSES = [
  "BCA", "MCA", "B.Tech", "M.Tech", "BBA",
  "MBA", "B.Sc", "M.Sc", "B.Com", "B.Pharmacy", "Other"
];

const EMPTY_FORM = { name:"", email:"", course:"", password:"Student@123" };

function getInitials(name = "") {
  return name.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "ST";
}
function getColor(id) {
  return AVATAR_COLORS[Number(id) % AVATAR_COLORS.length];
}

function StudentList() {
  const [students,   setStudents]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [sortAsc,    setSortAsc]    = useState(true);
  const [message,    setMessage]    = useState({ text:"", type:"" });
  const [showForm,   setShowForm]   = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text:"", type:"" }), 3500);
  };

  // Fetch students — reads from /api/student which filters Users by Role=Student
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/student");
      const list = Array.isArray(res.data) ? res.data : [];
      setStudents(list);
    } catch {
      showMsg("Failed to load students.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  const openEdit = (s) => {
    setEditId(s.id);
    setForm({ name:s.name||"", email:s.email||"", course:s.course||"", password:"" });
    setShowForm(true);
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  const closeForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.name.trim())   { showMsg("Name is required.", "error");   return; }
    if (!form.email.trim())  { showMsg("Email is required.", "error");  return; }
    if (!form.course)        { showMsg("Please select a course.", "error"); return; }

    setSaving(true);
    try {
      if (editId) {
        // Update student in Users table
        await API.put(`/student/${editId}`, {
          name:   form.name,
          email:  form.email,
          course: form.course,
        });
        showMsg("Student updated successfully.");
      } else {
        // Create student — also creates login account in Users table
        await API.post("/student", {
          name:     form.name,
          email:    form.email,
          course:   form.course,
          password: form.password || "Student@123",
        });
        showMsg(`Student added. They can login with email "${form.email}" and password "${form.password || "Student@123"}".`);
      }
      closeForm();
      fetchStudents();
    } catch (err) {
      showMsg(err?.response?.data?.message || "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student? Their login account will also be removed.")) return;
    try {
      await API.delete(`/student/${id}`);
      showMsg("Student deleted.");
      fetchStudents();
    } catch {
      showMsg("Delete failed.", "error");
    }
  };

  // Unique courses for filter
  const courseOptions = ["all", ...new Set(students.map(s => s.course).filter(Boolean))];

  const filtered = students
    .filter(s => {
      const q = search.toLowerCase();
      const matchSearch = (s.name||"").toLowerCase().includes(q) ||
                          (s.email||"").toLowerCase().includes(q) ||
                          (s.course||"").toLowerCase().includes(q);
      const matchCourse = filterCourse === "all" || s.course === filterCourse;
      return matchSearch && matchCourse;
    })
    .sort((a, b) => {
      const ka = (a.name||"").toLowerCase();
      const kb = (b.name||"").toLowerCase();
      return sortAsc ? ka.localeCompare(kb) : kb.localeCompare(ka);
    });

  return (
    <div className="dashboard">
      <UnifiedNavbar />
      <div className="main-content">

        {/* Message */}
        {message.text && (
          <div className={`message ${message.type}`} style={{ marginBottom:"var(--space-5)", animation:"fadeIn 0.2s ease" }}>
            {message.text}
          </div>
        )}

        {/* ── Add / Edit Form ── */}
        {showForm && (
          <div style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"var(--space-7)", marginBottom:"var(--space-8)", boxShadow:"var(--shadow-md)", animation:"slideInUp 0.3s ease", position:"relative" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:"4px", background:"var(--color-brand-gradient)", borderRadius:"var(--radius-xl) var(--radius-xl) 0 0" }} />

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"var(--space-6)" }}>
              <h3 style={{ fontSize:"var(--text-xl)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)", letterSpacing:"-0.02em" }}>
                {editId ? "Edit Student" : "Add New Student"}
              </h3>
              <button onClick={closeForm} style={{ background:"var(--color-neutral-100)", border:"none", borderRadius:"var(--radius-full)", width:"32px", height:"32px", cursor:"pointer", color:"var(--color-text-secondary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem" }}>✕</button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-4)" }}>

              {/* Name */}
              <div>
                <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Full Name *</label>
                <input type="text" placeholder="Student full name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                  style={{ width:"100%", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-md)", border:"1.5px solid var(--color-border)", background:"var(--color-neutral-50)", color:"var(--color-text-primary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box" }} />
              </div>

              {/* Email */}
              <div>
                <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Email Address *</label>
                <input type="email" placeholder="student@email.com" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}
                  style={{ width:"100%", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-md)", border:"1.5px solid var(--color-border)", background:"var(--color-neutral-50)", color:"var(--color-text-primary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box" }} />
              </div>

              {/* Course */}
              <div>
                <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Course *</label>
                <select value={form.course} onChange={e => setForm(f=>({...f,course:e.target.value}))}
                  style={{ width:"100%", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-md)", border:`1.5px solid ${form.course?"var(--color-brand-primary)":"var(--color-border)"}`, background:"var(--color-neutral-50)", color:form.course?"var(--color-text-primary)":"var(--color-text-tertiary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box" }}
                >
                  <option value="" disabled>Select course</option>
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Password — only for new student */}
              {!editId && (
                <div>
                  <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Login Password</label>
                  <input type="text" placeholder="Default: Student@123" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))}
                    style={{ width:"100%", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-md)", border:"1.5px solid var(--color-border)", background:"var(--color-neutral-50)", color:"var(--color-text-primary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box" }} />
                </div>
              )}
            </div>

            {/* Info banner */}
            {!editId && (
              <div style={{ marginTop:"var(--space-4)", padding:"var(--space-3) var(--space-4)", background:"#F5F3FF", borderRadius:"var(--radius-md)", border:"1px solid #DDD6FE", display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--color-brand-primary)" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="7"/><path d="M8 5v4M8 11v1"/></svg>
                <span style={{ fontSize:"var(--text-xs)", color:"var(--color-brand-primary)", fontWeight:"var(--font-medium)" }}>
                  A login account is automatically created. The student can sign in using their email and the password above.
                </span>
              </div>
            )}

            <div style={{ display:"flex", gap:"var(--space-3)", marginTop:"var(--space-6)" }}>
              <button onClick={handleSave} disabled={saving} className="auth-btn" style={{ flex:1, opacity:saving?0.75:1 }}>
                {saving ? "Saving…" : editId ? "Save Changes" : "Add Student"}
              </button>
              <button onClick={closeForm} disabled={saving} style={{ padding:"var(--space-3) var(--space-6)", borderRadius:"var(--radius-lg)", border:"1.5px solid var(--color-border)", background:"var(--color-surface)", color:"var(--color-text-secondary)", fontSize:"var(--text-sm)", fontWeight:"var(--font-semibold)", cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="grid-toolbar">
          <h2 className="grid-toolbar-title">
            Students <span className="grid-count-badge">{filtered.length}</span>
          </h2>
          <div className="grid-search-wrap">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l3.5 3.5" strokeLinecap="round"/></svg>
            <input className="grid-search" type="text" placeholder="Search by name, email, course…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="grid-filter-tabs">
            {courseOptions.slice(0, 5).map(c => (
              <button key={c} className={`grid-filter-btn ${filterCourse===c?"active":""}`} onClick={() => setFilterCourse(c)}>
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
          <button className="grid-sort-btn" onClick={() => setSortAsc(!sortAsc)}>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M1 3h10M3 6h6M5 9h2"/></svg>
            {sortAsc ? "A–Z" : "Z–A"}
          </button>
          <button className="grid-add-btn" onClick={openAdd}>+ Add Student</button>
        </div>

        {/* ── Student Grid ── */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"var(--space-16)", color:"var(--color-text-tertiary)", fontSize:"var(--text-sm)" }}>Loading students…</div>
        ) : filtered.length === 0 ? (
          <div className="person-grid">
            <div className="person-grid-empty">
              {search || filterCourse !== "all" ? "No students match your filter." : "No students yet. Click \"+ Add Student\" to add one."}
            </div>
          </div>
        ) : (
          <div className="person-grid">
            {filtered.map(s => {
              const color = getColor(s.id);
              return (
                <div className="person-card" key={s.id}>
                  <div className={`person-card-bar bar-${color}`} />
                  <div className={`person-avatar av-${color}`}>{getInitials(s.name)}</div>
                  <div className="person-card-name" title={s.name}>{s.name}</div>
                  <div className="person-card-role">ID: {s.id}</div>

                  <div className="person-card-meta">
                    <div className="person-meta-row">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="3" width="12" height="9" rx="1.5"/><path d="M1 6l6 4 6-4" strokeLinecap="round"/></svg>
                      {s.email}
                    </div>
                    <div className="person-meta-row">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M7 2L13 5l-6 3L1 5l6-3z" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 5v4M13 5v4M4 8.5V11l3 1.5L10 11V8.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {s.course || "—"}
                    </div>
                  </div>

                  <div className="person-card-footer">
                    <span className="person-status-pill sp-present">Student</span>
                    <div className="person-card-actions">
                      <button className="person-icon-btn edit-icon" title="Edit student" onClick={() => openEdit(s)}>
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z"/></svg>
                      </button>
                      <button className="person-icon-btn delete-icon" title="Delete student" onClick={() => handleDelete(s.id)}>
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4h10M5 4V2.5h4V4M6 7v4M8 7v4"/></svg>
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