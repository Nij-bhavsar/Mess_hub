import { useState, useEffect, useCallback } from "react";
import UnifiedNavbar from "../components/UnifiedNavbar";
import { readAuthUser } from "../utils/authStorage";

const BASE = "http://localhost:5155/api/notification";

const TYPE_CONFIG = {
  info:    { color:"var(--color-brand-primary)", bg:"#F5F3FF", border:"#DDD6FE", icon:"ℹ" },
  success: { color:"#059669",                    bg:"#D1FAE5", border:"#6EE7B7", icon:"✓" },
  warning: { color:"#D97706",                    bg:"#FEF3C7", border:"#FCD34D", icon:"⚠" },
  error:   { color:"#DC2626",                    bg:"#FEE2E2", border:"#FCA5A5", icon:"✗" },
};

/* Admin send notification form */
function SendNotificationPanel({ onSent }) {
  const [form,   setForm]   = useState({ title:"", message:"", type:"info", role:"" });
  const [saving, setSaving] = useState(false);
  const [open,   setOpen]   = useState(false);

  const handleSend = async () => {
    if (!form.message.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(BASE, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...form, userId:0 }),
      });
      if (res.ok) {
        setForm({ title:"", message:"", type:"info", role:"" });
        setOpen(false);
        onSent();
      }
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <div>
      <button className="grid-add-btn" onClick={() => setOpen(o => !o)}>
        {open ? "✕ Close" : "📢 Send Notification"}
      </button>

      {open && (
        <div style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"var(--space-6)", marginTop:"var(--space-4)", boxShadow:"var(--shadow-md)", animation:"slideInUp 0.3s ease", position:"relative" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:"4px", background:"var(--color-brand-gradient)", borderRadius:"var(--radius-xl) var(--radius-xl) 0 0" }} />
          <h3 style={{ fontSize:"var(--text-lg)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)", marginBottom:"var(--space-5)" }}>
            Send Notification
          </h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-4)" }}>
            <div>
              <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Title</label>
              <input type="text" placeholder="Notification title" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
                style={{ width:"100%", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-md)", border:"1.5px solid var(--color-border)", background:"var(--color-neutral-50)", color:"var(--color-text-primary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box" }} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Send To</label>
              <div style={{ display:"flex", gap:"var(--space-2)" }}>
                {[{v:"",label:"All"},{v:"student",label:"Students"},{v:"staff",label:"Staff"}].map(r => (
                  <button key={r.v} type="button" onClick={() => setForm(f=>({...f,role:r.v}))}
                    style={{ flex:1, padding:"var(--space-2)", borderRadius:"var(--radius-md)", border: form.role===r.v ? "2px solid var(--color-brand-primary)" : "1.5px solid var(--color-border)", background: form.role===r.v ? "#F5F3FF" : "var(--color-neutral-50)", color: form.role===r.v ? "var(--color-brand-primary)" : "var(--color-text-secondary)", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", cursor:"pointer" }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Type</label>
              <div style={{ display:"flex", gap:"var(--space-2)" }}>
                {["info","success","warning","error"].map(t => {
                  const tc = TYPE_CONFIG[t];
                  return (
                    <button key={t} type="button" onClick={() => setForm(f=>({...f,type:t}))}
                      style={{ flex:1, padding:"var(--space-2)", borderRadius:"var(--radius-md)", border: form.type===t ? `2px solid ${tc.color}` : "1.5px solid var(--color-border)", background: form.type===t ? tc.bg : "var(--color-neutral-50)", color: form.type===t ? tc.color : "var(--color-text-secondary)", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", cursor:"pointer" }}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ gridColumn:"1 / -1" }}>
              <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Message *</label>
              <textarea placeholder="Type your notification message…" value={form.message} onChange={e => setForm(f=>({...f,message:e.target.value}))} rows={3}
                style={{ width:"100%", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-lg)", border:"1.5px solid var(--color-border)", background:"var(--color-neutral-50)", color:"var(--color-text-primary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", lineHeight:"var(--leading-relaxed)", resize:"vertical", outline:"none", boxSizing:"border-box" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:"var(--space-3)", marginTop:"var(--space-5)" }}>
            <button onClick={handleSend} disabled={saving || !form.message.trim()} className="auth-btn" style={{ flex:1, opacity: saving||!form.message.trim() ? 0.7 : 1 }}>
              {saving ? "Sending…" : "Send Notification"}
            </button>
            <button onClick={() => setOpen(false)} style={{ padding:"var(--space-3) var(--space-5)", borderRadius:"var(--radius-lg)", border:"1.5px solid var(--color-border)", background:"var(--color-surface)", color:"var(--color-text-secondary)", fontSize:"var(--text-sm)", fontWeight:"var(--font-semibold)", cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const authUser   = readAuthUser() || {};
  const userId     = authUser.id   || 0;
  const userRole   = (authUser.role || "student").toLowerCase();
  const isAdmin    = userRole === "admin";

  const [notifications, setNotifications] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [actingOnRequest, setActingOnRequest] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState("all");

  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams({ userId: String(userId), role: userRole });
      const requests = isAdmin
        ? await Promise.all([
            fetch("http://localhost:5155/api/leave?status=Pending", { cache: "no-store" }),
            fetch("http://localhost:5155/api/itemrequest?status=Pending", { cache: "no-store" }),
          ])
        : [];
      const [notificationRes, ...requestResponses] = await Promise.all([
        fetch(`${BASE}?${params}`, { cache: "no-store" }),
        ...requests,
      ]);
      if (notificationRes.ok) {
        const data = await notificationRes.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
      if (isAdmin) {
        const [leaveRes, itemRequestRes] = requestResponses;
        const [leaves, itemRequests] = await Promise.all([
          leaveRes?.ok ? leaveRes.json() : [],
          itemRequestRes?.ok ? itemRequestRes.json() : [],
        ]);
        setPendingRequests([
          ...(Array.isArray(leaves) ? leaves.map(request => ({ ...request, requestKind: "leave" })) : []),
          ...(Array.isArray(itemRequests) ? itemRequests.map(request => ({ ...request, requestKind: "item" })) : []),
        ]);
      }
    } catch {
      setNotifications([]);
      if (isAdmin) setPendingRequests([]);
    } finally { setLoading(false); }
  }, [userId, userRole, isAdmin]);

  useEffect(() => {
    fetchNotifications();
    // Keep the notification list current while the page is open. Leave requests
    // are created by the API, so there is no client-side event to trigger a refresh.
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await fetch(`${BASE}/${id}/read?userId=${userId}`, { method:"PUT" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead:true } : n));
    } catch {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead:true } : n));
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${BASE}/read-all?userId=${userId}&role=${userRole}`, { method:"PUT" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead:true })));
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, isRead:true })));
    }
  };

  const deleteNotif = async (id) => {
    try {
      await fetch(`${BASE}/${id}?userId=${userId}`, { method:"DELETE" });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleRequestAction = async (request, status) => {
    const key = `${request.requestKind}-${request.id}`;
    setActingOnRequest(key);
    try {
      const endpoint = request.requestKind === "leave" ? "leave" : "itemrequest";
      const res = await fetch(`http://localhost:5155/api/${endpoint}/${request.id}/action`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminRemark: "" }),
      });
      if (!res.ok) throw new Error("Request action failed");
      await fetchNotifications();
    } catch {
      window.alert("Could not update this request. Please try again.");
    } finally {
      setActingOnRequest(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const requestNotifications = pendingRequests.map(request => {
    const isLeave = request.requestKind === "leave";
    return {
      ...request,
      id: `${request.requestKind}-${request.id}`,
      requestId: request.id,
      isRequest: true,
      isRead: false,
      type: "info",
      title: isLeave ? "New Leave Request" : "New Item Request",
      message: isLeave
        ? `${request.userName || "User"} (${request.userRole || "student"}) · ${request.leaveType || "Leave"} from ${request.fromDate} to ${request.toDate}. ${request.reason || ""}`
        : `${request.userName || "User"} (${request.userRole || "student"}) requested ${request.itemName || "an item"} · ${request.category || "Request"} · ${request.priority || "Medium"} priority. ${request.note || ""}`,
      createdAt: request.appliedAt || request.createdAt,
    };
  });
  const allNotifications = [...notifications, ...requestNotifications]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const filtered = filter === "all"
    ? allNotifications
    : filter === "unread"
      ? allNotifications.filter(n => !n.isRead)
      : allNotifications.filter(n => n.type === filter);

  return (
    <div className="dashboard">
      <UnifiedNavbar />
      <div className="main-content">

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"var(--space-4)", marginBottom:"var(--space-8)" }}>
          <div>
            <h1 style={{ fontSize:"var(--text-3xl)", fontFamily:"var(--font-display)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)", letterSpacing:"-0.02em", marginBottom:"var(--space-2)" }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ marginLeft:"var(--space-3)", fontSize:"var(--text-sm)", fontWeight:"var(--font-bold)", background:"var(--color-danger)", color:"white", padding:"2px 10px", borderRadius:"var(--radius-full)", verticalAlign:"middle" }}>
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-tertiary)", fontWeight:"var(--font-medium)" }}>
              {isAdmin ? "Manage and broadcast notifications" : "Your alerts and updates"}
            </p>
          </div>
          <div style={{ display:"flex", gap:"var(--space-3)", flexWrap:"wrap" }}>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ padding:"var(--space-2) var(--space-4)", borderRadius:"var(--radius-lg)", border:"1.5px solid var(--color-border)", background:"var(--color-surface)", color:"var(--color-text-secondary)", fontSize:"var(--text-sm)", fontWeight:"var(--font-semibold)", cursor:"pointer" }}>
                Mark all read
              </button>
            )}
            {isAdmin && <SendNotificationPanel onSent={fetchNotifications} />}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="grid-toolbar" style={{ marginBottom:"var(--space-6)" }}>
          <h2 className="grid-toolbar-title">
            All Notifications <span className="grid-count-badge">{filtered.length}</span>
          </h2>
          <div className="grid-filter-tabs">
            {["all","unread","info","success","warning","error"].map(f => (
              <button key={f} className={`grid-filter-btn ${filter===f?"active":""}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Notification list */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"var(--space-16)", color:"var(--color-text-tertiary)", fontSize:"var(--text-sm)" }}>Loading notifications…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"var(--space-20)", background:"var(--color-surface)", borderRadius:"var(--radius-xl)", border:"1px solid var(--color-border)" }}>
            <div style={{ fontSize:"3rem", marginBottom:"var(--space-4)" }}>🔔</div>
            <div style={{ fontSize:"var(--text-base)", fontWeight:"var(--font-semibold)", color:"var(--color-text-secondary)", marginBottom:"var(--space-2)" }}>No notifications</div>
            <div style={{ fontSize:"var(--text-sm)", color:"var(--color-text-tertiary)" }}>You're all caught up!</div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-3)" }}>
            {filtered.map(n => {
              const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
              return (
                <div
                  key={n.id}
                  onClick={() => !n.isRequest && !n.isRead && markRead(n.id)}
                  style={{
                    background:    n.isRead ? "var(--color-surface)" : "#FAFAFA",
                    border:        `1px solid ${n.isRead ? "var(--color-border)" : tc.border}`,
                    borderRadius:  "var(--radius-xl)",
                    padding:       "var(--space-5)",
                    boxShadow:     n.isRead ? "var(--shadow-xs)" : "var(--shadow-sm)",
                    cursor:        n.isRead || n.isRequest ? "default" : "pointer",
                    position:      "relative",
                    overflow:      "hidden",
                    display:       "flex",
                    alignItems:    "flex-start",
                    gap:           "var(--space-4)",
                    transition:    "all var(--transition-fast)",
                  }}
                >
                  {/* Unread indicator */}
                  {!n.isRead && (
                    <div style={{ position:"absolute", left:0, top:0, bottom:0, width:"4px", background:tc.color, borderRadius:"var(--radius-xl) 0 0 var(--radius-xl)" }} />
                  )}

                  {/* Type icon */}
                  <div style={{ width:"40px", height:"40px", borderRadius:"var(--radius-full)", background:tc.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", color:tc.color, fontWeight:"var(--font-bold)", flexShrink:0 }}>
                    {tc.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    {n.title && (
                      <div style={{ fontSize:"var(--text-sm)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)", marginBottom:"4px" }}>
                        {n.title}
                        {!n.isRead && (
                          <span style={{ marginLeft:"var(--space-2)", fontSize:"9px", background:tc.color, color:"white", padding:"1px 6px", borderRadius:"var(--radius-full)", fontWeight:"var(--font-bold)", textTransform:"uppercase" }}>New</span>
                        )}
                      </div>
                    )}
                    <div style={{ fontSize:"var(--text-sm)", color:"var(--color-text-secondary)", lineHeight:"var(--leading-relaxed)" }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)", marginTop:"var(--space-2)" }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—"}
                    </div>
                  </div>

                  {/* Delete button */}
                  {n.isRequest ? (
                    <div style={{ display:"flex", gap:"var(--space-2)", flexShrink:0 }}>
                      <button disabled={actingOnRequest === `${n.requestKind}-${n.requestId}`} onClick={e => { e.stopPropagation(); handleRequestAction({ ...n, id: n.requestId }, "Approved"); }} className="auth-btn" style={{ padding:"var(--space-2) var(--space-3)" }}>Approve</button>
                      <button disabled={actingOnRequest === `${n.requestKind}-${n.requestId}`} onClick={e => { e.stopPropagation(); handleRequestAction({ ...n, id: n.requestId }, "Rejected"); }} className="person-icon-btn delete-icon" style={{ width:"auto", padding:"0 var(--space-3)" }}>Reject</button>
                    </div>
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                      className="person-icon-btn delete-icon"
                      style={{ flexShrink:0 }}
                      title="Delete notification"
                    >
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3l8 8M11 3l-8 8"/>
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
