import { useEffect, useState } from "react";
import API from "../services/api";
import UnifiedNavbar from "../components/UnifiedNavbar";

const AVATAR_COLORS = ["blue", "green", "amber", "rose", "purple", "orange", "cyan"];

const ROLE_STYLES = {
  admin:   { pill: "sp-absent",   label: "Admin" },
  staff:   { pill: "sp-leave",    label: "Staff" },
  student: { pill: "sp-present",  label: "Student" },
};

function getInitials(email = "") {
  return email.slice(0, 2).toUpperCase();
}

function getColor(id) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [editId, setEditId] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Student");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [sortAsc, setSortAsc] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/user");
      setUsers(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const editUser = (user) => {
    setEditId(user.id);
    setEmail(user.email);
    setPassword(user.password);
    setRole(user.role);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateUser = async () => {
    try {
      await API.put(`/user/${editId}`, { email, password, role });
      setEditId(null); setEmail(""); setPassword(""); setRole("Student"); setShowForm(false);
      showMsg("User updated successfully.");
      fetchUsers();
    } catch (error) {
      showMsg("Update failed.", "error");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await API.delete(`/user/${id}`);
      showMsg("User deleted.");
      fetchUsers();
    } catch (error) {
      showMsg("Delete failed.", "error");
    }
  };

  const cancelEdit = () => {
    setEditId(null); setEmail(""); setPassword(""); setRole("Student"); setShowForm(false);
  };

  const filtered = users
    .filter((u) => {
      const matchSearch =
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.role?.toLowerCase().includes(search.toLowerCase());
      const matchRole =
        filterRole === "all" || u.role?.toLowerCase() === filterRole;
      return matchSearch && matchRole;
    })
    .sort((a, b) =>
      sortAsc ? a.email?.localeCompare(b.email) : b.email?.localeCompare(a.email)
    );

  return (
    <div className="dashboard">
      <UnifiedNavbar />

      <div className="main-content">

        {/* Message */}
        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        {/* Edit Form */}
        {showForm && editId && (
          <div className="student-form" style={{ marginBottom: "var(--space-8)", animation: "slideInUp 0.3s ease" }}>
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="text"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                flex: 1,
                minWidth: "160px",
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--color-border)",
                background: "var(--color-neutral-50)",
                fontSize: "var(--text-sm)",
              }}
            >
              <option>Admin</option>
              <option>Staff</option>
              <option>Student</option>
            </select>
            <button onClick={updateUser}>Save Changes</button>
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
            Users
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
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid-filter-tabs">
            {["all", "admin", "staff", "student"].map((f) => (
              <button
                key={f}
                className={`grid-filter-btn ${filterRole === f ? "active" : ""}`}
                onClick={() => setFilterRole(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <button className="grid-sort-btn" onClick={() => setSortAsc(!sortAsc)}>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <path d="M1 3h10M3 6h6M5 9h2" />
            </svg>
            {sortAsc ? "A–Z" : "Z–A"}
          </button>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="person-grid">
            <div className="person-grid-empty">No users found.</div>
          </div>
        ) : (
          <div className="person-grid">
            {filtered.map((u) => {
              const color = getColor(u.id);
              const roleKey = u.role?.toLowerCase();
              const roleStyle = ROLE_STYLES[roleKey] || { pill: "sp-unmarked", label: u.role };

              return (
                <div className="person-card" key={u.id}>
                  <div className={`person-card-bar bar-${color}`} />
                  <div className={`person-avatar av-${color}`}>
                    {getInitials(u.email)}
                  </div>
                  <div className="person-card-name">{u.email}</div>
                  <div className="person-card-role">ID: {u.id}</div>

                  <div className="person-card-meta">
                    <div className="person-meta-row">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <circle cx="7" cy="5" r="2.5" />
                        <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" strokeLinecap="round" />
                      </svg>
                      Role: {u.role}
                    </div>
                    <div className="person-meta-row">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <rect x="2" y="4" width="10" height="7" rx="1" />
                        <path d="M4 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
                      </svg>
                      ••••••••
                    </div>
                  </div>

                  <div className="person-card-footer">
                    <span className={`person-status-pill ${roleStyle.pill}`}>
                      {roleStyle.label}
                    </span>
                    <div className="person-card-actions">
                      <button
                        className="person-icon-btn edit-icon"
                        title="Edit"
                        onClick={() => editUser(u)}
                      >
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
                          <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" />
                        </svg>
                      </button>
                      <button
                        className="person-icon-btn delete-icon"
                        title="Delete"
                        onClick={() => deleteUser(u.id)}
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

export default UserManagement;