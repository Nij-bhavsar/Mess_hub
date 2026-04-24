import { useState, useEffect, useCallback } from "react";
import UnifiedNavbar from "../components/UnifiedNavbar";

const STATUS_CONFIG = {
  Pending:  { pill:"sp-unmarked", color:"#D97706", bg:"#FEF3C7", bar:"#D97706" },
  Approved: { pill:"sp-present",  color:"#059669", bg:"#D1FAE5", bar:"#059669" },
  Rejected: { pill:"sp-absent",   color:"#DC2626", bg:"#FEE2E2", bar:"#DC2626" },
};

const BASE = "http://localhost:5155/api/leave";

function LeaveAdmin() {
  const [leaves,     setLeaves]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [search,     setSearch]     = useState("");
  const [actionId,   setActionId]   = useState(null);
  const [remark,     setRemark]     = useState("");
  const [saving,     setSaving]     = useState(false);
  const [message,    setMessage]    = useState({ text:"", type:"" });

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text:"", type:"" }), 4000);
  };

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE);
      if (res.ok) {
        const data = await res.json();
        setLeaves(Array.isArray(data) ? data : []);
      }
    } catch { setLeaves([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleAction = async (id, status) => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/${id}/action`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status, adminRemark: remark }),
      });

      if (res.ok) {
        showMsg(`Leave ${status.toLowerCase()} successfully.`);
        setActionId(null);
        setRemark("");
        fetchLeaves();
      } else {
        showMsg("Action failed. Please try again.", "error");
      }
    } catch {
      showMsg("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const filtered = leaves.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = (l.userName||"").toLowerCase().includes(q) ||
                        (l.leaveType||"").toLowerCase().includes(q) ||
                        (l.reason||"").toLowerCase().includes(q);
    const matchStatus = filter === "all" || l.status === filter;
    const matchRole   = roleFilter === "all" || (l.userRole||"").toLowerCase() === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });

  const counts = {
    all:      leaves.length,
    Pending:  leaves.filter(l => l.status === "Pending").length,
    Approved: leaves.filter(l => l.status === "Approved").length,
    Rejected: leaves.filter(l => l.status === "Rejected").length,
  };

  function daysBetween(from, to) {
    try {
      return Math.max(1, Math.round((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1);
    } catch { return "—"; }
  }

  return (
    <div className="dashboard">
      <UnifiedNavbar />
      <div className="main-content">

        {/* Header */}
        <div style={{ marginBottom:"var(--space-8)" }}>
          <h1 style={{ fontSize:"var(--text-3xl)", fontFamily:"var(--font-display)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)", letterSpacing:"-0.02em", marginBottom:"var(--space-2)" }}>
            Leave Management
          </h1>
          <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-tertiary)", fontWeight:"var(--font-medium)" }}>
            Review and approve leave requests from students and staff
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"var(--space-4)", marginBottom:"var(--space-8)" }}>
          {[
            { label:"Total",    value: counts.all,      color:"var(--color-brand-primary)", bg:"#F5F3FF" },
            { label:"Pending",  value: counts.Pending,  color:"#D97706",                   bg:"#FEF3C7" },
            { label:"Approved", value: counts.Approved, color:"#059669",                   bg:"#D1FAE5" },
            { label:"Rejected", value: counts.Rejected, color:"#DC2626",                   bg:"#FEE2E2" },
          ].map(s => (
            <div key={s.label} style={{ background:s.bg, borderRadius:"var(--radius-xl)", padding:"var(--space-5)", border:"1px solid var(--color-border)", boxShadow:"var(--shadow-xs)", cursor:"pointer" }}
              onClick={() => setFilter(s.label === "Total" ? "all" : s.label)}>
              <div style={{ fontSize:"var(--text-2xl)", fontWeight:"var(--font-bold)", color:s.color, lineHeight:1.1, letterSpacing:"-0.02em", marginBottom:"var(--space-1)" }}>{s.value}</div>
              <div style={{ fontSize:"var(--text-xs)", fontWeight:"var(--font-semibold)", color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {message.text && (
          <div className={`message ${message.type}`} style={{ marginBottom:"var(--space-5)" }}>{message.text}</div>
        )}

        {/* Toolbar */}
        <div className="grid-toolbar" style={{ marginBottom:"var(--space-5)" }}>
          <h2 className="grid-toolbar-title">
            Applications <span className="grid-count-badge">{filtered.length}</span>
          </h2>
          <div className="grid-search-wrap">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l3.5 3.5" strokeLinecap="round"/></svg>
            <input className="grid-search" type="text" placeholder="Search name, type, reason…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="grid-filter-tabs">
            {["all","Pending","Approved","Rejected"].map(f => (
              <button key={f} className={`grid-filter-btn ${filter===f?"active":""}`} onClick={() => setFilter(f)}>
                {f === "all" ? "All" : f}{f !== "all" && counts[f] > 0 ? ` (${counts[f]})` : ""}
              </button>
            ))}
          </div>
          <div className="grid-filter-tabs">
            {["all","student","staff"].map(r => (
              <button key={r} className={`grid-filter-btn ${roleFilter===r?"active":""}`} onClick={() => setRoleFilter(r)}>
                {r.charAt(0).toUpperCase()+r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Leave list */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"var(--space-16)", color:"var(--color-text-tertiary)", fontSize:"var(--text-sm)" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"var(--space-16)", background:"var(--color-surface)", borderRadius:"var(--radius-xl)", border:"1px solid var(--color-border)", color:"var(--color-text-tertiary)", fontSize:"var(--text-sm)" }}>
            No leave applications found.
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-4)" }}>
            {filtered.map(leave => {
              const sc     = STATUS_CONFIG[leave.status] || STATUS_CONFIG.Pending;
              const isOpen = actionId === leave.id;

              return (
                <div key={leave.id} style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"var(--space-5) var(--space-6)", boxShadow:"var(--shadow-xs)", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", left:0, top:0, bottom:0, width:"4px", background:sc.bar, borderRadius:"var(--radius-xl) 0 0 var(--radius-xl)" }} />

                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"var(--space-4)", flexWrap:"wrap" }}>
                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", flexWrap:"wrap", marginBottom:"var(--space-2)" }}>
                        <span style={{ fontSize:"var(--text-base)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)" }}>
                          {leave.userName}
                        </span>
                        <span style={{ fontSize:"10px", fontWeight:"var(--font-bold)", padding:"2px 8px", borderRadius:"var(--radius-full)", background:"#F5F3FF", color:"var(--color-brand-primary)", textTransform:"uppercase", letterSpacing:"0.04em" }}>
                          {leave.userRole}
                        </span>
                        <span style={{ fontSize:"10px", fontWeight:"var(--font-bold)", padding:"2px 10px", borderRadius:"var(--radius-full)", background:sc.bg, color:sc.color, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                          {leave.status}
                        </span>
                      </div>

                      <div style={{ fontSize:"var(--text-sm)", fontWeight:"var(--font-semibold)", color:"var(--color-text-secondary)", marginBottom:"var(--space-2)" }}>
                        {leave.leaveType}
                        <span style={{ fontWeight:"var(--font-normal)", color:"var(--color-text-tertiary)", marginLeft:"var(--space-3)" }}>
                          {leave.fromDate} → {leave.toDate} ({daysBetween(leave.fromDate, leave.toDate)} days)
                        </span>
                      </div>

                      <div style={{ fontSize:"var(--text-sm)", color:"var(--color-text-secondary)", background:"var(--color-neutral-50)", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-md)", border:"1px solid var(--color-border)", marginBottom: leave.adminRemark ? "var(--space-2)" : 0 }}>
                        {leave.reason}
                      </div>

                      {leave.adminRemark && (
                        <div style={{ fontSize:"var(--text-xs)", color:sc.color, fontWeight:"var(--font-semibold)", background:sc.bg, padding:"var(--space-2) var(--space-3)", borderRadius:"var(--radius-md)", marginTop:"var(--space-2)" }}>
                          Remark: {leave.adminRemark}
                        </div>
                      )}

                      <div style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)", marginTop:"var(--space-2)" }}>
                        Applied: {leave.appliedAt ? new Date(leave.appliedAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—"}
                      </div>
                    </div>

                    {/* Action buttons — only for pending */}
                    {leave.status === "Pending" && (
                      <div style={{ flexShrink:0 }}>
                        {!isOpen ? (
                          <button
                            onClick={() => { setActionId(leave.id); setRemark(""); }}
                            style={{ padding:"var(--space-2) var(--space-4)", borderRadius:"var(--radius-md)", border:"1.5px solid var(--color-brand-primary)", background:"#F5F3FF", color:"var(--color-brand-primary)", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", cursor:"pointer" }}
                          >
                            Take Action
                          </button>
                        ) : (
                          <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-2)", minWidth:"200px" }}>
                            <textarea
                              placeholder="Admin remark (optional)"
                              value={remark}
                              onChange={e => setRemark(e.target.value)}
                              rows={2}
                              style={{ width:"100%", padding:"var(--space-2) var(--space-3)", borderRadius:"var(--radius-md)", border:"1.5px solid var(--color-border)", background:"var(--color-neutral-50)", fontSize:"var(--text-xs)", fontFamily:"var(--font-body)", outline:"none", resize:"none", boxSizing:"border-box" }}
                            />
                            <div style={{ display:"flex", gap:"var(--space-2)" }}>
                              <button
                                onClick={() => handleAction(leave.id, "Approved")}
                                disabled={saving}
                                style={{ flex:1, padding:"var(--space-2)", borderRadius:"var(--radius-md)", border:"none", background:"var(--color-success)", color:"white", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", cursor:"pointer", opacity:saving?0.7:1 }}
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleAction(leave.id, "Rejected")}
                                disabled={saving}
                                style={{ flex:1, padding:"var(--space-2)", borderRadius:"var(--radius-md)", border:"none", background:"var(--color-danger)", color:"white", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", cursor:"pointer", opacity:saving?0.7:1 }}
                              >
                                ✗ Reject
                              </button>
                              <button
                                onClick={() => { setActionId(null); setRemark(""); }}
                                style={{ padding:"var(--space-2)", borderRadius:"var(--radius-md)", border:"1.5px solid var(--color-border)", background:"var(--color-surface)", fontSize:"var(--text-xs)", cursor:"pointer", color:"var(--color-text-secondary)" }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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

export default LeaveAdmin;