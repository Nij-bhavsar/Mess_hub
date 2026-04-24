import { useEffect, useState, useCallback } from "react";
import UnifiedNavbar from "../components/UnifiedNavbar";
import { downloadReceiptPDF } from "../utils/receiptPDF";

const AVATAR_COLORS = ["blue", "green", "amber", "rose", "purple", "orange", "cyan"];

function getInitials(name = "") {
  return name.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "ST";
}
function getColor(id) {
  return AVATAR_COLORS[Number(id) % AVATAR_COLORS.length];
}
function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}
function formatDate(str) {
  if (!str) return "—";
  try {
    return new Date(str).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
  } catch { return str; }
}

function Payments() {
  const [payments,   setPayments]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [sortAsc,    setSortAsc]    = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5155/api/payment");
      if (res.ok) {
        const data = await res.json();
        setPayments(Array.isArray(data) ? data : []);
        return;
      }
    } catch {}
    // Fallback — collect all localStorage receipts
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith("receipts_"));
    const all = allKeys.flatMap(k => {
      try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; }
    });
    all.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
    setPayments(all);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => { setLoading(false); }, [payments]);

  // Summary stats
  const totalRevenue  = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalStudents = new Set(payments.map(p => p.studentId)).size;
  const planCounts    = payments.reduce((acc, p) => {
    acc[p.plan] = (acc[p.plan] || 0) + 1;
    return acc;
  }, {});
  const uniquePlans = ["all", ...Object.keys(planCounts)];

  const filtered = payments
    .filter(p => {
      const q = search.toLowerCase();
      const matchSearch =
        (p.studentName || "").toLowerCase().includes(q) ||
        (p.plan        || "").toLowerCase().includes(q) ||
        (p.method      || "").toLowerCase().includes(q) ||
        (p.receiptId   || p.id || "").toString().toLowerCase().includes(q);
      const matchPlan = filterPlan === "all" || p.plan === filterPlan;
      return matchSearch && matchPlan;
    })
    .sort((a, b) => {
      const da = new Date(a.paidAt || 0);
      const db = new Date(b.paidAt || 0);
      return sortAsc ? da - db : db - da;
    });

  return (
    <div className="dashboard">
      <UnifiedNavbar />
      <div className="main-content">

        {/* Header */}
        <div style={{ marginBottom:"var(--space-8)" }}>
          <h1 style={{ fontSize:"var(--text-3xl)", fontFamily:"var(--font-display)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)", letterSpacing:"-0.02em", marginBottom:"var(--space-2)" }}>
            Payments
          </h1>
          <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-tertiary)", fontWeight:"var(--font-medium)" }}>
            All student mess fee payments
          </p>
        </div>

        {/* Summary stat cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"var(--space-4)", marginBottom:"var(--space-8)" }}>
          {[
            { label:"Total Revenue",  value: formatCurrency(totalRevenue), color:"var(--color-brand-primary)", bg:"#F5F3FF"           },
            { label:"Total Payments", value: payments.length,              color:"var(--color-accent-blue)",   bg:"#EFF6FF"           },
            { label:"Students Paid",  value: totalStudents,                color:"var(--color-success)",       bg:"var(--color-success-light)" },
            { label:"This Month",     value: payments.filter(p => {
                try { return new Date(p.paidAt).getMonth() === new Date().getMonth(); } catch { return false; }
              }).length,              color:"var(--color-warning)",        bg:"var(--color-warning-light)"    },
          ].map(s => (
            <div key={s.label} style={{ background:s.bg, borderRadius:"var(--radius-xl)", padding:"var(--space-5)", border:"1px solid var(--color-border)", boxShadow:"var(--shadow-xs)" }}>
              <div style={{ fontSize:"var(--text-2xl)", fontWeight:"var(--font-bold)", color:s.color, lineHeight:1.1, letterSpacing:"-0.02em", marginBottom:"var(--space-1)" }}>
                {s.value}
              </div>
              <div style={{ fontSize:"var(--text-xs)", fontWeight:"var(--font-semibold)", color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="grid-toolbar">
          <h2 className="grid-toolbar-title">
            Payment Records
            <span className="grid-count-badge">{filtered.length}</span>
          </h2>
          <div className="grid-search-wrap">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l3.5 3.5" strokeLinecap="round"/></svg>
            <input className="grid-search" type="text" placeholder="Search name, plan, receipt…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="grid-filter-tabs">
            {uniquePlans.slice(0, 5).map(p => (
              <button key={p} className={`grid-filter-btn ${filterPlan===p?"active":""}`} onClick={() => setFilterPlan(p)}>
                {p === "all" ? "All Plans" : p}
              </button>
            ))}
          </div>
          <button className="grid-sort-btn" onClick={() => setSortAsc(!sortAsc)}>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M1 3h10M3 6h6M5 9h2"/></svg>
            {sortAsc ? "Oldest" : "Newest"}
          </button>
        </div>

        {/* Payment cards grid */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"var(--space-16)", color:"var(--color-text-tertiary)", fontSize:"var(--text-sm)" }}>
            Loading payments…
          </div>
        ) : filtered.length === 0 ? (
          <div className="person-grid">
            <div className="person-grid-empty">
              {search || filterPlan !== "all" ? "No payments match your filter." : "No payment records yet."}
            </div>
          </div>
        ) : (
          <div className="person-grid">
            {filtered.map((p, i) => {
              const color = getColor(p.studentId || i);
              return (
                <div className="person-card" key={p.id || p.receiptId || i}>
                  <div className={`person-card-bar bar-${color}`} />

                  {/* Avatar */}
                  <div className={`person-avatar av-${color}`}>
                    {getInitials(p.studentName)}
                  </div>

                  {/* Name + Receipt */}
                  <div className="person-card-name">{p.studentName || "Student"}</div>
                  <div className="person-card-role">{p.receiptId || p.id}</div>

                  {/* Meta */}
                  <div className="person-card-meta">
                    <div className="person-meta-row">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="3" width="12" height="9" rx="1.5"/><path d="M1 6l6 4 6-4" strokeLinecap="round"/></svg>
                      {p.plan}
                    </div>
                    <div className="person-meta-row">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="2" width="12" height="10" rx="1.5"/><path d="M1 5h12M4 8.5h2M4 10.5h4" strokeLinecap="round"/></svg>
                      {p.method || "—"}
                    </div>
                    <div className="person-meta-row">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="3" width="12" height="9" rx="1.5"/><path d="M1 7h12M5 3V1M9 3V1" strokeLinecap="round"/></svg>
                      {formatDate(p.paidAt || p.date)}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="person-card-footer">
                    <span style={{ fontSize:"var(--text-base)", fontWeight:"var(--font-bold)", color:"var(--color-success)" }}>
                      {formatCurrency(p.amount)}
                    </span>
                    <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
                      <span className="person-status-pill sp-present">Paid</span>
                      <button
                        onClick={async () => await downloadReceiptPDF(p)}
                        title="Download Receipt PDF"
                        className="person-icon-btn edit-icon"
                      >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 2v8M4 7l4 4 4-4M2 12v2h12v-2"/>
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

export default Payments;