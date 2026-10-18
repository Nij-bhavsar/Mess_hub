import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UnifiedNavbar from "../components/UnifiedNavbar";
import { downloadReceiptPDF } from "../utils/receiptPDF";
import { readAuthUser } from "../utils/authStorage";

/* ─────────────────────────────────────────────
   RAZORPAY SETUP
   1. Create account at https://razorpay.com
   2. Get your Key ID from Dashboard → Settings → API Keys
   3. Replace the key below with your actual Key ID
   ───────────────────────────────────────────── */
const RAZORPAY_KEY_ID = "rzp_test_SarYc3XX6MmNFL"; // ← Replace with your Razorpay Key ID

const MESS_PLANS = [
  { id:"monthly",   label:"Monthly Plan",   amount:3500, meals:"All meals — 30 days",      popular:true  },
  { id:"weekly",    label:"Weekly Plan",    amount:950,  meals:"All meals — 7 days",        popular:false },
  { id:"breakfast", label:"Breakfast Only", amount:1200, meals:"Breakfast only — 30 days",  popular:false },
  { id:"lunch",     label:"Lunch Only",     amount:1800, meals:"Lunch only — 30 days",      popular:false },
];

function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

function isPaidForCurrentMonth(receipt) {
  const paidAt = receipt?.paidAt || receipt?.date;
  if (!paidAt) return false;

  const paidDate = new Date(paidAt);
  if (Number.isNaN(paidDate.getTime())) return false;

  const now = new Date();
  return paidDate.getFullYear() === now.getFullYear()
    && paidDate.getMonth() === now.getMonth();
}

