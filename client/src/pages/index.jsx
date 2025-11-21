import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReactDatamaps from "react-india-states-map";
import dynamic from 'next/dynamic';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function Home() {
    const [activeInfoTab, setActiveInfoTab] = useState('whats-new');
    const [activeServiceTab, setActiveServiceTab] = useState('rd');
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

    // IntersectionObserver for counter animation
    useEffect(() => {
        const metricCards = document.querySelectorAll('.metric-card');
        const countedCards = new Set();

        const animateCounter = (element) => {
            const counterElement = element.querySelector('.counter-value');
            if (!counterElement) return;

            const start = parseInt(element.getAttribute('data-start')) || 0;
            const end = parseInt(element.getAttribute('data-end')) || 0;
            const increment = parseInt(element.getAttribute('data-increment')) || 1;
            const speed = parseInt(element.getAttribute('data-speed')) || 50;

            // Skip animation if speed is 0 (for non-numeric values like "2014-25")
            if (speed === 0 || increment === 0) {
                return;
            }

            let current = start;

            const updateCounter = () => {
                if (current <= end) {
                    counterElement.textContent = current.toLocaleString();
                    current += increment;
                    setTimeout(updateCounter, speed);
                } else {
                    counterElement.textContent = end.toLocaleString();
                }
            };

            updateCounter();
        };

        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px'
        };

        const observerCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !countedCards.has(entry.target)) {
                    countedCards.add(entry.target);
                    animateCounter(entry.target);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        metricCards.forEach((card) => {
            observer.observe(card);
        });

        return () => {
            observer.disconnect();
        };
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
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200 selection:text-blue-900">
            {showNavbar && (
                <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down shadow-xl">
                    <Navbar />
                </div>
            )}
            <style jsx>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down { animation: slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }

        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-scroll { animation: scroll 40s linear infinite; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }

        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up { animation: scaleUp 0.5s ease-out forwards; }
        
        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        
        .hero-gradient {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #172554 100%);
        }

        /* Map Animations */
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
          background-color: #f97316;
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
          color: #1e293b;
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

            {/* Hero Section - Modern & Professional */}
            <section className="relative h-screen min-h-[600px] overflow-hidden flex items-center justify-center">
                {/* Background Images with Parallax-like feel */}
                <div className="absolute inset-0 z-0">
                    {bannerImages.map((image, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-all duration-[2000ms] ease-in-out transform ${index === currentImageIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                                }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-slate-900/90 z-10" />
                            <img
                                src={image}
                                alt={`Background ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                </div>

                {/* Content Container */}
                <div className="relative z-20 max-w-[95%] mx-auto px-2 text-center flex flex-col items-center">
                    {/* Emblem with Glow */}
                    <div className="mb-10 relative group">
                        <div className="absolute -inset-4 bg-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative w-32 h-32 md:w-40 md:h-40 bg-white/10 backdrop-blur-md rounded-full p-4 border border-white/20 shadow-2xl flex items-center justify-center transform transition-transform duration-500 group-hover:scale-105">
                            <img
                                src="/images/GOI logo.png"
                                alt="Government of India Emblem"
                                className="w-full h-full object-contain drop-shadow-lg"
                            />
                        </div>
                    </div>

                    {/* Main Title with Modern Typography */}
                    <div className="mb-6 relative">
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-blue-200 tracking-tight mb-2 drop-shadow-sm">
                            NaCCER
                        </h1>
                        <div className="absolute -top-4 -right-8 md:-right-12 rotate-12">
                            <span className="bg-yellow-400 text-yellow-900 text-xs md:text-sm font-bold px-3 py-1 rounded-full shadow-lg border border-yellow-300 uppercase tracking-wider">
                                Beta v1.0
                            </span>
                        </div>
                    </div>

                    {/* Subtitle & Description */}
                    <div className="max-w-3xl mx-auto space-y-6">
                        <h2 className="text-2xl md:text-4xl font-light text-white tracking-wide">
                            National Research Portal of India
                        </h2>
                        <div className="w-24 h-1 bg-blue-500 mx-auto rounded-full"></div>
                        <p className="text-lg md:text-xl text-blue-100 font-light leading-relaxed">
                            Accelerating innovation in coal and energy sectors through <br className="hidden md:block" />
                            <span className="font-semibold text-white">Advanced R&D</span> and <span className="font-semibold text-white">Collaborative Intelligence</span>.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto">
                        <Link href="/login" className="w-full">
                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 hover:-translate-y-1 flex items-center justify-center gap-2 group">
                                <span>Access Portal</span>
                                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </button>
                        </Link>
                        <Link href="/register" className="w-full">
                            <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/30 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:-translate-y-1 flex items-center justify-center">
                                New Registration
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <div className="w-8 h-12 border-2 border-white/30 rounded-full flex justify-center p-2">
                        <div className="w-1 h-3 bg-white rounded-full"></div>
                    </div>
                </div>

                {/* Image Indicators */}
                <div className="absolute bottom-10 right-10 z-20 flex space-x-3">
                    {bannerImages.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`h-1.5 rounded-full transition-all duration-500 ${index === currentImageIndex
                                ? 'w-8 bg-white'
                                : 'w-2 bg-white/40 hover:bg-white/60'
                                }`}
                            aria-label={`Switch to image ${index + 1}`}
                        />
                    ))}
                </div>
            </section>

            {/* Floating Statistics Bar */}
            <div className="relative -mt-20 z-30 max-w-[95%] mx-auto px-2">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 transform transition-transform hover:scale-[1.01] duration-500">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        {[
                            { icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z", count: "14,237", label: "Online Services" },
                            { icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z", count: "4,373", label: "Govt. Schemes" },
                            { icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z", count: "5,424", label: "Citizen Engagements" },
                            { icon: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z", count: "3,851", label: "Tourist Places" },
                            { icon: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z", count: "2,847", label: "Research Papers" },
                            { icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z", count: "1,543", label: "Active Researchers" }
                        ].map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center text-center p-4 group cursor-pointer hover:bg-slate-50 rounded-xl transition-colors">
                                <div className="w-12 h-12 mb-3 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d={item.icon} />
                                    </svg>
                                </div>
                                <div className="text-2xl font-bold text-slate-900 mb-1">{item.count}</div>
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <section className="py-12 bg-white">
                <div className="max-w-[95%] mx-auto px-2">
                    <div className="grid lg:grid-cols-12 gap-12 items-start">
                        {/* Left Content - 8 Columns */}
                        <div className="lg:col-span-8 space-y-8">
                            {/* PRISM Card */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 flex flex-col md:flex-row items-center gap-8 hover:shadow-lg transition-shadow duration-300">
                                <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-sm p-4 flex-shrink-0">
                                    <img
                                        src="/images/prism brand logo.png"
                                        alt="PRISM Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="text-center md:text-left">
                                    <h2 className="text-3xl font-bold text-slate-900 mb-2">PRISM</h2>
                                    <p className="text-lg text-slate-600 font-medium mb-4">
                                        Proposal Review & Innovation Support Mechanism
                                    </p>
                                    <p className="text-slate-500 leading-relaxed">
                                        A cutting-edge platform designed to streamline the research proposal lifecycle, ensuring transparency, efficiency, and merit-based selection for national coal research projects.
                                    </p>
                                </div>
                            </div>

                            {/* Welcome Text */}
                            <div className="prose prose-lg max-w-none text-slate-600">
                                <h1 className="text-4xl font-bold text-slate-900 mb-6">
                                    Welcome to <span className="text-blue-600">NaCCER</span> Research Portal
                                </h1>
                                <p className="text-xl leading-relaxed">
                                    The <strong className="text-slate-900">National Coal Committee for Environmental Research</strong> presents an advanced R&D Proposal Management System. We are dedicated to fostering sustainable coal research, promoting environmental stewardship, and driving technological innovation in India's energy sector.
                                </p>
                            </div>
                        </div>

                        {/* Right Content - 4 Columns (Info Widget) */}
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden sticky top-24">
                                {/* Tab Header */}
                                <div className="flex border-b border-slate-100">
                                    <button
                                        onClick={() => setActiveInfoTab('whats-new')}
                                        className={`flex-1 py-4 text-sm font-semibold transition-all duration-300 ${activeInfoTab === 'whats-new'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                            }`}
                                    >
                                        What's New
                                    </button>
                                    <button
                                        onClick={() => setActiveInfoTab('important-info')}
                                        className={`flex-1 py-4 text-sm font-semibold transition-all duration-300 ${activeInfoTab === 'important-info'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                            }`}
                                    >
                                        Important Info
                                    </button>
                                </div>

                                {/* Content Area */}
                                <div className="p-6 min-h-[300px]">
                                    {activeInfoTab === 'whats-new' && (
                                        <div className="space-y-6 animate-fade-in">
                                            {[
                                                { text: "New AI-powered proposal evaluation system launched successfully.", date: "25/09/2025", tag: "New" },
                                                { text: "Enhanced collaboration features now available for all users.", date: "20/09/2025", tag: "Update" },
                                                { text: "Updated R&D proposal submission guidelines published.", date: "15/09/2025", tag: "Info" },
                                                { text: "Digital transformation initiatives in mining sector expanded.", date: "12/09/2025", tag: "News" }
                                            ].map((item, i) => (
                                                <div key={i} className="flex gap-4 items-start group">
                                                    <div className="flex-shrink-0 w-12 text-center">
                                                        <span className="block text-xs font-bold text-slate-400">{item.date.split('/')[0]}</span>
                                                        <span className="block text-xs font-bold text-slate-300 uppercase">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(item.date.split('/')[1]) - 1]}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-slate-700 font-medium group-hover:text-blue-600 transition-colors cursor-pointer">
                                                            {item.text}
                                                        </p>
                                                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">
                                                            {item.tag}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {activeInfoTab === 'important-info' && (
                                        <div className="space-y-6 animate-fade-in">
                                            {[
                                                { text: "System maintenance scheduled for Oct 1, 2025", type: "Critical", color: "red" },
                                                { text: "New compliance requirements for research proposals", type: "Policy", color: "blue" },
                                                { text: "Deadline extension for pending submissions until Oct 15, 2025", type: "Alert", color: "orange" },
                                                { text: "Mandatory training session for new reviewers on Oct 5, 2025", type: "Training", color: "green" }
                                            ].map((item, i) => (
                                                <div key={i} className="border-l-4 pl-4 py-1" style={{ borderColor: item.color }}>
                                                    <p className="text-sm text-slate-700 font-medium mb-1">{item.text}</p>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider text-${item.color}-600`}>
                                                        {item.type}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center justify-center gap-2 mx-auto group">
                                        View Archive
                                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Latest Updates Banner */}
            <section className="bg-slate-900 py-3 overflow-hidden border-y border-slate-800">
                <div className="max-w-[95%] mx-auto px-2">
                    <div className="flex items-center gap-6 text-sm text-white">
                        <span className="font-bold flex items-center gap-2 flex-shrink-0 text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                            </span>
                            LATEST UPDATES
                        </span>
                        <div className="overflow-hidden flex-1 mask-linear-fade">
                            <div className="whitespace-nowrap animate-scroll text-slate-300 font-medium">
                                <span className="mx-4">•</span> New guidelines for R&D proposal submissions effective from October 2025
                                <span className="mx-4">•</span> Enhanced AI evaluation system launched
                                <span className="mx-4">•</span> Improved collaboration features now available
                                <span className="mx-4">•</span> Coal research initiatives expanded
                                <span className="mx-4">•</span> Digital transformation in mining sector
                                <span className="mx-4">•</span> Sustainable development goals implementation
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="py-12 bg-slate-50">
                <div className="max-w-[95%] mx-auto px-2">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Impact at a Glance</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Measuring our contribution to the national research ecosystem through data-driven insights.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { label: "Active Proposals", value: "500+", color: "blue", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                            { label: "Researchers", value: "1200+", color: "green", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
                            { label: "Approved Projects", value: "300+", color: "purple", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
                            { label: "Expert Reviewers", value: "150+", color: "orange", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group">
                                <div className={`w-16 h-16 bg-${stat.color}-50 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                                    <svg className={`w-8 h-8 text-${stat.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                                    </svg>
                                </div>
                                <div className="text-4xl font-bold text-slate-900 mb-2">{stat.value}</div>
                                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Ministry & Vision/Mission Section */}
            <section className="py-16 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-30">
                    <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-100 blur-3xl"></div>
                    <div className="absolute top-1/2 right-0 w-64 h-64 rounded-full bg-orange-50 blur-3xl"></div>
                </div>

                <div className="max-w-[95%] mx-auto px-2 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">

                        {/* About Ministry/Department Component */}
                        <div className="space-y-8">
                            <div className="inline-block">
                                <h2 className="text-4xl font-bold text-slate-900 mb-2">About Ministry</h2>
                                <div className="h-1.5 w-24 bg-blue-600 rounded-full"></div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 relative overflow-hidden group hover:shadow-2xl transition-shadow duration-300">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>

                                <div className="relative z-10 space-y-6 text-lg text-slate-600 leading-relaxed">
                                    <p>
                                        We are dedicated to serving the public by advancing <strong className="text-slate-900">coal research and development</strong> initiatives in India.
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
                                        The <span className="text-blue-600 font-bold">NaCCER portal</span> represents our commitment to streamlined research management and
                                        collaborative scientific advancement.
                                    </p>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <a href="https://www.coal.nic.in" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition-colors group/link">
                                        Visit Official Website
                                        <svg className="w-5 h-5 transform group-hover/link:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Vision & Mission Component */}
                        <div className="space-y-8">
                            {/* Vision Card - Flip */}
                            <div className="h-[280px] cursor-pointer [perspective:1200px] group">
                                <div className="relative w-full h-full duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-2xl rounded-2xl">
                                    {/* FRONT */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex flex-col items-center justify-center [backface-visibility:hidden] p-8 text-white">
                                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
                                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-4xl font-bold tracking-wider">VISION</h2>
                                        <p className="mt-4 text-blue-100 font-medium">Hover to reveal</p>
                                    </div>

                                    {/* BACK */}
                                    <div className="absolute inset-0 bg-white text-slate-800 rounded-2xl p-8 [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-auto border border-slate-100">
                                        <h3 className="text-2xl font-bold text-blue-600 mb-4">Our Vision</h3>
                                        <p className="text-lg font-medium mb-4 text-slate-700">
                                            To secure availability of coal in an eco-friendly, sustainable and cost-effective manner.
                                        </p>
                                        <ul className="space-y-3 text-sm text-slate-600">
                                            <li className="flex items-start">
                                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                                <span>Augment production through advanced clean coal technologies.</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                                <span>Enhance resource base by increasing exploration efforts.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Mission Card - Flip */}
                            <div className="h-[280px] cursor-pointer [perspective:1200px] group">
                                <div className="relative w-full h-full duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-2xl rounded-2xl">
                                    {/* FRONT */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl flex flex-col items-center justify-center [backface-visibility:hidden] p-8 text-white">
                                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
                                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-4xl font-bold tracking-wider">MISSION</h2>
                                        <p className="mt-4 text-emerald-100 font-medium">Hover to reveal</p>
                                    </div>

                                    {/* BACK */}
                                    <div className="absolute inset-0 bg-white text-slate-800 rounded-2xl p-8 [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-auto border border-slate-100">
                                        <h3 className="text-2xl font-bold text-emerald-600 mb-4">Our Mission</h3>
                                        <ul className="space-y-3 text-sm text-slate-600 mb-4">
                                            <li className="flex items-start">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                                <span>Adopt clean coal technologies for safety & sustainability.</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                                <span>Develop infrastructure for efficient coal evacuation.</span>
                                            </li>
                                        </ul>
                                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                            <p className="text-xs font-semibold text-emerald-800">
                                                Driving sustainable development through innovation.
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
            <section className="py-16 bg-slate-50">
                <div className="max-w-[95%] mx-auto px-2">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Services</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Comprehensive support for the entire research lifecycle, from proposal submission to project completion.</p>
                    </div>

                    {/* Service Categories */}
                    <div className="flex justify-center mb-10">
                        <div className="bg-white p-1.5 rounded-full shadow-sm border border-slate-200 inline-flex">
                            <button
                                onClick={() => setActiveServiceTab('rd')}
                                className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${activeServiceTab === 'rd'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                R&D Services
                            </button>
                            <button
                                onClick={() => setActiveServiceTab('support')}
                                className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${activeServiceTab === 'support'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                Research Support
                            </button>
                        </div>
                    </div>

                    {/* Service Grid */}
                    <div className="min-h-[400px]">
                        {activeServiceTab === 'rd' && (
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 animate-fade-in">
                                {[
                                    { title: "Proposal Submission", desc: "Streamlined online submission process for research proposals.", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "blue" },
                                    { title: "Expert Review", desc: "Rigorous peer review system powered by AI and domain experts.", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "green" },
                                    { title: "Progress Tracking", desc: "Real-time monitoring of project milestones and deliverables.", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", color: "purple" },
                                    { title: "Collaboration", desc: "Connect with researchers and institutions across the nation.", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", color: "orange" }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
                                        <div className={`w-14 h-14 bg-${item.color}-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                            <svg className={`w-7 h-7 text-${item.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                        <p className="text-slate-500 leading-relaxed text-sm">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeServiceTab === 'support' && (
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 animate-fade-in">
                                {[
                                    { title: "Literature Support", desc: "Access to a vast repository of research papers and journals.", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", color: "indigo" },
                                    { title: "Lab Resources", desc: "Book advanced laboratory equipment and facilities.", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z", color: "teal" },
                                    { title: "Innovation Hub", desc: "Incubation support for breakthrough technologies.", icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z", color: "pink" },
                                    { title: "Funding Support", desc: "Guidance on securing grants and financial aid.", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "cyan" }
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
                                        <div className={`w-14 h-14 bg-${item.color}-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                            <svg className={`w-7 h-7 text-${item.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                        <p className="text-slate-500 leading-relaxed text-sm">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Research Proposals by State Section */}
            <section className="py-16 bg-white">
                <div className="max-w-[95%] mx-auto px-2">
                    {/* Header with India Map Icon */}
                    <div className="flex flex-col items-center justify-center gap-4 mb-12">
                        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center transform rotate-3">
                            <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-bold text-slate-900 text-center">
                            NaCCER's Indian Footprint
                        </h2>
                        <p className="text-slate-500 text-center max-w-2xl">
                            Visualizing the distribution of research proposals and scientific contributions across the nation.
                        </p>
                    </div>

                    {/* Main Content Area */}
                    <div className="grid lg:grid-cols-12 gap-12 items-start">
                        {/* Left: State Info and Chart - 4 Columns */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>

                                <div className="relative z-10">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Selected Region</h3>
                                    <div className="relative h-16 mb-6">
                                        {/* Ball Animation */}
                                        <div className="ball" key={selectedState + '-ball'}></div>
                                        {/* Animated Text */}
                                        <div className="state-text text-3xl text-slate-900" key={selectedState + '-text'}>{selectedState}</div>
                                        {/* Hidden Real Text (to measure width) */}
                                        <div ref={textRef} className="real-text text-3xl">{selectedState}</div>
                                    </div>

                                    <div className="h-1 w-full bg-slate-100 rounded-full mb-8 overflow-hidden">
                                        <div className="h-full bg-orange-500 w-1/3 animate-pulse"></div>
                                    </div>

                                    <div className="animate-fade-in" key={selectedState + '-count'}>
                                        <p className="text-sm font-medium text-slate-500 mb-2">Total Proposals (2014-2025)</p>
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-5xl font-bold text-slate-900 animate-count-up">{stateProposalsData[selectedState].count}</span>
                                            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline Chart */}
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 animate-slide-up" key={selectedState + '-chart'}>
                                <ReactApexChart
                                    options={{
                                        chart: {
                                            height: 250,
                                            type: 'area',
                                            toolbar: { show: false },
                                            zoom: { enabled: false },
                                            fontFamily: 'inherit'
                                        },
                                        dataLabels: { enabled: false },
                                        stroke: { curve: 'smooth', width: 3, colors: ['#f97316'] },
                                        fill: {
                                            type: 'gradient',
                                            gradient: {
                                                shadeIntensity: 1,
                                                opacityFrom: 0.7,
                                                opacityTo: 0.2,
                                                stops: [0, 90, 100],
                                                colorStops: [
                                                    { offset: 0, color: '#f97316', opacity: 0.4 },
                                                    { offset: 100, color: '#f97316', opacity: 0 }
                                                ]
                                            }
                                        },
                                        grid: {
                                            borderColor: '#f1f5f9',
                                            strokeDashArray: 4,
                                            padding: { top: 0, right: 0, bottom: 0, left: 10 }
                                        },
                                        xaxis: {
                                            categories: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'],
                                            labels: { style: { colors: '#64748b', fontSize: '10px' } },
                                            axisBorder: { show: false },
                                            axisTicks: { show: false }
                                        },
                                        yaxis: { show: false },
                                        tooltip: {
                                            theme: 'light',
                                            y: { formatter: (val) => val + " Proposals" }
                                        },
                                        markers: { size: 0, hover: { size: 6, colors: ['#f97316'] } }
                                    }}
                                    series={[{ name: "Proposals", data: stateProposalsData[selectedState].history }]}
                                    type="area"
                                    height={250}
                                />
                            </div>
                        </div>

                        {/* Right: India Map Visualization - 8 Columns */}
                        <div className="lg:col-span-8">
                            <div className="bg-slate-50 rounded-3xl p-4 border border-slate-200 shadow-inner">
                                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 relative overflow-hidden" style={{ height: '650px' }}>

                                    {/* Map Container */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-full h-full transform scale-110">
                                            <ReactDatamaps
                                                regionData={Object.keys(stateProposalsData).reduce((acc, state) => {
                                                    acc[state] = {
                                                        value: stateProposalsData[state].count,
                                                        content: { txt: `${stateProposalsData[state].count} Proposals` }
                                                    };
                                                    return acc;
                                                }, {})}
                                                mapLayout={{
                                                    title: "",
                                                    legendTitle: "",
                                                    startColor: "#fff7ed",
                                                    endColor: "#ea580c",
                                                    hoverTitle: "Proposals",
                                                    noDataColor: "#f8fafc",
                                                    borderColor: "#cbd5e1",
                                                    hoverColor: "#f97316",
                                                    hoverBorderColor: "#c2410c",
                                                    height: 600,
                                                    weight: 600
                                                }}
                                                hoverComponent={({ value }) => (
                                                    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 pointer-events-none transform -translate-y-4">
                                                        <div className="font-bold text-orange-400 text-sm mb-1">{value.name}</div>
                                                        <div className="text-2xl font-bold">{value.value}</div>
                                                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Proposals</div>
                                                    </div>
                                                )}
                                                onClick={(data, name) => {
                                                    const matchedState = Object.keys(stateProposalsData).find(
                                                        state => state.toLowerCase() === name.toLowerCase() ||
                                                            name.toLowerCase().includes(state.toLowerCase()) ||
                                                            state.toLowerCase().includes(name.toLowerCase())
                                                    );
                                                    if (matchedState) setSelectedState(matchedState);
                                                }}
                                                activeState={{
                                                    data: stateProposalsData[selectedState] ? {
                                                        value: stateProposalsData[selectedState].count,
                                                        content: { txt: `${stateProposalsData[selectedState].count} Proposals` }
                                                    } : {},
                                                    name: selectedState
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Floating Stats Cards on Map */}
                                    <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-100 max-w-[200px]">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Highest Activity</div>
                                        <div className="text-lg font-bold text-slate-900">Jharkhand</div>
                                        <div className="text-sm font-medium text-orange-600">44 Proposals</div>
                                    </div>

                                    <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                        {['MH', 'WB', 'TS'][i - 1]}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-xs font-medium text-slate-600">
                                                Top contributing<br />regions this year
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Summary */}
                    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: "States Covered", value: Object.keys(stateProposalsData).length, color: "blue", speed: 50, increment: 1 },
                            { label: "Total Proposals", value: Object.values(stateProposalsData).reduce((sum, state) => sum + state.count, 0), color: "green", speed: 30, increment: 2 },
                            { label: "Highest (State)", value: Math.max(...Object.values(stateProposalsData).map(s => s.count)), color: "orange", speed: 80, increment: 1 }
                        ].map((stat, idx) => (
                            <div
                                key={idx}
                                className={`metric-card bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group hover:-translate-y-2 cursor-default`}
                                data-start="0"
                                data-end={typeof stat.value === 'number' ? stat.value : 0}
                                data-increment={stat.increment}
                                data-speed={stat.speed}
                            >
                                <div className={`absolute top-0 left-0 w-full h-1 bg-${stat.color}-500 transition-all duration-500 group-hover:h-1.5`}></div>
                                <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${stat.color}-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-150`}></div>
                                <div className="relative z-10">
                                    <div className={`counter-value text-3xl font-bold text-slate-900 mb-1 transition-transform duration-300 group-hover:scale-110 origin-center`}>0</div>
                                    <div className={`text-sm font-medium text-slate-500 uppercase tracking-wide transition-colors duration-300 group-hover:text-${stat.color}-600`}>{stat.label}</div>
                                </div>
                            </div>
                        ))}

                        {/* Time Period Box */}
                        <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group hover:-translate-y-2 cursor-default">
                            <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 transition-all duration-500 group-hover:h-1.5"></div>
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-150"></div>
                            <div className="relative z-10">
                                <div className="text-3xl font-bold text-slate-900 mb-1 transition-transform duration-300 group-hover:scale-110 origin-center">2014-2025</div>
                                <div className="text-sm font-medium text-slate-500 uppercase tracking-wide transition-colors duration-300 group-hover:text-purple-600">Time Period</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Ministers Section */}
            <section className="py-16 bg-slate-900 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600 blur-[100px] opacity-20"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600 blur-[100px] opacity-20"></div>
                </div>

                <div className="max-w-[95%] mx-auto px-2 relative z-10">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-white mb-4">Leadership</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">Guiding the nation towards energy security and sustainable development.</p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-12 items-center">
                        {/* Prime Minister - Center/Left Focus */}
                        <div className="lg:col-span-5 text-center lg:text-left">
                            <div className="relative inline-block group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                                <div className="w-72 h-72 bg-slate-800 rounded-full p-2 relative z-10 mx-auto lg:mx-0">
                                    <img
                                        src="/images/narendra modi.jpg"
                                        alt="Hon'ble Prime Minister Shri Narendra Modi"
                                        className="w-full h-full object-cover rounded-full border-4 border-slate-700 shadow-2xl"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 space-y-2">
                                <h3 className="text-3xl font-bold text-white">Shri Narendra Modi</h3>
                                <p className="text-blue-400 font-medium text-lg uppercase tracking-wider">Hon'ble Prime Minister of India</p>
                            </div>

                            <div className="mt-6 flex items-center justify-center lg:justify-start gap-4">
                                <a href="https://www.pmindia.gov.in/en/" target="_blank" rel="noopener noreferrer" className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-colors backdrop-blur-sm border border-white/10">
                                    View Portfolio
                                </a>
                                <div className="flex gap-2">
                                    {[
                                        { icon: "M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z", link: "https://x.com/pmoindia" },
                                        { icon: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z", link: "https://www.facebook.com/PMOIndia" }
                                    ].map((social, idx) => (
                                        <a key={idx} href={social.link} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/5 hover:bg-blue-500 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-all duration-300">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d={social.icon} />
                                            </svg>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Other Ministers - Cards */}
                        <div className="lg:col-span-7 space-y-6">
                            {[
                                { name: "Shri G. Kishan Reddy", role: "Hon'ble Union Minister", dept: "Coal and Mines, Govt. of India", img: "/images/kishan reddy.jpg", link: "https://www.coal.nic.in/index.php/minister/shri-g-kishan-reddy" },
                                { name: "Shri Satish Chandra Dubey", role: "Hon'ble Minister of State", dept: "Coal and Mines, Govt. of India", img: "/images/satish chandra dubey.jpg", link: "https://www.coal.nic.in/index.php/minister/shri-satish-chandra-dubey" }
                            ].map((minister, idx) => (
                                <a key={idx} href={minister.link} target="_blank" rel="noopener noreferrer" className="block group">
                                    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-6 flex items-center gap-6 hover:bg-slate-800 transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10">
                                        <div className="w-24 h-24 shrink-0">
                                            <img
                                                src={minister.img}
                                                alt={minister.name}
                                                className="w-full h-full object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-blue-400 font-medium text-sm mb-1">{minister.role}</p>
                                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">{minister.name}</h3>
                                            <p className="text-slate-400 text-sm">{minister.dept}</p>
                                        </div>
                                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section className="py-16 bg-white">
                <div className="max-w-[95%] mx-auto px-2">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                        <div>
                            <h2 className="text-4xl font-bold text-slate-900 mb-4">Media Gallery</h2>
                            <p className="text-slate-500 max-w-xl">Highlights from recent events, conferences, and technological milestones in the coal sector.</p>
                        </div>
                        <a href="#" className="text-blue-600 font-bold hover:text-blue-800 transition-colors flex items-center gap-2 group">
                            View All Gallery
                            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </a>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { img: "/images/gallery1.jpeg", title: "Establishment of Geo-thermal energy", date: "SCCL held at Sri Ram Institute on 8/2/2022", link: "https://scienceandtech.cmpdi.co.in/review_meeting_on_geothermal_energy_sccl.php" },
                            { img: "/images/gallery2.jpeg", title: "22nd Meeting of Tech. Sub-Committee of SSRC", date: "Held on 16th, 21st & 22nd June 2021", link: "https://scienceandtech.cmpdi.co.in/22nd_tech_ssrc_meeting.php" },
                            { img: "/images/gallery3.jpeg", title: "23rd SSRC Tech. Sub-Committee Meeting", date: "Held on 25/10/2021", link: "https://scienceandtech.cmpdi.co.in/23rd_tech_ssrc_meeting.php" },
                            { img: "/images/gallery4.jpg", title: "Coal Bed Methane Recovery and Utilisation", date: "Architecture detail", link: "https://scienceandtech.cmpdi.co.in/CBM-CE-27_photographs.php" },
                            { img: "/images/gallery5.jpg", title: "Sustainable Development", date: "Building a Greener, Smarter Future", link: "https://scienceandtech.cmpdi.co.in/sustainable_development-EE-44_photographs.php" },
                            { img: "/images/gallery6.jpg", title: "Online Washability Analyzer", date: "Real-Time Coal Washability Monitoring", link: "https://scienceandtech.cmpdi.co.in/online_washibility_analyzer-CP-47_photographs.php" }
                        ].map((item, idx) => (
                            <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="group relative block h-80 rounded-2xl overflow-hidden shadow-lg cursor-pointer">
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                    style={{ backgroundImage: `url("${item.img}")` }}
                                ></div>

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>

                                {/* Content */}
                                <div className="absolute inset-0 p-6 flex flex-col justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <div className="transform opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 mb-2">
                                        <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">Event</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-blue-200 transition-colors">{item.title}</h3>
                                    <p className="text-slate-300 text-sm line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">{item.date}</p>

                                    <div className="flex items-center gap-2 text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                        View Details
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}


