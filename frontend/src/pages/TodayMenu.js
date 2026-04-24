import { useEffect, useState } from "react";
import API from "../services/api";
import UnifiedNavbar from "../components/UnifiedNavbar";

const colorMap = {
  amber: {
    bar:   "#D97706",
    bg:    "var(--color-warning-light)",
    icon:  "var(--color-warning-dark)",
    badge: { background: "var(--color-warning-light)", color: "var(--color-warning-dark)" },
  },
  green: {
    bar:   "#16A34A",
    bg:    "var(--color-success-light)",
    icon:  "var(--color-success-dark)",
    badge: { background: "var(--color-success-light)", color: "var(--color-success-dark)" },
  },
  blue: {
    bar:   "#2563EB",
    bg:    "var(--color-info-light)",
    icon:  "var(--color-info-dark)",
    badge: { background: "var(--color-info-light)", color: "var(--color-info-dark)" },
  },
};

const MealIcon = ({ slot }) => {
  if (slot === "Breakfast") return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <circle cx="10" cy="8" r="5" />
      <path d="M3 18c0-3.87 3.13-7 7-7s7 3.13 7 7" />
    </svg>
  );
  if (slot === "Lunch") return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l3 3" />
    </svg>
  );
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M3 5v7a7 7 0 0014 0V5" />
      <path d="M10 5V2" />
    </svg>
  );
};

function TodayMenu() {
  const [menu,    setMenu]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const todayDay   = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const res    = await API.get("/menu");
        const menus  = res.data || [];

        /* Match today's day name — case-insensitive */
        const todayMenu = menus.find(
          (m) => m.day?.toLowerCase() === todayDay.toLowerCase()
        );

        if (todayMenu) {
          setMenu(todayMenu);
        } else {
          setError(`No menu has been set for ${todayDay} yet.`);
        }
      } catch (err) {
        console.error("TodayMenu fetch error:", err);
        setError("Failed to load today's menu. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [todayDay]);

  const meals = menu
    ? [
        { slot: "Breakfast", time: "7:30 – 9:00 AM",  item: menu.breakfast, color: "amber" },
        { slot: "Lunch",     time: "12:30 – 2:00 PM", item: menu.lunch,     color: "green" },
        { slot: "Dinner",    time: "7:30 – 9:00 PM",  item: menu.dinner,    color: "blue"  },
      ]
    : [];

  return (
    <div className="dashboard">
      <UnifiedNavbar />

      <div className="main-content">

        {/* Header */}
        <div style={{ marginBottom: "var(--space-8)" }}>
          <h1 style={{
            fontSize:      "var(--text-3xl)",
            fontFamily:    "var(--font-display)",
            fontWeight:    "var(--font-bold)",
            color:         "var(--color-text-primary)",
            letterSpacing: "-0.02em",
            marginBottom:  "var(--space-2)",
          }}>
            Today's Menu
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)", fontWeight: "var(--font-medium)" }}>
            {todayLabel}
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "var(--space-5)", marginBottom: "var(--space-10)" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card" style={{ padding: "var(--space-6)", cursor: "default" }}>
                {[{ h: "44px", w: "44px", r: "var(--radius-md)" }, { h: "12px", w: "60%" }, { h: "20px", w: "85%" }, { h: "12px", w: "50%" }].map((s, j) => (
                  <div key={j} style={{
                    height:       s.h,
                    width:        s.w,
                    borderRadius: s.r || "var(--radius-full)",
                    background:   "var(--color-neutral-200)",
                    marginBottom: "var(--space-3)",
                    animation:    "pulse 1.5s ease-in-out infinite",
                    animationDelay: `${j * 0.1}s`,
                  }} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div style={{ marginBottom: "var(--space-8)" }}>
            <div className="message error" style={{ maxWidth: "520px", animation: "fadeIn 0.3s ease" }}>
              {error}
            </div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)", marginTop: "var(--space-3)" }}>
              Ask an admin or staff member to add the menu for {todayDay}.
            </p>
          </div>
        )}

        {/* Meal cards */}
        {!loading && menu && (
          <>
            {/* Day pill */}
            <div style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           "var(--space-2)",
              background:    "var(--color-brand-gradient)",
              color:         "white",
              padding:       "var(--space-2) var(--space-4)",
              borderRadius:  "var(--radius-full)",
              fontSize:      "var(--text-xs)",
              fontWeight:    "var(--font-bold)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom:  "var(--space-6)",
              boxShadow:     "var(--shadow-brand)",
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <rect x="1" y="2" width="10" height="9" rx="1.5"/>
                <path d="M1 5h10M4 1v3M8 1v3"/>
              </svg>
              {menu.day}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "var(--space-5)", marginBottom: "var(--space-10)" }}>
              {meals.map((meal) => {
                const c = colorMap[meal.color];
                return (
                  <div key={meal.slot} className="card" style={{ padding: "var(--space-6)", cursor: "default" }}>

                    {/* Top colour bar */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: c.bar, borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }} />

                    {/* Icon */}
                    <div style={{ width: "44px", height: "44px", borderRadius: "var(--radius-md)", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", color: c.icon, marginBottom: "var(--space-4)" }}>
                      <MealIcon slot={meal.slot} />
                    </div>

                    {/* Slot */}
                    <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-1)" }}>
                      {meal.slot}
                    </div>

                    {/* Meal name */}
                    <div style={{
                      fontSize:      "var(--text-xl)",
                      fontWeight:    "var(--font-bold)",
                      color:         meal.item ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                      lineHeight:    "var(--leading-snug)",
                      marginBottom:  "var(--space-4)",
                      letterSpacing: "-0.01em",
                      fontStyle:     meal.item ? "normal" : "italic",
                    }}>
                      {meal.item || "Not scheduled"}
                    </div>

                    {/* Time badge */}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", padding: "4px var(--space-3)", borderRadius: "var(--radius-full)", fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)", ...c.badge }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <circle cx="5" cy="5" r="4" />
                        <path d="M5 3v2l1.5 1.5" />
                      </svg>
                      {meal.time}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Notice banner */}
        {!loading && (
          <div style={{ background: "var(--color-neutral-50)", border: "1px solid var(--color-border)", borderLeft: "4px solid var(--color-brand-primary)", borderRadius: "var(--radius-md)", padding: "var(--space-4) var(--space-5)", display: "flex", alignItems: "flex-start", gap: "var(--space-3)", maxWidth: "600px" }}>
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
        )}

      </div>
    </div>
  );
}

export default TodayMenu;