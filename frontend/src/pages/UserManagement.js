import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import UnifiedNavbar from "../components/UnifiedNavbar";

const AVATAR_COLORS = ["blue", "green", "amber", "rose", "purple", "orange", "cyan"];

const ROLE_STYLES = {
  admin:   { pill: "sp-absent",  label: "Admin"   },
  staff:   { pill: "sp-leave",   label: "Staff"   },
  student: { pill: "sp-present", label: "Student" },
};

const COURSES = [
  "BCA", "MCA", "B.Tech", "M.Tech", "BBA",
  "MBA", "B.Sc", "M.Sc", "B.Com", "B.Pharmacy", "Other"
];

const EMPTY_FORM = { name:"", email:"", password:"", role:"Student", course:"" };

function getInitials(name = "", email = "") {
  const str = name || email;
  return str.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U";
}

function getColor(id) {
  return AVATAR_COLORS[Number(id) % AVATAR_COLORS.length];
}

function UserManagement() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filterRole, setFilterRole] = useState("all");
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

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await API.get("/user");
      // Backend returns { users:[...], total:N } OR plain array
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.users)
          ? res.data.users
          : [];
      setUsers(list);
    } catch {
      showMsg("Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  const openEdit = (user) => {
    setEditId(user.id);
    setForm({ name: user.name || user.username || "", email: user.email || "", password:"", role: user.role || "Student", course: user.course || "" });
    setShowForm(true);
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  const closeForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.email.trim())                          { showMsg("Email is required.", "error");               return; }
    if (!editId && !form.password.trim())            { showMsg("Password is required.", "error");            return; }
    if (form.role === "Student" && !form.course)     { showMsg("Please select a course.", "error");          return; }
    setSaving(true);
    try {
      if (editId) {
        await API.put(`/user/${editId}`, {
          name:     form.name || form.email,
          email:    form.email,
          role:     form.role,
          ...(form.role === "Student" ? { course: form.course } : {}),
          ...(form.password ? { password: form.password } : {}),
        });
        showMsg("User updated successfully.");
      } else {
        await API.post("/user", {
          username: form.name || form.email,
          email:    form.email,
          phone:    "",
          role:     form.role,
          password: form.password,
          course:   form.role === "Student" ? form.course : "",
        });
        showMsg(`${form.role} account created — they can now login with the provided credentials.`);
      }
      closeForm();
      fetchUsers();
    } catch (err) {
      showMsg(err?.response?.data?.message || "Save failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try {
      await API.delete(`/user/${id}`);
      showMsg("User deleted.");
      fetchUsers();
    } catch {
      showMsg("Delete failed.", "error");
    }
  };

  const filtered = users
    .filter(u => {
      const q = search.toLowerCase();
      const match = (u.email||"").toLowerCase().includes(q) ||
                    (u.name||"").toLowerCase().includes(q)  ||
                    (u.username||"").toLowerCase().includes(q) ||
                    (u.role||"").toLowerCase().includes(q);
      const role  = filterRole === "all" || (u.role||"").toLowerCase() === filterRole;
      return match && role;
    })
    .sort((a, b) => {
      const ka = (a.name||a.username||a.email||"").toLowerCase();
      const kb = (b.name||b.username||b.email||"").toLowerCase();
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
                {editId ? "Edit User" : "Add New User"}
              </h3>
              <button onClick={closeForm} style={{ background:"var(--color-neutral-100)", border:"none", borderRadius:"var(--radius-full)", width:"32px", height:"32px", cursor:"pointer", color:"var(--color-text-secondary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem" }}>✕</button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-4)" }}>

              {/* Name */}
              <div>
                <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Full Name</label>
                <input type="text" placeholder="Full name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} style={{ width:"100%", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-md)", border:"1.5px solid var(--color-border)", background:"var(--color-neutral-50)", color:"var(--color-text-primary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box" }} />
              </div>

              {/* Email */}
              <div>
                <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Email Address *</label>
                <input type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} style={{ width:"100%", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-md)", border:"1.5px solid var(--color-border)", background:"var(--color-neutral-50)", color:"var(--color-text-primary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box" }} />
              </div>

              {/* Password */}
              <div>
                <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>
                  Password {editId ? "(blank = keep current)" : "*"}
                </label>
                <input type="password" placeholder={editId ? "Leave blank to keep" : "Set a password"} value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} style={{ width:"100%", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-md)", border:"1.5px solid var(--color-border)", background:"var(--color-neutral-50)", color:"var(--color-text-primary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box" }} />
              </div>

              {/* Role */}
              <div>
                <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Role *</label>
                <div style={{ display:"flex", gap:"var(--space-2)" }}>
                  {["Student","Staff","Admin"].map(r => (
                    <button key={r} type="button"
                      onClick={() => setForm(f=>({...f, role:r, course: r!=="Student"?"":f.course}))}
                      style={{ flex:1, padding:"var(--space-3) var(--space-1)", borderRadius:"var(--radius-md)", border: form.role===r ? "2px solid var(--color-brand-primary)" : "1.5px solid var(--color-border)", background: form.role===r ? "#F5F3FF" : "var(--color-neutral-50)", color: form.role===r ? "var(--color-brand-primary)" : "var(--color-text-secondary)", fontWeight: form.role===r ? "var(--font-bold)" : "var(--font-medium)", fontSize:"var(--text-xs)", cursor:"pointer", transition:"all var(--transition-fast)" }}
                    >
                      {r==="Student"?"🎓":r==="Staff"?"👨‍🍳":"🛡️"} {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Course — Student only */}
              {form.role === "Student" && (
                <div style={{ gridColumn:"1 / -1" }}>
                  <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Course *</label>
                  <select value={form.course} onChange={e => setForm(f=>({...f,course:e.target.value}))}
                    style={{ width:"100%", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-md)", border:`1.5px solid ${form.course?"var(--color-brand-primary)":"var(--color-border)"}`, background:"var(--color-neutral-50)", color: form.course?"var(--color-text-primary)":"var(--color-text-tertiary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", outline:"none" }}
                  >
                    <option value="" disabled>Select course</option>
                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Info for new student */}
            {!editId && form.role === "Student" && (
              <div style={{ marginTop:"var(--space-4)", padding:"var(--space-3) var(--space-4)", background:"#F5F3FF", borderRadius:"var(--radius-md)", border:"1px solid #DDD6FE", display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--color-brand-primary)" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="7"/><path d="M8 5v4M8 11v1"/></svg>
                <span style={{ fontSize:"var(--text-xs)", color:"var(--color-brand-primary)", fontWeight:"var(--font-medium)" }}>
                  A student account will be automatically created. They can login with this email and password.
                </span>
              </div>
            )}

            <div style={{ display:"flex", gap:"var(--space-3)", marginTop:"var(--space-6)" }}>
              <button onClick={handleSave} disabled={saving} className="auth-btn" style={{ flex:1, opacity:saving?0.75:1 }}>
                {saving ? "Saving…" : editId ? "Save Changes" : `Create ${form.role} Account`}
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
            Users <span className="grid-count-badge">{filtered.length}</span>
          </h2>
          <div className="grid-search-wrap">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l3.5 3.5" strokeLinecap="round"/></svg>
            <input className="grid-search" type="text" placeholder="Search by name, email, role…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="grid-filter-tabs">
            {["all","admin","staff","student"].map(f => (
              <button key={f} className={`grid-filter-btn ${filterRole===f?"active":""}`} onClick={() => setFilterRole(f)}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
          <button className="grid-sort-btn" onClick={() => setSortAsc(!sortAsc)}>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M1 3h10M3 6h6M5 9h2"/></svg>
            {sortAsc ? "A–Z" : "Z–A"}
          </button>
          <button className="grid-add-btn" onClick={openAdd}>+ Add User</button>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"var(--space-16)", color:"var(--color-text-tertiary)", fontSize:"var(--text-sm)" }}>Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="person-grid"><div className="person-grid-empty">{search||filterRole!=="all" ? "No users match your filter." : "No users yet. Click \"+ Add User\" to create one."}</div></div>
        ) : (
          <div className="person-grid">
            {filtered.map(u => {
              const color   = getColor(u.id);
              const roleKey = (u.role||"").toLowerCase();
              const rStyle  = ROLE_STYLES[roleKey] || { pill:"sp-unmarked", label:u.role };
              const display = u.name || u.username || u.email || "Unknown";
              return (
                <div className="person-card" key={u.id}>
                  <div className={`person-card-bar bar-${color}`} />
                  <div className={`person-avatar av-${color}`}>{getInitials(display, u.email)}</div>
                  <div className="person-card-name" title={display}>{display}</div>
                  <div className="person-card-role">{u.email}</div>
                  <div className="person-card-meta">
                    <div className="person-meta-row">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="7" cy="5" r="2.5"/><path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" strokeLinecap="round"/></svg>
                      {u.role || "—"}
                    </div>
                    {u.course && (
                      <div className="person-meta-row">
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M7 2L13 5l-6 3L1 5l6-3z" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 5v4M13 5v4M4 8.5V11l3 1.5L10 11V8.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        {u.course}
                      </div>
                    )}
                    <div className="person-meta-row">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="3" width="12" height="9" rx="1.5"/><path d="M1 6l6 4 6-4" strokeLinecap="round"/></svg>
                      {u.email}
                    </div>
                  </div>
                  <div className="person-card-footer">
                    <span className={`person-status-pill ${rStyle.pill}`}>{rStyle.label}</span>
                    <div className="person-card-actions">
                      <button className="person-icon-btn edit-icon" title="Edit" onClick={() => openEdit(u)}>
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z"/></svg>
                      </button>
                      <button className="person-icon-btn delete-icon" title="Delete" onClick={() => handleDelete(u.id)}>
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

export default UserManagement;
