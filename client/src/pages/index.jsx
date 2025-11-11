import Link from "next/link";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Home() {
  const [activeInfoTab, setActiveInfoTab] = useState('whats-new');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCollaborateModal, setShowCollaborateModal] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Array of banner images
  const bannerImages = [
    "/images/banner image.jpg", // Default image (first)
    "/images/aatai1.jpeg",
    "/images/aatai2.png",
    "/images/Sibi.png"
  ];

  // Auto-switch images every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % bannerImages.length
      );
    }, 4000); // 4 seconds

    return () => clearInterval(interval);
  }, [bannerImages.length]);

  // Navigate to previous image
  const goToPrevious = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? bannerImages.length - 1 : prevIndex - 1
    );
  };

  // Navigate to next image
  const goToNext = () => {
    setCurrentImageIndex((prevIndex) => 
      (prevIndex + 1) % bannerImages.length
    );
  };

  // Handle collaboration invitation
  const handleCollaborateInvite = async () => {
    if (!collaboratorEmail) return;
    
    setIsInviting(true);
    try {
      // Here you would typically make an API call to send the invitation
      const response = await fetch('/api/invite-collaborator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: collaboratorEmail,
          inviteType: 'collaboration',
          platform: 'NaCCER Research Portal'
        }),
      });

      if (response.ok) {
        alert(`Collaboration invitation sent to ${collaboratorEmail}!`);
        setCollaboratorEmail('');
        setShowCollaborateModal(false);
      } else {
        throw new Error('Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />
      
      {/* Hero Banner Section - Full Banner Display */}
      <section className="relative bg-gray-50 border-b border-gray-200 h-96 md:h-[500px] overflow-hidden">
        {/* Full Banner Image with Transition */}
        <div className="absolute inset-0 z-0">
          {bannerImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img 
              src={image}   
              alt={`Government Banner ${index + 1}`} 
              className={`w-full h-full object-contain bg-gray-100`} 
            />

            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
          aria-label="Previous image"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
          aria-label="Next image"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Image Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
          {bannerImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentImageIndex 
                  ? 'bg-white scale-110' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Switch to image ${index + 1}`}
            />
          ))}
        </div>

        {/* Optional Banner Title Overlay */}
        <div className="absolute bottom-8 left-8 right-8 z-10">
          <div className="text-white max-w-2xl">
            <h1 className="text-2xl md:text-4xl font-bold mb-2 drop-shadow-lg">
              National Coal Committee for Environmental Research
            </h1>
            <p className="text-sm md:text-lg drop-shadow-md">
              Advanced R&D Proposal Management System
            </p>
          </div>
        </div>
      </section>

      {/* Content Section - All Elements Below Banner */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-start gap-12">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mb-6">
                <div className="flex items-center justify-center lg:justify-start gap-4">
                  <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-md border">
                    <img 
                      src="/images/prism brand logo.png" 
                      alt="PRISM Logo" 
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-bold text-black mb-2">PRISM</h2>
                    <p className="text-sm text-black font-medium">
                      Proposal Review & Innovation
                      Support Mechanism
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mb-8">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  NaCCER Research Portal
                </h1>
                <p className="text-lg text-gray-900 font-semibold leading-relaxed">
                  National Coal Committee for Environmental Research - Advanced R&D Proposal Management System for sustainable coal research and innovation.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/login">
                  <button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-md font-medium text-lg transition-colors duration-200 shadow-md">
                    Sign In to Portal
                  </button>
                </Link>
                <Link href="/register">
                  <button className="border-2 border-orange-600 bg-transparent text-orange-600 hover:bg-orange-600 hover:text-white px-8 py-4 rounded-md font-medium text-lg transition-colors duration-200">
                    Create Account
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Content - Info Box */}
            <div className="flex-shrink-0 w-full lg:w-80">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                {/* Tab Header */}
                <div className="bg-indigo-900">
                  <div className="flex">
                    <button 
                      onClick={() => setActiveInfoTab('whats-new')}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 ${
                        activeInfoTab === 'whats-new' 
                          ? 'bg-indigo-900 text-white' 
                          : 'text-indigo-200 hover:text-white hover:bg-indigo-800/50'
                      }`}
                    >
                      What's new
                    </button>
                    <button 
                      onClick={() => setActiveInfoTab('important-info')}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 ${
                        activeInfoTab === 'important-info' 
                          ? 'bg-indigo-900 text-white' 
                          : 'text-indigo-200 hover:text-white hover:bg-indigo-800/50'
                      }`}
                    >
                      Important Information
                    </button>
                  </div>
                </div>
                
                {/* Content Area */}
                <div className="p-4 bg-gray-50">
                  {activeInfoTab === 'whats-new' && (
                    <div className="space-y-3">
                      <div className="text-sm">
                        <p className="text-gray-900 font-semibold mb-1">New AI-powered proposal evaluation system launched successfully.</p>
                        <p className="text-xs text-gray-700 font-medium">25/09/2025</p>
                      </div>
                      
                      <div className="text-sm">
                        <p className="text-gray-900 font-semibold mb-1">Enhanced collaboration features now available for all users.</p>
                        <p className="text-xs text-gray-700 font-medium">20/09/2025</p>
                      </div>
                      
                      <div className="text-sm">
                        <p className="text-gray-900 font-semibold mb-1">Updated R&D proposal submission guidelines published.</p>
                        <p className="text-xs text-gray-700 font-medium">15/09/2025</p>
                      </div>
                      
                      <div className="text-sm">
                        <p className="text-gray-900 font-semibold mb-1">Digital transformation initiatives in mining sector expanded.</p>
                        <p className="text-xs text-gray-700 font-medium">12/09/2025</p>
                      </div>
                    </div>
                  )}
                  
                  {activeInfoTab === 'important-info' && (
                    <div className="space-y-3">
                      <div className="text-sm">
                        <p className="text-gray-900 font-semibold mb-1">System maintenance scheduled for Oct 1, 2025</p>
                        <p className="text-xs text-red-600 font-bold">Critical Notice</p>
                      </div>
                      
                      <div className="text-sm">
                        <p className="text-gray-900 font-semibold mb-1">New compliance requirements for research proposals</p>
                        <p className="text-xs text-blue-600 font-bold">Policy Update</p>
                      </div>
                      
                      <div className="text-sm">
                        <p className="text-gray-900 font-semibold mb-1">Deadline extension for pending submissions until Oct 15, 2025</p>
                        <p className="text-xs text-red-600 font-bold">Submission Alert</p>
                      </div>
                      
                      <div className="text-sm">
                        <p className="text-gray-900 font-semibold mb-1">Mandatory training session for new reviewers on Oct 5, 2025</p>
                        <p className="text-xs text-green-600 font-bold">Training Notice</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center pt-4 border-t border-gray-200 mt-4">
                    <button className="text-blue-600 hover:text-white hover:bg-blue-600 px-4 py-2 rounded transition-colors text-sm font-medium">
                      View All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Updates Banner */}
      <section className="bg-yellow-400 py-3 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 text-sm text-black">
            <span className="font-bold flex items-center gap-2 flex-shrink-0">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              LATEST
            </span>
            <div className="overflow-hidden">
              <div className="whitespace-nowrap animate-scroll">
                New guidelines for R&D proposal submissions effective from October 2025 • Enhanced AI evaluation system launched • Improved collaboration features now available • Coal research initiatives expanded • Digital transformation in mining sector • Sustainable development goals implementation
              </div>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes scroll {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .animate-scroll {
            animation: scroll 30s linear infinite;
          }
        `}</style>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow animate-fade-in-up">
              <div className="w-12 h-12 bg-blue-100 mx-auto mb-4 rounded flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-sm font-bold text-gray-900">Active Proposals</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow animate-fade-in-up animation-delay-200">
              <div className="w-12 h-12 bg-green-100 mx-auto mb-4 rounded flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">1200+</div>
              <div className="text-sm font-bold text-gray-900">Researchers</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow animate-fade-in-up animation-delay-400">
              <div className="w-12 h-12 bg-purple-100 mx-auto mb-4 rounded flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">300+</div>
              <div className="text-sm font-bold text-gray-900">Approved Projects</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow animate-fade-in-up animation-delay-600">
              <div className="w-12 h-12 bg-orange-100 mx-auto mb-4 rounded flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">150+</div>
              <div className="text-sm font-bold text-gray-900">Expert Reviewers</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Ministry Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-4xl font-bold text-gray-900 mb-8 border-b-4 border-blue-600 pb-4">
                About Ministry/Department
              </h2>
              <div className="text-lg text-gray-900 font-medium leading-relaxed space-y-4">
                <p>
                  We are dedicated to serving the public by advancing coal research and development initiatives in India. 
                  The Ministry of Coal is committed to sustainable mining practices, environmental protection, and 
                  technological innovation in the coal sector.
                </p>
                <p>
                  Our team of experienced professionals focuses on promoting clean coal technologies, 
                  carbon capture and storage solutions, and supporting research initiatives that contribute to 
                  India's energy security while maintaining environmental standards.
                </p>
                <p>
                  We believe in transparency, innovation, and excellence in all our operations. 
                  The NaCCER portal represents our commitment to streamlined research management and 
                  collaborative scientific advancement in the coal and mining sector.
                </p>
              </div>
              <a href="https://www.coal.nic.in" target="_blank" rel="noopener noreferrer">
                <button className="mt-8 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-md font-medium transition-colors duration-200">
                  Know More
                </button>
              </a>
            </div>
            <div className="flex-shrink-0 space-y-6">
              <div className="w-80 h-40 bg-gray-200 rounded-lg overflow-hidden">
                <img 
                  src="/images/coal mining image.webp" 
                  alt="Coal Mining Operations" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-40 h-40 bg-gray-200 rounded-full overflow-hidden ml-auto">
                <img 
                  src="/images/research image.jpg" 
                  alt="Research Laboratory" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Ministers Section */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-center text-white mb-8 animate-fade-in-up border-b-4 border-yellow-500 pb-4 inline-block">Our Ministers</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Prime Minister */}
            <div className="text-center animate-fade-in-up">
              <div className="w-64 h-64 bg-gray-300 rounded-full mx-auto mb-6 flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/narendra modi.jpg" 
                  alt="Hon'ble Prime Minister Shri Narendra Modi"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-bold mb-2">Hon'ble Prime Minister</h3>
              <p className="text-xl mb-4">Shri Narendra Modi</p>
              
              <div className="flex justify-center gap-4 mb-4">
                <a href="https://www.pmindia.gov.in/en/" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-white text-sm font-medium border border-blue-300 hover:border-white px-4 py-2 rounded transition-colors">
                  Portfolio
                </a>
              </div>
              
              <div className="flex justify-center gap-4">
                <a href="https://x.com/pmoindia" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 cursor-pointer transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="https://www.facebook.com/PMOIndia" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 cursor-pointer transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://www.youtube.com/pmoindia" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 cursor-pointer transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Other Ministers */}
            <div className="space-y-8 animate-fade-in-up animation-delay-300">
              <a href="https://www.coal.nic.in/index.php/minister/shri-g-kishan-reddy" target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 hover:bg-white/10 p-4 rounded-lg transition-colors">
                <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src="/images/kishan reddy.jpg" 
                    alt="Shri G. Kishan Reddy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-lg font-medium text-blue-200">Hon'ble Union Minister</p>
                  <h3 className="text-xl font-bold">Shri G. Kishan Reddy</h3>
                  <p className="text-sm text-blue-200">Coal and Mines, Govt. of India</p>
                </div>
              </a>
              
              <a href="https://www.coal.nic.in/index.php/minister/shri-satish-chandra-dubey" target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 hover:bg-white/10 p-4 rounded-lg transition-colors">
                <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src="/images/satish chandra dubey.jpg" 
                    alt="Shri Satish Chandra Dubey"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-lg font-medium text-blue-200">Hon'ble Minister of State</p>
                  <h3 className="text-xl font-bold">Shri Satish Chandra Dubey</h3>
                  <p className="text-sm text-blue-200">Coal and Mines, Govt. of India</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4 border-b-4 border-green-600 pb-4 inline-block">Our Services</h2>
          
          {/* Service Categories */}
          <div className="flex justify-center mb-12">
            <div className="flex border-b border-gray-200">
              <button 
                id="rd-services-tab" 
                className="service-tab active px-8 py-3 border-b-4 border-amber-500 text-black font-semibold hover:bg-amber-50 transition-colors"
              >
                R&D Services
              </button>
              <button 
                id="research-support-tab" 
                className="service-tab px-8 py-3 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors border-b-4 border-transparent hover:border-amber-200"
              >
                Research Support
              </button>
            </div>
          </div>

          {/* Service Grid */}
          <div id="services-content">
            <div id="rd-services-content" className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow animate-fade-in-up">
                <div className="w-24 h-24 bg-blue-100 rounded mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Proposal Submission</h3>
                <p className="text-sm text-gray-900 font-semibold">Submit research proposals online</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow animate-fade-in-up animation-delay-200">
                <div className="w-24 h-24 bg-green-100 rounded mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Expert Review</h3>
                <p className="text-sm text-gray-900 font-semibold">AI-powered peer review system</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow animate-fade-in-up animation-delay-400">
                <div className="w-24 h-24 bg-purple-100 rounded mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Progress Tracking</h3>
                <p className="text-sm text-gray-900 font-semibold">Real-time project monitoring</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow animate-fade-in-up animation-delay-600">
                <div className="w-24 h-24 bg-orange-100 rounded mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Collaboration</h3>
                <p className="text-sm text-gray-900 font-semibold">Multi-stakeholder platform</p>
              </div>
            </div>

            <div id="research-support-content" className="hidden grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow animate-fade-in-up">
                <div className="w-24 h-24 bg-indigo-100 rounded mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Literature Support</h3>
                <p className="text-sm text-gray-900 font-semibold">Access to research databases</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow animate-fade-in-up animation-delay-200">
                <div className="w-24 h-24 bg-teal-100 rounded mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Lab Resources</h3>
                <p className="text-sm text-gray-900 font-semibold">Equipment and facility access</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow animate-fade-in-up animation-delay-400">
                <div className="w-24 h-24 bg-pink-100 rounded mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Innovation Hub</h3>
                <p className="text-sm text-gray-900 font-semibold">Technology incubation support</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow animate-fade-in-up animation-delay-600">
                <div className="w-24 h-24 bg-cyan-100 rounded mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Funding Support</h3>
                <p className="text-sm text-gray-900 font-semibold">Grant and financial assistance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Vision Box */}
            <div className="vision-mission-box group relative bg-white rounded-lg shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-700 cursor-pointer overflow-hidden h-64 hover:h-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center justify-center h-full w-full px-4 py-8 group-hover:h-auto group-hover:justify-start group-hover:mb-6 group-hover:px-0 group-hover:py-0 transition-all duration-700">
                  <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 group-hover:text-white group-hover:text-3xl group-hover:bg-none transition-all duration-700 text-center tracking-wider leading-none">
                    VISION
                  </h2>
                </div>
                
                <div className="space-y-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-200 overflow-hidden">
                  <p className="text-lg font-semibold text-white">
                    To Secure availability of Coal to meet the demand of various sectors of the economy in a eco-friendly, sustainable and cost effective manner.
                  </p>
                  
                  <div className="text-gray-100">
                    <p className="font-medium mb-3 text-white">Ministry of Coal is committed to:</p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-100">Augment production through Government companies as well as captive mining route by adopting state-of-the-art and clean coal technologies with a view to improve productivity, safety, quality and ecology.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-100">Augment the resource base by enhancing exploration efforts with thrust on increasing proved resources.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-100">Facilitate development of necessary infrastructure for prompt evacuation of coal.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Mission Box */}
            <div className="vision-mission-box group relative bg-white rounded-lg shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-700 cursor-pointer overflow-hidden h-64 hover:h-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center justify-center h-full w-full px-4 py-8 group-hover:h-auto group-hover:justify-start group-hover:mb-6 group-hover:px-0 group-hover:py-0 transition-all duration-700">
                  <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-800 group-hover:text-white group-hover:text-3xl group-hover:bg-none transition-all duration-700 text-center tracking-wider leading-none">
                    MISSION
                  </h2>
                </div>
                
                <div className="space-y-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-200 overflow-hidden">
                  <div className="text-gray-100">
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-sm text-gray-100">To augment production through Government companies as well as captive mining route by adopting state-of-the-art and clean coal technologies with a view to improve productivity, safety, quality and ecology.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-sm text-gray-100">To augment the resource base by enhancing exploration efforts with thrust on increasing proved resources.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-sm text-gray-100">To facilitate development of necessary infrastructure for prompt evacuation of coal.</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="mt-6 p-4 bg-white/10 rounded-lg">
                    <p className="text-sm text-gray-200 font-medium">
                      Driving sustainable development in India's coal sector through innovation, technology, and environmental stewardship.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12 animate-fade-in-up border-b-4 border-purple-600 pb-4 inline-block">Gallery</h2>
          
          {/* Gallery Categories */}
          <div className="flex justify-start mb-8 gap-4">
            <button 
              id="research-projects-tab" 
              className="gallery-main-tab active bg-amber-400 text-gray-900 px-6 py-2 rounded-full font-medium hover:bg-amber-500 transition-colors"
            >
              Research Projects
            </button>
            <button 
              id="mining-operations-tab" 
              className="gallery-main-tab bg-gray-100 text-black hover:bg-gray-200 px-6 py-2 rounded-full font-medium transition-colors"
            >
              Mining Operations
            </button>
          </div>

          {/* Sub Categories */}
          <div className="gallery-subcategories mb-8">
            <div id="research-subs" className="flex gap-6 text-sm">
              <button 
                id="clean-coal-tab" 
                className="gallery-sub-tab active text-blue-600 font-medium border-b-2 border-blue-600 pb-1 hover:text-blue-800 transition-colors"
              >
                Clean Coal Technology
              </button>
              <button 
                id="environmental-research-tab" 
                className="gallery-sub-tab text-gray-500 hover:text-black hover:border-b-2 hover:border-gray-300 pb-1 transition-all"
              >
                Environmental Research
              </button>
            </div>
            <div id="mining-subs" className="hidden flex gap-6 text-sm">
              <button 
                id="sustainable-mining-tab" 
                className="gallery-sub-tab active text-blue-600 font-medium border-b-2 border-blue-600 pb-1 hover:text-blue-800 transition-colors"
              >
                Sustainable Mining
              </button>
              <button 
                id="operations-tab" 
                className="gallery-sub-tab text-gray-500 hover:text-black hover:border-b-2 hover:border-gray-300 pb-1 transition-all"
              >
                Mining Operations
              </button>
            </div>
          </div>

          {/* Gallery Grid */}
          <div id="gallery-content" className="animate-fade-in-up">
            
            {/* Clean Coal Technology Content */}
            <div id="clean-coal-content" className="gallery-content-section">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="relative group cursor-pointer hover:transform hover:scale-105 transition-transform">
                  <div className="w-full h-80 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg overflow-hidden">
                    <img 
                      src="/images/coal lab image.jpg" 
                      alt="Coal Research Laboratory"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">Coal Research Lab</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                          <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        +15
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative group cursor-pointer hover:transform hover:scale-105 transition-transform">
                  <div className="w-full h-80 bg-gradient-to-br from-green-100 to-green-200 rounded-lg overflow-hidden">
                    <img 
                      src="/images/research image.jpg" 
                      alt="Research Facility"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">Research Facility</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                          <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        +12
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Environmental Research Content */}
            <div id="environmental-research-content" className="hidden gallery-content-section">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="relative group cursor-pointer hover:transform hover:scale-105 transition-transform">
                  <div className="w-full h-80 bg-gradient-to-br from-green-100 to-green-200 rounded-lg overflow-hidden">
                    <img 
                      src="/images/coal image3.jpg" 
                      alt="Environmental Research"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">Environmental Studies</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                          <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        +9
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative group cursor-pointer hover:transform hover:scale-105 transition-transform">
                  <div className="w-full h-80 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg overflow-hidden">
                    <img 
                      src="/images/research image.jpg" 
                      alt="Green Technology Research"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">Green Technology</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                          <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        +6
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mining Operations Content */}
            <div id="mining-operations-content" className="hidden gallery-content-section">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="relative group cursor-pointer hover:transform hover:scale-105 transition-transform">
                  <div className="w-full h-80 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg overflow-hidden">
                    <img 
                      src="/images/coal mining image.webp" 
                      alt="Coal Mining Operations"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">Mining Operations</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                          <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        +20
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative group cursor-pointer hover:transform hover:scale-105 transition-transform">
                  <div className="w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src="/images/another coal mining image.jpg" 
                      alt="Coal Mining Site"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">Mining Site</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                          <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        +14
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Gallery Items */}
            <div className="grid grid-cols-3 gap-4">
              <div className="h-40 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform cursor-pointer">
                <img 
                  src="/images/coal mining image2.jpeg" 
                  alt="Mining Technology"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-40 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center hover:transform hover:scale-105 transition-transform cursor-pointer">
                <div className="text-center text-green-600">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                  <div className="text-sm font-medium">Project Reports</div>
                </div>
              </div>
              <div className="h-40 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center hover:transform hover:scale-105 transition-transform cursor-pointer">
                <div className="text-center text-purple-600">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <div className="text-sm font-medium">Innovation Hub</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              // Service Tabs
              const serviceTabs = document.querySelectorAll('.service-tab');
              serviceTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                  serviceTabs.forEach(t => {
                    t.classList.remove('active', 'border-amber-500', 'text-black');
                    t.classList.add('text-gray-500');
                    t.style.borderBottom = 'none';
                  });
                  
                  this.classList.add('active', 'text-black');
                  this.classList.remove('text-gray-500');
                  this.style.borderBottom = '4px solid rgb(245 158 11)';
                  
                  // Show/hide content
                  if (this.id === 'rd-services-tab') {
                    document.getElementById('rd-services-content').classList.remove('hidden');
                    document.getElementById('research-support-content').classList.add('hidden');
                  } else if (this.id === 'research-support-tab') {
                    document.getElementById('rd-services-content').classList.add('hidden');
                    document.getElementById('research-support-content').classList.remove('hidden');
                  }
                });
              });

              // Gallery Main Tabs
              const galleryMainTabs = document.querySelectorAll('.gallery-main-tab');
              galleryMainTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                  galleryMainTabs.forEach(t => {
                    t.classList.remove('active', 'bg-amber-400', 'text-gray-900');
                    t.classList.add('bg-gray-100', 'text-black');
                  });
                  
                  this.classList.add('active', 'bg-amber-400', 'text-gray-900');
                  this.classList.remove('bg-gray-100', 'text-black');
                  
                  // Show/hide subcategories
                  if (this.id === 'research-projects-tab') {
                    document.getElementById('research-subs').classList.remove('hidden');
                    document.getElementById('mining-subs').classList.add('hidden');
                    // Show clean coal content by default
                    showGalleryContent('clean-coal-content');
                    // Reset sub-tab states
                    resetSubTabs('research-subs');
                  } else if (this.id === 'mining-operations-tab') {
                    document.getElementById('research-subs').classList.add('hidden');
                    document.getElementById('mining-subs').classList.remove('hidden');
                    // Show mining operations content by default
                    showGalleryContent('mining-operations-content');
                    // Reset sub-tab states
                    resetSubTabs('mining-subs');
                  }
                });
              });
              
              // Gallery Sub Tabs
              const gallerySubTabs = document.querySelectorAll('.gallery-sub-tab');
              gallerySubTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                  const parent = this.closest('#research-subs, #mining-subs');
                  parent.querySelectorAll('.gallery-sub-tab').forEach(t => {
                    t.classList.remove('active', 'text-blue-600');
                    t.classList.add('text-gray-500');
                    t.style.borderBottom = 'none';
                  });
                  
                  this.classList.add('active', 'text-blue-600');
                  this.classList.remove('text-gray-500');
                  this.style.borderBottom = '2px solid #2563eb';
                  
                  // Show corresponding content
                  if (this.id === 'clean-coal-tab') {
                    showGalleryContent('clean-coal-content');
                  } else if (this.id === 'environmental-research-tab') {
                    showGalleryContent('environmental-research-content');
                  } else if (this.id === 'sustainable-mining-tab') {
                    showGalleryContent('mining-operations-content');
                  } else if (this.id === 'operations-tab') {
                    showGalleryContent('mining-operations-content');
                  }
                });
              });
              
              function showGalleryContent(contentId) {
                // Hide all gallery content sections
                document.querySelectorAll('.gallery-content-section').forEach(section => {
                  section.classList.add('hidden');
                });
                
                // Show the selected content
                const targetContent = document.getElementById(contentId);
                if (targetContent) {
                  targetContent.classList.remove('hidden');
                }
              }
              
              function resetSubTabs(parentId) {
                const parent = document.getElementById(parentId);
                const tabs = parent.querySelectorAll('.gallery-sub-tab');
                tabs.forEach((tab, index) => {
                  if (index === 0) {
                    tab.classList.add('active', 'text-blue-600');
                    tab.classList.remove('text-gray-500');
                    tab.style.borderBottom = '2px solid #2563eb';
                  } else {
                    tab.classList.remove('active', 'text-blue-600');
                    tab.classList.add('text-gray-500');
                    tab.style.borderBottom = 'none';
                  }
                });
              }
            });
          `
        }} />
      </section>

      {/* Social Media Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left Content */}
            <div className="flex-1 animate-fade-in-up">
              <h2 className="text-4xl font-bold text-gray-900 mb-6 border-b-4 border-red-600 pb-4 inline-block">Social Media</h2>
              <p className="text-lg text-gray-900 font-semibold mb-8">
                Explore our social media presence and stay updated with the latest developments 
                in coal research and sustainable mining practices.
              </p>
              
              <div className="flex gap-6">
                <a href="https://www.youtube.com/@coalministry3323" target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors hover:scale-110 transform">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                
                <a href="https://x.com/CoalMinistry" target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-black hover:bg-gray-800 rounded-full flex items-center justify-center text-white transition-colors hover:scale-110 transform">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>

                <a href="https://linktr.ee/ministryofcoal" target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors hover:scale-110 transform">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.953 15.066c-.08.163-.08.324-.08.486.001.162.08.325.161.486.24.408.645.652 1.084.652.44 0 .845-.244 1.084-.652.08-.161.16-.324.16-.486 0-.162-.08-.323-.16-.486-.239-.408-.644-.652-1.084-.652-.439 0-.844.244-1.084.652l-.081-.001zm8.094 0c-.08.163-.08.324-.08.486.001.162.08.325.161.486.24.408.645.652 1.084.652.44 0 .845-.244 1.084-.652.08-.161.16-.324.16-.486 0-.162-.08-.323-.16-.486-.239-.408-.644-.652-1.084-.652-.439 0-.844.244-1.084.652l-.081-.001zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 6l-3.5 3.5L8.5 8 12 4.5 15.5 8zM8.5 16L12 12.5l3.5 3.5L12 19.5 8.5 16z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Right Content - Mobile Mockup */}
            <div className="flex-shrink-0 animate-fade-in-up animation-delay-300">
              <div className="relative">
                <div className="w-80 h-96 bg-gray-100 rounded-2xl p-4 shadow-lg">
                  <div className="w-full h-full bg-white rounded-xl shadow-sm flex flex-col">
                    <div className="bg-black text-white p-4 rounded-t-xl">
                      <div className="flex items-center gap-3">
                        <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/32px-Flag_of_India.svg.png" 
                          alt="India Flag" 
                          className="w-8 h-6 rounded"
                        />
                        <div>
                          <h3 className="font-bold text-sm">Ministry of Coal</h3>
                          <p className="text-xs text-gray-300">@CoalMinistry</p>
                        </div>
                        <a href="https://x.com/CoalMinistry" target="_blank" rel="noopener noreferrer" className="ml-auto bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-full text-xs transition-colors">
                          Follow
                        </a>
                      </div>
                    </div>
                    <div className="p-4 flex-1">
                      <p className="text-sm text-gray-900 mb-3 font-semibold">
                        Latest updates on sustainable coal research and clean energy initiatives. 
                        Building a greener future for India. 🇮🇳
                      </p>
                      <div className="text-xs text-gray-800 space-y-1">
                        <div className="font-medium">📍 New Delhi, India</div>
                        <div className="font-medium">🔗 <a href="https://www.coal.nic.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">coal.nic.in</a></div>
                        <div className="flex gap-4 mt-2 font-bold text-gray-900">
                          <span>52 Following</span>
                          <span>364.5K Followers</span>
                        </div>
                        
                        {/* Ministry of Coal Banner */}
                        <div className="mt-3 rounded-lg overflow-hidden">
                          <img 
                            src="/images/ministry of coal banner.jpeg" 
                            alt="Ministry of Coal Banner"
                            className="w-full h-24 object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collaboration Modal */}
      {showCollaborateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Invite Collaborator</h2>
              <button
                onClick={() => setShowCollaborateModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <label htmlFor="collaboratorEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Collaborator Email Address
              </label>
              <input
                type="email"
                id="collaboratorEmail"
                value={collaboratorEmail}
                onChange={(e) => setCollaboratorEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isInviting}
              />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowCollaborateModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isInviting}
              >
                Cancel
              </button>
              <button
                onClick={handleCollaborateInvite}
                disabled={!collaboratorEmail || isInviting}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isInviting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Invitation
                  </>
                )}
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> An email invitation will be sent to the collaborator with instructions to join the NaCCER Research Portal.
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}