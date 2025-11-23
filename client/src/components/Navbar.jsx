'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth, ROLES } from "../context/AuthContext";

export default function Navbar({ variant = "default" }) {
  const { user, logout, isExpertReviewer, isCMPDIMember, isTSSRCMember, isSSRCMember, isSuperAdmin, hasAnyRole, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isScrolled, setIsScrolled] = useState(false);
  const userMenuRef = useRef(null);
  const languageMenuRef = useRef(null);

  // Debug: Log user state
  console.log("Navbar - User:", user, "Loading:", loading);

  // Get navbar styling based on variant
  const getNavbarStyles = () => {
    switch (variant) {
      case "profile":
        return {
          bg: isScrolled
            ? "bg-slate-900/90 backdrop-blur-md shadow-lg border-b border-slate-800"
            : "bg-transparent",
          text: "text-white",
          border: "border-transparent"
        };
      default:
        return {
          bg: isScrolled
            ? "bg-slate-900/90 backdrop-blur-md shadow-lg border-b border-slate-800"
            : "bg-transparent",
          text: "text-white",
          border: "border-transparent"
        };
    }
  };

  const navStyles = getNavbarStyles();

  // Scroll detection for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const defaultUserAvatar = "/images/default-user.svg";
  const userAvatar = defaultUserAvatar;
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'User';
  const displayRoles = user?.roles?.join(', ').replace(/_/g, ' ') || 'USER';

  return (
    <>
      {/* Combined Government Header and Main Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navStyles.bg} ${navStyles.text}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-6">
            {/* Left Section: Government & Logos */}
            <div className="flex items-center gap-6 min-w-0">
              <Link href={user ? "/dashboard" : "/"}>
                <div className="flex items-center gap-4 cursor-pointer group">
                  {/* GOI Logo */}
                  <div className="flex items-center gap-3">
                    <img
                      src="/images/GOI logo.png"
                      alt="Government of India"
                      className="h-12 w-auto brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="hidden sm:block leading-tight">
                      <div className="font-bold text-sm tracking-wide">भारत सरकार</div>
                      <div className="font-medium text-xs opacity-80">Government of India</div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-8 w-px bg-white/20 mx-2"></div>

                  {/* Ministry/Portal Logos */}
                  <div className="flex items-center gap-4">
                    <img
                      src="/images/CoalLog4.png"
                      alt="Coal India"
                      className="h-10 w-auto bg-white/10 rounded p-1 backdrop-blur-sm"
                    />
                    <img
                      src="/images/cmpdi logo.jpg"
                      alt="CMPDI"
                      className="h-10 w-auto bg-white/10 rounded p-1 backdrop-blur-sm hidden md:block"
                    />
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors text-sm font-medium border border-transparent hover:border-white/10"
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
                    {hasAnyRole([ROLES.EXPERT_REVIEWER, ROLES.CMPDI_MEMBER, ROLES.TSSRC_MEMBER, ROLES.SSRC_MEMBER]) && (
                      <Link
                        href="/proposal/review"
                        className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 transition-all text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Review
                      </Link>
                    )}

                    {/* User Profile Menu */}
                    <div className="relative" ref={userMenuRef}>
                      <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-all duration-300"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-white/20">
                          <img
                            src={userAvatar}
                            alt="User"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = defaultUserAvatar; }}
                          />
                        </div>
                        <div className="text-left hidden lg:block">
                          <div className="text-xs font-bold leading-none mb-0.5">{displayName}</div>
                          <div className="text-[10px] opacity-70 uppercase tracking-wider leading-none">{displayRoles}</div>
                        </div>
                        <svg className={`w-4 h-4 transition-transform opacity-70 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {isUserMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-fade-in-up text-slate-900 overflow-hidden">
                          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                            <p className="text-sm font-bold text-slate-900">{user?.fullName}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {user?.roles?.map((role, index) => (
                                <span key={index} className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                                  {role.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="p-2">
                            <Link href="/profile">
                              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer group">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <span className="text-sm font-medium">Profile Settings</span>
                              </div>
                            </Link>

                            <Link href="/dashboard">
                              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer group">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                  </svg>
                                </div>
                                <span className="text-sm font-medium">Dashboard</span>
                              </div>
                            </Link>
                          </div>

                          <div className="border-t border-slate-100 mt-1 p-2">
                            <button
                              onClick={logout}
                              className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors w-full text-left group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                              </div>
                              <span className="text-sm font-medium">Sign Out</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // Guest navigation
                  <div className="flex items-center gap-3">
                    <Link href="/login">
                      <button className="px-5 py-2 rounded-full text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                        Sign In
                      </button>
                    </Link>
                    <Link href="/register">
                      <button className="px-5 py-2 rounded-full text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5">
                        Register
                      </button>
                    </Link>
                  </div>
                )}
              </div>

              {/* SIH Badge */}
              <div className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold tracking-wider text-white/80">
                SIH 2025
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
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

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900 border-t border-slate-800 shadow-2xl animate-fade-in-down">
            <div className="p-4 space-y-4">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-10 bg-white/10 rounded animate-pulse"></div>
                  <div className="h-10 bg-white/10 rounded animate-pulse"></div>
                </div>
              ) : user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center text-white font-bold">
                      {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white truncate">{user?.fullName}</div>
                      <div className="text-xs text-slate-400 truncate">{user?.email}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{displayRoles}</div>
                    </div>
                  </div>

                  {hasAnyRole([ROLES.EXPERT_REVIEWER, ROLES.CMPDI_MEMBER, ROLES.TSSRC_MEMBER, ROLES.SSRC_MEMBER]) && (
                    <Link href="/proposal/review">
                      <div className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-white/5 rounded-xl transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Review Proposals
                      </div>
                    </Link>
                  )}

                  <Link href="/dashboard">
                    <div className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-white/5 rounded-xl transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      Dashboard
                    </div>
                  </Link>

                  <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors w-full text-left"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/login">
                    <button className="w-full py-3 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                      Register
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
