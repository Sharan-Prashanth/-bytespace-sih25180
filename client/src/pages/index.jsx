import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamic imports for client-only components
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });
const ReactDatamaps = dynamic(() => import("react-india-states-map"), { ssr: false });
const Navbar = dynamic(() => import("../components/Navbar"), { ssr: false });
const Footer = dynamic(() => import("../components/Footer"), { ssr: false });
const Counter = dynamic(() => import("../components/Counter"), { ssr: false });
const ScanningCard = dynamic(() => import("../components/ScanningCard"), { ssr: false });
const ServicesContent = dynamic(() => import("../components/ServicesContent"), { ssr: false });

export default function Home() {
  const [activeInfoTab, setActiveInfoTab] = useState('whats-new');
  const [activeServiceTab, setActiveServiceTab] = useState('rd');

  const [currentResourceIndex, setCurrentResourceIndex] = useState(0);
  const [showCollaborateModal, setShowCollaborateModal] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [selectedState, setSelectedState] = useState('West Bengal');
  const [hoveredState, setHoveredState] = useState(null);
  const [textWidth, setTextWidth] = useState(300);
  const [showNavbar, setShowNavbar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMiningSlide, setCurrentMiningSlide] = useState(0);
  const textRef = useRef(null);

  const miningSlides = [
    {
      img: "/images/coal mining image.webp",
      title: "Modern Coal Mining Infrastructure",
      description: "State-of-the-art mining equipment and facilities ensuring efficiency and safety."
    },
    {
      img: "/images/coal mining image2.jpeg",
      title: "Advanced Mining Operations",
      description: "Cutting-edge technology implementation in coal extraction processes."
    },
    {
      img: "/images/banner image.jpg",
      title: "Coal Mining Excellence",
      description: "Sustainable and efficient mining practices for a greener future."
    },
    {
      img: "/images/coal mining image3.webp",
      title: "Frontline Coal Operations",
      description: "Ensuring safe, responsible, and inclusive coal handling practices under the Ministry of Coal."
    },
    {
      img: "/images/coal mining image4.webp",
      title: "Mechanized Coal Mining",
      description: "Enhancing productivity and environmental compliance through modern, sustainable mining machinery."
    },

  ];

  // Auto-advance mining slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMiningSlide((prev) => (prev + 1) % miningSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Simulate Loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

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
    "Jharkhand": { count: 44, history: [2, 4, 3, 5, 4, 6, 5, 7, 8, 6, 9, 44] },
    "Maharashtra": { count: 38, history: [1, 3, 2, 4, 3, 5, 4, 6, 7, 5, 8, 38] },
    "West Bengal": { count: 32, history: [2, 3, 2, 3, 4, 4, 5, 5, 6, 7, 8, 32] },
    "Telangana": { count: 28, history: [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 28] },
    "Odisha": { count: 24, history: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 24] },
    "Madhya Pradesh": { count: 20, history: [1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 20] },
    "Chhattisgarh": { count: 18, history: [0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 18] },
    "Tamil Nadu": { count: 15, history: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 15] },
    "Uttar Pradesh": { count: 12, history: [0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 12] },
    "Rajasthan": { count: 10, history: [0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 10] },
    "Gujarat": { count: 8, history: [0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 8] },
    "Karnataka": { count: 6, history: [0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 6] },
    "Andhra Pradesh": { count: 5, history: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 5] },
    "Punjab": { count: 4, history: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4] },
    "Haryana": { count: 3, history: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 3] },
    "Delhi": { count: 2, history: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2] },

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

      {/* Custom Preloader - Prism Theme */}
      <div className={`fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${isLoading ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="relative scale-150">
          {/* Pulsing Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 blur-3xl opacity-20 animate-pulse"></div>

          {/* Logo Text */}
          <h1 className="relative text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 animate-pulse">
            PRISM
          </h1>
        </div>

        {/* Loading Bar */}
        <div className="mt-8 h-1 w-48 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div className="h-full bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 w-full animate-[loading_1.5s_ease-in-out_infinite] origin-left"></div>
        </div>

        <p className="mt-4 text-slate-500 font-medium text-xs tracking-[0.3em] uppercase animate-pulse">Initializing Portal</p>
      </div>
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

      {/* Hero Section - Shopify Style (Cinematic & Minimal) */}
      <section className="relative h-screen w-full overflow-hidden bg-slate-900 text-white">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/50 z-10" />
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

        {/* Transparent Header (Hero Only) */}
        <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-6 md:px-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20">
              <img src="/images/prism brand logo.png" alt="Logo" className="w-6 h-6 object-contain brightness-0 invert" />
            </div>
            <span className="font-bold text-xl tracking-tight">NaCCER</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-white/80">
            <a href="#about" className="hover:text-white transition-colors">Why NaCCER?</a>
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#research" className="hover:text-white transition-colors">Research</a>
            <a href="#leadership" className="hover:text-white transition-colors">Enterprise</a>
          </nav>

          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium hover:text-white/80 transition-colors hidden sm:block">Log in</Link>
            <Link href="/register">
              <button className="bg-white text-slate-900 px-6 py-3 rounded-full text-sm font-bold hover:bg-slate-100 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                New Registration
              </button>
            </Link>
          </div>
        </header>

        {/* Main Hero Content */}
        <div className="relative z-30 h-full flex flex-col justify-end pb-24 px-6 md:px-12 max-w-8xl mx-auto w-full">
          <div className="max-w-4xl space-y-8 animate-fade-in-up">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-light tracking-tighter leading-[0.9]">
              Unleash R&D<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">with PRISM.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 font-light max-w-xl leading-relaxed">
              Revolutionizing coal research through our advanced Proposal Review & Innovation Support Mechanism.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link href="/login">
                <button className="px-10 py-5 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-blue-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:-translate-y-1 flex items-center gap-3 group">
                  Access Portal
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </Link>
              <Link href="/register">
                <button className="px-10 py-5 bg-transparent border border-white/30 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all hover:-translate-y-1 backdrop-blur-sm">
                  New Registration
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Right Video Link */}
        <a href="#about" className="absolute bottom-12 right-12 z-30 hidden lg:flex items-center gap-4 group cursor-pointer animate-fade-in">
          <span className="text-lg font-medium text-white/90 group-hover:text-white transition-colors">Why we build NaCCER</span>
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-all group-hover:scale-110">
            <svg className="w-6 h-6 fill-white ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </a>
      </section>

      {/* Latest Updates Ticker - Cyberpunk/Modern Style */}
      <section className="bg-slate-950 border-y border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-6 text-sm text-white">
            <div className="flex items-center gap-3 flex-shrink-0 bg-blue-900/30 px-4 py-1.5 rounded-full border border-blue-500/30 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              <span className="font-bold tracking-wider text-blue-100">LIVE UPDATES</span>
            </div>
            <div className="overflow-hidden flex-1 mask-linear-fade">
              <div className="whitespace-nowrap animate-scroll text-slate-300 font-medium flex items-center">
                {[
                  "New guidelines for R&D proposal submissions effective from October 2025",
                  "Enhanced AI evaluation system launched",
                  "NaCCER announces 50 new research grants for clean coal technologies",
                  "International symposium on sustainable mining scheduled for December"
                ].map((text, i) => (
                  <span key={i} className="inline-flex items-center mx-8">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-3"></span>
                    {text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Left Content - 8 Columns */}
            <div className="lg:col-span-8 space-y-12">
              {/* Welcome Text */}
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                  Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">NaCCER</span>
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed font-light">
                  The <strong className="text-slate-900 font-semibold">National Coal Committee for Environmental Research</strong> presents an advanced R&D Proposal Management System. We are dedicated to fostering sustainable coal research, promoting environmental stewardship, and driving technological innovation in India's energy sector.
                </p>
              </div>

              {/* PRISM Card - Modern Dashboard Style */}
              <div className="group relative bg-white rounded-3xl p-1 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-white rounded-[20px] p-8 flex flex-col md:flex-row items-center gap-8 z-10">
                  <div className="w-40 h-40 bg-slate-50 rounded-2xl flex items-center justify-center p-6 shadow-inner group-hover:scale-105 transition-transform duration-500">
                    <img
                      src="/images/prism brand logo.png"
                      alt="PRISM Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                      <h2 className="text-3xl font-bold text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all">PRISM</h2>
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full uppercase tracking-wider border border-blue-100">Core System</span>
                    </div>
                    <p className="text-lg text-slate-600 font-medium mb-4">
                      Proposal Review & Innovation Support Mechanism
                    </p>
                    <p className="text-slate-500 leading-relaxed mb-6">
                      A cutting-edge platform designed to streamline the research proposal lifecycle, ensuring transparency, efficiency, and merit-based selection for national coal research projects.
                    </p>
                    <button className="text-blue-600 font-semibold flex items-center gap-2 group/btn hover:gap-3 transition-all">
                      Learn more about PRISM
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - 4 Columns (Info Widget) */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden sticky top-24">
                {/* Tab Header */}
                <div className="flex p-2 bg-slate-50/50 backdrop-blur-sm">
                  <button
                    onClick={() => setActiveInfoTab('whats-new')}
                    className={`flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-300 ${activeInfoTab === 'whats-new'
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    What's New
                  </button>
                  <button
                    onClick={() => setActiveInfoTab('important-info')}
                    className={`flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-300 ${activeInfoTab === 'important-info'
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    Important Info
                  </button>
                </div>

                {/* Content Area */}
                <div className="p-6 min-h-[400px] bg-white">
                  {activeInfoTab === 'whats-new' && (
                    <div className="space-y-6 animate-fade-in">
                      {[
                        { text: "New AI-powered proposal evaluation system launched successfully.", date: "25/09/2025", tag: "New" },
                        { text: "Enhanced collaboration features now available for all users.", date: "20/09/2025", tag: "Update" },
                        { text: "Updated R&D proposal submission guidelines published.", date: "15/09/2025", tag: "Info" },
                        { text: "Digital transformation initiatives in mining sector expanded.", date: "12/09/2025", tag: "News" }
                      ].map((item, i) => (
                        <div key={i} className="flex gap-4 items-start group cursor-pointer">
                          <div className="flex-shrink-0 w-14 text-center bg-slate-50 rounded-lg p-2 border border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50 transition-colors">
                            <span className="block text-xl font-bold text-slate-700 group-hover:text-blue-600">{item.date.split('/')[0]}</span>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(item.date.split('/')[1]) - 1]}</span>
                          </div>
                          <div>
                            <p className="text-sm text-slate-700 font-medium group-hover:text-blue-600 transition-colors line-clamp-2">
                              {item.text}
                            </p>
                            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold border border-slate-200">
                              {item.tag}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeInfoTab === 'important-info' && (
                    <div className="space-y-4 animate-fade-in">
                      {[
                        { text: "System maintenance scheduled for Oct 1, 2025", type: "Critical", color: "red" },
                        { text: "New compliance requirements for research proposals", type: "Policy", color: "blue" },
                        { text: "Deadline extension for pending submissions until Oct 15, 2025", type: "Alert", color: "orange" },
                        { text: "Mandatory training session for new reviewers on Oct 5, 2025", type: "Training", color: "green" }
                      ].map((item, i) => (
                        <div key={i} className={`p-4 rounded-xl border border-${item.color}-100 bg-${item.color}-50/50 hover:bg-${item.color}-50 transition-colors`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider text-${item.color}-600 bg-white px-2 py-1 rounded-full shadow-sm`}>
                              {item.type}
                            </span>
                            <span className={`w-2 h-2 rounded-full bg-${item.color}-500 animate-pulse`}></span>
                          </div>
                          <p className="text-sm text-slate-700 font-medium">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                  <button className="w-full py-3 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 group">
                    View All Updates
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

      {/* Statistics Strip */}
      <section className="bg-[#020617] py-10 border-t border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-4">
            {[
              {
                count: "14237",
                label: "ONLINE SERVICES",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              },
              {
                count: "4373",
                label: "GOVT. SCHEMES",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              },
              {
                count: "5424",
                label: "CITIZEN ENGAGEMENTS",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              },
              {
                count: "3851",
                label: "TOURIST PLACES",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              },
              {
                count: "2847",
                label: "RESEARCH PAPERS",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              },
              {
                count: "1543",
                label: "ACTIVE RESEARCHERS",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              }
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center group p-2">
                <div className="text-blue-500 mb-3 transform group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {stat.icon}
                  </svg>
                </div>
                <div className="relative inline-block mb-2 text-center">
                  <span className="text-3xl font-bold text-white tracking-wider block">{stat.count}</span>
                  <div className="h-0.5 w-12 bg-slate-700 mx-auto mt-1 group-hover:bg-blue-500 transition-colors duration-300"></div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-400 transition-colors text-center leading-tight">
                  {stat.label.split(' ').map((word, i) => (
                    <span key={i} className="block">{word}</span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>



      <section id="services" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">Our Services</h2>
            <div className="w-24 h-1.5 bg-blue-600 mx-auto rounded-full mb-4"></div>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">
              Comprehensive support for the entire research lifecycle, from proposal submission to project monitoring and evaluation.
            </p>
          </div>


          {/* Services Content - Full Width */}
          <ServicesContent />
        </div>
      </section>

      <section id="research" className="py-24 bg-indigo-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:20px_20px] opacity-50"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="flex flex-col items-center justify-center gap-4 mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Live Data Visualization
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
              NaCCER's Indian Footprint
            </h2>
            <p className="text-slate-600 max-w-2xl text-lg font-normal">
              Visualizing the distribution of research proposals and scientific contributions across the nation in real-time.
            </p>
          </div>

          {/* Main Content Area */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left: State Info and Chart - 4 Columns */}
            <div className="lg:col-span-4 space-y-6">
              {/* Selected State Card */}
              <div className="bg-white rounded-3xl border border-blue-100 shadow-xl p-8 relative overflow-hidden group hover:border-blue-300 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10"></div>

                <div className="relative z-10">
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Selected Region</h3>

                  <div className="relative h-16 mb-8">
                    {/* Animated Text */}
                    <div className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight" key={selectedState + '-text'}>
                      {selectedState}
                    </div>
                  </div>

                  <div className="h-1 w-full bg-slate-100 rounded-full mb-8 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-1/3 animate-[loading_2s_ease-in-out_infinite]"></div>
                  </div>

                  <div className="animate-fade-in" key={selectedState + '-count'}>
                    <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Total Proposals (2014-2025)</p>
                    <div className="flex items-baseline gap-4">
                      <span className="text-6xl font-bold text-slate-900 animate-count-up">{stateProposalsData[selectedState].count}</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        Active Status
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
              <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xl">
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 relative overflow-hidden" style={{ height: '650px' }}>

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
                          noDataColor: "#cbd5e1",
                          borderColor: "#94a3b8",
                          hoverColor: "#f97316",
                          hoverBorderColor: "#c2410c",
                          height: 600,
                          weight: 600
                        }}
                        hoverComponent={({ value }) => (
                          <div className="bg-white text-slate-900 px-4 py-3 rounded-xl shadow-2xl border border-slate-200 pointer-events-none transform -translate-y-4">
                            <div className="font-bold text-orange-600 text-sm mb-1">{value.name}</div>
                            <div className="text-2xl font-bold">{value.value}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Proposals</div>
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
                  <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 max-w-[200px]">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Highest Activity</div>
                    <div className="text-lg font-bold text-slate-900">Jharkhand</div>
                    <div className="text-sm font-medium text-orange-600">44 Proposals</div>
                  </div>

                  <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
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
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "States Covered", value: Object.keys(stateProposalsData).length, color: "blue", speed: 50, increment: 1 },
              { label: "Total Proposals", value: Object.values(stateProposalsData).reduce((sum, state) => sum + state.count, 0), color: "green", speed: 30, increment: 2 },
              { label: "Highest (State)", value: Math.max(...Object.values(stateProposalsData).map(s => s.count)), color: "orange", speed: 80, increment: 1 }
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`metric-card bg-white rounded-2xl p-6 text-center border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group hover:-translate-y-2 cursor-default`}
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
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group hover:-translate-y-2 cursor-default">
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

      {/* About Ministry & Vision/Mission Section */}
      <section id="about" className="pt-24 pb-96 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-30 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-100 blur-3xl mix-blend-multiply"></div>
          <div className="absolute top-1/2 right-0 w-64 h-64 rounded-full bg-purple-100 blur-3xl mix-blend-multiply"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* About Ministry/Department Component */}
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-block">
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">About Ministry</h2>
                <div className="h-1.5 w-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] transition-all duration-500">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>

                <div className="relative z-10 space-y-6 text-lg text-slate-600 leading-relaxed font-light">
                  <p>
                    We are dedicated to serving the public by advancing <strong className="text-slate-900 font-semibold">coal research and development</strong> initiatives in India.
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
              <div className="h-[300px] cursor-pointer [perspective:1200px] group animate-fade-in-up animation-delay-200">
                <div className="relative w-full h-full duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-xl hover:shadow-2xl rounded-3xl transition-shadow">
                  {/* FRONT */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex flex-col items-center justify-center [backface-visibility:hidden] p-8 text-white overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/noise.png')] opacity-10 mix-blend-overlay"></div>

                    {/* Decorative Elements */}
                    <div className="absolute top-8 right-8 w-20 h-20 border-2 border-white/20 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-8 left-8 w-16 h-16 border-2 border-white/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>



                    {/* Title with gradient underline */}
                    <div className="text-center relative">
                      <h2 className="text-5xl font-extrabold tracking-widest mb-3 drop-shadow-lg">
                        <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent animate-gradient-x">VISION</span>
                      </h2>
                      <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-white to-transparent rounded-full"></div>
                    </div>

                  </div>

                  {/* BACK */}
                  <div className="absolute inset-0 bg-white text-slate-800 rounded-3xl p-8 [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-auto border border-slate-100 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">Our Vision</h3>
                    <p className="text-lg font-medium mb-6 text-slate-700 leading-snug">
                      To secure availability of coal in an eco-friendly, sustainable and cost-effective manner.
                    </p>
                    <ul className="space-y-4 text-sm text-slate-600">
                      <li className="flex items-start group/item">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0 group-hover/item:scale-125 transition-transform"></span>
                        <span>Augment production through advanced clean coal technologies.</span>
                      </li>
                      <li className="flex items-start group/item">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0 group-hover/item:scale-125 transition-transform"></span>
                        <span>Enhance resource base by increasing exploration efforts.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Mission Card - Flip */}
              <div className="h-[300px] cursor-pointer [perspective:1200px] group animate-fade-in-up animation-delay-400">
                <div className="relative w-full h-full duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-xl hover:shadow-2xl rounded-3xl transition-shadow">
                  {/* FRONT */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl flex flex-col items-center justify-center [backface-visibility:hidden] p-8 text-white overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/noise.png')] opacity-10 mix-blend-overlay"></div>

                    {/* Decorative Elements */}
                    <div className="absolute top-8 left-8 w-24 h-24 border-2 border-white/20 rounded-lg rotate-12 animate-pulse"></div>
                    <div className="absolute bottom-8 right-8 w-20 h-20 border-2 border-white/20 rounded-lg -rotate-12 animate-pulse" style={{ animationDelay: '1s' }}></div>


                    {/* Title with gradient underline */}
                    <div className="text-center relative">
                      <h2 className="text-5xl font-extrabold tracking-widest mb-3 drop-shadow-lg">
                        <span className="bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent animate-gradient-x">MISSION</span>
                      </h2>
                      <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-white to-transparent rounded-full"></div>
                    </div>

                  </div>

                  {/* BACK */}
                  <div className="absolute inset-0 bg-white text-slate-800 rounded-3xl p-8 [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-auto border border-slate-100 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-4">Our Mission</h3>
                    <ul className="space-y-4 text-sm text-slate-600 mb-6">
                      <li className="flex items-start group/item">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0 group-hover/item:scale-125 transition-transform"></span>
                        <span>Adopt clean coal technologies for safety & sustainability.</span>
                      </li>
                      <li className="flex items-start group/item">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0 group-hover/item:scale-125 transition-transform"></span>
                        <span>Develop infrastructure for efficient coal evacuation.</span>
                      </li>
                    </ul>
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-800 text-center uppercase tracking-wide">
                        Driving sustainable development through innovation
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Our Ministers Section with Overlapping Banner */}
      <section id="leadership" className="pt-72 pb-16 bg-slate-900 relative">

        {/* Overlapping Coal Mining Carousel */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl px-4 z-30">
          <div className="relative aspect-[21/9] overflow-hidden rounded-3xl shadow-2xl border border-slate-200 bg-slate-900 group">

            {/* Slides */}
            {miningSlides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${index === currentMiningSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                  }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10"></div>
                <img
                  src={slide.img}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />

                {/* Content Overlay */}
                <div className={`absolute top-0 left-0 h-full w-full md:w-2/3 p-8 md:p-16 flex flex-col justify-center z-20 transform transition-all duration-700 delay-300 ${index === currentMiningSlide ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
                  }`}>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest w-fit mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                    Featured Highlight
                  </div>
                  <h3 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
                    {slide.title}
                  </h3>
                  <p className="text-slate-300 text-lg md:text-xl leading-relaxed max-w-xl drop-shadow-md">
                    {slide.description}
                  </p>
                </div>
              </div>
            ))}

            {/* Navigation Arrows */}
            <button
              onClick={() => setCurrentMiningSlide((prev) => (prev - 1 + miningSlides.length) % miningSlides.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all hover:scale-110 border border-white/20 group/nav"
            >
              <svg className="w-6 h-6 transform group-hover/nav:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <button
              onClick={() => setCurrentMiningSlide((prev) => (prev + 1) % miningSlides.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all hover:scale-110 border border-white/20 group/nav"
            >
              <svg className="w-6 h-6 transform group-hover/nav:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-6 right-8 z-30 flex gap-2">
              {miningSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentMiningSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentMiningSlide ? 'w-8 bg-blue-500' : 'w-2 bg-white/50 hover:bg-white'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Background Pattern Container (Overflow Hidden) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600 blur-[100px] opacity-20"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600 blur-[100px] opacity-20"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-white mb-4">Leadership</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Guiding the nation towards energy security and sustainable development.</p>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-center">
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

      {/* 9. Timeline of Achievements */}
      {/* 9. Timeline of Achievements */}
      <div className="bg-gray-50 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Journey</h2>
            <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full mb-4"></div>
            <p className="text-slate-600 max-w-2xl mx-auto">Key milestones in NaCCER's evolution towards excellence in coal research.</p>
          </div>

          <div className="max-w-7xl mx-auto relative">
            {/* Desktop View - Interactive Hover Timeline */}
            <div className="hidden md:grid grid-cols-4 gap-4 relative min-h-[450px]">
              {/* Central Horizontal Line */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full z-0"></div>

              {[
                { year: "2014", title: "NaCCER Established", desc: "Ministry of Coal launches National Centre for Coal Excellence & Research" },
                { year: "2018", title: "1000+ Proposals", desc: "Crossed 1000 research proposals submitted across India" },
                { year: "2022", title: "Digital Transformation", desc: "Launched paperless online proposal submission portal" },
                { year: "2025", title: "AI-Powered Evaluation", desc: "Revolutionary AI/ML-based automated evaluation system deployed" }
              ].map((milestone, idx) => (
                <div key={idx} className="grid grid-rows-[1fr_auto_1fr] h-full group cursor-pointer">

                  {/* Top Row */}
                  <div className="flex flex-col justify-end items-center pb-6 px-2 relative">
                    {idx % 2 === 0 ? (
                      // Even: Year Card (Always Visible)
                      <div className="w-full flex flex-col items-center z-10">
                        <div className="bg-white rounded-2xl py-6 px-8 shadow-sm border border-slate-100 group-hover:shadow-xl group-hover:border-blue-400 group-hover:-translate-y-2 transition-all duration-300">
                          <span className="text-5xl font-black text-slate-200 group-hover:text-blue-600 transition-colors duration-300 block text-center">{milestone.year}</span>
                        </div>
                        <div className="h-6 w-0.5 bg-slate-200 group-hover:bg-blue-500 transition-colors duration-300 mt-2"></div>
                      </div>
                    ) : (
                      // Odd: Content Card (Visible on Hover)
                      <div className="absolute bottom-6 w-full flex flex-col items-center opacity-0 group-hover:opacity-100 translate-y-8 group-hover:translate-y-0 transition-all duration-500 ease-out z-20 pointer-events-none group-hover:pointer-events-auto">
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-l-4 border-blue-500 w-full transform transition-transform">
                          <h3 className="text-lg font-bold text-slate-900 mb-2">{milestone.title}</h3>
                          <p className="text-slate-600 text-sm leading-relaxed">{milestone.desc}</p>
                        </div>
                        <div className="h-6 w-0.5 bg-blue-500"></div>
                      </div>
                    )}
                  </div>

                  {/* Middle Row (Dot) */}
                  <div className="relative z-10 flex items-center justify-center h-4">
                    <div className="w-4 h-4 bg-slate-300 rounded-full group-hover:bg-blue-600 group-hover:scale-150 group-hover:ring-4 ring-blue-100 transition-all duration-300"></div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex flex-col justify-start items-center pt-6 px-2 relative">
                    {idx % 2 !== 0 ? (
                      // Odd: Year Card (Always Visible)
                      <div className="w-full flex flex-col items-center z-10">
                        <div className="h-6 w-0.5 bg-slate-200 group-hover:bg-blue-500 transition-colors duration-300 mb-2"></div>
                        <div className="bg-white rounded-2xl py-6 px-8 shadow-sm border border-slate-100 group-hover:shadow-xl group-hover:border-blue-400 group-hover:translate-y-2 transition-all duration-300">
                          <span className="text-5xl font-black text-slate-200 group-hover:text-blue-600 transition-colors duration-300 block text-center">{milestone.year}</span>
                        </div>
                      </div>
                    ) : (
                      // Even: Content Card (Visible on Hover)
                      <div className="absolute top-6 w-full flex flex-col items-center opacity-0 group-hover:opacity-100 -translate-y-8 group-hover:translate-y-0 transition-all duration-500 ease-out z-20 pointer-events-none group-hover:pointer-events-auto">
                        <div className="h-6 w-0.5 bg-blue-500"></div>
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-l-4 border-blue-500 w-full transform transition-transform">
                          <h3 className="text-lg font-bold text-slate-900 mb-2">{milestone.title}</h3>
                          <p className="text-slate-600 text-sm leading-relaxed">{milestone.desc}</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>

            {/* Mobile View (Vertical) */}
            <div className="md:hidden relative pl-8 border-l-2 border-blue-200 ml-4 space-y-12">
              {[
                { year: "2014", title: "NaCCER Established", desc: "Ministry of Coal launches National Centre for Coal Excellence & Research" },
                { year: "2018", title: "1000+ Proposals", desc: "Crossed 1000 research proposals submitted across India" },
                { year: "2022", title: "Digital Transformation", desc: "Launched paperless online proposal submission portal" },
                { year: "2025", title: "AI-Powered Evaluation", desc: "Revolutionary AI/ML-based automated evaluation system deployed" }
              ].map((milestone, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[41px] top-0 w-5 h-5 bg-white border-4 border-blue-600 rounded-full"></div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
                    <div className="text-xl font-bold text-blue-600 mb-2">{milestone.year}</div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{milestone.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{milestone.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-6">
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
