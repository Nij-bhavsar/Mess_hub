import { useEffect, useState } from "react";
import API from "../services/api";
import UnifiedNavbar from "../components/UnifiedNavbar";

const DAY_ORDER = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const DAY_COLORS = {
monday:    "blue",
tuesday:   "green",
wednesday: "amber",
thursday:  "purple",
friday:    "orange",
saturday:  "cyan",
sunday:    "rose",
};

const DAY_EMOJI = {
monday:    "M",
tuesday:   "T",
wednesday: "W",
thursday:  "Th",
friday:    "F",
saturday:  "Sa",
sunday:    "Su",
};

function getColor(day = "") {
return DAY_COLORS[day.toLowerCase()] || "blue";
}

function getShort(day = "") {
return DAY_EMOJI[day.toLowerCase()] || day.slice(0, 2).toUpperCase();
}

function ManageMenu() {
const [menus, setMenus] = useState([]);
const [day, setDay] = useState("");
const [breakfast, setBreakfast] = useState("");
const [lunch, setLunch] = useState("");
const [dinner, setDinner] = useState("");
const [editId, setEditId] = useState(null);
const [search, setSearch] = useState("");
const [message, setMessage] = useState({ text: "", type: "" });
const [showForm, setShowForm] = useState(false);

useEffect(() => {
fetchMenus();
}, []);

const fetchMenus = async () => {
try {
const res = await API.get("/menu");
setMenus(res.data);
} catch (error) {
console.log(error);
}
};

const showMsg = (text, type = "success") => {
setMessage({ text, type });
setTimeout(() => setMessage({ text: "", type: "" }), 3000);
};

const saveMenu = async () => {
if (!day.trim()) return;

try {
  if (editId !== null) {
    await API.put(`/menu/${editId}`, {
      id: editId, // ✅ FIX
      day,
      breakfast,
      lunch,
      dinner
    });
    showMsg("Menu updated successfully.");
  } else {
    await API.post("/menu", { day, breakfast, lunch, dinner });
    showMsg("Menu added successfully.");
  }

  setDay("");
  setBreakfast("");
  setLunch("");
  setDinner("");
  setEditId(null);
  setShowForm(false);

  fetchMenus();
} catch (error) {
  console.error(error);
  showMsg("Something went wrong.", "error");
}

};

const editMenu = (menu) => {
setEditId(menu.id);
setDay(menu.day);
setBreakfast(menu.breakfast);
setLunch(menu.lunch);
setDinner(menu.dinner);
setShowForm(true);
window.scrollTo({ top: 0, behavior: "smooth" });
};

const deleteMenu = async (id) => {
if (!window.confirm("Delete this menu?")) return;
try {
await API.delete(`/menu/${id}`);
showMsg("Menu deleted.");
fetchMenus();
} catch (error) {
showMsg("Delete failed.", "error");
}
};

const cancelEdit = () => {
setEditId(null);
setDay("");
setBreakfast("");
setLunch("");
setDinner("");
setShowForm(false);
};

const filtered = menus
.filter(
(m) =>
m.day?.toLowerCase().includes(search.toLowerCase()) ||
m.breakfast?.toLowerCase().includes(search.toLowerCase()) ||
m.lunch?.toLowerCase().includes(search.toLowerCase()) ||
m.dinner?.toLowerCase().includes(search.toLowerCase())
)
.sort((a, b) => {
const ai = DAY_ORDER.indexOf(a.day?.toLowerCase());
const bi = DAY_ORDER.indexOf(b.day?.toLowerCase());
return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
});

return ( <div className="dashboard"> <UnifiedNavbar />

  <div className="main-content">

    {message.text && (
      <div className={`message ${message.type}`}>{message.text}</div>
    )}

    {showForm && (
      <div className="menu-form" style={{ marginBottom: "var(--space-8)", animation: "slideInUp 0.3s ease" }}>
        <input
          placeholder="Day (e.g. Monday)"
          value={day}
          onChange={(e) => setDay(e.target.value)}
        />
        <input
          placeholder="Breakfast"
          value={breakfast}
          onChange={(e) => setBreakfast(e.target.value)}
        />
        <input
          placeholder="Lunch"
          value={lunch}
          onChange={(e) => setLunch(e.target.value)}
        />
        <input
          placeholder="Dinner"
          value={dinner}
          onChange={(e) => setDinner(e.target.value)}
        />
        <button onClick={saveMenu}>
          {editId !== null ? "Update Menu" : "Add Menu"}
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

    <div className="grid-toolbar">
      <h2 className="grid-toolbar-title">
        Weekly Menu
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
          placeholder="Search menus…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ✅ FIXED BUTTON */}
      <button
        className="grid-add-btn"
        onClick={() => {
          cancelEdit();
          setShowForm(true);
        }}
      >
        + Add Menu
      </button>
    </div>

    {filtered.length === 0 ? (
      <div className="person-grid">
        <div className="person-grid-empty">No menus found. Add one above.</div>
      </div>
    ) : (
      <div className="person-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {filtered.map((m) => {
          const color = getColor(m.day);
          const short = getShort(m.day);

          return (
            <div className="person-card" key={m.id}>
              <div className={`person-card-bar bar-${color}`} />

              <div className={`person-avatar av-${color}`} style={{ borderRadius: "var(--radius-md)", width: "48px", height: "48px", fontSize: "var(--text-base)" }}>
                {short}
              </div>

              <div className="person-card-name">{m.day}</div>
              <div className="person-card-role">3 meals scheduled</div>

              <div className="person-card-meta">
                <div className="person-meta-row">
                  <span style={{ minWidth: "62px" }}>Breakfast:</span>
                  <span>{m.breakfast || "—"}</span>
                </div>

                <div className="person-meta-row">
                  <span style={{ minWidth: "62px" }}>Lunch:</span>
                  <span>{m.lunch || "—"}</span>
                </div>

                <div className="person-meta-row">
                  <span style={{ minWidth: "62px" }}>Dinner:</span>
                  <span>{m.dinner || "—"}</span>
                </div>
              </div>

              <div className="person-card-footer">
                <span className={`person-status-pill sp-present`} style={{ visibility: "hidden" }}>
                  &nbsp;
                </span>
                <div className="person-card-actions">
                  <button
                    className="person-icon-btn edit-icon"
                    title="Edit"
                    onClick={() => editMenu(m)}
                  >
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
                      <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" />
                    </svg>
                  </button>
                  <button
                    className="person-icon-btn delete-icon"
                    title="Delete"
                    onClick={() => deleteMenu(m.id)}
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

export default ManageMenu;
