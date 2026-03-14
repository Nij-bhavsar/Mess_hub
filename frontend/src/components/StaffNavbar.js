import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

function StaffNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setMenuOpen(false);
    navigate("/");
  };

  const navLinks = [
    { label: "Dashboard", path: "/staff" },
    { label: "Menu Management", path: "/edit-menu" },
    { label: "Attendance", path: "/attendance" },
    { label: "Today's Menu", path: "/today-menu" }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🍽</span>
          <span className="logo-text">Mess Management System</span>
        </Link>

        <button 
          className="hamburger" 
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${menuOpen ? "active" : ""}`}>
          <ul className="navbar-links">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link 
                  to={link.path}
                  className={`nav-link ${isActive(link.path) ? "active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default StaffNavbar;
