'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth, ROLES } from "../context/AuthContext";

export default function Nav2() {
    const { user, logout, isExpertReviewer, isCMPDIMember, isTSSRCMember, isSSRCMember, isSuperAdmin, hasAnyRole, loading } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
    const [fontSize, setFontSize] = useState(16);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const userMenuRef = useRef(null);
    const languageMenuRef = useRef(null);

    // Scroll detection for enhanced shadow and auto-hide
    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;

                    // Update scrolled state
                    setIsScrolled(currentScrollY > 10);

                    // Show/hide navbar based on scroll direction
                    if (currentScrollY < lastScrollY || currentScrollY < 100) {
                        // Scrolling up or near top - show navbar
                        setIsVisible(true);
                    } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                        // Scrolling down and past 100px - hide navbar
                        setIsVisible(false);
                        // Close any open menus when hiding
                        setIsUserMenuOpen(false);
                        setIsLanguageMenuOpen(false);
                    }

                    setLastScrollY(currentScrollY);
                    ticking = false;
                });

                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
            if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
                setIsLanguageMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const increaseFontSize = () => {
        if (fontSize < 20) {
            const newSize = fontSize + 2;
            setFontSize(newSize);
            document.documentElement.style.fontSize = `${newSize}px`;
        }
    };

    const decreaseFontSize = () => {
        if (fontSize > 12) {
            const newSize = fontSize - 2;
            setFontSize(newSize);
            document.documentElement.style.fontSize = `${newSize}px`;
        }
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'हिन्दी' },
        { code: 'bn', name: 'বাংলা' },
        { code: 'te', name: 'తెలుగు' },
        { code: 'mr', name: 'मराठी' },
        { code: 'ta', name: 'தமிழ்' },
        { code: 'gu', name: 'ગુજરાતી' },
        { code: 'kn', name: 'ಕನ್ನಡ' },
        { code: 'ml', name: 'മലയാളം' },
        { code: 'pa', name: 'ਪੰਜਾਬੀ' }
    ];

    const defaultUserAvatar = "/images/default-user-avatar.svg";
    const userAvatar = defaultUserAvatar;
    const displayName = user?.fullName || user?.email?.split('@')[0] || 'User';
    const displayRoles = user?.roles?.join(', ').replace(/_/g, ' ') || 'USER';

    return (
        <>
            {/* Navbar with Solid Background - Auto-hide on scroll */}
            <nav className={`fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md text-white transition-all duration-300 ${isScrolled ? 'shadow-2xl border-b border-slate-800' : 'shadow-lg border-b border-slate-800/50'
                } ${isVisible ? 'translate-y-0' : '-translate-y-full'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20 gap-6">
                        {/* Left Section: Government & Logos */}
                        <div className="flex items-center gap-6 min-w-0">
                            <Link href={user ? "/dashboard" : "/"}>
                                <div className="flex items-center gap-4 cursor-pointer group">
                                    {/* Government and Brand Logos */}
                                    <div className="flex items-center gap-3">
                                        {/* Government of India Logo */}
                                        <img
                                            src="/images/GOI logo.png"
                                            alt="Government of India"
                                            className="h-10 w-auto brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity"
                                        />

                                        {/* Divider */}
                                        <div className="h-8 w-px bg-white/20"></div>

                                        {/* PRISM Logo */}
                                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20 group-hover:bg-white/15 transition-colors">
                                            <img src="/images/prism brand logo.png" alt="PRISM Logo" className="w-6 h-6 object-contain brightness-0 invert" />
                                        </div>

                                        {/* PRISM Text */}
                                        <span className="font-bold text-xl tracking-tight text-white">PRISM</span>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* Right Section: Controls & Status */}
                        <div className="hidden md:flex items-center gap-6 justify-end flex-shrink-0">
                            {/* Accessibility Tools */}
                            <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10 backdrop-blur-sm">
                                <button
                                    onClick={decreaseFontSize}
                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-xs font-bold"
                                    title="Decrease font size"
                                >
                                    A-
                                </button>
                                <button
                                    onClick={increaseFontSize}
                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-xs font-bold"
                                    title="Increase font size"
                                >
                                    A+
                                </button>
                            </div>

                            {/* Language Dropdown */}
                            <div className="relative" ref={languageMenuRef}>
                                <button
                                    onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors text-sm font-medium border border-white/10 hover:border-white/20"
                                >
                                    <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                    </svg>
                                    <span>EN</span>
                                    <svg className={`w-3 h-3 transition-transform opacity-70 ${isLanguageMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isLanguageMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in-up text-slate-900">
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium transition-colors flex items-center justify-between group"
                                                onClick={() => setIsLanguageMenuOpen(false)}
                                            >
                                                {lang.name}
                                                {lang.code === 'en' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Navigation Menu */}
                            <div className="flex items-center gap-4">
                                {loading ? (
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-8 bg-white/10 rounded animate-pulse"></div>
                                        <div className="w-24 h-8 bg-white/10 rounded animate-pulse"></div>
                                    </div>
                                ) : user ? (
                                    <>
                                        {/* Reviewer Link - for Expert Reviewers and Committee Members */}
                                        {hasAnyRole([ROLES.EXPERT_REVIEWER, ROLES.CMPDI_MEMBER, ROLES.TSSRC_MEMBER, ROLES.SSRC_MEMBER, ROLES.SUPER_ADMIN]) && (
                                            <Link href="/reviewer">
                                                <button className="px-4 py-2 text-sm font-semibold text-white hover:text-blue-300 transition-colors">
                                                    Reviewer
                                                </button>
                                            </Link>
                                        )}

                                        {/* User Profile Button - Compact with just avatar and chevron */}
                                        <div className="relative" ref={userMenuRef}>
                                            <button
                                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                                className="flex items-center gap-2 px-2 py-1.5 bg-transparent rounded-full hover:bg-white/5 transition-colors"
                                            >
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                                    {displayName.charAt(0).toUpperCase()}
                                                </div>
                                                <svg className={`w-4 h-4 opacity-70 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {/* User Dropdown Menu */}
                                            {isUserMenuOpen && (
                                                <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in-up">
                                                    {/* User Info Header */}
                                                    <div className="px-5 py-4 bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white/30">
                                                                {displayName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-base truncate">{displayName}</p>
                                                                <p className="text-xs text-blue-100 truncate">{user.email}</p>
                                                                <div className="mt-1.5 flex flex-wrap gap-1">
                                                                    {user.roles?.map((role, idx) => (
                                                                        <span key={idx} className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-semibold uppercase tracking-wide border border-white/20">
                                                                            {role.replace('_', ' ')}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Menu Items */}
                                                    <div className="py-2 text-slate-700">
                                                        <Link href="/dashboard">
                                                            <button className="w-full text-left px-5 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 group">
                                                                <svg className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                                </svg>
                                                                <span className="font-semibold text-sm">Dashboard</span>
                                                            </button>
                                                        </Link>

                                                        <Link href="/profile">
                                                            <button className="w-full text-left px-5 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 group">
                                                                <svg className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                                <span className="font-semibold text-sm">My Profile</span>
                                                            </button>
                                                        </Link>

                                                        <div className="my-1 border-t border-slate-200"></div>

                                                        <button
                                                            onClick={logout}
                                                            className="w-full text-left px-5 py-3 hover:bg-red-50 transition-colors flex items-center gap-3 group text-red-600"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                            </svg>
                                                            <span className="font-semibold text-sm">Logout</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login">
                                            <button className="px-6 py-2.5 text-sm font-semibold text-white hover:text-blue-300 transition-colors">
                                                Login
                                            </button>
                                        </Link>
                                        <Link href="/register">
                                            <button className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full text-sm font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                                                Register
                                            </button>
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-slate-800/95 backdrop-blur-md border-t border-slate-700">
                        <div className="px-4 py-4 space-y-2">
                            {user ? (
                                <>
                                    <Link href="/dashboard">
                                        <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 transition-colors font-semibold">
                                            Dashboard
                                        </button>
                                    </Link>
                                    <Link href="/profile">
                                        <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 transition-colors font-semibold">
                                            Profile
                                        </button>
                                    </Link>
                                    {hasAnyRole([ROLES.EXPERT_REVIEWER, ROLES.CMPDI_MEMBER, ROLES.TSSRC_MEMBER, ROLES.SSRC_MEMBER, ROLES.SUPER_ADMIN]) && (
                                        <Link href="/reviewer">
                                            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 transition-colors font-semibold">
                                                Reviewer
                                            </button>
                                        </Link>
                                    )}
                                    <button
                                        onClick={logout}
                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-500/20 transition-colors font-semibold text-red-300"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login">
                                        <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 transition-colors font-semibold">
                                            Login
                                        </button>
                                    </Link>
                                    <Link href="/register">
                                        <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-bold hover:from-blue-600 hover:to-indigo-700 transition-all">
                                            Register
                                        </button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
}
