import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function UnifiedNavbar() {
const location = useLocation();
const navigate = useNavigate();
const { user, logout, isLoading } = useAuth();
const [menuOpen, setMenuOpen] = useState(false);

const handleLogout = () => {
logout();
setMenuOpen(false);
navigate("/");
};

const getNavLinks = () => {
const userRole = user?.role ? user.role.toLowerCase() : null;

switch (userRole) {
  case "student":
    return [
      { label: "Dashboard", path: "/student" },
      { label: "Today's Menu", path: "/today-menu" },
      { label: "Attendance", path: "/attendance" }
    ];

  case "staff":
    return [
      { label: "Dashboard", path: "/staff" },
      { label: "Menu Management", path: "/edit-menu" },
      { label: "Attendance", path: "/attendance" },
      { label: "Today's Menu", path: "/today-menu" }
    ];

  case "admin":
    return [
      { label: "Dashboard", path: "/admin" },
      { label: "Student List", path: "/students" },
      { label: "User Management", path: "/users" },
      { label: "Menu Management", path: "/edit-menu" },
      { label: "Attendance", path: "/attendance" }
    ];

  default:
    return [];
}

};

const isActive = (path) => location.pathname === path;

if (isLoading || !user) {
return null;
}

const navLinks = getNavLinks();

return ( <nav className="navbar"> <div className="navbar-container">

    <Link to="/" className="navbar-logo">
      <img src="/l_3.png" alt="Mess Management System" className="logo-img" />
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

export default UnifiedNavbar;
