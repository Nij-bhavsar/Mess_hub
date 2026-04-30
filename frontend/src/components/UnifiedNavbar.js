import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function UnifiedNavbar() {
  const navigate         = useNavigate();
  const location         = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const logoutPopupRef = useRef(null);

  const role   = user?.role?.toLowerCase() || "";
  const userId = user?.id || 0;

  // Fetch unread notification count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch(`http://localhost:5155/api/notification/unread-count?userId=${userId}&role=${role}`);
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch {}
    };
    if (userId) {
      fetchCount();
      const interval = setInterval(fetchCount, 30000); // refresh every 30s
      return () => clearInterval(interval);
    }
  }, [userId, role]);

  useEffect(() => {
    if (!showLogoutPopup) return undefined;

    const handlePointerDown = (event) => {
      if (!logoutPopupRef.current?.contains(event.target)) {
        setShowLogoutPopup(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowLogoutPopup(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showLogoutPopup]);

  const navLinks = {
    admin: [
      { to: "/admin",          label: "Dashboard"  },
      { to: "/students",       label: "Students"   },
      { to: "/users",          label: "Users"      },
      { to: "/edit-menu",      label: "Menu"       },
      { to: "/attendance",     label: "Attendance" },
      { to: "/leave-admin",    label: "Leaves"     },
      { to: "/feedback-admin", label: "Feedbacks"  },
      { to: "/item-requests",  label: "Requests"   },
      { to: "/payments",       label: "Payments"   },
    ],
    staff: [
      { to: "/staff",         label: "Dashboard"  },
      { to: "/edit-menu",     label: "Menu"       },
      { to: "/today-menu",    label: "Today Menu" },
      { to: "/attendance",    label: "Attendance" },
      { to: "/leave",         label: "My Leaves"  },
      { to: "/item-request",  label: "Requests"   },
    ],
    student: [
      { to: "/student",       label: "Dashboard"  },
      { to: "/today-menu",    label: "Menu"       },
      { to: "/attendance",    label: "Attendance" },
      { to: "/leave",         label: "Leave"      },
      { to: "/feedback",      label: "Feedback"   },
      { to: "/invoice",       label: "Pay Fees"   },
    ],
  };

  const links = navLinks[role] || [];

  const handleLogout = () => {
    setShowLogoutPopup(false);
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Logo */}
        <Link to={role === "admin" ? "/admin" : role === "staff" ? "/staff" : "/student"} className="navbar-logo">
          <img src="/logo_messhub.png" alt="MessHub" className="logo-icon" style={{ width: "40px", height: "40px", marginRight: "10px" }} />
          <span className="logo-text">MessHub</span>
        </Link>

        {/* Hamburger */}
        <button
          className={`hamburger ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>

        {/* Nav links */}
        <div className={`navbar-menu ${menuOpen ? "active" : ""}`}>
          <div className="navbar-links">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link ${isActive(link.to) ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side — bell + user + logout */}
          <div className="navbar-actions">

            {/* Notification bell */}
            <Link
              to="/notifications"
              onClick={() => setMenuOpen(false)}
              style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center", width:"36px", height:"36px", borderRadius:"var(--radius-full)", border:"1.5px solid var(--color-border)", background:"var(--color-surface)", color:"var(--color-text-secondary)", textDecoration:"none", transition:"all var(--transition-fast)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span style={{ position:"absolute", top:"-4px", right:"-4px", width:"18px", height:"18px", borderRadius:"var(--radius-full)", background:"var(--color-danger)", color:"white", fontSize:"9px", fontWeight:"var(--font-bold)", display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid white" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* User avatar + name */}
            {user && (
              <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)", position:"relative" }} ref={logoutPopupRef}>
                <div 
                  onClick={() => setShowLogoutPopup(!showLogoutPopup)}
                  style={{ 
                    width:"32px", 
                    height:"32px", 
                    borderRadius:"var(--radius-full)", 
                    background:"var(--color-brand-gradient)", 
                    display:"flex", 
                    alignItems:"center", 
                    justifyContent:"center", 
                    fontSize:"var(--text-xs)", 
                    fontWeight:"var(--font-bold)", 
                    color:"white", 
                    flexShrink:0,
                    cursor:"pointer",
                    transition:"all var(--transition-fast)"
                  }}
                  title="Click to show logout options"
                >
                  {(user.name || user.email || "U")[0].toUpperCase()}
                </div>
                <div style={{ display:"flex", flexDirection:"column" }}>
                  <span style={{ fontSize:"var(--text-xs)", fontWeight:"var(--font-semibold)", color:"var(--color-text-primary)", lineHeight:1.2 }}>
                    {user.name || user.email}
                  </span>
                  <span style={{ fontSize:"10px", color:"var(--color-text-tertiary)", textTransform:"capitalize" }}>
                    {user.role}
                  </span>
                </div>

                {/* Logout popup */}
                {showLogoutPopup && (
                  <div 
                    className="logout-popup" 
                    role="dialog" 
                    aria-label="Logout confirmation"
                    style={{
                      position:"absolute",
                      top:"100%",
                      right:0,
                      marginTop:"var(--space-2)",
                      background:"var(--color-surface)",
                      border:"1px solid var(--color-border)",
                      borderRadius:"var(--radius-lg)",
                      boxShadow:"var(--shadow-lg)",
                      zIndex:1000,
                      minWidth:"200px"
                    }}
                  >
                    <div className="logout-popup-top">
                      <div className="logout-popup-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <path d="M16 17l5-5-5-5"/>
                          <path d="M21 12H9"/>
                        </svg>
                      </div>
                      <div>
                        <div className="logout-popup-title">Log out now?</div>
                        <div className="logout-popup-text">Your current tab session will end.</div>
                      </div>
                    </div>

                    <div className="logout-popup-actions">
                      <button type="button" className="logout-popup-cancel" onClick={() => setShowLogoutPopup(false)}>
                        Cancel
                      </button>
                      <button type="button" className="logout-popup-confirm" onClick={handleLogout}>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
}

export default UnifiedNavbar;
