import { Link, useLocation, useNavigate } from "react-router-dom";
import {useState, useEffect} from "react";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserRole(user.role ? user.role.toLowerCase() : "student");
      } catch (e) {
        setUserRole("student");
      }
    } else {
      // Infer role from current path
      if (location.pathname.includes("/admin") || location.pathname.includes("/students")) {
        setUserRole("admin");
      } else if (location.pathname.includes("/staff") || location.pathname.includes("/edit-menu")) {
        setUserRole("staff");
      } else {
        setUserRole("student");
      }
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setMenuOpen(false);
    navigate("/");
  };

  const getNavLinks = () => {
    switch(userRole) {
      case "admin":
        return [
          { label: "Dashboard", path: "/admin" },
          { label: "Students", path: "/students" },
          { label: "Menu", path: "/edit-menu" },
          { label: "Attendance", path: "/attendance" }
        ];
      case "staff":
        return [
          { label: "Dashboard", path: "/staff" },
          { label: "Menu", path: "/edit-menu" },
          { label: "Attendance", path: "/attendance" },
          { label: "Today's Menu", path: "/today-menu" }
        ];
      case "student":
        return [
          { label: "Dashboard", path: "/student" },
          { label: "Today's Menu", path: "/today-menu" },
          { label: "Attendance", path: "/attendance" }
        ];
      default:
        return [];
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🍽</span>
          <span className="logo-text">Mess Manager</span>
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
            {getNavLinks().map((link) => (
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

export default Navbar;
