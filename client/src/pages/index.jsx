import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReactDatamaps from "react-india-states-map";
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function Home() {
  const [activeInfoTab, setActiveInfoTab] = useState('whats-new');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentResourceIndex, setCurrentResourceIndex] = useState(0);
  const [showCollaborateModal, setShowCollaborateModal] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [selectedState, setSelectedState] = useState('West Bengal');
  const [hoveredState, setHoveredState] = useState(null);
  const [textWidth, setTextWidth] = useState(300);
  const [showNavbar, setShowNavbar] = useState(false);
  const textRef = useRef(null);

  // Measure text width whenever selectedState changes
  useEffect(() => {
    if (textRef.current) {
      setTextWidth(textRef.current.offsetWidth || 300);
    }
  }, [selectedState]);

  // Handle navbar visibility on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowNavbar(true);
      } else {
        setShowNavbar(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mock data for research proposals by state (for demonstration purposes)
  const stateProposalsData = {
  "Jharkhand": { 
    count: 44, 
    history: [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44] 
  },
  "West Bengal": { 
    count: 13, 
    history: [1, 2, 3, 5, 6, 7, 8, 9, 10, 12, 13] 
  },
  "Maharashtra": { 
    count: 15, 
    history: [1, 3, 4, 5, 7, 8, 9, 11, 12, 14, 15] 
  },
  "Telangana": { 
    count: 15, 
    history: [1, 3, 4, 5, 7, 8, 9, 11, 12, 14, 15] 
  },
  "Tamil Nadu": { 
    count: 8, 
    history: [1, 1, 2, 3, 4, 4, 5, 6, 6, 7, 8] 
  },
  "Karnataka": { 
    count: 8, 
    history: [1, 1, 2, 3, 4, 4, 5, 6, 6, 7, 8] 
  },
  "Odisha": { 
    count: 7, 
    history: [1, 1, 2, 3, 3, 4, 4, 5, 6, 6, 7] 
  },
  "Uttar Pradesh": { 
    count: 5, 
    history: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5] 
  },
  "Andhra Pradesh": { 
    count: 4, 
    history: [0, 1, 1, 1, 2, 2, 3, 3, 3, 4, 4] 
  },
  "Kerala": { 
    count: 2, 
    history: [0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2] 
  },
  "Chhattisgarh": { 
    count: 2, 
    history: [0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2] 
  },
  "Madhya Pradesh": { 
    count: 3, 
    history: [0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3] 
  },
  "Chandigarh": { 
    count: 2, 
    history: [0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2] 
  },
  "Bihar": { 
    count: 1, 
    history: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1] 
  },
  "Uttarakhand": { 
    count: 1, 
    history: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1] 
  },
  "Rajasthan": { 
    count: 1, 
    history: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1] 
  },
  "Puducherry": { 
    count: 1, 
    history: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1] 
  },
  "Assam": { 
    count: 2, 
    history: [0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2] 
  },
  "Delhi": { 
    count: 1, 
    history: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1] 
  },
  "Jammu and Kashmir": { 
    count: 1, 
    history: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1] 
  },

  // ===========================
  // All remaining states = zero
  // ===========================
  "Goa": { count: 0, history: Array(11).fill(0) },
  "Haryana": { count: 0, history: Array(11).fill(0) },
  "Himachal Pradesh": { count: 0, history: Array(11).fill(0) },
  "Manipur": { count: 0, history: Array(11).fill(0) },
  "Meghalaya": { count: 0, history: Array(11).fill(0) },
  "Mizoram": { count: 0, history: Array(11).fill(0) },
  "Nagaland": { count: 0, history: Array(11).fill(0) },
  "Sikkim": { count: 0, history: Array(11).fill(0) },
  "Tripura": { count: 0, history: Array(11).fill(0) },
  "Arunachal Pradesh": { count: 0, history: Array(11).fill(0) },
  "Ladakh": { count: 0, history: Array(11).fill(0) },
  "Lakshadweep": { count: 0, history: Array(11).fill(0) },
  "Andaman and Nicobar Islands": { count: 0, history: Array(11).fill(0) },
  "Punjab": { count: 0, history: Array(11).fill(0) },
  "Gujarat": { count: 0, history: Array(11).fill(0) }
};



  const resources = [
    { 
      icon: (
        <svg className="w-10 h-10 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 3h6v8H5V3zm8 0h6v5h-6V3zM5 13h6v8H5v-8zm8 0h6v8h-6v-8z" />
        </svg>
      ), 
      value: "23+", 
      label: "Webpage Templates" 
    },
    { 
      icon: (
        <svg className="w-10 h-10 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 5h16v14H4V5zm2 2v10h12V7H6zm2 2h8v2H8V9zm0 4h5v2H8v-2z" />
        </svg>
      ), 
      value: "19+", 
      label: "Bootstrap Templates" 
    },
    { 
      icon: (
        <svg className="w-10 h-10 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 3.25 2.37 5.96 5.5 6.74V20h3v-4.26C16.63 14.96 19 12.25 19 9c0-3.87-3.13-7-7-7z" />
        </svg>
      ), 
      value: "302+", 
      label: "Logos" 
    },
    { 
      icon: (
        <svg className="w-10 h-10 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 3h14l-1 6H6L5 3zm1 8h12v9H6v-9z" />
        </svg>
      ), 
      value: "10+", 
      label: "Presentation" 
    }
  ];

  const handlePrevious = () => {
    setCurrentResourceIndex((prev) => (prev === 0 ? resources.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentResourceIndex((prev) => (prev === resources.length - 1 ? 0 : prev + 1));
  };

  const currentResource = resources[currentResourceIndex];

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
    <div className="min-h-screen bg-white">
      {showNavbar && (
        <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
          <Navbar />
        </div>
      )}
      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slideDown 0.5s ease-out forwards;
        }

        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.7s ease-out forwards;
        }

        @keyframes countUp {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-count-up {
          animation: countUp 0.8s ease-out forwards;
        }

        @keyframes drawLine {
          from {
            stroke-dashoffset: 1000;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes ballmove {
          0% { transform: translate(0px, 8.5px) scale(0.1); }
          10% { transform: translateX(0px) scale(0.5); }
          40% { transform: translateX(${textWidth - 40}px) scale(0.5); }
          60% { transform: translate(${textWidth - 40}px, 8.5px) scale(0.1); }
          70% { transform: translate(${textWidth - 40}px, 8.5px) scale(0.15); }
          80% { transform: translate(${textWidth - 40}px, 8.5px) scale(0.1); }
          90% { transform: translate(${textWidth - 40}px, 8.5px) scale(0.15); }
          100% { transform: translate(${textWidth - 40}px, 8.5px) scale(0.1); }
        }

        @keyframes textreveal {
          0% { width: 0; }
          10% { width: 0; }
          40% { width: ${textWidth}px; }
          100% { width: ${textWidth}px; }
        }

        .ball {
          position: absolute;
          top: 0;
          left: 0;
          height: 30px;
          width: 30px;
          background-color: #f57724;
          border-radius: 50%;
          animation: ballmove 4s infinite alternate;
          z-index: 2;
          box-shadow: 0px 3px 12px rgba(0,0,0,0.25);
        }

        .state-text {
          position: absolute;
          font-size: 40px;
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          top: 8px;
          left: 0;
          width: 0;
          color: #313131;
          animation: textreveal 4s infinite alternate;
          z-index: 1;
        }

        .real-text {
          visibility: hidden;
          white-space: nowrap;
          position: absolute;
          top: 8px;
          left: 0;
          font-size: 40px;
          font-weight: bold;
        }
      `}</style>
      
      {/* Hero Section - India.gov.in Style */}
      <section className="relative min-h-screen overflow-hidden flex items-center justify-center">
        {/* Background Images with Transition */}
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
                alt={`Background ${index + 1}`} 
                className="w-full h-full object-cover opacity-90"
              />
            </div>
          ))}
          {/* Dark Overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-gray-900/75 to-black/80"></div>
        </div>
        
        {/* Image Indicators */}
        <div className="absolute bottom-8 right-8 z-20 flex space-x-2">
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

        <div className="relative z-10 max-w-[98%] mx-auto px-2 py-16 text-center">
          {/* National Emblem */}
          <div className="mb-12 flex justify-center">
            <div className="w-48 h-48 bg-white/10 backdrop-blur-sm rounded-full p-6 flex items-center justify-center">
              <img 
                src="/images/goi logo.png" 
                alt="Government of India Emblem" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Main Title */}
          <div className="mb-8">
            <h1 className="text-7xl md:text-9xl lg:text-[12rem] font-bold text-white mb-4 leading-none">
              NaCCER
            </h1>
            <div className="inline-block bg-yellow-400 text-black px-6 py-3 rounded text-xl font-bold">
              BETA
            </div>
          </div>

          {/* Subtitle */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-4">
            National Research Portal of India
          </h2>
          <p className="text-2xl md:text-3xl lg:text-4xl text-gray-300 mb-8">
            Where Research & Innovation Converges
          </p>
        </div>
      </section>

      {/* Statistics Bar - India.gov.in Style */}
      <section className="bg-gray-100 py-6">
        <div className="max-w-[95%] mx-auto px-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {/* Online Services */}
            <div className="flex flex-col items-center text-center p-3 hover:bg-gray-50 rounded-lg transition-all duration-300 cursor-pointer border-r border-gray-200 last:border-r-0">
              <div className="w-12 h-12 mb-2 flex items-center justify-center">
                <svg className="w-full h-full text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">14237</div>
              <div className="text-[10px] font-medium text-black leading-tight">Online<br/>Services</div>
            </div>

            {/* Govt. Schemes */}
            <div className="flex flex-col items-center text-center p-3 hover:bg-gray-50 rounded-lg transition-all duration-300 cursor-pointer border-r border-gray-200 last:border-r-0">
              <div className="w-12 h-12 mb-2 flex items-center justify-center">
                <svg className="w-full h-full text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">4373</div>
              <div className="text-[10px] font-medium text-black leading-tight">Govt.<br/>Schemes</div>
            </div>

            {/* Citizen Engagements */}
            <div className="flex flex-col items-center text-center p-3 hover:bg-gray-50 rounded-lg transition-all duration-300 cursor-pointer border-r border-gray-200 last:border-r-0">
              <div className="w-12 h-12 mb-2 flex items-center justify-center">
                <svg className="w-full h-full text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">5424</div>
              <div className="text-[10px] font-medium text-black leading-tight">Citizen<br/>Engagements</div>
            </div>

            {/* Tourist Places */}
            <div className="flex flex-col items-center text-center p-3 hover:bg-gray-50 rounded-lg transition-all duration-300 cursor-pointer border-r border-gray-200 last:border-r-0">
              <div className="w-12 h-12 mb-2 flex items-center justify-center">
                <svg className="w-full h-full text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">3851</div>
              <div className="text-[10px] font-medium text-black leading-tight">Tourist<br/>Places</div>
            </div>

            {/* ODOP Products */}
            <div className="flex flex-col items-center text-center p-3 hover:bg-gray-50 rounded-lg transition-all duration-300 cursor-pointer border-r border-gray-200 last:border-r-0">
              <div className="w-12 h-12 mb-2 flex items-center justify-center">
                <svg className="w-full h-full text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
                </svg>
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">1207</div>
              <div className="text-[10px] font-medium text-black leading-tight">ODOP<br/>Products</div>
            </div>

            {/* Research Papers */}
            <div className="flex flex-col items-center text-center p-3 hover:bg-gray-50 rounded-lg transition-all duration-300 cursor-pointer border-r border-gray-200 last:border-r-0">
              <div className="w-12 h-12 mb-2 flex items-center justify-center">
                <svg className="w-full h-full text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">2847</div>
              <div className="text-[10px] font-medium text-black leading-tight">Research<br/>Papers</div>
            </div>

            {/* Active Researchers */}
            <div className="flex flex-col items-center text-center p-3 hover:bg-gray-50 rounded-lg transition-all duration-300 cursor-pointer border-r border-gray-200 last:border-r-0">
              <div className="w-12 h-12 mb-2 flex items-center justify-center">
                <svg className="w-full h-full text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">1543</div>
              <div className="text-[10px] font-medium text-black leading-tight">Active<br/>Researchers</div>
            </div>

            {/* Information Categories */}
            <div className="flex flex-col items-center text-center p-3 hover:bg-gray-50 rounded-lg transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 mb-2 flex items-center justify-center">
                <svg className="w-full h-full text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">18</div>
              <div className="text-[10px] font-medium text-black leading-tight">Information<br/>Categories</div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section - All Elements Below Banner */}
      <section className="py-6 bg-white">
        <div className="w-full px-2 lg:px-4 xl:px-6">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-12">
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
        <div className="max-w-[98%] mx-auto px-2">
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
      </section>

      {/* Statistics Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-[95%] mx-auto px-2">
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

      {/* About Ministry & Vision/Mission Section */}
      <section className="py-12 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-[95%] mx-auto px-2">
          <div className="grid lg:grid-cols-2 gap-12">

            {/* About Ministry/Department Component */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
              <h2 className="text-4xl font-bold text-gray-900 mb-8 border-b-4 border-blue-600 pb-4 inline-block">
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

            {/* Vision & Mission Component */}
            <div className="space-y-6">
              {/* Vision Card - Flip */}
              <div className="h-[240px] cursor-pointer [perspective:1200px] group">
                <div className="relative w-full h-full duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                  
                  {/* FRONT */}
                  <div className="absolute inset-0 bg-white border border-gray-300 rounded-2xl flex items-center justify-center [backface-visibility:hidden] shadow-xl">
                    <h2 className="text-5xl font-extrabold text-blue-700 tracking-wide">
                      VISION
                    </h2>
                  </div>

                  {/* BACK */}
                  <div className="absolute inset-0 bg-blue-700 text-white rounded-2xl p-6 [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-auto shadow-xl">
                    <p className="text-base font-medium mb-4">
                      To secure availability of coal in an eco-friendly, sustainable and cost-effective manner.
                    </p>

                    <p className="font-semibold text-lg mb-3">Ministry of Coal is committed to:</p>

                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-white rounded-full mt-[6px] mr-3 flex-shrink-0"></span>
                        <span>Augment production through advanced clean coal technologies ensuring productivity, safety, and ecology.</span>
                      </li>

                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-white rounded-full mt-[6px] mr-3 flex-shrink-0"></span>
                        <span>Enhance the resource base by increasing exploration efforts focused on proven reserves.</span>
                      </li>

                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-white rounded-full mt-[6px] mr-3 flex-shrink-0"></span>
                        <span>Facilitate development of infrastructure enabling rapid evacuation of coal.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Mission Card - Flip */}
              <div className="h-[240px] cursor-pointer [perspective:1200px] group">
                <div className="relative w-full h-full duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                  
                  {/* FRONT */}
                  <div className="absolute inset-0 bg-white border border-gray-300 rounded-2xl flex items-center justify-center [backface-visibility:hidden] shadow-xl">
                    <h2 className="text-5xl font-extrabold text-green-700 tracking-wide">
                      MISSION
                    </h2>
                  </div>

                  {/* BACK */}
                  <div className="absolute inset-0 bg-green-700 text-white rounded-2xl p-6 [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-auto shadow-xl">
                    <ul className="space-y-3 text-sm mb-6">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-white rounded-full mt-[6px] mr-3 flex-shrink-0"></span>
                        <span>Adopt clean coal technologies to improve productivity, safety, quality, and environmental sustainability.</span>
                      </li>

                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-white rounded-full mt-[6px] mr-3 flex-shrink-0"></span>
                        <span>Enhance the resource base with extensive exploration to increase proven reserves.</span>
                      </li>

                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-white rounded-full mt-[6px] mr-3 flex-shrink-0"></span>
                        <span>Develop infrastructure to ensure efficient and prompt evacuation of coal.</span>
                      </li>
                    </ul>

                    <div className="p-4 bg-white/20 rounded-xl">
                      <p className="text-sm font-medium">
                        Driving sustainable development in India's coal sector through innovation, technology, and environmental responsibility.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
      {/* Our Services Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-[95%] mx-auto px-2">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-8 border-b-4 border-green-600 pb-4 inline-block">Our Services</h2>
          
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

      {/* Research Proposals by State Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-[95%] mx-auto px-2">
          {/* Header with India Map Icon */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <svg className="w-12 h-12 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <h2 className="text-4xl font-bold text-gray-900 border-b-4 border-orange-600 pb-4 inline-block">
              NaCCER's Indian Footprint
            </h2>
          </div>

          {/* Main Content Area */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: State Info and Chart */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200 transition-all duration-500 ease-in-out transform hover:scale-[1.02]">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-black mb-2 transition-all duration-300">Research Proposals by State</h3>
                <div className="relative" style={{ width: "100%", height: "100px", maxWidth: "600px" }}>
                  {/* Ball Animation */}
                  <div className="ball" key={selectedState + '-ball'}></div>

                  {/* Animated Text */}
                  <div className="state-text" key={selectedState + '-text'}>{selectedState}</div>

                  {/* Hidden Real Text (to measure width) */}
                  <div ref={textRef} className="real-text">{selectedState}</div>
                </div>
                <div className="h-1 w-20 bg-red-500 mb-6 animate-pulse transition-all duration-300"></div>
              </div>

              <div className="mb-8 animate-fade-in" key={selectedState + '-count'}>
                <p className="text-sm text-black mb-1 transition-opacity duration-300">As of November 2025</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent transition-all duration-700 animate-count-up">{stateProposalsData[selectedState].count}</span>
                  <div className="text-sm text-black">
                    <div>Research Proposals</div>
                    <div>Submitted in India</div>
                  </div>
                </div>
              </div>

              {/* Timeline Chart */}
              <div className="relative transition-all duration-700 animate-slide-up" key={selectedState + '-chart'}>
                <ReactApexChart 
                  options={{
                    chart: {
                      height: 350,
                      type: 'line',
                      zoom: {
                        enabled: false
                      },
                      animations: {
                        enabled: true,
                        easing: 'easeinout',
                        speed: 800,
                        animateGradually: {
                          enabled: true,
                          delay: 150
                        },
                        dynamicAnimation: {
                          enabled: true,
                          speed: 350
                        }
                      }
                    },
                    dataLabels: {
                      enabled: true,
                      style: {
                        fontSize: '12px',
                        fontWeight: 'bold',
                        colors: ['#000']
                      },
                      background: {
                        enabled: true,
                        foreColor: '#fff',
                        borderRadius: 2,
                        padding: 4,
                        opacity: 0.9,
                        borderWidth: 1,
                        borderColor: '#3b82f6'
                      }
                    },
                    stroke: {
                      curve: 'smooth',
                      width: 3
                    },
                    title: {
                      text: `Research Proposals Trend - ${selectedState}`,
                      align: 'left',
                      style: {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#1f2937'
                      }
                    },
                    grid: {
                      row: {
                        colors: ['#f3f4f6', 'transparent'],
                        opacity: 0.5
                      },
                      borderColor: '#e5e7eb'
                    },
                    xaxis: {
                      categories: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'],
                      labels: {
                        style: {
                          colors: '#2563eb',
                          fontSize: '11px',
                          fontWeight: 500
                        }
                      }
                    },
                    yaxis: {
                      labels: {
                        style: {
                          colors: '#000',
                          fontSize: '12px'
                        }
                      }
                    },
                    colors: ['#3b82f6'],
                    markers: {
                      size: 5,
                      colors: ['#3b82f6'],
                      strokeColors: '#fff',
                      strokeWidth: 2,
                      hover: {
                        size: 7
                      }
                    },
                    tooltip: {
                      enabled: true,
                      theme: 'dark',
                      y: {
                        formatter: function (val) {
                          return val + " Proposals"
                        }
                      }
                    }
                  }} 
                  series={[{
                    name: "Research Proposals",
                    data: stateProposalsData[selectedState].history
                  }]} 
                  type="line" 
                  height={350} 
                />
              </div>

              <p className="text-xs text-black mt-4 italic">
                * Mock data for demonstration purposes only
              </p>
            </div>

            {/* Right: India Map Visualization */}
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl shadow-xl p-8 border-2 border-orange-200">
                <div className="relative w-full max-w-2xl mx-auto" style={{ height: '600px' }}>
                  
                  {/* India Map using ReactDatamaps */}
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="relative w-full h-full">
                      <ReactDatamaps
                        regionData={Object.keys(stateProposalsData).reduce((acc, state) => {
                          acc[state] = {
                            value: stateProposalsData[state].count,
                            content: {
                              txt: `${stateProposalsData[state].count} Research Proposals submitted from ${state}`
                            }
                          };
                          return acc;
                        }, {})}
                        mapLayout={{
                          title: "",
                          legendTitle: "Proposals",
                          startColor: "#FFF3E0",
                          endColor: "#FF6B00",
                          hoverTitle: "Research Proposals",
                          noDataColor: "#FFE0B2",
                          borderColor: "#8B4513",
                          hoverColor: "#FF9933",
                          hoverBorderColor: "#FF6B00",
                          height: 550,
                          weight: 550
                        }}
                        hoverComponent={({ value }) => {
                          return (
                            <div className="bg-slate-800 text-white px-4 py-3 rounded-lg shadow-2xl border-2 border-yellow-400 transition-all duration-300 ease-in-out pointer-events-none">
                              <div className="font-bold text-yellow-400 text-lg mb-1 transition-all duration-200">{value.name}</div>
                              <div className="text-2xl font-bold mb-1 transition-all duration-200">{value.value}</div>
                              <div className="text-xs text-gray-300 transition-all duration-200">Research Proposals</div>
                            </div>
                          );
                        }}
                        onClick={(data, name) => {
                          const matchedState = Object.keys(stateProposalsData).find(
                            state => state.toLowerCase() === name.toLowerCase() ||
                                     name.toLowerCase().includes(state.toLowerCase()) ||
                                     state.toLowerCase().includes(name.toLowerCase())
                          );
                          if (matchedState) {
                            setSelectedState(matchedState);
                          }
                        }}
                        activeState={{
                          data: stateProposalsData[selectedState] ? {
                            value: stateProposalsData[selectedState].count,
                            content: {
                              txt: `${stateProposalsData[selectedState].count} Research Proposals`
                            }
                          } : {},
                          name: selectedState
                        }}
                      />
                    </div>
                  </div>

                  {/* Selected State Label */}
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-600 to-red-600 text-white px-5 py-2 rounded-lg shadow-lg font-bold text-base z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      {selectedState}
                    </div>
                  </div>

                  {/* Proposal Count Badge */}
                  <div className="absolute top-4 left-4 bg-white text-orange-600 px-5 py-2 rounded-lg shadow-lg border-2 border-orange-600 z-10">
                    <div className="text-xs font-semibold">Total Proposals</div>
                    <div className="text-2xl font-bold">{stateProposalsData[selectedState].count}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Summary */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border-t-4 border-blue-600">
              <div className="text-3xl font-bold text-black">{Object.keys(stateProposalsData).length}</div>
              <div className="text-sm text-black mt-2">States Covered</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border-t-4 border-green-600">
              <div className="text-3xl font-bold text-black">
                {Object.values(stateProposalsData).reduce((sum, state) => sum + state.count, 0)}
              </div>
              <div className="text-sm text-black mt-2">Total Proposals</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border-t-4 border-orange-600">
              <div className="text-3xl font-bold text-black">
                {Math.max(...Object.values(stateProposalsData).map(s => s.count))}
              </div>
              <div className="text-sm text-black mt-2">Highest (State)</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center border-t-4 border-purple-600">
              <div className="text-3xl font-bold text-black">2014-2025</div>
              <div className="text-sm text-black mt-2">Time Period</div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Ministers Section */}
      <section className="py-12 bg-blue-900 text-white">
        <div className="max-w-[95%] mx-auto px-2">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-center text-white mb-8 border-b-4 border-yellow-500 pb-4 inline-block">Our Ministers</h2>
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

      {/* Gallery Section */}
      <section className="py-12 bg-white">
  <div className="max-w-[95%] mx-auto px-2">

    <h2 className="text-4xl font-bold text-center text-gray-900 mb-8 border-b-4 border-purple-600 pb-4 inline-block">
      Gallery
    </h2>

    <div className="grid md:grid-cols-3 gap-8">

      {/* --- CONSISTENT CARD TEMPLATE (Three-Part Split) --- */}

      {/* Card 1: gallery1.jpeg */}
      <div className="relative w-full h-80 overflow-hidden rounded-xl cursor-pointer group">
        
        {/* The Image (Starts Full, Moves to Bottom-Left on hover) */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-500 group-hover:h-1/2 group-hover:w-1/2 group-hover:translate-x-0 group-hover:translate-y-full"
          style={{ backgroundImage: 'url("/images/gallery1.jpeg")' }}
        >
        </div>

        {/* Black Box (Starts out of view, Moves to Top Half on hover) */}
        <div className="absolute inset-0 w-full h-full bg-black transition-all duration-500 transform translate-y-full group-hover:h-1/2 group-hover:w-full group-hover:translate-y-0">
          <div className="p-6 h-full flex flex-col justify-start">
            <h3 className="text-white text-3xl font-bold mt-4">
              Establishment of Geo-thermal energy
            </h3>
            <p className="text-white text-lg mt-2">
              SCCL held at Sri Ram Institute on 8/2/2022
            </p>
          </div>
        </div>
        
        {/* White 'MORE ->' Box (Starts out of view, Moves to Bottom-Right on hover) */}
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-white transition-all duration-500 transform translate-x-full translate-y-full group-hover:translate-x-0 group-hover:translate-y-0">
          {/* LINK ADDED HERE */}
          <a href="https://scienceandtech.cmpdi.co.in/review_meeting_on_geothermal_energy_sccl.php" className="h-full w-full flex items-center justify-center" target="_blank" rel="noopener noreferrer">
            <span className="text-lg font-semibold text-gray-900">
              MORE &rarr;
            </span>
          </a>
        </div>
      </div>

      {/* Card 2: gallery2.jpeg */}
      <div className="relative w-full h-80 overflow-hidden rounded-xl cursor-pointer group">
        
        {/* The Image (Starts Full, Moves to Bottom-Left on hover) */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-500 group-hover:h-1/2 group-hover:w-1/2 group-hover:translate-x-0 group-hover:translate-y-full"
          style={{ backgroundImage: 'url("/images/gallery2.jpeg")' }}
        >
        </div>

        {/* Black Box (Starts out of view, Moves to Top Half on hover) */}
        <div className="absolute inset-0 w-full h-full bg-black transition-all duration-500 transform translate-y-full group-hover:h-1/2 group-hover:w-full group-hover:translate-y-0">
          <div className="p-6 h-full flex flex-col justify-start">
            <h3 className="text-white text-3xl font-bold mt-4">
              22nd Meeting of Tech. Sub-Committee of SSRC
            </h3>
            <p className="text-white text-lg mt-2">
              Held on 16th, 21st & 22nd June 2021
            </p>
          </div>
        </div>
        
        {/* White 'MORE ->' Box (Starts out of view, Moves to Bottom-Right on hover) */}
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-white transition-all duration-500 transform translate-x-full translate-y-full group-hover:translate-x-0 group-hover:translate-y-0">
           {/* LINK ADDED HERE */}
           <a href="https://scienceandtech.cmpdi.co.in/22nd_tech_ssrc_meeting.php" className="h-full w-full flex items-center justify-center" target="_blank" rel="noopener noreferrer">
            <span className="text-lg font-semibold text-gray-900">
              MORE &rarr;
            </span>
          </a>
        </div>
      </div>

      {/* Card 3: gallery3.jpeg */}
      <div className="relative w-full h-80 overflow-hidden rounded-xl cursor-pointer group">
        
        {/* The Image (Starts Full, Moves to Bottom-Left on hover) */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-500 group-hover:h-1/2 group-hover:w-1/2 group-hover:translate-x-0 group-hover:translate-y-full"
          style={{ backgroundImage: 'url("/images/gallery3.jpeg")' }}
        >
        </div>

        {/* Black Box (Starts out of view, Moves to Top Half on hover) */}
        <div className="absolute inset-0 w-full h-full bg-black transition-all duration-500 transform translate-y-full group-hover:h-1/2 group-hover:w-full group-hover:translate-y-0">
          <div className="p-6 h-full flex flex-col justify-start">
            <h3 className="text-white text-3xl font-bold mt-4">
              23rd SSRC Tech. Sub-Committee Meeting
            </h3>
            <p className="text-white text-lg mt-2">
              Held on 25/10/2021
            </p>
          </div>
        </div>
        
        {/* White 'MORE ->' Box (Starts out of view, Moves to Bottom-Right on hover) */}
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-white transition-all duration-500 transform translate-x-full translate-y-full group-hover:translate-x-0 group-hover:translate-y-0">
           {/* LINK ADDED HERE */}
           <a href="https://scienceandtech.cmpdi.co.in/23rd_tech_ssrc_meeting.php" className="h-full w-full flex items-center justify-center" target="_blank" rel="noopener noreferrer">
            <span className="text-lg font-semibold text-gray-900">
              MORE &rarr;
            </span>
          </a>
        </div>
      </div>
      
      {/* Card 4: gallery4.jpg */}
      <div className="relative w-full h-80 overflow-hidden rounded-xl cursor-pointer group">
        
        {/* The Image (Starts Full, Moves to Bottom-Left on hover) */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-500 group-hover:h-1/2 group-hover:w-1/2 group-hover:translate-x-0 group-hover:translate-y-full"
          style={{ backgroundImage: 'url("/images/gallery4.jpg")' }}
        >
        </div>

        {/* Black Box (Starts out of view, Moves to Top Half on hover) */}
        <div className="absolute inset-0 w-full h-full bg-black transition-all duration-500 transform translate-y-full group-hover:h-1/2 group-hover:w-full group-hover:translate-y-0">
          <div className="p-6 h-full flex flex-col justify-start">
            <h3 className="text-white text-3xl font-bold mt-4">
              Coal Bed Methane Recovery and Utilisation
            </h3>
            <p className="text-white text-lg mt-2">
              Architecture detail
            </p>
          </div>
        </div>
        
        {/* White 'MORE ->' Box (Starts out of view, Moves to Bottom-Right on hover) */}
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-white transition-all duration-500 transform translate-x-full translate-y-full group-hover:translate-x-0 group-hover:translate-y-0">
           {/* LINK ADDED HERE */}
           <a href="https://scienceandtech.cmpdi.co.in/CBM-CE-27_photographs.php" className="h-full w-full flex items-center justify-center" target="_blank" rel="noopener noreferrer">
            <span className="text-lg font-semibold text-gray-900">
              MORE &rarr;
            </span>
          </a>
        </div>
      </div>

      {/* Card 5: gallery5.jpg */}
      <div className="relative w-full h-80 overflow-hidden rounded-xl cursor-pointer group">
        
        {/* The Image (Starts Full, Moves to Bottom-Left on hover) */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-500 group-hover:h-1/2 group-hover:w-1/2 group-hover:translate-x-0 group-hover:translate-y-full"
          style={{ backgroundImage: 'url("/images/gallery5.jpg")' }}
        >
        </div>

        {/* Black Box (Starts out of view, Moves to Top Half on hover) */}
        <div className="absolute inset-0 w-full h-full bg-black transition-all duration-500 transform translate-y-full group-hover:h-1/2 group-hover:w-full group-hover:translate-y-0">
          <div className="p-6 h-full flex flex-col justify-start">
            <h3 className="text-white text-3xl font-bold mt-4">
              Sustainable Development
            </h3>
            <p className="text-white text-lg mt-2">
              Building a Greener, Smarter Future
            </p>
          </div>
        </div>
        
        {/* White 'MORE ->' Box (Starts out of view, Moves to Bottom-Right on hover) */}
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-white transition-all duration-500 transform translate-x-full translate-y-full group-hover:translate-x-0 group-hover:translate-y-0">
           {/* LINK ADDED HERE */}
           <a href="https://scienceandtech.cmpdi.co.in/sustainable_development-EE-44_photographs.php" className="h-full w-full flex items-center justify-center" target="_blank" rel="noopener noreferrer">
            <span className="text-lg font-semibold text-gray-900">
              MORE &rarr;
            </span>
          </a>
        </div>
      </div>

      {/* Card 6: gallery6.jpg */}
      <div className="relative w-full h-80 overflow-hidden rounded-xl cursor-pointer group">
        
        {/* The Image (Starts Full, Moves to Bottom-Left on hover) */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-500 group-hover:h-1/2 group-hover:w-1/2 group-hover:translate-x-0 group-hover:translate-y-full"
          style={{ backgroundImage: 'url("/images/gallery6.jpg")' }}
        >
        </div>

        {/* Black Box (Starts out of view, Moves to Top Half on hover) */}
        <div className="absolute inset-0 w-full h-full bg-black transition-all duration-500 transform translate-y-full group-hover:h-1/2 group-hover:w-full group-hover:translate-y-0">
          <div className="p-6 h-full flex flex-col justify-start">
            <h3 className="text-white text-3xl font-bold mt-4">
              Online Washability Analyzer
            </h3>
            <p className="text-white text-lg mt-2">
              Real-Time Coal Washability Monitoring
            </p>
          </div>
        </div>
        
        {/* White 'MORE ->' Box (Starts out of view, Moves to Bottom-Right on hover) */}
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-white transition-all duration-500 transform translate-x-full translate-y-full group-hover:translate-x-0 group-hover:translate-y-0">
           {/* LINK ADDED HERE */}
           <a href="https://scienceandtech.cmpdi.co.in/online_washibility_analyzer-CP-47_photographs.php" className="h-full w-full flex items-center justify-center" target="_blank" rel="noopener noreferrer">
            <span className="text-lg font-semibold text-gray-900">
              MORE &rarr;
            </span>
          </a>
        </div>
      </div>

    </div>
  </div>
</section>

      <Footer />
    </div>
  );
}

