import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { clearAuthUser, readAuthUser, writeAuthUser, getOrCreateSessionId } from "../utils/authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  // Read initial user synchronously — no useEffect to avoid re-render issues
  const getStoredUser = () => {
    return readAuthUser();
  };

  const [user, setUser] = useState(getStoredUser);

  // Called on successful login — stores user in state
  const login = useCallback((userData) => {
    const normalized = {
      id:     userData.userId || userData.id,
      name:   userData.name   || userData.email,
      email:  userData.email,
      role:   userData.role,
      course: userData.course || "",
    };
    setUser(normalized);
    writeAuthUser(normalized);
  }, []);

  // Called on logout — wipes everything for this session
  const logout = useCallback(() => {
    setUser(null);
    clearAuthUser();

    // Remove session keys but keep student-specific data
    // (receipts and item requests are keyed by student ID so safe to keep)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key !== "user" &&
        !key.startsWith("receipts_") &&
        !key.startsWith("item_requests_")
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }, []);

  // Initialize session on mount
  useEffect(() => {
    getOrCreateSessionId();
  }, []);

  const isAuthenticated = !!user;
  const userRole        = user?.role?.toLowerCase() || "";

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, userRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export default AuthContext;
