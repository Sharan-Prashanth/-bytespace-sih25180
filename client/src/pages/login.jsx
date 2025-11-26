'use client';

import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import LoadingScreen from "../components/LoadingScreen";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form.email, form.password);
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
      <section className="relative h-screen w-full overflow-hidden bg-slate-900 text-white pt-20">
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

        {/* Login Form - Centered */}
        <div className="relative z-30 h-full flex items-center justify-center px-4 py-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white/10 backdrop-blur-2xl p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-white/20 animate-fade-in-up"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-blue-300 uppercase tracking-widest">Government of India</span>
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '500ms' }}></div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1.5">Welcome Back</h2>
              <p className="text-slate-300 text-xs">Sign in to your NaCCER account</p>
              <div className="w-16 h-0.5 bg-gradient-to-r from-blue-400 to-emerald-400 mx-auto mt-3"></div>
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

            <div className="mb-4">
              <label className="block text-white text-xs font-semibold mb-1.5">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-white/20 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:outline-none bg-white/10 backdrop-blur-md text-white placeholder-slate-400 font-medium transition-all duration-300 text-sm"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-white text-xs font-semibold mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-white/20 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:outline-none bg-white/10 backdrop-blur-md text-white placeholder-slate-400 font-medium transition-all duration-300 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-lg font-bold text-sm shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-102 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In to Portal
                </>
              )}
            </button>

            <div className="mt-5 text-center">
              <p className="text-slate-300 font-medium text-xs">
                Don't have an account?
                <a href="/register" className="text-blue-300 hover:text-blue-200 font-semibold ml-1 transition-colors duration-300">Register here</a>
              </p>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowCredentials(!showCredentials)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-xs font-bold text-blue-200">Test Credentials</h3>
                </div>
                <svg
                  className={`w-4 h-4 text-blue-300 transition-transform duration-300 ${showCredentials ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showCredentials && (
                <div className="mt-2 p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl border border-white/10 backdrop-blur-sm animate-fade-in-up">
                  <div className="text-xs text-slate-200 space-y-1.5 max-h-40 overflow-y-auto pr-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0"></div>
                      <span><strong>Admin:</strong> bytespacesih@gmail.com / adminpass</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></div>
                      <span><strong>User:</strong> user-bs@gmail.com / userpass</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full flex-shrink-0"></div>
                      <span><strong>CMPDI:</strong> cmpdi-bs@gmail.com / cmpdipass</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0"></div>
                      <span><strong>Expert:</strong> expert-bs@gmail.com / expertpass</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0"></div>
                      <span><strong>TSSRC:</strong> tssrc-bs@gmail.com / tssrcpass</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0"></div>
                      <span><strong>SSRC:</strong> ssrc-bs@gmail.com / ssrcpass</span>
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
