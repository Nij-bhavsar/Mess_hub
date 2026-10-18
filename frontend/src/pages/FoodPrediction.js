import { useCallback, useEffect, useState } from "react";
import UnifiedNavbar from "../components/UnifiedNavbar";
import API from "../services/api";

const isoTomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

function FoodPrediction() {
  const [date, setDate] = useState(isoTomorrow());
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPrediction = useCallback(async (requestedDate = date) => {
    setLoading(true); setError("");
    try {
      const response = await API.get("/food-prediction", { params: { date: requestedDate } });
      setPrediction(response.data);
    } catch {
      setError("Could not load the prediction. Ensure the API is running.");
    } finally { setLoading(false); }
  }, [date]);

  useEffect(() => { loadPrediction(); }, [loadPrediction]); // Load tomorrow's plan on opening.

  const card = { background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"var(--space-6)", boxShadow:"var(--shadow-xs)" };

  return (
    <div className="dashboard">
      <UnifiedNavbar />
      <main className="main-content">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"end", gap:"var(--space-4)", flexWrap:"wrap", marginBottom:"var(--space-8)" }}>
          <div>
            <h1 style={{ fontSize:"var(--text-3xl)", marginBottom:"var(--space-2)" }}>Food AI Planner</h1>
            <p style={{ color:"var(--color-text-tertiary)" }}>Predict demand, ingredient quantities, and student-preferred dishes.</p>
          </div>
          <div style={{ display:"flex", gap:"var(--space-2)" }}>
            <input aria-label="Prediction date" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding:"10px", border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)" }} />
            <button className="grid-add-btn" onClick={() => loadPrediction()} disabled={loading}>{loading ? "Predicting…" : "Update plan"}</button>
          </div>
        </div>

        {error && <div className="message error">{error}</div>}
        {loading && !prediction ? <div style={{ padding:"var(--space-16)", textAlign:"center" }}>Calculating recommendation…</div> : prediction && <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"var(--space-4)", marginBottom:"var(--space-6)" }}>
            {[
              ["Expected diners", prediction.expectedStudents, "Students likely to eat"],
              ["Prepare servings", prediction.plannedServings, "Includes a 5% buffer"],
              ["Approved leave", prediction.inputs.approvedLeaves, "Excluded from demand"],
              ["Confidence", prediction.confidence, `${prediction.inputs.historicalSameWeekdayDays} matching weekday records`],
            ].map(([label, value, help]) => <div key={label} style={card}><div style={{ fontSize:"var(--text-2xl)", fontWeight:"var(--font-bold)", color:"var(--color-brand-primary)" }}>{value}</div><div style={{ fontWeight:"var(--font-semibold)", marginTop:"6px" }}>{label}</div><small style={{ color:"var(--color-text-tertiary)" }}>{help}</small></div>)}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"var(--space-6)" }}>
            <section style={card}>
              <h2 style={{ fontSize:"var(--text-lg)", marginBottom:"var(--space-2)" }}>Recommended food ideas</h2>
              <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-tertiary)", marginBottom:"var(--space-4)" }}>Based on requested items and past menus.</p>
              {prediction.suggestions.map((suggestion) => <div key={suggestion.item} style={{ padding:"var(--space-3) 0", borderTop:"1px solid var(--color-border)" }}><strong>{suggestion.item}</strong><div style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)", marginTop:"4px" }}>{suggestion.reason}</div></div>)}
            </section>
            <section style={card}>
              <h2 style={{ fontSize:"var(--text-lg)", marginBottom:"var(--space-2)" }}>Purchase guide</h2>
              <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-tertiary)", marginBottom:"var(--space-4)" }}>For {prediction.plannedServings} planned servings; adjust for your recipe.</p>
              {prediction.quantityGuide.map((row) => <div key={row.ingredient} style={{ display:"flex", justifyContent:"space-between", gap:"var(--space-3)", padding:"var(--space-3) 0", borderTop:"1px solid var(--color-border)" }}><div><strong>{row.ingredient}</strong><div style={{ fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)" }}>{row.perStudent} per student</div></div><strong style={{ color:"var(--color-brand-primary)" }}>{row.quantityKg} kg</strong></div>)}
            </section>
          </div>
          <p style={{ marginTop:"var(--space-6)", fontSize:"var(--text-xs)", color:"var(--color-text-tertiary)" }}>How it works: 70% recent attendance on the same weekday, 30% current roster after approved leave, then a 5% service buffer. It becomes more accurate as attendance and requests are recorded.</p>
        </>}
      </main>
    </div>
  );
}

export default FoodPrediction;
