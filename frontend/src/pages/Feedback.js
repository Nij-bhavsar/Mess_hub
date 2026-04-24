import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import UnifiedNavbar from "../components/UnifiedNavbar";
import { readAuthUser } from "../utils/authStorage";

const BASE = "http://localhost:5155/api/feedback";

const CATEGORIES = [
  { value:"food_quality", label:"Food Quality", icon:"🍽️" },
  { value:"cleanliness",  label:"Cleanliness",  icon:"🧹" },
  { value:"service",      label:"Service",       icon:"👨‍🍳" },
  { value:"menu_variety", label:"Menu Variety",  icon:"📋" },
  { value:"timing",       label:"Meal Timing",   icon:"⏰" },
  { value:"other",        label:"Other",         icon:"💬" },
];

const RATINGS = [
  { value:5, label:"Excellent", color:"#059669" },
  { value:4, label:"Good",      color:"#16A34A" },
  { value:3, label:"Average",   color:"#D97706" },
  { value:2, label:"Poor",      color:"#DC2626" },
  { value:1, label:"Very Poor", color:"#991B1B" },
];

const STATUS_CONFIG = {
  Pending:  { color:"#D97706", bg:"#FEF3C7" },
  Reviewed: { color:"#2563EB", bg:"#EFF6FF"  },
  Resolved: { color:"#059669", bg:"#D1FAE5"  },
};

