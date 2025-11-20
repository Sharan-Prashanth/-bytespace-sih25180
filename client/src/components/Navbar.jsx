import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth, ROLES } from "../context/AuthContext";

export default function Navbar({ variant = "default" }) {
  const { user, logout, isUser, isReviewer, isStaff, loading } = useAuth();
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
            ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 backdrop-blur-lg shadow-xl" 
            : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg",
          text: "text-white",
          border: "border-white/20"
        };
      default:
        return {
          bg: isScrolled 
            ? "bg-gradient-to-r from-orange-500 to-orange-600 backdrop-blur-lg shadow-xl" 
            : "bg-white shadow-lg",
          text: isScrolled ? "text-black" : "text-gray-900",
          border: isScrolled ? "border-orange-300" : "border-gray-200"
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

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'user': return 'from-blue-500 to-blue-600';
      case 'reviewer': return 'from-purple-500 to-purple-600';
      case 'staff': return 'from-green-500 to-green-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

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
  const userAvatar =
    user?.avatarUrl ||
    user?.profileImage ||
    user?.photo ||
    defaultUserAvatar;

  return (
    <>
      {/* Combined Government Header and Main Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 shadow-2xl transition-all duration-500 ${navStyles.bg} ${navStyles.text} border-b ${navStyles.border}`}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full animate-float"></div>

          <div className="absolute top-0 -left-5 w-24 h-24 bg-white/5 rounded-full animate-float animation-delay-1000"></div>
        </div>

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16 gap-6">
            {/* Left Section: Government & Logos (flush left) */}
            <div className="flex items-center gap-6 min-w-0">
              <Link href={user ? "/dashboard" : "/"}>
                <div className="flex items-center gap-6 cursor-pointer group pl-0">
                  <div className={`flex items-center gap-4 text-sm font-semibold ${navStyles.text}`}>
                    <a href="https://www.india.gov.in/" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                      variant === "profile" ? 'hover:bg-white/20' : (isScrolled ? 'hover:bg-white/10' : 'hover:bg-black/20')
                    }`}>
                      <img 
                        src="/images/GOI logo.png" 
                        alt="Government of India Logo" 
                        className="w-6 h-10 rounded"
                      />
                      <div>
                        <div className="font-medium">भारत सरकार</div>
                        <div className="font-medium text-xs">Government of India</div>
                      </div>
                    </a>
                    <div className={`w-px h-8 ${variant === "profile" ? 'bg-white/30' : (isScrolled ? 'bg-white/30' : 'bg-gray-600/60')}`}></div>
                    <div className="flex items-center gap-3">
                      <a href="https://www.coalindia.in/" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                        variant === "profile" ? 'hover:bg-white/20' : (isScrolled ? 'hover:bg-white/10' : 'hover:bg-black/20')
                      }`}>
                        <img 
                          src="/images/CoalLog4.png" 
                          alt="Coal India Limited" 
                          className="w-10 h-12 rounded bg-white object-cover"
                        />
                        <span className="font-medium text-xs">Coal India Limited</span>
                      </a>
                      <a href="https://www.cmpdi.co.in/en" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                        variant === "profile" ? 'hover:bg-white/20' : (isScrolled ? 'hover:bg-white/10' : 'hover:bg-black/20')
                      }`}>
                        <img 
                          src="/images/cmpdi logo.jpg" 
                          alt="CMPDI" 
                          className="w-20 h-12 rounded bg-white object-cover" 
                        />
                        <span className="font-medium text-xs">CMPDI</span>
                      </a>
                    </div>
                    <div className={`w-px h-8 mx-2 ${isScrolled ? 'bg-white/30' : 'bg-gray-600/60'}`}></div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Right Section: Controls & Status (flush right) */}
            <div className="hidden md:flex items-center gap-6 justify-end flex-shrink-0">
              {/* Font Size Controls */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={decreaseFontSize}
                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors font-semibold ${
                    variant === "profile"
                      ? 'bg-white/20 hover:bg-white/30 text-white'
                      : (isScrolled 
                        ? 'bg-white/20 hover:bg-white/30 text-white' 
                        : 'bg-gray-900/30 hover:bg-gray-900/40 text-gray-900')
                  }`}
                  title="Decrease font size"
                >
                  A-
                </button>
                <button 
                  onClick={increaseFontSize}
                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors font-semibold ${
                    variant === "profile"
                      ? 'bg-white/20 hover:bg-white/30 text-white'
                      : (isScrolled 
                        ? 'bg-white/20 hover:bg-white/30 text-white' 
                        : 'bg-gray-900/30 hover:bg-gray-900/40 text-gray-900')
                  }`}
                  title="Increase font size"
                >
                  A+
                </button>
              </div>
              
              {/* Language Dropdown */}
              <div className="relative" ref={languageMenuRef}>
                <button 
                  onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-colors font-medium ${
                    variant === "profile"
                      ? 'hover:bg-white/20 text-white'
                      : (isScrolled 
                        ? 'hover:bg-white/20 text-white' 
                        : 'hover:bg-gray-900/20 text-gray-900')
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  Language
                  <svg className={`w-4 h-4 transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isLanguageMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        className="w-full text-left px-4 py-2 text-black hover:bg-gray-100 text-sm"
                        onClick={() => setIsLanguageMenuOpen(false)}  
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className={`w-px h-6 ${isScrolled ? 'bg-white/30' : 'bg-gray-600/60'}`}></div>

              {/* Navigation Menu */}
              <div className="flex items-center gap-6">
                {loading ? (
                // Loading state - show skeleton to prevent hydration mismatch
                <div className="flex items-center gap-4">
                  <div className="w-20 h-8 bg-white rounded animate-pulse"></div>
                  <div className="w-16 h-8 bg-black rounded animate-pulse"></div>
                  <div className="w-24 h-8 bg-black rounded animate-pulse"></div>
                </div>
              ) : user ? (
                // Logged-in user navigation - only show role-specific links
                <>
                  <div className="flex items-center gap-6">
                    {/* Reviewer-specific navigation */}
                    {isReviewer() && (
                      <Link 
                        href="/proposal/review" 
                        className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 font-medium ${
                          variant === "profile"
                            ? 'hover:bg-white/20 text-white'
                            : (isScrolled 
                              ? 'hover:bg-white/10 text-white' 
                              : 'hover:bg-gray-900/20 text-gray-900')
                        }`}
                      >
                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Review Proposals
                      </Link>
                    )}
                  </div>

                  {/* User Profile Menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-300 group ${
                        isScrolled
                          ? 'bg-white/10 hover:bg-white/20 border-white/30 text-black'
                          : 'bg-black/5 hover:bg-black/10 border-black/10 text-gray-900'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full border border-black/10 overflow-hidden bg-white flex items-center justify-center">
                        <img
                          src={userAvatar}
                          alt={`${user?.username || 'Portal user'} avatar`}
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = defaultUserAvatar;
                          }}
                        />
                      </div>
                      <div className="text-left leading-tight">
                        <div className={`${isScrolled ? 'text-black' : 'text-gray-900'}`}>{user?.username || 'User'}</div>
                        <div className="text-[11px] uppercase tracking-wide text-gray-500">
                          {user?.role || 'Guest'}
                        </div>
                      </div>
                      <svg className={`w-4 h-4 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''} group-hover:scale-110 ${isScrolled ? 'text-black' : 'text-gray-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in-down">
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-sm font-medium text-slate-900">{user?.username}</p>
                          <p className="text-xs text-slate-500">{user?.email}</p>
                        </div>
                        
                        <Link href="/profile">
                          <div className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors duration-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-sm font-medium">Profile Settings</span>
                          </div>
                        </Link>
                        
                        <Link href="/dashboard">
                          <div className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors duration-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            </svg>
                            <span className="text-sm font-medium">Dashboard</span>
                          </div>
                        </Link>
                        
                        <div className="border-t border-slate-100 mt-2 pt-2">
                          <button
                            onClick={logout}
                            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 cursor-pointer transition-colors duration-200 w-full text-left"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-sm font-medium">Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // Guest navigation
                <div className="flex items-center gap-4">
                  <Link href="/login">
                    <button className={`group px-6 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 hover:scale-105 ${
                      isScrolled 
                        ? 'bg-gradient-to-r from-orange-700 to-orange-800 hover:from-orange-800 hover:to-orange-900 text-white shadow-lg' 
                        : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg'
                    }`}>
                      <svg className="w-4 h-4 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className={`group border-2 px-6 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 hover:scale-105 ${
                      isScrolled 
                        ? 'border-orange-700 hover:border-orange-800 text-orange-800 hover:bg-orange-700/10 bg-white/90' 
                        : 'border-gray-900 hover:border-gray-700 text-gray-900 hover:bg-gray-900/20 shadow-md'
                    }`}>
                      <svg className="w-4 h-4 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Register
                    </button>
                  </Link>
                </div>
              )}
              </div>

              <div
                className="px-3 py-1 rounded-full bg-black text-white text-xs font-semibold shadow-lg border border-white/10 ml-2"
                role="status"
                aria-label="SIH Team ID 72110"
                title="SIH Team ID: 72110"
              >
                SIH ID: 72110
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 transition-colors duration-300 ${
                  isScrolled ? 'text-black hover:text-gray-700' : 'text-gray-900 hover:text-gray-700'
                }`}
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
          <div className={`md:hidden absolute top-full left-0 right-0 shadow-2xl z-50 animate-fade-in-down transition-all duration-500 ${
            isScrolled 
              ? 'bg-orange-700 border-t border-orange-800' 
              : 'bg-white/10 backdrop-blur-lg border-t border-white/20'
          }`}>
            <div className="px-4 py-6 space-y-4">
              {loading ? (
                <div className="space-y-2">
                  <div className={`w-full h-8 rounded animate-pulse ${isScrolled ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                  <div className={`w-3/4 h-8 rounded animate-pulse ${isScrolled ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                  <div className={`w-1/2 h-8 rounded animate-pulse ${isScrolled ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                </div>
              ) : user ? (
                <>
                  {isReviewer() && (
                    <Link href="/proposal/review">
                      <div className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-colors duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Review Proposals
                      </div>
                    </Link>
                  )}
                  
                  <div className="border-t border-orange-800 pt-4">
                    <div className="px-4 py-2">
                      <p className="text-sm text-white/70">Signed in as</p>
                      <p className="text-white font-medium">{user?.username}</p>
                      <p className="inline-block text-xs px-2 py-1 rounded bg-blue-800 text-white font-medium mt-2">
                        {user?.role}
                      </p>
                    </div>
                    <button
                      onClick={logout}
                      className="flex items-center gap-3 px-4 py-3 text-red-200 hover:bg-red-500/20 rounded-lg transition-colors duration-200 w-full text-left"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-800 hover:bg-blue-900 text-white rounded-lg transition-colors duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In
                    </div>
                  </Link>
                  
                  <Link href="/register">
                    <div className="flex items-center gap-3 px-4 py-3 border-2 border-white/30 text-white hover:bg-white/10 rounded-lg transition-colors duration-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Register
                    </div>
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
