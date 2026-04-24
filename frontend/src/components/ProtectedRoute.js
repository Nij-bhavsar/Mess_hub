import { Navigate } from "react-router-dom";
import { readAuthUser } from "../utils/authStorage";

/**
 * ProtectedRoute — reads role synchronously from session storage.
 * No useEffect, no useState — so there is NO null→value transition
 * that could trigger a redirect flash or wrong dashboard switch.
 */
function ProtectedRoute({ children, allowedRoles = [] }) {
  const user = readAuthUser();

  // Not logged in at all — go to login
  if (!user || !user.role) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role.toLowerCase();

  // Check if this role is allowed — case-insensitive
  const allowed = allowedRoles.some(
    r => r.toLowerCase() === userRole
  );

  if (!allowed) {
    // Redirect to the correct dashboard for their actual role
    if (userRole === "admin")       return <Navigate to="/admin"   replace />;
    if (userRole === "staff")       return <Navigate to="/staff"   replace />;
    if (userRole === "student")     return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
