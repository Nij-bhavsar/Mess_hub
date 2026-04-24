/**
 * receiptPDF.js
 * Generates and downloads a professional PDF receipt using jsPDF.
 * jsPDF is loaded dynamically from CDN — no npm install needed.
 */

async function loadJsPDF() {
  if (window.jspdf) return window.jspdf.jsPDF;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = () => resolve(window.jspdf.jsPDF);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function downloadReceiptPDF(receipt) {
  const jsPDF = await loadJsPDF();
  const doc   = new jsPDF({ unit:"mm", format:"a4" });

  const W = 210; // A4 width mm
  const margin = 20;
  let y = 0;

  // ── Helpers ──
  const text  = (str, x, yy, opts = {}) => doc.text(String(str || ""), x, yy, opts);
  const line  = (x1, y1, x2, y2) => { doc.line(x1, y1, x2, y2); };
  const rect  = (x, yy, w, h, style = "F") => doc.rect(x, yy, w, h, style);

  // ── Header band ──
  doc.setFillColor(76, 29, 149); // brand purple #4C1D95
  rect(0, 0, W, 42);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  text("MessHub", margin, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  text("Mess Management System", margin, 26);
  text("Payment Receipt", margin, 33);

  // Receipt ID top-right
  doc.setFontSize(9);
  const rcpLabel = `Receipt: ${receipt.receiptId || receipt.id || "—"}`;
  text(rcpLabel, W - margin, 18, { align:"right" });
  text(receipt.date || new Date().toLocaleDateString("en-IN"), W - margin, 25, { align:"right" });

  y = 52;

  // ── Payment Successful badge ──
  doc.setFillColor(236, 253, 245);
  rect(margin, y - 5, W - margin * 2, 14, "F");
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.5);
  rect(margin, y - 5, W - margin * 2, 14, "S");

  doc.setTextColor(5, 150, 105);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  text("✓  Payment Successful", W / 2, y + 4, { align:"center" });

  y += 20;

  // ── Student details section ──
  doc.setTextColor(28, 25, 23);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  text("STUDENT DETAILS", margin, y);
  doc.setDrawColor(109, 40, 217);
  doc.setLineWidth(0.8);
  line(margin, y + 2, margin + 45, y + 2);
  y += 8;

  const studentRows = [
    ["Student Name", receipt.studentName || "—"],
    ["Student ID",   receipt.studentId   || "—"],
    ["Email",        receipt.email        || "—"],
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  studentRows.forEach(([label, val]) => {
    doc.setTextColor(120, 116, 108);
    text(label, margin, y);
    doc.setTextColor(28, 25, 23);
    doc.setFont("helvetica", "bold");
    text(val, margin + 45, y);
    doc.setFont("helvetica", "normal");
    y += 7;
  });

  y += 6;

  // ── Payment details section ──
  doc.setTextColor(28, 25, 23);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  text("PAYMENT DETAILS", margin, y);
  doc.setDrawColor(109, 40, 217);
  doc.setLineWidth(0.8);
  line(margin, y + 2, margin + 45, y + 2);
  y += 8;

  const payRows = [
    ["Plan",           receipt.plan    || "—"],
    ["Payment Method", receipt.method  || "—"],
    ["Transaction Date", receipt.date  || "—"],
    ["Status",         "Paid"],
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  payRows.forEach(([label, val]) => {
    doc.setTextColor(120, 116, 108);
    text(label, margin, y);
    doc.setTextColor(28, 25, 23);
    doc.setFont("helvetica", "bold");
    if (label === "Status") {
      doc.setTextColor(5, 150, 105);
    }
    text(val, margin + 55, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(28, 25, 23);
    y += 7;
  });

  y += 6;

  // ── Amount breakdown table ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(28, 25, 23);
  text("AMOUNT BREAKDOWN", margin, y);
  doc.setDrawColor(109, 40, 217);
  doc.setLineWidth(0.8);
  line(margin, y + 2, margin + 50, y + 2);
  y += 8;

  const baseAmount = Math.round((receipt.amount || 0) / 1.05);
  const gst        = (receipt.amount || 0) - baseAmount;

  const amountRows = [
    ["Plan Amount",    `Rs. ${baseAmount.toLocaleString("en-IN")}`],
    ["GST (5%)",       `Rs. ${gst.toLocaleString("en-IN")}`],
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  amountRows.forEach(([label, val]) => {
    doc.setTextColor(120, 116, 108);
    text(label, margin, y);
    doc.setTextColor(28, 25, 23);
    text(val, W - margin, y, { align:"right" });
    doc.setDrawColor(232, 230, 227);
    doc.setLineWidth(0.3);
    line(margin, y + 2, W - margin, y + 2);
    y += 8;
  });

  // Total row
  doc.setFillColor(76, 29, 149);
  rect(margin, y - 4, W - margin * 2, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  text("TOTAL PAID", margin + 4, y + 4);
  text(`Rs. ${Number(receipt.amount || 0).toLocaleString("en-IN")}`, W - margin - 4, y + 4, { align:"right" });

  y += 22;

  // ── Razorpay transaction ID if present ──
  if (receipt.razorpayPaymentId) {
    doc.setFillColor(245, 243, 255);
    rect(margin, y - 4, W - margin * 2, 12, "F");
    doc.setDrawColor(109, 40, 217);
    doc.setLineWidth(0.3);
    rect(margin, y - 4, W - margin * 2, 12, "S");
    doc.setTextColor(109, 40, 217);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    text(`Razorpay Transaction ID: ${receipt.razorpayPaymentId}`, W / 2, y + 4, { align:"center" });
    y += 18;
  }

  // ── Footer ──
  doc.setDrawColor(232, 230, 227);
  doc.setLineWidth(0.5);
  line(margin, 270, W - margin, 270);

  doc.setTextColor(168, 164, 157);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  text("This is a computer-generated receipt and does not require a signature.", W / 2, 276, { align:"center" });
  text("MessHub — Mess Management System  |  Generated on " + new Date().toLocaleDateString("en-IN"), W / 2, 282, { align:"center" });

  // ── Save ──
  const filename = `MessHub_Receipt_${receipt.receiptId || receipt.id || "payment"}.pdf`;
  doc.save(filename);
}