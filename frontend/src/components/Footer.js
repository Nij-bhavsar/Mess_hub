function Footer() {

  const year = new Date().getFullYear();

  return (
    <footer style={{
      borderTop:      "1px solid var(--color-border)",
      background:     "var(--color-surface)",
      padding:        "var(--space-5) var(--space-10)",
      marginTop:      "auto",
    }}>
      <div style={{
        maxWidth:        "var(--max-width)",
        margin:          "0 auto",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "space-between",
        flexWrap:        "wrap",
        gap:             "var(--space-3)",
      }}>

        {/* Left — branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div style={{
            width:           "40px",
            height:          "40px",
            borderRadius:    "var(--radius-md)",
            background:      "transparent",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
          }}>
            <img src="/logo_messhub.png" alt="MessHub" style={{ width: "100%", height: "100%", objectFit: "contain", maxWidth: "35px", maxHeight: "35px" }} />
          </div>
          <div>
            <div style={{
              fontSize:      "var(--text-sm)",
              fontWeight:    "var(--font-bold)",
              color:         "var(--color-text-primary)",
              letterSpacing: "-0.01em",
              lineHeight:    1.2,
            }}>
              MessHub
            </div>
            <div style={{
              fontSize:  "var(--text-xs)",
              color:     "var(--color-text-tertiary)",
              marginTop: "2px",
            }}>
              © {year} All rights reserved
            </div>
          </div>
        </div>

        {/* Center — credits */}
        <div style={{
          display:    "flex",
          alignItems: "center",
          gap:        "var(--space-2)",
          fontSize:   "var(--text-xs)",
          color:      "var(--color-text-tertiary)",
        }}>
          <span>Designed &amp; Developed by</span>
          <span style={{
            fontWeight:      "var(--font-bold)",
            color:           "var(--color-brand-primary)",
            background:      "var(--color-info-light)",
            padding:         "2px var(--space-2)",
            borderRadius:    "var(--radius-sm)",
            letterSpacing:   "0.01em",
          }}>
            Nij Dharmeshbhai Bhavsar
          </span>
        </div>

        {/* Right — tech stack badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          {[
            { label: "React",      color: "#61DAFB", bg: "#E8F8FD" },
            { label: "ASP.NET",    color: "#512BD4", bg: "#F0ECFD" },
            { label: "SQL Server", color: "#CC2927", bg: "#FEF0F0" },
          ].map((tech) => (
            <span
              key={tech.label}
              style={{
                fontSize:     "var(--text-xs)",
                fontWeight:   "var(--font-semibold)",
                color:        tech.color,
                background:   tech.bg,
                padding:      "2px var(--space-2)",
                borderRadius: "var(--radius-sm)",
                letterSpacing:"0.02em",
              }}
            >
              {tech.label}
            </span>
          ))}
        </div>

      </div>
    </footer>
  );
}

export default Footer;