import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role ? user.role.toLowerCase() : null;

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
