import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

function ForgotPassword() {

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [message,  setMessage]  = useState({ text: "", type: "" });

  const resetPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    // Field validation
    if (!normalizedEmail) {
      setMessage({ text: "Please enter your email address.", type: "error" });
      return;
    }
    if (!password.trim()) {
      setMessage({ text: "Please enter a new password.", type: "error" });
      return;
    }
    if (password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters.", type: "error" });
      return;
    }
    if (password !== confirm) {
      setMessage({ text: "Passwords do not match. Please try again.", type: "error" });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: "", type: "" });

      await API.post("/auth/forgot-password", {
        email: normalizedEmail,
        newPassword: password.trim(),
      });

      setMessage({ text: "Password updated successfully! You can now log in with your new password.", type: "success" });
      setEmail("");
      setPassword("");
      setConfirm("");

    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error   ||
        "Email not found. Please check and try again.";
      setMessage({ text: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") resetPassword();
  };

  // Password strength indicator
  const strength = !password ? 0
    : password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3
    : password.length >= 6 ? 2
    : 1;

  const strengthLabel = ["", "Weak", "Good", "Strong"];
  const strengthColor = ["", "var(--color-danger)", "var(--color-warning)", "var(--color-success)"];

  return (
    <div className="auth-container">

      <div className="auth-card">

        {/* Icon */}
        <div
          className="logo-circle"
          style={{ margin: "0 auto var(--space-6)" }}
        >
          <img src="/logo_messhub.png" alt="Reset Password" className="logo-img" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>

        <h2>Reset Password</h2>
        <p className="auth-subtitle">
          Enter your email and choose a new password to regain access.
        </p>

        {/* Message banner */}
        {message.text && (
          <div
            className={`message ${message.type}`}
            style={{ marginBottom: "var(--space-5)", animation: "fadeIn 0.2s ease" }}
          >
            {message.text}
          </div>
        )}

        {/* Email */}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setMessage({ text: "", type: "" }); }}
          onKeyDown={handleKeyDown}
          autoComplete="email"
        />

        {/* New password with show/hide */}
        <div style={{ position: "relative", marginBottom: "var(--space-2)" }}>
          <input
            type={showPass ? "text" : "password"}
            placeholder="New password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setMessage({ text: "", type: "" }); }}
            onKeyDown={handleKeyDown}
            autoComplete="new-password"
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

        {/* Password strength bar */}
        {password.length > 0 && (
          <div style={{ marginBottom: "var(--space-4)" }}>
            <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    flex:         1,
                    height:       "3px",
                    borderRadius: "var(--radius-full)",
                    background:   strength >= i ? strengthColor[strength] : "var(--color-border)",
                    transition:   "background 0.25s ease",
                  }}
                />
              ))}
            </div>
            <div style={{
              fontSize:   "var(--text-xs)",
              fontWeight: "var(--font-semibold)",
              color:      strengthColor[strength],
            }}>
              {strengthLabel[strength]} password
            </div>
          </div>
        )}

        {/* Confirm password */}
        <div style={{ position: "relative", marginBottom: "var(--space-4)" }}>
          <input
            type={showPass ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setMessage({ text: "", type: "" }); }}
            onKeyDown={handleKeyDown}
            autoComplete="new-password"
            style={{
              marginBottom: 0,
              borderColor: confirm && confirm !== password
                ? "var(--color-danger)"
                : confirm && confirm === password
                ? "var(--color-success)"
                : undefined,
            }}
          />
          {/* Match indicator icon */}
          {confirm.length > 0 && (
            <div style={{
              position:  "absolute",
              right:     "12px",
              top:       "50%",
              transform: "translateY(-50%)",
              color:     confirm === password ? "var(--color-success)" : "var(--color-danger)",
              lineHeight: 1,
            }}>
              {confirm === password ? (
                <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 7l3.5 3.5L12 3"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M3 3l8 8M11 3l-8 8"/>
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          onClick={resetPassword}
          className="auth-btn"
          disabled={loading}
          style={{ opacity: loading ? 0.75 : 1 }}
        >
          {loading ? "Updating…" : "Reset Password"}
        </button>

        {/* Back to login */}
        <p className="auth-link" style={{ marginTop: "var(--space-5)" }}>
          Remember your password? <Link to="/login">Back to Login</Link>
        </p>

      </div>
    </div>
  );
}

export default ForgotPassword;