/* Load Razorpay script dynamically */
function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src   = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/* ── Receipt modal with PDF download ── */
function ReceiptModal({ receipt, onClose }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadReceiptPDF(receipt);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"var(--space-4)" }}>
      <div style={{ background:"var(--color-surface)", borderRadius:"var(--radius-2xl)", padding:"var(--space-8)", width:"min(500px,100%)", boxShadow:"var(--shadow-xl)", animation:"scaleIn 0.3s ease", position:"relative" }}>

        {/* Close */}
        <button onClick={onClose} style={{ position:"absolute", top:"var(--space-4)", right:"var(--space-4)", background:"var(--color-neutral-100)", border:"none", borderRadius:"var(--radius-full)", width:"32px", height:"32px", cursor:"pointer", color:"var(--color-text-secondary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem" }}>✕</button>

        {/* Success icon */}
        <div style={{ textAlign:"center", marginBottom:"var(--space-6)" }}>
          <div style={{ width:"72px", height:"72px", borderRadius:"var(--radius-full)", background:"linear-gradient(135deg,#D1FAE5,#6EE7B7)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto var(--space-4)", boxShadow:"0 8px 24px rgba(5,150,105,0.2)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ fontSize:"var(--text-xl)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)", marginBottom:"4px" }}>Payment Successful!</h2>
          <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)" }}>Receipt ID: {receipt.receiptId || receipt.id}</p>
          {receipt.razorpayPaymentId && (
            <p style={{ fontSize:"var(--text-xs)", color:"var(--color-brand-primary)", marginTop:"4px", fontWeight:"var(--font-semibold)" }}>
              Razorpay ID: {receipt.razorpayPaymentId}
            </p>
          )}
        </div>

        {/* Receipt details */}
        <div style={{ background:"var(--color-neutral-50)", borderRadius:"var(--radius-lg)", padding:"var(--space-5)", border:"1px solid var(--color-border)", marginBottom:"var(--space-5)" }}>
          {[
            { label:"Plan",    value: receipt.plan        },
            { label:"Student", value: receipt.studentName },
            { label:"Date",    value: receipt.date        },
            { label:"Method",  value: receipt.method      },
            { label:"Status",  value: "Paid ✓"            },
          ].map(row => (
            <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"var(--space-2) 0", borderBottom:"1px solid var(--color-border)" }}>
              <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)", fontWeight:"var(--font-semibold)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{row.label}</span>
              <span style={{ fontSize:"var(--text-sm)", color:"var(--color-text-primary)", fontWeight:"var(--font-medium)" }}>{row.value}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"var(--space-3)" }}>
            <span style={{ fontSize:"var(--text-sm)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)" }}>Total Paid</span>
            <span style={{ fontSize:"var(--text-xl)", fontWeight:"var(--font-bold)", background:"var(--color-brand-gradient)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              {formatCurrency(receipt.amount)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display:"flex", gap:"var(--space-3)" }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              flex:1, padding:"var(--space-3)", borderRadius:"var(--radius-lg)",
              border:"1.5px solid var(--color-brand-primary)",
              background:"#F5F3FF", color:"var(--color-brand-primary)",
              fontSize:"var(--text-sm)", fontWeight:"var(--font-bold)",
              cursor:"pointer", display:"flex", alignItems:"center",
              justifyContent:"center", gap:"var(--space-2)",
              transition:"all var(--transition-fast)",
              opacity: downloading ? 0.7 : 1,
            }}
          >
            {downloading ? "Generating…" : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2v8M4 7l4 4 4-4M2 12v2h12v-2"/>
                </svg>
                Download PDF
              </>
            )}
          </button>
          <button onClick={onClose} className="auth-btn" style={{ flex:1, padding:"var(--space-3)" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Invoice page ── */
function Invoice() {
  const navigate = useNavigate();

  const authUser     = readAuthUser() || {};
  const studentName  = authUser.name  || "Student";
  const studentId    = authUser.id    || "";
  const studentEmail = authUser.email || "";

  const [selectedPlan,  setSelectedPlan]  = useState("monthly");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [receipts,      setReceipts]      = useState([]);
  const [showReceipt,   setShowReceipt]   = useState(null);
  const [processing,    setProcessing]    = useState(false);
  const [error,         setError]         = useState("");
  const [feeInvoice,    setFeeInvoice]    = useState(null);

  const fallbackPlan = MESS_PLANS.find(p => p.id === selectedPlan);
  const plan = feeInvoice ? { id:"attendance", label:`${feeInvoice.monthLabel} attendance fee`, amount:Number(feeInvoice.subtotal), meals:`${feeInvoice.foodDays} food days × ${formatCurrency(feeInvoice.dailyRate)} per day`, popular:true } : fallbackPlan;
  const gst   = feeInvoice ? Number(feeInvoice.gst) : Math.round(plan.amount * 0.05);
  const total = feeInvoice ? Number(feeInvoice.total) : plan.amount + gst;
  const currentMonthPayment = feeInvoice?.status === "Paid" ? { paidAt:new Date().toISOString() } : receipts.find(isPaidForCurrentMonth);

  /* Load past payments from backend */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`http://localhost:5155/api/payment/student/${studentId}`);
        if (res.ok) setReceipts(await res.json());
      } catch {}
      try {
        const invoiceRes = await fetch(`http://localhost:5155/api/payment/monthly-fee/student/${studentId}`);
        if (invoiceRes.ok) setFeeInvoice(await invoiceRes.json());
      } catch {}
      try {
        const stored = JSON.parse(localStorage.getItem(`receipts_${studentId}`) || "[]");
        setReceipts(stored);
      } catch {}
    };
    if (studentId) load();
  }, [studentId]);

  /* Save payment to backend after Razorpay success */
  const savePayment = async (receiptData) => {
    let res;
    try {
      res = await fetch("http://localhost:5155/api/payment", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          studentId:   Number(studentId),
          studentName,
          plan:        receiptData.plan,
          amount:      receiptData.amount,
          method:      receiptData.method,
          status:      "Paid",
          paidAt:      receiptData.paidAt,
          receiptId:   receiptData.receiptId,
        }),
      });
    } catch {}

    if (res) {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Payment could not be recorded.");
      }
      return { ...receiptData, id: data.id };
    }

    // fallback to localStorage
    const stored = JSON.parse(localStorage.getItem(`receipts_${studentId}`) || "[]");
    stored.unshift(receiptData);
    localStorage.setItem(`receipts_${studentId}`, JSON.stringify(stored));
    return receiptData;
  };

  /* Initiate Razorpay payment */
  const handlePay = async () => {
    setError("");

    if (currentMonthPayment) {
      const paidMonth = new Date(currentMonthPayment.paidAt || currentMonthPayment.date)
        .toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      setError(`Fees for ${paidMonth} are already paid. You cannot pay again for the same month.`);
      return;
    }

    setProcessing(true);

    const loaded = await loadRazorpay();
    if (!loaded) {
      setError("Payment gateway failed to load. Please check your internet connection.");
      setProcessing(false);
      return;
    }

    const receiptId = `RCP${Date.now()}`;
    const date      = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
    const paidAt    = new Date().toISOString();

    /* ─── Razorpay options ─── */
    const options = {
      key:          RAZORPAY_KEY_ID,
      amount:       total * 100,        // Razorpay expects paise (multiply by 100)
      currency:     "INR",
      name:         "MessHub",
      description:  `${plan.label} — Mess Fee Payment`,
      image:        "https://via.placeholder.com/60x60.png?text=MH",
      receipt:      receiptId,

      prefill: {
        name:    studentName,
        email:   studentEmail,
        contact: "",
      },

      notes: {
        student_id:   String(studentId),
        student_name: studentName,
        plan:         plan.label,
      },

      theme: {
        color: "#6D28D9",   // brand purple
      },

      /* Called when payment is successful */
      handler: async (response) => {
        const methodLabel = paymentMethod === "upi"
          ? "UPI" : paymentMethod === "card"
          ? "Card" : "Net Banking";

        const receipt = {
          receiptId,
          id:                  receiptId,
          plan:                plan.label,
          amount:              total,
          method:              methodLabel,
          studentName,
          studentId,
          email:               studentEmail,
          date,
          paidAt,
          razorpayPaymentId:   response.razorpay_payment_id,
          razorpayOrderId:     response.razorpay_order_id,
          razorpaySignature:   response.razorpay_signature,
        };

        try {
          const saved = await savePayment(receipt);
          setReceipts(prev => [saved, ...prev]);
          setShowReceipt(saved);
        } catch (err) {
          setError(err.message || "Payment completed, but the receipt could not be saved.");
        } finally {
          setProcessing(false);
        }
      },

      /* Called when user closes payment modal */
      modal: {
        ondismiss: () => {
          setProcessing(false);
          setError("Payment cancelled. Please try again.");
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        setError(`Payment failed: ${resp.error.description}`);
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      setError("Failed to open payment gateway. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="dashboard">
      <UnifiedNavbar />

      {showReceipt && (
        <ReceiptModal
          receipt={showReceipt}
          onClose={() => { setShowReceipt(null); navigate("/student"); }}
        />
      )}

      <div className="main-content">

        {/* Header */}
        <div style={{ marginBottom:"var(--space-8)" }}>
          <h1 style={{ fontSize:"var(--text-3xl)", fontFamily:"var(--font-display)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)", letterSpacing:"-0.02em", marginBottom:"var(--space-2)" }}>
            Mess Invoice & Payment
          </h1>
          <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-tertiary)", fontWeight:"var(--font-medium)" }}>
            Choose your plan and pay securely via Razorpay
          </p>
        </div>

        {error && (
          <div className="message error" style={{ marginBottom:"var(--space-5)", animation:"fadeIn 0.2s ease" }}>
            {error}
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr minmax(0,340px)", gap:"var(--space-6)", alignItems:"start" }}>

          {/* ── Left — Plan + Payment method ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-5)" }}>

            {/* Step 1 — Choose Plan */}
            <div style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"var(--space-6)", boxShadow:"var(--shadow-xs)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", marginBottom:"var(--space-5)" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"var(--radius-full)", background:"var(--color-brand-gradient)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"white" }}>1</div>
                <span style={{ fontSize:"var(--text-base)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)" }}>Choose Your Plan</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-3)" }}>
                {(feeInvoice ? [plan] : MESS_PLANS).map(p => (
                  <div key={p.id} onClick={() => setSelectedPlan(p.id)} style={{
                    padding:"var(--space-4)", borderRadius:"var(--radius-lg)", cursor:"pointer", position:"relative",
                    border: selectedPlan===p.id ? "2px solid var(--color-brand-primary)" : "1.5px solid var(--color-border)",
                    background: selectedPlan===p.id ? "#F5F3FF" : "var(--color-neutral-50)",
                    transition:"all var(--transition-fast)",
                    boxShadow: selectedPlan===p.id ? "var(--shadow-brand)" : "none",
                  }}>
                    {p.popular && (
                      <span style={{ position:"absolute", top:"-10px", right:"var(--space-3)", background:"var(--color-brand-gradient)", color:"white", fontSize:"9px", fontWeight:"var(--font-bold)", padding:"2px 8px", borderRadius:"var(--radius-full)", letterSpacing:"0.05em", textTransform:"uppercase" }}>Popular</span>
                    )}
                    <div style={{ fontSize:"var(--text-sm)", fontWeight:"var(--font-bold)", color: selectedPlan===p.id ? "var(--color-brand-primary)" : "var(--color-text-primary)", marginBottom:"4px" }}>{p.label}</div>
                    <div style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)", marginBottom:"var(--space-3)" }}>{p.meals}</div>
                    <div style={{ fontSize:"var(--text-xl)", fontWeight:"var(--font-bold)", color: selectedPlan===p.id ? "var(--color-brand-primary)" : "var(--color-text-primary)" }}>{formatCurrency(p.amount)}</div>
                  </div>
                ))}
              </div>
              {feeInvoice && (
                <div style={{ marginTop:"var(--space-4)", padding:"var(--space-4)", borderRadius:"var(--radius-lg)", background:"#F0FDF4", border:"1px solid #BBF7D0" }}>
                  <strong style={{ color:"#166534" }}>Day-wise meal fee</strong>
                  <div style={{ fontSize:"var(--text-sm)", marginTop:"6px", color:"var(--color-text-secondary)" }}>You are charged only for days marked Present in attendance.</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginTop:"var(--space-3)" }}>{feeInvoice.attendanceDates.map(day => <span key={day} style={{ background:"white", border:"1px solid #BBF7D0", borderRadius:"999px", padding:"4px 8px", fontSize:"11px", color:"#166534" }}>{day}</span>)}</div>
                  {feeInvoice.foodDays === 0 && <div style={{ fontSize:"var(--text-sm)", marginTop:"8px", color:"#166534" }}>No present meal days recorded for this month.</div>}
                </div>
              )}
            </div>

            {/* Step 2 — Payment method */}
            {/* <div style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"var(--space-6)", boxShadow:"var(--shadow-xs)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", marginBottom:"var(--space-5)" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"var(--radius-full)", background:"var(--color-brand-gradient)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"white" }}>2</div>
                <span style={{ fontSize:"var(--text-base)", fontWeight:"var(--font-bold)", color:"var(--color-text-primary)" }}>Payment Method</span>
              </div>
              <p style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)", marginBottom:"var(--space-4)", lineHeight:"var(--leading-relaxed)" }}>
                Razorpay supports UPI, Cards, Net Banking, and Wallets. Select your preferred method below — you can also change it inside the payment window.
              </p> */}
              {/* <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-2)" }}>
                {[
                  { id:"upi",        label:"UPI (GPay, PhonePe, Paytm…)", icon:"📱" },
                  { id:"card",       label:"Debit / Credit Card",           icon:"💳" },
                  { id:"netbanking", label:"Net Banking",                   icon:"🏦" },
                ].map(m => (
                  <div key={m.id} onClick={() => setPaymentMethod(m.id)} style={{
                    display:"flex", alignItems:"center", gap:"var(--space-3)",
                    padding:"var(--space-4)", borderRadius:"var(--radius-lg)", cursor:"pointer",
                    border: paymentMethod===m.id ? "2px solid var(--color-brand-primary)" : "1.5px solid var(--color-border)",
                    background: paymentMethod===m.id ? "#F5F3FF" : "var(--color-neutral-50)",
                    transition:"all var(--transition-fast)",
                  }}>
                    <span style={{ fontSize:"1.3rem" }}>{m.icon}</span>
                    <span style={{ fontSize:"var(--text-sm)", fontWeight:"var(--font-semibold)", color: paymentMethod===m.id ? "var(--color-brand-primary)" : "var(--color-text-primary)" }}>{m.label}</span>
                    {paymentMethod===m.id && (
                      <svg style={{ marginLeft:"auto" }} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-brand-primary)" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 8 7 12 13 4"/></svg>
                    )}
                  </div>
                ))}
              </div> */}
            {/* </div> */}

            {/* Razorpay badge */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"var(--space-3)", padding:"var(--space-3)", background:"var(--color-neutral-50)", borderRadius:"var(--radius-lg)", border:"1px solid var(--color-border)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-secondary)", fontWeight:"var(--font-medium)" }}>
                Secured by <strong>Razorpay</strong> — 256-bit SSL encryption
              </span>
            </div>

            {currentMonthPayment && (
              <div className="message error" style={{ marginBottom:"0" }}>
                Fees for this month are already paid. You cannot pay again for the same month.
              </div>
            )}

            {/* Pay button */}
            <button
              className="auth-btn"
              onClick={handlePay}
              disabled={processing || !!currentMonthPayment}
              style={{ width:"100%", fontSize:"var(--text-base)", padding:"var(--space-4)", opacity: processing || currentMonthPayment ? 0.8 : 1 }}
            >
              {processing ? (
                <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"var(--space-2)" }}>
                  <span style={{ width:"18px", height:"18px", border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"white", borderRadius:"50%", display:"inline-block", animation:"spin 0.8s linear infinite" }} />
                  Opening payment window…
                </span>
              ) : currentMonthPayment ? "This month is already paid" : `Pay ${formatCurrency(total)} →`}
            </button>
          </div>

          {/* ── Right — Summary + History ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-4)" }}>

            {/* Order summary */}
            <div style={{ background:"var(--color-brand-gradient)", borderRadius:"var(--radius-xl)", padding:"var(--space-6)", color:"white", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", right:"-20px", top:"-20px", width:"100px", height:"100px", borderRadius:"50%", background:"rgba(255,255,255,0.08)", pointerEvents:"none" }} />
              <div style={{ fontSize:"var(--text-xs)", color:"rgba(255,255,255,0.7)", fontWeight:"var(--font-bold)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"var(--space-4)" }}>
                Order Summary
              </div>
              {[
                { label: plan.label,  value: formatCurrency(plan.amount) },
                { label: "GST (5%)", value: formatCurrency(gst)         },
              ].map(row => (
                <div key={row.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:"var(--space-2)" }}>
                  <span style={{ fontSize:"var(--text-sm)", color:"rgba(255,255,255,0.8)" }}>{row.label}</span>
                  <span style={{ fontSize:"var(--text-sm)", color:"white", fontWeight:"var(--font-semibold)" }}>{row.value}</span>
                </div>
              ))}
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.2)", marginTop:"var(--space-3)", paddingTop:"var(--space-3)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:"var(--text-sm)", fontWeight:"var(--font-bold)", color:"white" }}>Total</span>
                <span style={{ fontSize:"var(--text-2xl)", fontWeight:"var(--font-bold)", color:"white" }}>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Student info */}
            <div style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"var(--space-5)", boxShadow:"var(--shadow-xs)" }}>
              <div style={{ fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-3)" }}>Student Info</div>
              {[
                { label:"Name",  value: studentName  },
                { label:"ID",    value: `#${studentId}` },
                { label:"Email", value: studentEmail  },
              ].map(row => (
                <div key={row.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:"var(--space-2)" }}>
                  <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)" }}>{row.label}</span>
                  <span style={{ fontSize:"var(--text-xs)", fontWeight:"var(--font-semibold)", color:"var(--color-text-primary)" }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Payment history */}
            {receipts.length > 0 && (
              <div style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"var(--space-5)", boxShadow:"var(--shadow-xs)" }}>
                <div style={{ fontSize:"var(--text-xs)", fontWeight:"var(--font-bold)", color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"var(--space-4)" }}>
                  Payment History
                </div>
                {receipts.slice(0, 5).map((r, i) => (
                  <div key={r.id || r.receiptId || i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"var(--space-3)", borderRadius:"var(--radius-md)", marginBottom:"var(--space-2)", border:"1px solid var(--color-border)", background:"var(--color-neutral-50)" }}>
                    <div>
                      <div style={{ fontSize:"var(--text-xs)", fontWeight:"var(--font-semibold)", color:"var(--color-text-primary)" }}>{r.plan}</div>
                      <div style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)" }}>{r.date || r.paidAt?.slice(0,10)}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:"var(--text-sm)", fontWeight:"var(--font-bold)", color:"var(--color-success)" }}>{formatCurrency(r.amount)}</div>
                        <div style={{ fontSize:"9px", background:"var(--color-success-light)", color:"var(--color-success-dark)", padding:"1px 6px", borderRadius:"var(--radius-full)", fontWeight:"var(--font-bold)" }}>PAID</div>
                      </div>
                      <button
                        onClick={async () => { await downloadReceiptPDF({ ...r, email: studentEmail }); }}
                        title="Download PDF"
                        style={{ width:"28px", height:"28px", borderRadius:"var(--radius-md)", border:"1px solid var(--color-border)", background:"var(--color-surface)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--color-brand-primary)", transition:"all var(--transition-fast)" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 2v8M4 7l4 4 4-4M2 12v2h12v-2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Invoice;
