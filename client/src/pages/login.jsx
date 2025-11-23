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
    <div className="min-h-screen bg-slate-50 pt-16">
      <Navbar />
      
      {/* Hero Background Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-16">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-orange-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-green-400 rounded-full blur-2xl opacity-20 animate-pulse animation-delay-1000"></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center px-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white/85 backdrop-blur-lg p-8 rounded-xl shadow-xl w-full max-w-md border border-white/30 animate-fade-in-up relative overflow-hidden"
            style={{
              boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.15)',
            }}
          >
            {/* Subtle Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-white/5 to-orange-50/10 pointer-events-none rounded-xl"></div>
            <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-orange-600">Government of India</span>
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse animation-delay-500"></div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h2>
              <p className="text-slate-600 text-sm">Sign in to your NaCCER account</p>
              <div className="w-20 h-0.5 bg-gradient-to-r from-orange-500 to-green-500 mx-auto mt-3 animate-scale-x"></div>
            </div>
          
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-800 px-3 py-2 rounded-lg mb-4 font-medium animate-fade-in-up animation-delay-200">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            <div className="mb-4 animate-fade-in-up animation-delay-400">
              <label className="block text-slate-700 text-xs font-semibold mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={handleChange}
                className="w-full p-3 border border-orange-200/60 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 focus:outline-none text-slate-900 bg-white/70 backdrop-blur-sm font-medium transition-all duration-300 hover:border-orange-300 text-sm"
                required
              />
            </div>
            
            <div className="mb-6 animate-fade-in-up animation-delay-600">
              <label className="block text-slate-700 text-xs font-semibold mb-2">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                className="w-full p-3 border border-orange-200/60 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 focus:outline-none text-slate-900 bg-white/70 backdrop-blur-sm font-medium transition-all duration-300 hover:border-orange-300 text-sm"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-102 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none animate-fade-in-up animation-delay-800 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
          
            <div className="mt-6 text-center animate-fade-in-up animation-delay-1000">
              <p className="text-slate-600 font-medium text-sm">
                Don't have an account? 
                <a href="/register" className="text-orange-600 hover:text-orange-700 font-semibold ml-1 transition-colors duration-300">Register here</a>
              </p>
            </div>
            
            <div 
              className="mt-6 p-4 bg-gradient-to-br from-orange-50/70 to-orange-100/50 rounded-xl border border-orange-200/50 animate-fade-in-up animation-delay-1200 backdrop-blur-sm"
            >
              <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h3 className="text-xs font-bold text-orange-800">Test Credentials</h3>
              </div>
              <div className="text-xs text-orange-700 space-y-1.5 max-h-48 overflow-y-auto pr-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
                  <span><strong>Admin:</strong> bytespacesih@gmail.com / adminpass</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span><strong>User:</strong> user-bs@gmail.com / userpass</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0"></div>
                  <span><strong>CMPDI:</strong> cmpdi-bs@gmail.com / cmpdipass</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <span><strong>Expert:</strong> expert-bs@gmail.com / expertpass</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span><strong>TSSRC:</strong> tssrc-bs@gmail.com / tssrcpass</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></div>
                  <span><strong>SSRC:</strong> ssrc-bs@gmail.com / ssrcpass</span>
                </div>
              </div>
              </div>
            </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
