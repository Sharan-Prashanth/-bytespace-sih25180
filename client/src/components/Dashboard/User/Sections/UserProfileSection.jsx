'use client';

import { Award, Building2, Camera, Check, Globe, GraduationCap, Loader2, Mail, MapPin, Phone, Save, User } from "lucide-react";
import { useState } from "react";
import apiClient from "../../../../utils/api";

// Organisation type options (matching backend enum)
const ORGANISATION_TYPES = [
    { value: 'INDIAN_ACADEMIC_RESEARCH', label: 'Indian Academic/Research' },
    { value: 'INDIAN_GOVT_ORGANISATION', label: 'Indian Government Organisation' },
    { value: 'PRIVATE_SECTOR', label: 'Private Sector' },
    { value: 'PUBLIC_SECTOR_SUBSIDIARY', label: 'Public Sector Subsidiary' },
    { value: 'CMPDI', label: 'CMPDI' },
    { value: 'FOREIGN_ORGANISATION', label: 'Foreign Organisation' },
    { value: 'OTHER', label: 'Other' },
];

// Helper function to convert address object to string
const formatAddress = (address) => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    if (typeof address === 'object') {
        const parts = [];
        if (address.line1) parts.push(address.line1);
        if (address.line2) parts.push(address.line2);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.postalCode) parts.push(address.postalCode);
        return parts.filter(Boolean).join(', ');
    }
    return '';
};

