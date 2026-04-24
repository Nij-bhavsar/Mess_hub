import { useState, useEffect, useCallback } from "react";
import UnifiedNavbar from "../components/UnifiedNavbar";
import { readAuthUser } from "../utils/authStorage";

const BASE = "http://localhost:5155/api/itemrequest";

const ITEM_CATEGORIES = ["Food Item", "Ingredient", "Utensil", "Beverage", "Other"];

const PRIORITY_CONFIG = {
  High:   { color:"#DC2626", bg:"#FEE2E2", bar:"#DC2626" },
  Medium: { color:"#D97706", bg:"#FEF3C7", bar:"#D97706" },
  Low:    { color:"#059669", bg:"#D1FAE5", bar:"#059669" },
};

const STATUS_CONFIG = {
  Pending:  { color:"#D97706", bg:"#FEF3C7" },
  Approved: { color:"#059669", bg:"#D1FAE5" },
  Rejected: { color:"#DC2626", bg:"#FEE2E2" },
};

const EMPTY_FORM = { itemName:"", category:"Food Item", priority:"Medium", note:"" };

function ItemRequest() {
  const authUser    = readAuthUser() || {};
  const userId      = authUser.id   || 0;
  const userName    = authUser.name || authUser.email || "User";
  const userRole    = authUser.role || "Student";
  const role        = userRole.toLowerCase();
  const isAdmin     = role === "admin";
  const canRequest  = role === "student" || role === "staff"; // both can request

  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [message,  setMessage]  = useState({ text:"", type:"" });
  const [filter,   setFilter]   = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [remarkDrafts, setRemarkDrafts] = useState({});

  const showMsg = (text, type="success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text:"", type:"" }), 3500);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const url = isAdmin ? BASE : `${BASE}?userId=${userId}`;
      const res = await fetch(url);
      if (res.ok) setItems(await res.json());
    } catch {
      // localStorage fallback
      try {
        const stored = JSON.parse(localStorage.getItem(`item_requests_${userId}`) || "[]");
        setItems(stored);
      } catch { setItems([]); }
    } finally { setLoading(false); }
  }, [userId, isAdmin]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAdd = async () => {
    if (!form.itemName.trim()) { showMsg("Please enter an item name.", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch(BASE, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId, userName, userRole, ...form }),
      });
      if (res.ok) {
        showMsg("Item request submitted successfully!");
        setForm(EMPTY_FORM);
        setShowForm(false);
        fetchItems();
      } else {
        const d = await res.json();
        showMsg(d.message || "Submission failed.", "error");
      }
    } catch {
      // localStorage fallback
      const newItem = { id:Date.now(), userId, userName, userRole, ...form, status:"Pending", createdAt:new Date().toISOString() };
      const stored = JSON.parse(localStorage.getItem(`item_requests_${userId}`) || "[]");
      stored.unshift(newItem);
      localStorage.setItem(`item_requests_${userId}`, JSON.stringify(stored));
      setItems(prev => [newItem, ...prev]);
      showMsg("Request submitted (offline mode).");
      setForm(EMPTY_FORM);
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Cancel this request?")) return;
    try {
      await fetch(`${BASE}/${id}`, { method:"DELETE" });
      showMsg("Request cancelled.");
      fetchItems();
    } catch {
      setItems(prev => prev.filter(i => i.id !== id));
      showMsg("Request cancelled.");
    }
  };

  const handleAction = async (id, status) => {
    setActingId(id);
    try {
      const res = await fetch(`${BASE}/${id}/action`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminRemark: remarkDrafts[id] || "",
        }),
      });

      if (res.ok) {
        showMsg(`Request ${status.toLowerCase()} successfully.`);
        setRemarkDrafts((prev) => ({ ...prev, [id]: "" }));
        fetchItems();
      } else {
        const data = await res.json();
        showMsg(data.message || `Could not ${status.toLowerCase()} request.`, "error");
      }
    } catch {
      showMsg(`Could not ${status.toLowerCase()} request.`, "error");
    } finally {
      setActingId(null);
    }
  };

  const filtered = filter === "all" ? items : items.filter(i => i.status === filter);
  const counts = {
    all:      items.length,
    Pending:  items.filter(i => i.status === "Pending").length,
    Approved: items.filter(i => i.status === "Approved").length,
    Rejected: items.filter(i => i.status === "Rejected").length,
  };

  return (
    <div className="dashboard">
      <UnifiedNavbar />
      <div className="main-content">

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"var(--space-4)", marginBottom:"var(--space-8)" }}>
          <div>
            <h1 style={{ fontSize:"var(--text-3xl)", fontFamily:"var(--font-display)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)", letterSpacing:"-0.02em", marginBottom:"var(--space-2)" }}>
              {isAdmin ? "Item Requests" : "Request Items"}
            </h1>
            <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-tertiary)", fontWeight:"var(--font-medium)" }}>
              {isAdmin ? "Review item requests from students and staff" : "Request items you'd like added to the mess"}
            </p>
          </div>
          {canRequest && (
            <button className="grid-add-btn" onClick={() => setShowForm(s => !s)}>
              {showForm ? "✕ Close" : "+ New Request"}
            </button>
          )}
        </div>

        {message.text && <div className={`message ${message.type}`} style={{ marginBottom:"var(--space-5)", animation:"fadeIn 0.2s ease" }}>{message.text}</div>}

        <div style={{ display:"grid", gridTemplateColumns: canRequest && showForm ? "1fr minmax(0,360px)" : "1fr", gap:"var(--space-6)", alignItems:"start" }}>

          {/* ── Left — List ── */}
          <div>
            <div className="grid-toolbar" style={{ marginBottom:"var(--space-5)" }}>
              <h2 className="grid-toolbar-title">
                Requests <span className="grid-count-badge">{filtered.length}</span>
              </h2>
              <div className="grid-filter-tabs">
                {["all","Pending","Approved","Rejected"].map(f => (
                  <button key={f} className={`grid-filter-btn ${filter===f?"active":""}`} onClick={() => setFilter(f)}>
                    {f === "all" ? "All" : f}{counts[f] > 0 ? ` (${counts[f]})` : ""}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign:"center", padding:"var(--space-16)", color:"var(--color-text-tertiary)", fontSize:"var(--text-sm)" }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"var(--space-16)", background:"var(--color-surface)", borderRadius:"var(--radius-xl)", border:"1px solid var(--color-border)", color:"var(--color-text-tertiary)", fontSize:"var(--text-sm)" }}>
                {filter === "all" ? "No requests yet." : `No ${filter.toLowerCase()} requests.`}
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-3)" }}>
                {filtered.map(item => {
                  const pc = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.Medium;
                  const sc = STATUS_CONFIG[item.status]     || STATUS_CONFIG.Pending;
                  return (
                    <div key={item.id} style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"var(--space-5)", boxShadow:"var(--shadow-xs)", display:"flex", alignItems:"flex-start", gap:"var(--space-4)", position:"relative", overflow:"hidden" }}>
                      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:"4px", background:pc.bar, borderRadius:"var(--radius-xl) 0 0 var(--radius-xl)" }} />

                      {/* Icon */}
                      <div style={{ width:"44px", height:"44px", borderRadius:"var(--radius-lg)", background:"var(--color-neutral-50)", border:"1px solid var(--color-border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", flexShrink:0, marginLeft:"var(--space-2)" }}>
                        {item.category==="Food Item"?"🍽️":item.category==="Ingredient"?"🥕":item.category==="Utensil"?"🥄":item.category==="Beverage"?"🥤":"📦"}
                      </div>

                      {/* Content */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)", flexWrap:"wrap", marginBottom:"var(--space-1)" }}>
                          <span style={{ fontSize:"var(--text-base)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)" }}>{item.itemName}</span>
                          <span style={{ fontSize:"10px", fontWeight:"var(--font-bold)", padding:"2px 8px", borderRadius:"var(--radius-full)", background:pc.bg, color:pc.color, textTransform:"uppercase", letterSpacing:"0.04em" }}>{item.priority}</span>
                          <span style={{ fontSize:"10px", fontWeight:"var(--font-bold)", padding:"2px 8px", borderRadius:"var(--radius-full)", background:sc.bg, color:sc.color, textTransform:"uppercase", letterSpacing:"0.04em" }}>{item.status}</span>
                        </div>
                        <div style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)", marginBottom: item.note ? "var(--space-2)" : 0 }}>
                          {item.category}
                          {isAdmin && ` • ${item.userName} (${item.userRole})`}
                          {` • ${item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short" }) : "—"}`}
                        </div>
                        {item.note && (
                          <div style={{ fontSize:"var(--text-xs)", color:"var(--color-text-secondary)", background:"var(--color-neutral-50)", padding:"var(--space-2) var(--space-3)", borderRadius:"var(--radius-md)", border:"1px solid var(--color-border)" }}>
                            {item.note}
                          </div>
                        )}
                        {item.adminRemark && (
                          <div style={{ marginTop:"var(--space-2)", fontSize:"var(--text-xs)", color:sc.color, fontWeight:"var(--font-semibold)", background:sc.bg, padding:"var(--space-2) var(--space-3)", borderRadius:"var(--radius-md)" }}>
                            Admin: {item.adminRemark}
                          </div>
                        )}

                        {isAdmin && item.status === "Pending" && (
                          <div style={{ marginTop:"var(--space-3)", display:"flex", flexDirection:"column", gap:"var(--space-3)" }}>
                            <textarea
                              placeholder="Admin remark (optional)"
                              value={remarkDrafts[item.id] ?? ""}
                              onChange={(e) => setRemarkDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                              rows={2}
                              style={{
                                width:"100%",
                                padding:"var(--space-3) var(--space-4)",
                                borderRadius:"var(--radius-md)",
                                border:"1.5px solid var(--color-border)",
                                background:"var(--color-neutral-50)",
                                color:"var(--color-text-primary)",
                                fontSize:"var(--text-sm)",
                                fontFamily:"var(--font-body)",
                                lineHeight:"var(--leading-relaxed)",
                                resize:"vertical",
                                outline:"none",
                                boxSizing:"border-box",
                              }}
                            />

                            <div style={{ display:"flex", gap:"var(--space-2)", flexWrap:"wrap" }}>
                              <button
                                type="button"
                                onClick={() => handleAction(item.id, "Approved")}
                                disabled={actingId === item.id}
                                style={{
                                  padding:"var(--space-2) var(--space-4)",
                                  borderRadius:"var(--radius-md)",
                                  border:"1px solid rgba(5,150,105,0.2)",
                                  background:"#D1FAE5",
                                  color:"#065F46",
                                  fontSize:"var(--text-sm)",
                                  fontWeight:"var(--font-bold)",
                                  cursor:"pointer",
                                  opacity: actingId === item.id ? 0.7 : 1,
                                }}
                              >
                                {actingId === item.id ? "Saving..." : "Approve"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAction(item.id, "Rejected")}
                                disabled={actingId === item.id}
                                style={{
                                  padding:"var(--space-2) var(--space-4)",
                                  borderRadius:"var(--radius-md)",
                                  border:"1px solid rgba(220,38,38,0.2)",
                                  background:"#FEE2E2",
                                  color:"#991B1B",
                                  fontSize:"var(--text-sm)",
                                  fontWeight:"var(--font-bold)",
                                  cursor:"pointer",
                                  opacity: actingId === item.id ? 0.7 : 1,
                                }}
                              >
                                {actingId === item.id ? "Saving..." : "Reject"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Delete for pending own requests */}
                      {!isAdmin && item.status === "Pending" && (
                        <button onClick={() => handleDelete(item.id)} className="person-icon-btn delete-icon" style={{ flexShrink:0 }} title="Cancel">
                          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4h10M5 4V2.5h4V4M6 7v4M8 7v4"/></svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Right — Add form (student/staff only) ── */}
          {canRequest && showForm && (
            <div style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"var(--space-6)", boxShadow:"var(--shadow-sm)", position:"sticky", top:"var(--space-4)", animation:"slideInUp 0.3s ease" }}>
              <h3 style={{ fontSize:"var(--text-lg)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)", marginBottom:"var(--space-5)", letterSpacing:"-0.01em" }}>New Request</h3>

              {/* Item name */}
              <div style={{ marginBottom:"var(--space-4)" }}>
                <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Item Name *</label>
                <input type="text" placeholder="e.g. Paneer, Green tea, Fork…" value={form.itemName} onChange={e => setForm(f=>({...f,itemName:e.target.value}))}
                  style={{ width:"100%", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-md)", border:"1.5px solid var(--color-border)", background:"var(--color-neutral-50)", color:"var(--color-text-primary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box" }} />
              </div>

              {/* Category */}
              <div style={{ marginBottom:"var(--space-4)" }}>
                <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Category</label>
                <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}
                  style={{ width:"100%", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-md)", border:"1.5px solid var(--color-border)", background:"var(--color-neutral-50)", color:"var(--color-text-primary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", outline:"none" }}>
                  {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Priority */}
              <div style={{ marginBottom:"var(--space-4)" }}>
                <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Priority</label>
                <div style={{ display:"flex", gap:"var(--space-2)" }}>
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <button key={key} type="button" onClick={() => setForm(f=>({...f,priority:key}))}
                      style={{ flex:1, padding:"var(--space-2)", borderRadius:"var(--radius-md)", border: form.priority===key ? `2px solid ${cfg.color}` : "1.5px solid var(--color-border)", background: form.priority===key ? cfg.bg : "var(--color-neutral-50)", color: form.priority===key ? cfg.color : "var(--color-text-secondary)", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", cursor:"pointer", transition:"all var(--transition-fast)" }}>
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div style={{ marginBottom:"var(--space-5)" }}>
                <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Note (optional)</label>
                <textarea placeholder="Why do you need this?" value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} rows={3}
                  style={{ width:"100%", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-md)", border:"1.5px solid var(--color-border)", background:"var(--color-neutral-50)", color:"var(--color-text-primary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", lineHeight:"var(--leading-relaxed)", resize:"vertical", outline:"none", boxSizing:"border-box" }} />
              </div>

              <button className="auth-btn" onClick={handleAdd} disabled={saving} style={{ width:"100%", opacity:saving?0.75:1 }}>
                {saving ? "Submitting…" : "+ Add to Request List"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemRequest;
