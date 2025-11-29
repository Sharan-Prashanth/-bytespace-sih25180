'use client';

import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth, ROLES } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import LoadingScreen from "../components/LoadingScreen";

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    qualification: "",
    designation: "",
    organisationName: "",
    expertiseDomains: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    organisationType: "INDIAN_ACADEMIC_RESEARCH",
    country: "India",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: ""
    }
  });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested address fields
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setForm({
        ...form,
        address: {
          ...form.address,
          [addressField]: value
        }
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!consent) {
      setError("Please provide your consent to proceed");
      setLoading(false);
      return;
    }

    try {
      // Prepare form data
      const registrationData = {
        ...form,
        expertiseDomains: form.expertiseDomains ? form.expertiseDomains.split(',').map(e => e.trim()).filter(e => e) : []
      };
      
      // Remove confirmPassword before sending
      delete registrationData.confirmPassword;

      await register(registrationData);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      {/* Hero Section with Video Background */}
      <section className="relative min-h-screen w-full overflow-hidden bg-slate-900 text-white pt-20">
        {/* Background Video Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/edit-hero-section1.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Register Form - Centered */}
        <div className="relative z-30 min-h-screen flex items-center justify-center px-4 py-24">
          <form
            onSubmit={handleSubmit}
            className="bg-white/10 backdrop-blur-2xl p-6 rounded-2xl shadow-2xl w-full max-w-2xl border border-white/20 animate-fade-in-up my-8"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-cent
              er gap-2 mb-3">
                <div className="flex items-center gap-2">
  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>

  <span className="text-xs font-medium uppercase tracking-widest bg-gradient-to-r from-orange-400 via-white to-green-600 bg-clip-text text-transparent">
    Government of India
  </span>

  <div
    className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"
    style={{ animationDelay: "500ms" }}
  ></div>
</div>

              </div>
              <h2 className="text-2xl font-bold text-white mb-1.5">Create Account</h2>
              <p className="text-slate-300 text-xs">Join the NaCCER research community</p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-orange-500 via-white to-green-600 mx-auto mt-3"></div>
            </div>

            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/40 text-red-200 px-3 py-2 rounded-lg mb-4 font-medium animate-fade-in-up text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs">{error}</span>
                </div>
              </div>
            )}

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white text-xs font-semibold mb-1.5">Name *</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:outline-none bg-white/10 backdrop-blur-md text-white placeholder-slate-400 font-medium transition-all duration-300 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-white text-xs font-semibold mb-1.5">Qualification *</label>
                <input
                  type="text"
                  name="qualification"
                  placeholder="Enter your qualification"
                  value={form.qualification}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:outline-none bg-white/10 backdrop-blur-md text-white placeholder-slate-400 font-medium transition-all duration-300 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white text-xs font-semibold mb-1.5">Designation *</label>
                <input
                  type="text"
                  name="designation"
                  placeholder="e.g., Research Scholar, Professor"
                  value={form.designation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:outline-none bg-white/10 backdrop-blur-md text-white placeholder-slate-400 font-medium transition-all duration-300 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-white text-xs font-semibold mb-1.5">Organization *</label>
                <input
                  type="text"
                  name="organisationName"
                  placeholder="Enter your organisation name"
                  value={form.organisationName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:outline-none bg-white/10 backdrop-blur-md text-white placeholder-slate-400 font-medium transition-all duration-300 text-sm"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-white text-xs font-semibold mb-1.5">Research Interest Area *</label>
              <input
                type="text"
                name="expertiseDomains"
                placeholder="e.g., Coal Mining, Environmental Science"
                value={form.expertiseDomains}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-white/20 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:outline-none bg-white/10 backdrop-blur-md text-white placeholder-slate-400 font-medium transition-all duration-300 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white text-xs font-semibold mb-1.5">Email *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:outline-none bg-white/10 backdrop-blur-md text-white placeholder-slate-400 font-medium transition-all duration-300 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-white text-xs font-semibold mb-1.5">Contact *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="Enter your phone number"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:outline-none bg-white/10 backdrop-blur-md text-white placeholder-slate-400 font-medium transition-all duration-300 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white text-xs font-semibold mb-1.5">Password *</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a strong password (min 6 characters)"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:outline-none bg-white/10 backdrop-blur-md text-white placeholder-slate-400 font-medium transition-all duration-300 text-sm"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-white text-xs font-semibold mb-1.5">Re-enter Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:outline-none bg-white/10 backdrop-blur-md text-white placeholder-slate-400 font-medium transition-all duration-300 text-sm"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-slate-300 text-xs">
                  I agree to the <a href="#" className="text-blue-400 hover:text-blue-300">Terms of Service</a> and <a href="#" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className= "w-full group bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
>
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create Account
                </>
              )}
            </button>

            <div className="text-center mb-4">
              <p className="text-slate-300 font-medium text-xs">
                Already have an account?
                <a href="/login" className="text-blue-300 hover:text-blue-200 font-semibold ml-1 transition-colors duration-300">Sign in here</a>
              </p>
            </div>

            {/* Account Info - Collapsible */}
            <div>
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-xs font-bold text-blue-200">Account Information</h3>
                </div>
                <svg
                  className={`w-4 h-4 text-blue-300 transition-transform duration-300 ${showInfo ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showInfo && (
                <div className="mt-2 p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl border border-white/10 backdrop-blur-sm animate-fade-in-up">
                  <div className="text-xs text-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></div>
                      <span><strong>Note:</strong> All users register with USER role</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full flex-shrink-0"></div>
                      <span>Committee members are created by Super Admin</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0"></div>
                      <span>Submit research proposals after registration</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