function StarIcon({ filled, color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function StarDisplay({ rating, size = 14 }) {
  return (
    <div style={{ display:"flex", gap:"2px" }}>
      {[1,2,3,4,5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= rating ? "#D97706" : "none"} stroke="#D97706" strokeWidth="1.8">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

function Feedback() {
  const navigate = useNavigate();
  const authUser    = readAuthUser() || {};
  const studentId   = authUser.id   || null;
  const studentName = authUser.name || "Student";

  const [category,    setCategory]    = useState("");
  const [rating,      setRating]      = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [msg,         setMsg]         = useState("");
  const [anonymous,   setAnonymous]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [showForm,    setShowForm]    = useState(true);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const charLimit   = 500;
  const activeRating = hoverRating || rating;
  const ratingInfo   = RATINGS.find(r => r.value === activeRating);

  const fetchMyFeedbacks = useCallback(async () => {
    if (!studentId) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${BASE}/student/${studentId}`);
      if (res.ok) setMyFeedbacks(await res.json());
    } catch {}
    finally { setLoadingHistory(false); }
  }, [studentId]);

  useEffect(() => { fetchMyFeedbacks(); }, [fetchMyFeedbacks]);

  const validate = () => {
    if (!category)              return "Please select a category.";
    if (rating === 0)           return "Please give a rating.";
    if (!msg.trim())            return "Please write your feedback.";
    if (msg.trim().length < 10) return "Feedback must be at least 10 characters.";
    return null;
  };

  const handleSubmit = async () => {
    setError("");
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const res = await fetch(BASE, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          studentId:   anonymous ? null : studentId,
          studentName: anonymous ? "Anonymous" : studentName,
          category,
          rating,
          message:     msg.trim(),
          anonymous,
          submittedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setCategory(""); setRating(0); setMsg(""); setAnonymous(false);
        setShowForm(false);
        fetchMyFeedbacks();
      } else {
        const d = await res.json();
        setError(d.message || "Submission failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <UnifiedNavbar />
      <div className="main-content">

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"var(--space-4)", marginBottom:"var(--space-8)" }}>
          <div>
            <h1 style={{ fontSize:"var(--text-3xl)", fontFamily:"var(--font-display)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)", letterSpacing:"-0.02em", marginBottom:"var(--space-2)" }}>
              Feedback
            </h1>
            <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-tertiary)", fontWeight:"var(--font-medium)" }}>
              Share your mess experience and track your submissions
            </p>
          </div>
          <button className="grid-add-btn" onClick={() => setShowForm(s => !s)}>
            {showForm ? "✕ Close Form" : "+ Give Feedback"}
          </button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr minmax(0,360px)", gap:"var(--space-6)", alignItems:"start" }}>

          {/* ── Left — Form or History ── */}
          <div>
            {showForm && (
              <div style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"var(--space-7)", marginBottom:"var(--space-6)", boxShadow:"var(--shadow-sm)", position:"relative", animation:"slideInUp 0.3s ease" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:"4px", background:"var(--color-brand-gradient)", borderRadius:"var(--radius-xl) var(--radius-xl) 0 0" }} />

                <h3 style={{ fontSize:"var(--text-xl)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)", letterSpacing:"-0.02em", marginBottom:"var(--space-6)" }}>
                  New Feedback
                </h3>

                {error && <div className="message error" style={{ marginBottom:"var(--space-4)" }}>{error}</div>}

                {/* Category */}
                <div style={{ marginBottom:"var(--space-5)" }}>
                  <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-3)" }}>
                    Category <span style={{ color:"var(--color-danger)" }}>*</span>
                  </label>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"var(--space-2)" }}>
                    {CATEGORIES.map(cat => (
                      <button key={cat.value} type="button" onClick={() => { setCategory(cat.value); setError(""); }}
                        style={{ padding:"var(--space-3) var(--space-2)", borderRadius:"var(--radius-lg)", border: category===cat.value ? "2px solid var(--color-brand-primary)" : "1.5px solid var(--color-border)", background: category===cat.value ? "#F5F3FF" : "var(--color-neutral-50)", color: category===cat.value ? "var(--color-brand-primary)" : "var(--color-text-secondary)", fontWeight: category===cat.value ? "var(--font-bold)" : "var(--font-medium)", fontSize:"var(--text-xs)", cursor:"pointer", transition:"all var(--transition-fast)", display:"flex", flexDirection:"column", alignItems:"center", gap:"var(--space-1)", boxShadow: category===cat.value ? "var(--shadow-brand)" : "none" }}>
                        <span style={{ fontSize:"1.3rem", lineHeight:1 }}>{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div style={{ marginBottom:"var(--space-5)" }}>
                  <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-3)" }}>
                    Rating <span style={{ color:"var(--color-danger)" }}>*</span>
                  </label>
                  <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)" }}>
                    <div style={{ display:"flex", gap:"var(--space-1)" }}>
                      {[1,2,3,4,5].map(star => (
                        <button key={star} type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => { setRating(star); setError(""); }}
                          style={{ background:"none", border:"none", cursor:"pointer", padding:"2px", color: activeRating>=star ? (ratingInfo?.color || "#D97706") : "var(--color-neutral-300)", transition:"all 0.15s ease", transform: activeRating>=star ? "scale(1.1)" : "scale(1)" }}>
                          <StarIcon filled={activeRating>=star} color={activeRating>=star ? (ratingInfo?.color || "#D97706") : "var(--color-neutral-300)"} />
                        </button>
                      ))}
                    </div>
                    {activeRating > 0 && (
                      <span style={{ fontSize:"var(--text-sm)", fontWeight:"var(--font-bold)", color:ratingInfo?.color, animation:"fadeIn 0.15s ease" }}>
                        {ratingInfo?.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div style={{ marginBottom:"var(--space-5)" }}>
                  <label style={{ display:"block", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-3)" }}>
                    Your Feedback <span style={{ color:"var(--color-danger)" }}>*</span>
                  </label>
                  <div style={{ position:"relative" }}>
                    <textarea placeholder="Tell us about your experience…" value={msg} onChange={e => { setMsg(e.target.value.slice(0, charLimit)); setError(""); }} rows={5}
                      style={{ width:"100%", padding:"var(--space-4)", borderRadius:"var(--radius-lg)", border:`1.5px solid ${msg.length > 0 ? "var(--color-brand-primary)" : "var(--color-border)"}`, background:"var(--color-neutral-50)", color:"var(--color-text-primary)", fontSize:"var(--text-sm)", fontFamily:"var(--font-body)", lineHeight:"var(--leading-relaxed)", resize:"vertical", outline:"none", boxSizing:"border-box", boxShadow: msg.length > 0 ? "var(--shadow-focus)" : "none" }} />
                    <div style={{ position:"absolute", bottom:"var(--space-3)", right:"var(--space-3)", fontSize:"var(--text-xs)", color: msg.length > charLimit*0.9 ? "var(--color-danger)" : "var(--color-text-tertiary)", pointerEvents:"none" }}>
                      {msg.length}/{charLimit}
                    </div>
                  </div>
                </div>

                {/* Anonymous toggle */}
                <div onClick={() => setAnonymous(!anonymous)} style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", padding:"var(--space-4)", background:"var(--color-neutral-50)", borderRadius:"var(--radius-lg)", border:"1px solid var(--color-border)", marginBottom:"var(--space-6)", cursor:"pointer" }}>
                  <div style={{ width:"44px", height:"24px", borderRadius:"var(--radius-full)", background: anonymous ? "var(--color-brand-gradient)" : "var(--color-neutral-300)", position:"relative", flexShrink:0, transition:"background var(--transition-base)", boxShadow: anonymous ? "var(--shadow-brand)" : "none" }}>
                    <div style={{ position:"absolute", top:"3px", left: anonymous ? "23px" : "3px", width:"18px", height:"18px", borderRadius:"var(--radius-full)", background:"white", boxShadow:"0 1px 4px rgba(0,0,0,0.15)", transition:"left var(--transition-spring)" }} />
                  </div>
                  <div>
                    <div style={{ fontSize:"var(--text-sm)", fontWeight:"var(--font-semibold)", color:"var(--color-text-primary)" }}>Submit anonymously</div>
                    <div style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)", marginTop:"2px" }}>Your name won't be attached to this feedback</div>
                  </div>
                </div>

                <button className="auth-btn" onClick={handleSubmit} disabled={loading} style={{ width:"100%", opacity:loading?0.75:1 }}>
                  {loading ? "Submitting…" : "Submit Feedback"}
                </button>
              </div>
            )}

            {/* My feedback history */}
            <div>
              <h3 style={{ fontSize:"var(--text-lg)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)", marginBottom:"var(--space-4)", letterSpacing:"-0.01em" }}>
                My Submissions
                {myFeedbacks.length > 0 && (
                  <span style={{ marginLeft:"var(--space-2)", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", background:"var(--color-brand-gradient)", color:"white", padding:"2px 8px", borderRadius:"var(--radius-full)" }}>
                    {myFeedbacks.length}
                  </span>
                )}
              </h3>

              {loadingHistory ? (
                <div style={{ textAlign:"center", padding:"var(--space-10)", color:"var(--color-text-tertiary)", fontSize:"var(--text-sm)" }}>Loading…</div>
              ) : myFeedbacks.length === 0 ? (
                <div style={{ textAlign:"center", padding:"var(--space-10)", background:"var(--color-surface)", borderRadius:"var(--radius-xl)", border:"1px solid var(--color-border)", color:"var(--color-text-tertiary)", fontSize:"var(--text-sm)" }}>
                  No feedback submitted yet.
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-3)" }}>
                  {myFeedbacks.map(f => {
                    const sc = STATUS_CONFIG[f.status] || STATUS_CONFIG.Pending;
                    const cat = CATEGORIES.find(c => c.value === f.category);
                    return (
                      <div key={f.id} style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"var(--space-5)", boxShadow:"var(--shadow-xs)" }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"var(--space-3)", flexWrap:"wrap", gap:"var(--space-2)" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
                            <span style={{ fontSize:"1.1rem" }}>{cat?.icon || "💬"}</span>
                            <span style={{ fontSize:"var(--text-sm)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)" }}>{cat?.label || f.category}</span>
                            <StarDisplay rating={f.rating} />
                          </div>
                          <span style={{ fontSize:"10px", fontWeight:"var(--font-bold)", padding:"2px 10px", borderRadius:"var(--radius-full)", background:sc.bg, color:sc.color, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                            {f.status}
                          </span>
                        </div>
                        <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-secondary)", lineHeight:"var(--leading-relaxed)", marginBottom:"var(--space-3)" }}>{f.message}</p>
                        {f.adminReply && (
                          <div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:"var(--radius-md)", padding:"var(--space-3) var(--space-4)" }}>
                            <div style={{ fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-brand-primary)", marginBottom:"4px" }}>Admin Reply</div>
                            <div style={{ fontSize:"var(--text-sm)", color:"var(--color-text-secondary)" }}>{f.adminReply}</div>
                          </div>
                        )}
                        <div style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)", marginTop:"var(--space-3)" }}>
                          {f.submittedAt ? new Date(f.submittedAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right info panel ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-4)" }}>
            <div style={{ background:"var(--color-brand-gradient)", borderRadius:"var(--radius-xl)", padding:"var(--space-6)", color:"white", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", right:"-20px", top:"-20px", width:"100px", height:"100px", borderRadius:"50%", background:"rgba(255,255,255,0.08)", pointerEvents:"none" }} />
              <div style={{ fontSize:"var(--text-xs)", color:"rgba(255,255,255,0.7)", fontWeight:"var(--font-semibold)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"var(--space-2)" }}>Submitting as</div>
              <div style={{ fontSize:"var(--text-lg)", fontWeight:"var(--font-bold)", marginBottom:"var(--space-1)" }}>{anonymous ? "Anonymous" : studentName}</div>
              <div style={{ fontSize:"var(--text-xs)", color:"rgba(255,255,255,0.65)" }}>{anonymous ? "Your identity is hidden" : authUser.email || ""}</div>
            </div>

            <div style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"var(--space-6)", boxShadow:"var(--shadow-xs)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)", marginBottom:"var(--space-4)" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"var(--radius-sm)", background:"#F5F3FF", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--color-brand-primary)" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="7"/><path d="M8 5v4M8 11v1"/></svg>
                </div>
                <span style={{ fontSize:"var(--text-sm)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)" }}>Guidelines</span>
              </div>
              {["Be specific about what needs improvement", "Keep feedback respectful and constructive", "Mention the date or meal if relevant", "Admin will review and reply to your feedback"].map((tip, i) => (
                <div key={i} style={{ display:"flex", gap:"var(--space-2)", marginBottom:"var(--space-3)", alignItems:"flex-start" }}>
                  <div style={{ width:"18px", height:"18px", borderRadius:"var(--radius-full)", background:"#F5F3FF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"1px" }}>
                    <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:"var(--color-brand-primary)" }} />
                  </div>
                  <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-secondary)", lineHeight:"var(--leading-relaxed)" }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Feedback;
