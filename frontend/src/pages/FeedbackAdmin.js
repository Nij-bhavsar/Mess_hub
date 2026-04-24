import { useState, useEffect, useCallback } from "react";
import UnifiedNavbar from "../components/UnifiedNavbar";

const BASE = "http://localhost:5155/api/feedback";

const CATEGORIES = {
  food_quality: { label:"Food Quality", icon:"🍽️" },
  cleanliness:  { label:"Cleanliness",  icon:"🧹" },
  service:      { label:"Service",      icon:"👨‍🍳" },
  menu_variety: { label:"Menu Variety", icon:"📋" },
  timing:       { label:"Meal Timing",  icon:"⏰" },
  other:        { label:"Other",        icon:"💬" },
};

const STATUS_CONFIG = {
  Pending:  { color:"#D97706", bg:"#FEF3C7" },
  Reviewed: { color:"#2563EB", bg:"#EFF6FF"  },
  Resolved: { color:"#059669", bg:"#D1FAE5"  },
};

function StarDisplay({ rating }) {
  return (
    <div style={{ display:"flex", gap:"2px" }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={s <= rating ? "#D97706" : "none"} stroke="#D97706" strokeWidth="1.8">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

function FeedbackAdmin() {
  const [feedbacks,  setFeedbacks]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("all");
  const [catFilter,  setCatFilter]  = useState("all");
  const [search,     setSearch]     = useState("");
  const [replyId,    setReplyId]    = useState(null);
  const [replyText,  setReplyText]  = useState("");
  const [replyStatus,setReplyStatus]= useState("Reviewed");
  const [saving,     setSaving]     = useState(false);
  const [message,    setMessage]    = useState({ text:"", type:"" });

  const showMsg = (text, type="success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text:"", type:"" }), 3500);
  };

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE);
      if (res.ok) setFeedbacks(await res.json());
    } catch { setFeedbacks([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFeedbacks(); }, [fetchFeedbacks]);

  const handleReply = async (id) => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/${id}/reply`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: replyStatus, adminReply: replyText }),
      });
      if (res.ok) {
        showMsg("Reply sent successfully.");
        setReplyId(null); setReplyText(""); setReplyStatus("Reviewed");
        fetchFeedbacks();
      } else showMsg("Reply failed.", "error");
    } catch { showMsg("Network error.", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this feedback?")) return;
    try {
      await fetch(`${BASE}/${id}`, { method:"DELETE" });
      showMsg("Feedback deleted.");
      fetchFeedbacks();
    } catch { showMsg("Delete failed.", "error"); }
  };

  // Stats
  const avgRating = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
    : "—";
  const counts = {
    all:      feedbacks.length,
    Pending:  feedbacks.filter(f => f.status === "Pending").length,
    Reviewed: feedbacks.filter(f => f.status === "Reviewed").length,
    Resolved: feedbacks.filter(f => f.status === "Resolved").length,
  };

  const filtered = feedbacks.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = (f.studentName||"").toLowerCase().includes(q) ||
                        (f.message||"").toLowerCase().includes(q)      ||
                        (f.category||"").toLowerCase().includes(q);
    const matchStatus = filter === "all" || f.status === filter;
    const matchCat    = catFilter === "all" || f.category === catFilter;
    return matchSearch && matchStatus && matchCat;
  });

  return (
    <div className="dashboard">
      <UnifiedNavbar />
      <div className="main-content">

        {/* Header */}
        <div style={{ marginBottom:"var(--space-8)" }}>
          <h1 style={{ fontSize:"var(--text-3xl)", fontFamily:"var(--font-display)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)", letterSpacing:"-0.02em", marginBottom:"var(--space-2)" }}>
            Feedback Reviews
          </h1>
          <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-tertiary)", fontWeight:"var(--font-medium)" }}>
            Review and respond to student feedback
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"var(--space-4)", marginBottom:"var(--space-8)" }}>
          {[
            { label:"Total",      value: counts.all,      color:"var(--color-brand-primary)", bg:"#F5F3FF" },
            { label:"Avg Rating", value: avgRating + " ⭐", color:"#D97706",                   bg:"#FEF3C7" },
            { label:"Pending",    value: counts.Pending,  color:"#D97706",                   bg:"#FEF3C7" },
            { label:"Reviewed",   value: counts.Reviewed, color:"#2563EB",                   bg:"#EFF6FF"  },
            { label:"Resolved",   value: counts.Resolved, color:"#059669",                   bg:"#D1FAE5" },
          ].map(s => (
            <div key={s.label} style={{ background:s.bg, borderRadius:"var(--radius-xl)", padding:"var(--space-5)", border:"1px solid var(--color-border)", boxShadow:"var(--shadow-xs)" }}>
              <div style={{ fontSize:"var(--text-2xl)", fontWeight:"var(--font-bold)", color:s.color, lineHeight:1.1, letterSpacing:"-0.02em", marginBottom:"var(--space-1)" }}>{s.value}</div>
              <div style={{ fontSize:"var(--text-xs)", fontWeight:"var(--font-semibold)", color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {message.text && <div className={`message ${message.type}`} style={{ marginBottom:"var(--space-5)" }}>{message.text}</div>}

        {/* Toolbar */}
        <div className="grid-toolbar" style={{ marginBottom:"var(--space-5)" }}>
          <h2 className="grid-toolbar-title">
            Feedbacks <span className="grid-count-badge">{filtered.length}</span>
          </h2>
          <div className="grid-search-wrap">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l3.5 3.5" strokeLinecap="round"/></svg>
            <input className="grid-search" type="text" placeholder="Search name, message…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="grid-filter-tabs">
            {["all","Pending","Reviewed","Resolved"].map(f => (
              <button key={f} className={`grid-filter-btn ${filter===f?"active":""}`} onClick={() => setFilter(f)}>
                {f === "all" ? "All" : f}{f !== "all" && counts[f] > 0 ? ` (${counts[f]})` : ""}
              </button>
            ))}
          </div>
          <div className="grid-filter-tabs">
            {["all",...Object.keys(CATEGORIES)].map(c => (
              <button key={c} className={`grid-filter-btn ${catFilter===c?"active":""}`} onClick={() => setCatFilter(c)}>
                {c === "all" ? "All" : CATEGORIES[c]?.icon + " " + CATEGORIES[c]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback list */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"var(--space-16)", color:"var(--color-text-tertiary)", fontSize:"var(--text-sm)" }}>Loading feedbacks…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"var(--space-16)", background:"var(--color-surface)", borderRadius:"var(--radius-xl)", border:"1px solid var(--color-border)", color:"var(--color-text-tertiary)", fontSize:"var(--text-sm)" }}>No feedbacks found.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-4)" }}>
            {filtered.map(f => {
              const sc    = STATUS_CONFIG[f.status] || STATUS_CONFIG.Pending;
              const cat   = CATEGORIES[f.category];
              const isOpen = replyId === f.id;

              return (
                <div key={f.id} style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"var(--space-6)", boxShadow:"var(--shadow-xs)", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", left:0, top:0, bottom:0, width:"4px", background:f.rating >= 4 ? "#059669" : f.rating >= 3 ? "#D97706" : "#DC2626", borderRadius:"var(--radius-xl) 0 0 var(--radius-xl)" }} />

                  {/* Top row */}
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"var(--space-4)", flexWrap:"wrap", marginBottom:"var(--space-4)" }}>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", flexWrap:"wrap", marginBottom:"var(--space-2)" }}>
                        <span style={{ fontSize:"1.1rem" }}>{cat?.icon || "💬"}</span>
                        <span style={{ fontSize:"var(--text-base)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)" }}>{cat?.label || f.category}</span>
                        <StarDisplay rating={f.rating} />
                        <span style={{ fontSize:"10px", fontWeight:"var(--font-bold)", padding:"2px 10px", borderRadius:"var(--radius-full)", background:sc.bg, color:sc.color, textTransform:"uppercase", letterSpacing:"0.05em" }}>{f.status}</span>
                      </div>
                      <div style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)" }}>
                        By: <strong>{f.studentName}</strong> •{" "}
                        {f.submittedAt ? new Date(f.submittedAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"var(--space-2)" }}>
                      {f.status === "Pending" && (
                        <button onClick={() => { setReplyId(isOpen ? null : f.id); setReplyText(""); setReplyStatus("Reviewed"); }}
                          style={{ padding:"var(--space-2) var(--space-4)", borderRadius:"var(--radius-md)", border:"1.5px solid var(--color-brand-primary)", background:"#F5F3FF", color:"var(--color-brand-primary)", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", cursor:"pointer" }}>
                          {isOpen ? "Cancel" : "Reply"}
                        </button>
                      )}
                      <button onClick={() => handleDelete(f.id)} className="person-icon-btn delete-icon" title="Delete">
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M3 3l8 8M11 3l-8 8"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* Message */}
                  <div style={{ fontSize:"var(--text-sm)", color:"var(--color-text-secondary)", lineHeight:"var(--leading-relaxed)", background:"var(--color-neutral-50)", padding:"var(--space-4)", borderRadius:"var(--radius-lg)", border:"1px solid var(--color-border)", marginBottom: (f.adminReply || isOpen) ? "var(--space-4)" : 0 }}>
                    {f.message}
                  </div>

                  {/* Existing reply */}
                  {f.adminReply && !isOpen && (
                    <div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:"var(--radius-lg)", padding:"var(--space-4)" }}>
                      <div style={{ fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-brand-primary)", marginBottom:"var(--space-2)" }}>Your Reply</div>
                      <div style={{ fontSize:"var(--text-sm)", color:"var(--color-text-secondary)" }}>{f.adminReply}</div>
                    </div>
                  )}

                  {/* Reply form */}
                  {isOpen && (
                    <div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:"var(--radius-lg)", padding:"var(--space-5)" }}>
                      <div style={{ display:"flex", gap:"var(--space-2)", marginBottom:"var(--space-3)" }}>
                        {["Reviewed","Resolved"].map(s => (
                          <button key={s} type="button" onClick={() => setReplyStatus(s)}
                            style={{ flex:1, padding:"var(--space-2)", borderRadius:"var(--radius-md)", border: replyStatus===s ? `2px solid ${STATUS_CONFIG[s].color}` : "1.5px solid var(--color-border)", background: replyStatus===s ? STATUS_CONFIG[s].bg : "var(--color-surface)", color: replyStatus===s ? STATUS_CONFIG[s].color : "var(--color-text-secondary)", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", cursor:"pointer" }}>
                            {s}
                          </button>
                        ))}
                      </div>
                      <textarea placeholder="Write your reply to the student… (optional)" value={replyText} onChange={e => setReplyText(e.target.value)} rows={3}
                        style={{ width:"100%", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-md)", border:"1.5px solid #DDD6FE", background:"white", color:"var(--color-text-primary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", lineHeight:"var(--leading-relaxed)", resize:"vertical", outline:"none", boxSizing:"border-box", marginBottom:"var(--space-3)" }} />
                      <button onClick={() => handleReply(f.id)} disabled={saving} className="auth-btn" style={{ width:"100%", opacity:saving?0.75:1 }}>
                        {saving ? "Sending…" : "Send Reply"}
                      </button>
                    </div>
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

export default FeedbackAdmin;