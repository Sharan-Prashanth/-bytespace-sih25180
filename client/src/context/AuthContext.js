import { createContext, useContext, useState, useEffect } from "react";
import { API_ENDPOINTS } from "../utils/api";

// Hook to prevent hydration mismatches
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useEffect : () => {};

// Create Context
const AuthContext = createContext();

// User roles
export const ROLES = {
  USER: 'user',
  REVIEWER: 'reviewer', 
  STAFF: 'staff'
};

// Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);   // store user object with role
  const [loading, setLoading] = useState(true); // check session load
  const [mounted, setMounted] = useState(false); // track if component is mounted on client

  // Mark component as mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-login if token exists
  useEffect(() => {
    // Only run on client side after mounting
    if (!mounted) {
      return;
    }

    const token = localStorage.getItem("token");
    if (token) {
      fetch(API_ENDPOINTS.ME, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) setUser(data.user);
        })
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [mounted]);

  // Login function
  const login = async (email, password) => {
    const res = await fetch(API_ENDPOINTS.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      if (typeof window !== 'undefined') {
        localStorage.setItem("token", data.token);
      }
      setUser(data.user);
    } else {
      throw new Error(data.message || "Login failed");
    }
  };

  // Register function
  const register = async (name, email, password, role = ROLES.USER, department = "") => {
    const res = await fetch(API_ENDPOINTS.REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, department }),
    });

    const data = await res.json();
    if (res.ok) {
      if (typeof window !== 'undefined') {
        localStorage.setItem("token", data.token);
      }
      setUser(data.user);
    } else {
      throw new Error(data.message || "Registration failed");
    }
  };

  // Logout function
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("token");
    }
    setUser(null);
  };

  // Role check helper functions
  const isUser = () => user?.role === ROLES.USER;
  const isReviewer = () => user?.role === ROLES.REVIEWER;
  const isStaff = () => user?.role === ROLES.STAFF;
  const hasRole = (role) => user?.role === role;

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading: loading || !mounted, // Keep loading true until mounted and auth check complete
      login, 
      register, 
      logout,
      isUser,
      isReviewer,
      isStaff,
      hasRole,
      ROLES
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook
export const useAuth = () => useContext(AuthContext);

