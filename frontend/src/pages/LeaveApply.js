import { useState, useEffect, useCallback } from "react";
import UnifiedNavbar from "../components/UnifiedNavbar";
import { readAuthUser } from "../utils/authStorage";

const LEAVE_TYPES = ["Sick Leave", "Personal Leave", "Academic Leave", "Family Emergency", "Other"];

const STATUS_CONFIG = {
  Pending:  { pill:"sp-unmarked", color:"#D97706", bg:"#FEF3C7", bar:"#D97706" },
  Approved: { pill:"sp-present",  color:"#059669", bg:"#D1FAE5", bar:"#059669" },
  Rejected: { pill:"sp-absent",   color:"#DC2626", bg:"#FEE2E2", bar:"#DC2626" },
};

const BASE = "http://localhost:5155/api/leave";

const EMPTY_FORM = {
  fromDate:  "",
  toDate:    "",
  leaveType: "Sick Leave",
  reason:    "",
};

function LeaveApply() {
  const authUser    = readAuthUser() || {};
  const userId      = authUser.id   || 0;
  const userName    = authUser.name || authUser.email || "User";
  const userRole    = authUser.role || "Student";

  const [leaves,   setLeaves]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [message,  setMessage]  = useState({ text:"", type:"" });
  const [filter,   setFilter]   = useState("all");
  const [showForm, setShowForm] = useState(false);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text:"", type:"" }), 4000);
  };

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setLeaves(Array.isArray(data) ? data : []);
      }
    } catch {
      // fallback localStorage
      try {
        const stored = JSON.parse(localStorage.getItem(`leaves_${userId}`) || "[]");
        setLeaves(stored);
      } catch { setLeaves([]); }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const validate = () => {
    if (!form.fromDate) return "Please select a start date.";
    if (!form.toDate)   return "Please select an end date.";
    if (new Date(form.toDate) < new Date(form.fromDate)) return "End date cannot be before start date.";
    if (!form.reason.trim()) return "Please provide a reason.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { showMsg(err, "error"); return; }

    setSaving(true);
    try {
      const res = await fetch(BASE, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          userId,
          userName,
          userRole,
          fromDate:  form.fromDate,
          toDate:    form.toDate,
          leaveType: form.leaveType,
          reason:    form.reason,
        }),
      });

      if (res.ok) {
        showMsg("Leave application submitted successfully!");
        setForm(EMPTY_FORM);
        setShowForm(false);
        fetchLeaves();
      } else {
        const data = await res.json();
        showMsg(data.message || "Submission failed.", "error");
      }
    } catch {
      // fallback localStorage
      const newLeave = {
        id:        Date.now(),
        userId, userName, userRole,
        fromDate:  form.fromDate,
        toDate:    form.toDate,
        leaveType: form.leaveType,
        reason:    form.reason,
        status:    "Pending",
        appliedAt: new Date().toISOString(),
      };
      const stored = JSON.parse(localStorage.getItem(`leaves_${userId}`) || "[]");
      stored.unshift(newLeave);
      localStorage.setItem(`leaves_${userId}`, JSON.stringify(stored));
      setLeaves(stored);
      showMsg("Leave application submitted (offline mode).");
      setForm(EMPTY_FORM);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this leave application?")) return;
    try {
      const res = await fetch(`${BASE}/${id}`, { method:"DELETE" });
      if (res.ok) { showMsg("Leave cancelled."); fetchLeaves(); }
      else showMsg("Could not cancel leave.", "error");
    } catch {
      const stored = JSON.parse(localStorage.getItem(`leaves_${userId}`) || "[]");
      localStorage.setItem(`leaves_${userId}`, JSON.stringify(stored.filter(l => l.id !== id)));
      setLeaves(prev => prev.filter(l => l.id !== id));
      showMsg("Leave cancelled.");
    }
  };

  const filtered = filter === "all" ? leaves : leaves.filter(l => l.status === filter);

  const counts = {
    all:      leaves.length,
    Pending:  leaves.filter(l => l.status === "Pending").length,
    Approved: leaves.filter(l => l.status === "Approved").length,
    Rejected: leaves.filter(l => l.status === "Rejected").length,
  };

  function daysBetween(from, to) {
    try {
      const diff = new Date(to) - new Date(from);
      return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
    } catch { return "—"; }
  }

  return (
    <div className="dashboard">
      <UnifiedNavbar />
      <div className="main-content">

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"var(--space-4)", marginBottom:"var(--space-8)" }}>
          <div>
            <h1 style={{ fontSize:"var(--text-3xl)", fontFamily:"var(--font-display)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)", letterSpacing:"-0.02em", marginBottom:"var(--space-2)" }}>
              Leave Applications
            </h1>
            <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-tertiary)", fontWeight:"var(--font-medium)" }}>
              Apply for leave and track your application status
            </p>
          </div>
          <button
            className="grid-add-btn"
            onClick={() => { setShowForm(s => !s); setForm(EMPTY_FORM); }}
          >
            {showForm ? "✕ Close" : "+ Apply for Leave"}
          </button>
        </div>

        {/* Messages */}
        {message.text && (
          <div className={`message ${message.type}`} style={{ marginBottom:"var(--space-5)", animation:"fadeIn 0.2s ease" }}>
            {message.text}
          </div>
        )}

        {/* Apply form */}
        {showForm && (
          <div style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"var(--space-7)", marginBottom:"var(--space-8)", boxShadow:"var(--shadow-md)", animation:"slideInUp 0.3s ease", position:"relative" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:"4px", background:"var(--color-brand-gradient)", borderRadius:"var(--radius-xl) var(--radius-xl) 0 0" }} />

            <h3 style={{ fontSize:"var(--text-xl)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)", letterSpacing:"-0.02em", marginBottom:"var(--space-6)" }}>
              New Leave Application
            </h3>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-4)" }}>

              {/* From date */}
              <div>
                <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>From Date *</label>
                <input type="date" value={form.fromDate} min={new Date().toISOString().split("T")[0]}
                  onChange={e => setForm(f => ({ ...f, fromDate:e.target.value }))}
                  style={{ width:"100%", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-md)", border:"1.5px solid var(--color-border)", background:"var(--color-neutral-50)", color:"var(--color-text-primary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box" }} />
              </div>

              {/* To date */}
              <div>
                <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>To Date *</label>
                <input type="date" value={form.toDate} min={form.fromDate || new Date().toISOString().split("T")[0]}
                  onChange={e => setForm(f => ({ ...f, toDate:e.target.value }))}
                  style={{ width:"100%", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-md)", border:"1.5px solid var(--color-border)", background:"var(--color-neutral-50)", color:"var(--color-text-primary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box" }} />
              </div>

              {/* Leave type */}
              <div>
                <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Leave Type *</label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-2)" }}>
                  {LEAVE_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setForm(f=>({...f,leaveType:t}))}
                      style={{ padding:"var(--space-2) var(--space-3)", borderRadius:"var(--radius-md)", fontSize:"var(--text-xs)", fontWeight: form.leaveType===t ? "var(--font-bold)" : "var(--font-medium)", cursor:"pointer", transition:"all var(--transition-fast)", border: form.leaveType===t ? "2px solid var(--color-brand-primary)" : "1.5px solid var(--color-border)", background: form.leaveType===t ? "#F5F3FF" : "var(--color-neutral-50)", color: form.leaveType===t ? "var(--color-brand-primary)" : "var(--color-text-secondary)" }}
                    >{t}</button>
                  ))}
                </div>
              </div>

              {/* Days preview */}
              {form.fromDate && form.toDate && (
                <div style={{ display:"flex", alignItems:"center" }}>
                  <div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:"var(--radius-lg)", padding:"var(--space-4)", width:"100%", textAlign:"center" }}>
                    <div style={{ fontSize:"var(--text-3xl)", fontWeight:"var(--font-bold)", color:"var(--color-brand-primary)", lineHeight:1 }}>
                      {daysBetween(form.fromDate, form.toDate)}
                    </div>
                    <div style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)", marginTop:"var(--space-1)", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                      Days Requested
                    </div>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div style={{ gridColumn:"1 / -1" }}>
                <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-2)" }}>Reason *</label>
                <textarea
                  placeholder="Describe your reason for leave…"
                  value={form.reason}
                  onChange={e => setForm(f=>({...f,reason:e.target.value}))}
                  rows={4}
                  style={{ width:"100%", padding:"var(--space-4)", borderRadius:"var(--radius-lg)", border:`1.5px solid ${form.reason?"var(--color-brand-primary)":"var(--color-border)"}`, background:"var(--color-neutral-50)", color:"var(--color-text-primary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", lineHeight:"var(--leading-relaxed)", resize:"vertical", outline:"none", boxSizing:"border-box" }}
                />
              </div>
            </div>

            <div style={{ display:"flex", gap:"var(--space-3)", marginTop:"var(--space-6)" }}>
              <button onClick={handleSubmit} disabled={saving} className="auth-btn" style={{ flex:1, opacity:saving?0.75:1 }}>
                {saving ? "Submitting…" : "Submit Application"}
              </button>
              <button onClick={() => setShowForm(false)} style={{ padding:"var(--space-3) var(--space-6)", borderRadius:"var(--radius-lg)", border:"1.5px solid var(--color-border)", background:"var(--color-surface)", color:"var(--color-text-secondary)", fontSize:"var(--text-sm)", fontWeight:"var(--font-semibold)", cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="grid-toolbar" style={{ marginBottom:"var(--space-5)" }}>
          <h2 className="grid-toolbar-title">
            My Applications <span className="grid-count-badge">{filtered.length}</span>
          </h2>
          <div className="grid-filter-tabs">
            {["all","Pending","Approved","Rejected"].map(f => (
              <button key={f} className={`grid-filter-btn ${filter===f?"active":""}`} onClick={() => setFilter(f)}>
                {f === "all" ? "All" : f}
                {counts[f] > 0 && ` (${counts[f]})`}
              </button>
            ))}
          </div>
        </div>

        {/* Leave cards */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"var(--space-16)", color:"var(--color-text-tertiary)", fontSize:"var(--text-sm)" }}>Loading leaves…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"var(--space-16)", background:"var(--color-surface)", borderRadius:"var(--radius-xl)", border:"1px solid var(--color-border)", color:"var(--color-text-tertiary)", fontSize:"var(--text-sm)" }}>
            {filter === "all" ? "No leave applications yet. Click \"+ Apply for Leave\" to start." : `No ${filter.toLowerCase()} leaves.`}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-4)" }}>
            {filtered.map(leave => {
              const sc = STATUS_CONFIG[leave.status] || STATUS_CONFIG.Pending;
              return (
                <div key={leave.id} style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"var(--space-5) var(--space-6)", boxShadow:"var(--shadow-xs)", position:"relative", overflow:"hidden", animation:"fadeIn 0.2s ease" }}>
                  {/* Left status bar */}
                  <div style={{ position:"absolute", left:0, top:0, bottom:0, width:"4px", background:sc.bar, borderRadius:"var(--radius-xl) 0 0 var(--radius-xl)" }} />

                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"var(--space-3)" }}>
                    {/* Left content */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", flexWrap:"wrap", marginBottom:"var(--space-2)" }}>
                        <span style={{ fontSize:"var(--text-base)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)" }}>
                          {leave.leaveType}
                        </span>
                        <span style={{ fontSize:"10px", fontWeight:"var(--font-bold)", padding:"2px 10px", borderRadius:"var(--radius-full)", background:sc.bg, color:sc.color, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                          {leave.status}
                        </span>
                      </div>

                      <div style={{ display:"flex", alignItems:"center", gap:"var(--space-4)", flexWrap:"wrap", marginBottom:"var(--space-3)" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"var(--space-1)", fontSize:"var(--text-xs)", color:"var(--color-text-secondary)", fontWeight:"var(--font-medium)" }}>
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1" y="2" width="12" height="10" rx="1.5"/><path d="M1 6h12M4 2V0M10 2V0"/></svg>
                          {leave.fromDate} → {leave.toDate}
                        </div>
                        <div style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)" }}>
                          {daysBetween(leave.fromDate, leave.toDate)} day{daysBetween(leave.fromDate, leave.toDate) !== 1 ? "s" : ""}
                        </div>
                        <div style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)" }}>
                          Applied: {leave.appliedAt ? new Date(leave.appliedAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                        </div>
                      </div>

                      <div style={{ fontSize:"var(--text-sm)", color:"var(--color-text-secondary)", lineHeight:"var(--leading-relaxed)", background:"var(--color-neutral-50)", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-md)", border:"1px solid var(--color-border)" }}>
                        {leave.reason}
                      </div>

                      {leave.adminRemark && (
                        <div style={{ marginTop:"var(--space-3)", fontSize:"var(--text-xs)", color:sc.color, fontWeight:"var(--font-semibold)", background:sc.bg, padding:"var(--space-2) var(--space-3)", borderRadius:"var(--radius-md)" }}>
                          Admin remark: {leave.adminRemark}
                        </div>
                      )}
                    </div>

                    {/* Cancel button for pending */}
                    {leave.status === "Pending" && (
                      <button onClick={() => handleCancel(leave.id)} className="person-icon-btn delete-icon" style={{ flexShrink:0 }} title="Cancel application">
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4h10M5 4V2.5h4V4M6 7v4M8 7v4"/></svg>
                      </button>
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

export default LeaveApply;
