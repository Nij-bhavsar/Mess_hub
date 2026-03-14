import UnifiedNavbar from "../components/UnifiedNavbar";

const meals = [
  {
    slot:  "Breakfast",
    time:  "7:30 – 9:00 AM",
    item:  "Poha & Tea",
    color: "amber",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <circle cx="10" cy="7" r="4" />
        <path d="M4 17c0-3.31 2.69-6 6-6s6 2.69 6 6" />
      </svg>
    ),
  },
  {
    slot:  "Lunch",
    time:  "12:30 – 2:00 PM",
    item:  "Dal, Rice & Roti",
    color: "green",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <circle cx="10" cy="10" r="7" />
        <path d="M10 6v4l3 3" />
      </svg>
    ),
  },
  {
    slot:  "Dinner",
    time:  "7:30 – 9:00 PM",
    item:  "Paneer Sabji & Roti",
    color: "blue",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M3 5v7a7 7 0 0014 0V5" />
        <path d="M10 5V2" />
      </svg>
    ),
  },
];

const colorMap = {
  amber: {
    bar:     "#F59E0B",
    bg:      "var(--color-warning-light)",
    icon:    "var(--color-warning-dark)",
    badge:   { background: "var(--color-warning-light)", color: "var(--color-warning-dark)" },
  },
  green: {
    bar:     "#10B981",
    bg:      "var(--color-success-light)",
    icon:    "var(--color-success-dark)",
    badge:   { background: "var(--color-success-light)", color: "var(--color-success-dark)" },
  },
  blue: {
    bar:     "#3B82F6",
    bg:      "var(--color-info-light)",
    icon:    "var(--color-info-dark)",
    badge:   { background: "var(--color-info-light)", color: "var(--color-info-dark)" },
  },
};

function TodayMenu() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="dashboard">
      <UnifiedNavbar />

      <div className="main-content">

        {/* Header */}
        <div style={{ marginBottom: "var(--space-8)" }}>
          <h1 style={{
            fontSize: "var(--text-3xl)",
            fontFamily: "var(--font-display)",
            fontWeight: "var(--font-bold)",
            color: "var(--color-text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: "var(--space-2)",
          }}>
            Today's Menu
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)", fontWeight: "var(--font-medium)" }}>
            {today}
          </p>
        </div>

        {/* Meal Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "var(--space-5)",
          marginBottom: "var(--space-10)",
        }}>
          {meals.map((meal) => {
            const c = colorMap[meal.color];
            return (
              <div
                key={meal.slot}
                className="card"
                style={{ padding: "var(--space-6)", cursor: "default" }}
              >
                {/* Coloured top bar override */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                  background: c.bar, borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
                }} />

                {/* Icon circle */}
                <div style={{
                  width: "44px", height: "44px", borderRadius: "var(--radius-md)",
                  background: c.bg, display: "flex", alignItems: "center",
                  justifyContent: "center", color: c.icon, marginBottom: "var(--space-4)",
                }}>
                  {meal.icon}
                </div>

                <div style={{
                  fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)",
                  color: "var(--color-text-tertiary)", textTransform: "uppercase",
                  letterSpacing: "0.08em", marginBottom: "var(--space-1)",
                }}>
                  {meal.slot}
                </div>

                <div style={{
                  fontSize: "var(--text-xl)", fontWeight: "var(--font-bold)",
                  color: "var(--color-text-primary)", lineHeight: "var(--leading-snug)",
                  marginBottom: "var(--space-4)", letterSpacing: "-0.01em",
                }}>
                  {meal.item}
                </div>

                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
                  padding: "4px var(--space-3)", borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)",
                  ...c.badge,
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                    <circle cx="5" cy="5" r="4" />
                    <path d="M5 3v2l1.5 1.5" />
                  </svg>
                  {meal.time}
                </div>
              </div>
            );
          })}
        </div>

        {/* Notice banner */}
        <div style={{
          background: "var(--color-neutral-50)",
          border: "1px solid var(--color-border)",
          borderLeft: "4px solid var(--color-brand-primary)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-4) var(--space-5)",
          display: "flex",
          alignItems: "flex-start",
          gap: "var(--space-3)",
          maxWidth: "600px",
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-brand-primary)" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: "2px" }}>
            <circle cx="8" cy="8" r="7" />
            <path d="M8 5v4M8 11v1" />
          </svg>
          <div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", color: "var(--color-text-primary)", marginBottom: "var(--space-1)" }}>
              Menu notice
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", lineHeight: "var(--leading-relaxed)" }}>
              Menu may be subject to change. Please contact the mess team for dietary requirements or special requests.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default TodayMenu;