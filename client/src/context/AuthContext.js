'use client';

import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../utils/api";

// Hook to prevent hydration mismatches
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useEffect : () => { };

// Create Context
const AuthContext = createContext();

// User roles (must match backend enum)
export const ROLES = {
    USER: 'USER',
    CMPDI_MEMBER: 'CMPDI_MEMBER',
    EXPERT_REVIEWER: 'EXPERT_REVIEWER',
    TSSRC_MEMBER: 'TSSRC_MEMBER',
    SSRC_MEMBER: 'SSRC_MEMBER',
    SUPER_ADMIN: 'SUPER_ADMIN'
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
            apiClient.get('/api/auth/me')
                .then(response => {
                    // Backend returns user directly in response.data.data
                    if (response.data && response.data.data) {
                        setUser(response.data.data);
                    }
                })
                .catch(() => {
                    // Token is invalid or expired, clear it
                    localStorage.removeItem("token");
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [mounted]);

    // Login function
    const login = async (email, password) => {
        try {
            const response = await apiClient.post('/api/auth/login', { email, password });
            const { data } = response.data;
            
            if (typeof window !== 'undefined') {
                localStorage.setItem("token", data.token);
            }
            setUser(data.user);
        } catch (error) {
            throw new Error(error.response?.data?.message || "Login failed");
        }
    };

    // Register function (PUBLIC - USER role only)
    const register = async (formData) => {
        try {
            const response = await apiClient.post('/api/auth/register', formData);
            const { data } = response.data;
            
            if (typeof window !== 'undefined') {
                localStorage.setItem("token", data.token);
            }
            setUser(data.user);
        } catch (error) {
            throw new Error(error.response?.data?.message || "Registration failed");
        }
    };

    // Logout function
    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem("token");
        }
        setUser(null);
    };

    // Role check helper functions (user.roles is now an array)
    const hasRole = (role) => user?.roles?.includes(role);
    const hasAnyRole = (rolesArray) => rolesArray.some(role => user?.roles?.includes(role));
    const hasAllRoles = (rolesArray) => rolesArray.every(role => user?.roles?.includes(role));
    
    // Specific role checks
    const isUser = () => hasRole(ROLES.USER);
    const isCMPDIMember = () => hasRole(ROLES.CMPDI_MEMBER);
    const isExpertReviewer = () => hasRole(ROLES.EXPERT_REVIEWER);
    const isTSSRCMember = () => hasRole(ROLES.TSSRC_MEMBER);
    const isSSRCMember = () => hasRole(ROLES.SSRC_MEMBER);
    const isSuperAdmin = () => hasRole(ROLES.SUPER_ADMIN);

    return (
        <AuthContext.Provider value={{
            user,
            loading: loading || !mounted, // Keep loading true until mounted and auth check complete
            login,
            register,
            logout,
            // Role check helpers
            hasRole,
            hasAnyRole,
            hasAllRoles,
            isUser,
            isCMPDIMember,
            isExpertReviewer,
            isTSSRCMember,
            isSSRCMember,
            isSuperAdmin,
            ROLES
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom Hook
export const useAuth = () => useContext(AuthContext);

