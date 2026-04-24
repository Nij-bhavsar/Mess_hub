import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

/* ── Password strength calculator ── */
function getStrength(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 6)                          score++;
  if (pwd.length >= 10)                         score++;
  if (/[A-Z]/.test(pwd))                        score++;
  if (/[0-9]/.test(pwd))                        score++;
  if (/[^A-Za-z0-9]/.test(pwd))                score++;
  return score; // 0–5
}

function getStrengthLabel(score) {
  if (score === 0) return { label: "",          color: "transparent" };
  if (score <= 1)  return { label: "Very weak", color: "var(--color-danger)"  };
  if (score === 2) return { label: "Weak",      color: "#E97316"              };
  if (score === 3) return { label: "Fair",      color: "var(--color-warning)" };
  if (score === 4) return { label: "Strong",    color: "#65A30D"              };
  return               { label: "Very strong", color: "var(--color-success)" };
}

function Signup() {
  const navigate = useNavigate();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [role,     setRole]     = useState("Student");
  const [course,   setCourse]   = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const strength      = getStrength(password);
  const strengthInfo  = getStrengthLabel(strength);
  const filledBars    = Math.round((strength / 5) * 4); // map 0–5 → 0–4 bars

  const validate = () => {
    if (!name.trim())             return "Full name is required.";
    if (!email.trim())            return "Email address is required.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Please enter a valid email address.";
    if (role === "Student" && !course) return "Please select your course.";
    if (!password)                return "Password is required.";
    if (password.length < 6)      return "Password must be at least 6 characters.";
    if (strength <= 1)            return "Password is too weak. Add numbers or symbols.";
    if (password !== confirm)     return "Passwords do not match.";
    return null;
  };

  const signup = async () => {
    setError("");
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    try {
      setLoading(true);
      await API.post("/auth/signup", { name, email, password, role, course: role === "Student" ? course : "" });
      setSuccess("Account created! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data          ||
        "Signup failed. Please try again.";
      setError(typeof msg === "string" ? msg : "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") signup(); };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* Logo */}
        <div className="logo-circle" style={{ margin: "0 auto var(--space-6)" }}>
          <img src="/logo_messhub.png" alt="Mess Management" className="logo-img" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>

        <h2>Create Account</h2>
        <p className="auth-subtitle">
          Sign up to access the Mess Management System
        </p>

        {/* Error / success messages */}
        {error   && <div className="message error"   style={{ marginBottom: "var(--space-4)", animation: "fadeIn 0.2s ease" }}>{error}</div>}
        {success && <div className="message success" style={{ marginBottom: "var(--space-4)", animation: "fadeIn 0.2s ease" }}>{success}</div>}

        {/* Full Name */}
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          onKeyDown={handleKeyDown}
          autoComplete="name"
        />

        {/* Email */}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          onKeyDown={handleKeyDown}
          autoComplete="email"
        />

        {/* Role selector as pill tabs */}
        <div style={{
          display:             "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap:                 "var(--space-2)",
          marginBottom:        "var(--space-4)",
        }}>
          {["Student", "Staff", "Admin"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); if (r !== "Student") setCourse(""); }}
              style={{
                padding:      "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-md)",
                border:       role === r
                                ? "2px solid var(--color-brand-primary)"
                                : "1.5px solid var(--color-border)",
                background:   role === r ? "#EFF6FF" : "var(--color-neutral-50)",
                color:        role === r
                                ? "var(--color-brand-primary)"
                                : "var(--color-text-secondary)",
                fontWeight:   role === r ? "var(--font-bold)" : "var(--font-medium)",
                fontSize:     "var(--text-sm)",
                cursor:       "pointer",
                transition:   "all var(--transition-fast)",
              }}
            >
              {r === "Student" ? "🎓" : r === "Staff" ? "👨‍🍳" : "🛡️"} {r}
            </button>
          ))}
        </div>

        {/* Course selector — only shown for Student role */}
        {role === "Student" && (
          <div style={{ marginBottom: "var(--space-4)", animation: "fadeIn 0.2s ease" }}>
            <select
              value={course}
              onChange={(e) => { setCourse(e.target.value); setError(""); }}
              style={{
                width:        "100%",
                padding:      "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-md)",
                border:       `1.5px solid ${course ? "var(--color-brand-primary)" : "var(--color-border)"}`,
                background:   "var(--color-neutral-50)",
                color:        course ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                fontSize:     "var(--text-sm)",
                fontFamily:   "var(--font-body)",
                outline:      "none",
                cursor:       "pointer",
                transition:   "border-color var(--transition-fast)",
              }}
            >
              <option value="" disabled>Select your course</option>
              <option value="BCA">BCA — Bachelor of Computer Applications</option>
              <option value="MCA">MCA — Master of Computer Applications</option>
              <option value="B.Tech">B.Tech — Bachelor of Technology</option>
              <option value="M.Tech">M.Tech — Master of Technology</option>
              <option value="BBA">BBA — Bachelor of Business Administration</option>
              <option value="MBA">MBA — Master of Business Administration</option>
              <option value="B.Sc">B.Sc — Bachelor of Science</option>
              <option value="M.Sc">M.Sc — Master of Science</option>
              <option value="B.Com">B.Com — Bachelor of Commerce</option>
              <option value="B.Pharmacy">B.Pharmacy</option>
              <option value="Other">Other</option>
            </select>
          </div>
        )}

        {/* Password with show/hide */}
        <div style={{ position: "relative", marginBottom: "var(--space-2)" }}>
          <input
            type={showPass ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={handleKeyDown}
            autoComplete="new-password"
            style={{ marginBottom: 0, paddingRight: "44px" }}
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            tabIndex={-1}
            style={{
              position:   "absolute",
              right:      "12px",
              top:        "50%",
              transform:  "translateY(-50%)",
              background: "none",
              border:     "none",
              cursor:     "pointer",
              color:      "var(--color-text-tertiary)",
              padding:    "4px",
              lineHeight: 1,
            }}
          >
            {showPass ? (
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3l14 14M10.478 10.478A3 3 0 016.52 6.52M8.05 4.2A9.3 9.3 0 0110 4c4 0 7 3.6 8 6-.4 1-1 2.1-1.9 3M2 10c.6-1.3 1.5-2.6 2.7-3.7"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                <circle cx="10" cy="10" r="2.5"/>
              </svg>
            )}
          </button>
        </div>

        {/* Password strength indicator */}
        {password.length > 0 && (
          <div style={{ marginBottom: "var(--space-4)" }}>

            {/* 4-bar strength meter */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    flex:         1,
                    height:       "4px",
                    borderRadius: "var(--radius-full)",
                    background:   filledBars >= i
                                    ? strengthInfo.color
                                    : "var(--color-border)",
                    transition:   "background 0.25s ease",
                  }}
                />
              ))}
            </div>

            {/* Strength label + tips */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{
                fontSize:   "var(--text-xs)",
                fontWeight: "var(--font-semibold)",
                color:      strengthInfo.color,
              }}>
                {strengthInfo.label}
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                {strength <= 2 && "Add uppercase, numbers & symbols"}
                {strength === 3 && "Add symbols for a stronger password"}
                {strength >= 4 && "✓ Good password"}
              </span>
            </div>
          </div>
        )}

        {/* Confirm password */}
        <div style={{ position: "relative", marginBottom: "var(--space-4)" }}>
          <input
            type={showPass ? "text" : "password"}
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(""); }}
            onKeyDown={handleKeyDown}
            autoComplete="new-password"
            style={{
              marginBottom: 0,
              paddingRight: "36px",
              borderColor:  confirm
                              ? confirm === password
                                ? "var(--color-success)"
                                : "var(--color-danger)"
                              : undefined,
            }}
          />
          {/* Match icon */}
          {confirm.length > 0 && (
            <div style={{
              position:  "absolute",
              right:     "12px",
              top:       "50%",
              transform: "translateY(-50%)",
              color:     confirm === password
                           ? "var(--color-success)"
                           : "var(--color-danger)",
              lineHeight: 1,
            }}>
              {confirm === password ? (
                <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 7l3.5 3.5L12 3"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 3l8 8M11 3l-8 8"/>
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          className="auth-btn"
          onClick={signup}
          disabled={loading}
          style={{ opacity: loading ? 0.75 : 1 }}
        >
          {loading ? "Creating account…" : `Sign up as ${role}`}
        </button>

        {/* Login link */}
        <p className="auth-link" style={{ marginTop: "var(--space-5)" }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>

      </div>
    </div>
  );
}

export default Signup;