import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {

  const navigate   = useNavigate();
  const { login: authLogin } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState("Student");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  const login = async () => {

    // Basic field validation
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res  = await API.post("/auth/login", { email, password, role });
      const user = res.data;

      // ── Role mismatch check ──
      // Compare the role returned by the server with what the user selected.
      // Both are normalised to lowercase so "Admin" === "admin" passes.
      if (user.role?.toLowerCase() !== role.toLowerCase()) {
        setError(
          `Access denied. Your account role is "${user.role}", but you selected "${role}". Please choose the correct role.`
        );
        setLoading(false);
        return;
      }

      // Role matched — save user and redirect
      authLogin(user);

      if (user.role === "Admin")        navigate("/admin");
      else if (user.role === "Staff")   navigate("/staff");
      else                              navigate("/student");

    } catch (err) {
      // Show the server error message if available, else a generic one
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error   ||
        "Invalid email, password, or role. Please try again.";
      setError(msg);
      setLoading(false);
    }
  };

  // Allow login on Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter") login();
  };

  return (
    <div className="auth-container">

      <div className="auth-card">

        {/* Logo */}
        <div className="logo-circle" style={{ margin: "0 auto var(--space-6)" }}>
          🍽️
        </div>

        <h2>Welcome back</h2>
        <p className="auth-subtitle">Sign in to access your mess dashboard</p>

        {/* Error message */}
        {error && (
          <div
            className="message error"
            style={{ marginBottom: "var(--space-5)", animation: "fadeIn 0.2s ease" }}
          >
            {error}
          </div>
        )}

        {/* Role selector — shown as pill tabs */}
        <div style={{
          display:       "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap:           "var(--space-2)",
          marginBottom:  "var(--space-5)",
        }}>
          {["Student", "Staff", "Admin"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRole(r); setError(""); }}
              style={{
                padding:       "var(--space-2) var(--space-3)",
                borderRadius:  "var(--radius-md)",
                border:        role === r
                                 ? "2px solid var(--color-brand-primary)"
                                 : "1.5px solid var(--color-border)",
                background:    role === r
                                 ? "#FFF4EF"
                                 : "var(--color-neutral-50)",
                color:         role === r
                                 ? "var(--color-brand-primary)"
                                 : "var(--color-text-secondary)",
                fontWeight:    role === r ? "var(--font-bold)" : "var(--font-medium)",
                fontSize:      "var(--text-sm)",
                cursor:        "pointer",
                transition:    "all var(--transition-fast)",
                letterSpacing: "0.01em",
              }}
            >
              {r === "Student" ? "🎓" : r === "Staff" ? "👨‍🍳" : "🛡️"} {r}
            </button>
          ))}
        </div>

        {/* Email */}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          onKeyDown={handleKeyDown}
          autoComplete="email"
        />

        {/* Password with show/hide toggle */}
        <div style={{ position: "relative", marginBottom: "var(--space-4)" }}>
          <input
            type={showPass ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={handleKeyDown}
            autoComplete="current-password"
            style={{ marginBottom: 0, paddingRight: "44px" }}
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            style={{
              position:   "absolute",
              right:      "12px",
              top:        "50%",
              transform:  "translateY(-50%)",
              background: "none",
              border:     "none",
              cursor:     "pointer",
              padding:    "4px",
              color:      "var(--color-text-tertiary)",
              lineHeight: 1,
            }}
            tabIndex={-1}
          >
            {showPass ? (
              // Eye-off icon
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3l14 14M10.478 10.478A3 3 0 016.52 6.52M8.05 4.2A9.3 9.3 0 0110 4c4 0 7 3.6 8 6-.4 1-1 2.1-1.9 3M2 10c.6-1.3 1.5-2.6 2.7-3.7"/>
              </svg>
            ) : (
              // Eye icon
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                <circle cx="10" cy="10" r="2.5"/>
              </svg>
            )}
          </button>
        </div>

        {/* Login button */}
        <button
          onClick={login}
          className="auth-btn"
          disabled={loading}
          style={{ opacity: loading ? 0.75 : 1 }}
        >
          {loading ? "Signing in…" : `Sign in as ${role}`}
        </button>

        {/* Links */}
        <p className="auth-link" style={{ marginTop: "var(--space-4)" }}>
          Forgot password? <Link to="/forgot-password">Reset here</Link>
        </p>

        <p className="auth-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>

      </div>
    </div>
  );
}

export default Login;