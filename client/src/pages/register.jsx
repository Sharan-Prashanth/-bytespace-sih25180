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
    email: "", 
    password: "",
    phoneNumber: "",
    designation: "",
    organisationName: "",
    organisationType: "INDIAN_ACADEMIC_RESEARCH",
    country: "India",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: ""
    },
    expertiseDomains: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    try {
      // Prepare form data
      const registrationData = {
        ...form,
        expertiseDomains: form.expertiseDomains ? form.expertiseDomains.split(',').map(e => e.trim()).filter(e => e) : []
      };
      
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
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Account</h2>
              <p className="text-slate-600 text-sm">Join the NaCCER research community</p>
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

            {/* Personal Information */}
            <div className="mb-4 animate-fade-in-up animation-delay-400">
              <label className="block text-slate-700 text-xs font-semibold mb-2">Full Name *</label>
              <input 
                type="text" 
                name="fullName" 
                placeholder="Enter your full name"
                value={form.fullName} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-orange-200/60 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 focus:outline-none text-slate-900 bg-white/70 backdrop-blur-sm font-medium transition-all duration-300 hover:border-orange-300 text-xs placeholder:text-xs"
                required 
              />
            </div>

            <div className="mb-4 animate-fade-in-up animation-delay-450">
              <label className="block text-slate-700 text-xs font-semibold mb-2">Email Address *</label>
              <input 
                type="email" 
                name="email" 
                placeholder="Enter your email address"
                value={form.email} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-orange-200/60 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 focus:outline-none text-slate-900 bg-white/70 backdrop-blur-sm font-medium transition-all duration-300 hover:border-orange-300 text-xs placeholder:text-xs"
                required 
              />
            </div>

            <div className="mb-4 animate-fade-in-up animation-delay-500">
              <label className="block text-slate-700 text-xs font-semibold mb-2">Password *</label>
              <input 
                type="password" 
                name="password" 
                placeholder="Create a strong password (min 6 characters)"
                value={form.password} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-orange-200/60 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 focus:outline-none text-slate-900 bg-white/70 backdrop-blur-sm font-medium transition-all duration-300 hover:border-orange-300 text-xs placeholder:text-xs"
                required 
                minLength={6}
              />
            </div>

            <div className="mb-4 animate-fade-in-up animation-delay-550">
              <label className="block text-slate-700 text-xs font-semibold mb-2">Phone Number</label>
              <input 
                type="tel" 
                name="phoneNumber" 
                placeholder="Enter your phone number"
                value={form.phoneNumber} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-orange-200/60 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 focus:outline-none text-slate-900 bg-white/70 backdrop-blur-sm font-medium transition-all duration-300 hover:border-orange-300 text-xs placeholder:text-xs"
              />
            </div>

            {/* Professional Information */}
            <div className="mb-4 animate-fade-in-up animation-delay-600">
              <label className="block text-slate-700 text-xs font-semibold mb-2">Designation *</label>
              <input 
                type="text" 
                name="designation" 
                placeholder="e.g., Research Scholar, Professor, Scientist"
                value={form.designation} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-orange-200/60 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 focus:outline-none text-slate-900 bg-white/70 backdrop-blur-sm font-medium transition-all duration-300 hover:border-orange-300 text-xs placeholder:text-xs"
                required 
              />
            </div>

            <div className="mb-4 animate-fade-in-up animation-delay-650">
              <label className="block text-slate-700 text-xs font-semibold mb-2">Organisation Name *</label>
              <input 
                type="text" 
                name="organisationName" 
                placeholder="Enter your organisation/institution name"
                value={form.organisationName} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-orange-200/60 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 focus:outline-none text-slate-900 bg-white/70 backdrop-blur-sm font-medium transition-all duration-300 hover:border-orange-300 text-xs placeholder:text-xs"
                required 
              />
            </div>

            <div className="mb-4 animate-fade-in-up animation-delay-700">
              <label className="block text-slate-700 text-xs font-semibold mb-2">Organisation Type *</label>
              <select 
                name="organisationType" 
                value={form.organisationType} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-orange-200/60 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 focus:outline-none text-slate-900 bg-white/70 backdrop-blur-sm font-medium transition-all duration-300 hover:border-orange-300 text-xs"
                required
              >
                <option value="INDIAN_ACADEMIC_RESEARCH">Indian Academic/Research Institution</option>
                <option value="INDIAN_GOVT_ORGANISATION">Indian Government Organisation</option>
                <option value="PUBLIC_SECTOR_SUBSIDIARY">Public Sector Subsidiary</option>
                <option value="FOREIGN_INSTITUTE">Foreign Institute</option>
                <option value="CMPDI">CMPDI</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="mb-4 animate-fade-in-up animation-delay-750">
              <label className="block text-slate-700 text-xs font-semibold mb-2">Country *</label>
              <input 
                type="text" 
                name="country" 
                placeholder="Enter your country"
                value={form.country} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-orange-200/60 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 focus:outline-none text-slate-900 bg-white/70 backdrop-blur-sm font-medium transition-all duration-300 hover:border-orange-300 text-xs placeholder:text-xs"
                required 
              />
            </div>

            {/* Address (Optional) */}
            <div className="mb-4 animate-fade-in-up animation-delay-800">
              <label className="block text-slate-700 text-xs font-semibold mb-2">Address Line 1</label>
              <input 
                type="text" 
                name="address.line1" 
                placeholder="Street address, P.O. Box"
                value={form.address.line1} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-orange-200/60 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 focus:outline-none text-slate-900 bg-white/70 backdrop-blur-sm font-medium transition-all duration-300 hover:border-orange-300 text-xs placeholder:text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 animate-fade-in-up animation-delay-850">
              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-2">City</label>
                <input 
                  type="text" 
                  name="address.city" 
                  placeholder="City"
                  value={form.address.city} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2.5 border border-orange-200/60 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 focus:outline-none text-slate-900 bg-white/70 backdrop-blur-sm font-medium transition-all duration-300 hover:border-orange-300 text-xs placeholder:text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-2">State</label>
                <input 
                  type="text" 
                  name="address.state" 
                  placeholder="State"
                  value={form.address.state} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2.5 border border-orange-200/60 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 focus:outline-none text-slate-900 bg-white/70 backdrop-blur-sm font-medium transition-all duration-300 hover:border-orange-300 text-xs placeholder:text-xs"
                />
              </div>
            </div>

            <div className="mb-6 animate-fade-in-up animation-delay-900">
              <label className="block text-slate-700 text-xs font-semibold mb-2">Expertise Domains</label>
              <input 
                type="text" 
                name="expertiseDomains" 
                placeholder="e.g., Coal Mining, Environmental Science (comma-separated)"
                value={form.expertiseDomains} 
                onChange={handleChange} 
                className="w-full px-3 py-2.5 border border-orange-200/60 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 focus:outline-none text-slate-900 bg-white/70 backdrop-blur-sm font-medium transition-all duration-300 hover:border-orange-300 text-xs placeholder:text-xs"
              />
              <p className="text-xs text-slate-500 mt-1">Separate multiple domains with commas</p>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-102 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none animate-fade-in-up animation-delay-950 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
          
            <div className="mt-6 text-center animate-fade-in-up animation-delay-1000">
              <p className="text-slate-600 font-medium text-sm">
                Already have an account? 
                <a href="/login" className="text-orange-600 hover:text-orange-700 font-semibold ml-1 transition-colors duration-300">Sign in here</a>
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
                <h3 className="text-xs font-bold text-orange-800">Account Types</h3>
              </div>
              <div className="text-xs text-orange-700 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                  <span><strong>Note:</strong> All users register with USER role</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-600 rounded-full"></div>
                  <span>Committee members are created by Super Admin</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Submit research proposals after registration</span>
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