export default function UserProfileSection({ user, theme, onUserUpdate }) {
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        qualification: user?.qualification || '',
        designation: user?.designation || '',
        organisationName: user?.organisationName || '',
        organisationType: user?.organisationType || '',
        country: user?.country || 'India',
        addressLine1: user?.address?.line1 || '',
        addressLine2: user?.address?.line2 || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        postalCode: user?.address?.postalCode || '',
        expertiseDomains: user?.expertiseDomains?.join(', ') || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);

    const isDark = theme === 'dark' || theme === 'darkest';
    const isDarkest = theme === 'darkest';

    const cardBg = isDarkest ? 'bg-neutral-900 border-neutral-800' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100';
    const textColor = isDark ? 'text-white' : 'text-black';
    const subTextColor = isDark ? 'text-slate-400' : 'text-black';
    const inputBg = isDarkest ? 'bg-neutral-950 border-neutral-800' : isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage(null);

        try {
            // Prepare data matching User model
            const updateData = {
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                qualification: formData.qualification,
                designation: formData.designation,
                organisationName: formData.organisationName,
                organisationType: formData.organisationType,
                country: formData.country,
                address: {
                    line1: formData.addressLine1,
                    line2: formData.addressLine2,
                    city: formData.city,
                    state: formData.state,
                    postalCode: formData.postalCode
                },
                expertiseDomains: formData.expertiseDomains.split(',').map(d => d.trim()).filter(Boolean)
            };

            const response = await apiClient.put('/api/users/profile', updateData);
            
            // Update the user in context if callback provided
            if (onUserUpdate) {
                onUserUpdate(response.data.user || response.data);
            }

            setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error) {
            console.error('Error saving profile:', error);
            setSaveMessage({ type: 'error', text: 'Failed to save changes. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    // Get formatted address for display
    const displayAddress = [formData.addressLine1, formData.addressLine2, formData.city, formData.state, formData.postalCode].filter(Boolean).join(', ');

    return (
        <div className="max-w-4xl mx-auto space-y-4">
            {/* Header */}
            <div>
                <h2 className={`text-xl font-bold ${textColor}`}>My Profile</h2>
                <p className={`${subTextColor} text-sm`}>Manage your personal information and account details.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Profile Card */}
                <div className={`lg:col-span-1 ${cardBg} p-5 rounded-2xl shadow-sm border flex flex-col items-center text-center`}>
                    <div className="relative mb-3 group cursor-pointer">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden ${isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-600'}`}>
                            {formData.fullName?.charAt(0) || 'U'}
                        </div>
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={20} />
                        </div>
                    </div>
                    <h3 className={`text-base font-bold ${textColor}`}>{formData.fullName || 'User Name'}</h3>
                    <p className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{formData.designation}</p>

                    <div className={`w-full mt-4 pt-4 border-t space-y-3 ${isDarkest ? 'border-neutral-800' : isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-2 text-sm">
                            <Mail size={14} className={subTextColor} />
                            <span className={textColor}>{formData.email || 'user@example.com'}</span>
                        </div>
                        {formData.phoneNumber && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone size={14} className={subTextColor} />
                                <span className={textColor}>{formData.phoneNumber}</span>
                            </div>
                        )}
                        {formData.qualification && (
                            <div className="flex items-center gap-2 text-sm">
                                <GraduationCap size={14} className={subTextColor} />
                                <span className={textColor}>{formData.qualification}</span>
                            </div>
                        )}
                        {formData.organisationName && (
                            <div className="flex items-center gap-2 text-sm">
                                <Building2 size={14} className={subTextColor} />
                                <span className={textColor}>{formData.organisationName}</span>
                            </div>
                        )}
                        {displayAddress && (
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin size={14} className={subTextColor} />
                                <span className={`${textColor} text-left`}>{displayAddress}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Form */}
                <div className={`lg:col-span-2 ${cardBg} p-5 rounded-2xl shadow-sm border`}>
                    <h3 className={`text-base font-bold mb-4 ${textColor}`}>Edit Information</h3>

                    {/* Success/Error Message */}
                    {saveMessage && (
                        <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${
                            saveMessage.type === 'success' 
                                ? (isDark ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 'bg-green-50 text-green-700 border border-green-100')
                                : (isDark ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-red-50 text-red-700 border border-red-100')
                        }`}>
                            {saveMessage.type === 'success' && <Check size={16} />}
                            <span className="text-sm font-medium">{saveMessage.text}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Personal Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Full Name</label>
                                <div className="relative">
                                    <User size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subTextColor}`} />
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Email Address</label>
                                <div className="relative">
                                    <Mail size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subTextColor}`} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        disabled
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all opacity-60 cursor-not-allowed ${inputBg} ${textColor}`}
                                    />
                                </div>
                                <p className={`text-xs ${subTextColor}`}>Email cannot be changed</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Phone Number</label>
                                <div className="relative">
                                    <Phone size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subTextColor}`} />
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                        placeholder="+91 98765 43210"
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Qualification</label>
                                <div className="relative">
                                    <GraduationCap size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subTextColor}`} />
                                    <input
                                        type="text"
                                        name="qualification"
                                        value={formData.qualification}
                                        onChange={handleInputChange}
                                        placeholder="Ph.D., M.Tech, etc."
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Organisation Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Designation</label>
                                <div className="relative">
                                    <Award size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subTextColor}`} />
                                    <input
                                        type="text"
                                        name="designation"
                                        value={formData.designation}
                                        onChange={handleInputChange}
                                        placeholder="Principal Investigator"
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Organisation Name</label>
                                <div className="relative">
                                    <Building2 size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subTextColor}`} />
                                    <input
                                        type="text"
                                        name="organisationName"
                                        value={formData.organisationName}
                                        onChange={handleInputChange}
                                        placeholder="Enter your organisation name"
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Organisation Type</label>
                                <select
                                    name="organisationType"
                                    value={formData.organisationType}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                >
                                    <option value="">Select Organisation Type</option>
                                    {ORGANISATION_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Country</label>
                                <div className="relative">
                                    <Globe size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subTextColor}`} />
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        placeholder="India"
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="space-y-2.5">
                            <h4 className={`text-sm font-bold ${textColor}`}>Address</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Address Line 1</label>
                                    <input
                                        type="text"
                                        name="addressLine1"
                                        value={formData.addressLine1}
                                        onChange={handleInputChange}
                                        placeholder="Street address"
                                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Address Line 2</label>
                                    <input
                                        type="text"
                                        name="addressLine2"
                                        value={formData.addressLine2}
                                        onChange={handleInputChange}
                                        placeholder="Apartment, suite, etc."
                                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        placeholder="City"
                                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        placeholder="State"
                                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Postal Code</label>
                                    <input
                                        type="text"
                                        name="postalCode"
                                        value={formData.postalCode}
                                        onChange={handleInputChange}
                                        placeholder="Postal code"
                                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Expertise */}
                        <div className="space-y-1.5">
                            <label className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Expertise Domains</label>
                            <textarea
                                name="expertiseDomains"
                                rows="2"
                                value={formData.expertiseDomains}
                                onChange={handleInputChange}
                                placeholder="Enter your areas of expertise, separated by commas (e.g., Mining Engineering, Safety, Environment)"
                                className={`w-full p-4 rounded-xl text-sm font-medium border outline-none transition-all focus:ring-2 focus:ring-blue-500/20 ${inputBg} ${textColor}`}
                            ></textarea>
                        </div>

                        <div className="flex justify-end pt-3">
                            <button 
                                type="button" 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
