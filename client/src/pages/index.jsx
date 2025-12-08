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
const TimelineChart = dynamic(() => import("../components/TimelineChart"), { ssr: false });
const ProcessFlow = dynamic(() => import("../components/ProcessFlow"), { ssr: false });

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
      img: "/images/coal mining image3.jpeg",
      title: "Frontline Coal Operations",
      description: "Ensuring safe, responsible, and inclusive coal handling practices under the Ministry of Coal."
    },
    {
      img: "/images/coal mining image4.jpeg",
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

  // Scroll-triggered animations
  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe all elements with scroll animation classes
    const animatedElements = document.querySelectorAll('.animate-on-scroll, .animate-on-scroll-left, .animate-on-scroll-right, .animate-on-scroll-scale');
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [isLoading]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 font-sans text-slate-900 selection:bg-blue-200 selection:text-blue-900">

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
      <Navbar />
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
        @keyframes gradient-xy {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-xy { animation: gradient-xy 6s ease infinite; }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }

        /* CTA Section Animations - Enhanced & More Visible */
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        .animate-float-delayed { animation: float-delayed 7s ease-in-out infinite; animation-delay: 2s; }

        @keyframes float-slow {
          0%, 100% { transform: translate(0px, 0px); }
          25% { transform: translate(10px, -10px); }
          50% { transform: translate(0px, -20px); }
          75% { transform: translate(-10px, -10px); }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        .animate-shimmer::after { 
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes glow-pulse {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2); 
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(59, 130, 246, 0.4); 
            transform: scale(1.02);
          }
        }
        .animate-glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }

        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-left { animation: slide-in-left 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale { animation: fade-in-scale 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes count-up {
          from { opacity: 0; transform: translateY(20px) scale(0.8); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-count-up { animation: count-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes line-grow {
          from { height: 0; opacity: 0; }
          to { height: 100%; opacity: 1; }
        }
        .animate-line-grow { animation: line-grow 1.5s ease-out forwards; animation-delay: 0.5s; }

        @keyframes checkmark-pop {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-checkmark-pop { animation: checkmark-pop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards; }

        @keyframes text-glow {
          0%, 100% { text-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
          50% { text-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.4); }
        }
        .animate-text-glow { animation: text-glow 2s ease-in-out infinite; }

        @keyframes border-glow {
          0%, 100% { border-color: rgba(59, 130, 246, 0.3); }
          50% { border-color: rgba(59, 130, 246, 0.8); }
        }
        .animate-border-glow { animation: border-glow 2s ease-in-out infinite; }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-pulse-ring::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid rgba(74, 222, 128, 0.6);
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes typing {
          from { width: 0; }
          to { width: 100%; }
        }
        .animate-typing { 
          overflow: hidden;
          white-space: nowrap;
          animation: typing 2s steps(30) forwards;
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }
        .animate-wiggle { animation: wiggle 0.5s ease-in-out; }

        .stagger-1 { animation-delay: 0.15s; }
        .stagger-2 { animation-delay: 0.3s; }
        .stagger-3 { animation-delay: 0.45s; }
        .stagger-4 { animation-delay: 0.6s; }
        .stagger-5 { animation-delay: 0.75s; }
        .stagger-6 { animation-delay: 0.9s; }
        .stagger-7 { animation-delay: 1.05s; }
        .stagger-8 { animation-delay: 1.2s; }

        /* Hover effect classes */
        .hover-lift { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease; }
        .hover-lift:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }

        .hover-glow { transition: all 0.4s ease; }
        .hover-glow:hover { box-shadow: 0 0 30px rgba(59, 130, 246, 0.5); }

        .hover-scale { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .hover-scale:hover { transform: scale(1.1); }

        /* Scroll-triggered animations */
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-on-scroll.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .animate-on-scroll-left {
          opacity: 0;
          transform: translateX(-60px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-on-scroll-left.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .animate-on-scroll-right {
          opacity: 0;
          transform: translateX(60px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-on-scroll-right.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .animate-on-scroll-scale {
          opacity: 0;
          transform: scale(0.9);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-on-scroll-scale.visible {
          opacity: 1;
          transform: scale(1);
        }

        /* Initial fade-in animations for hero */
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; animation-delay: 0.5s; opacity: 0; }
      `}</style>

      {/* Hero Section - Nama Style (Cinematic & Minimal) */}
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
            <source src="/hero_section_vedio.mp4" type="video/mp4" />
          </video>
        </div>



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
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Content - 8 Columns */}
            <div className="lg:col-span-8">
              {/* PRISM Main Feature Section - Professional Government Style */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-500">
                {/* Header Bar - Clean Minimal Design */}
                <div className="px-6 py-5 border-b border-slate-100">
                  <div className="flex items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                        <img
                          src="/images/prism brand logo.png"
                          alt="PRISM Logo"
                          className="w-8 h-8 object-contain brightness-0 invert"
                        />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">PRISM</h2>
                        <p className="text-slate-500 text-xs">Proposal Review & Innovation Support Mechanism</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-slate-600 text-sm leading-relaxed">
                    An integrated digital platform under the Ministry of Coal, Government of India, designed to streamline 
                    the research proposal lifecycle with transparency, efficiency, and merit-based evaluation for national 
                    coal research & development projects.
                  </p>
                </div>

                {/* Features Grid - Clean Professional Style */}
                <div className="p-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-8 h-px bg-slate-300"></span>
                    Key Features
                    <span className="flex-1 h-px bg-slate-200"></span>
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { text: "AI-Assisted Proposal Evaluation", desc: "Automated scoring and analysis", icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" },
                      { text: "Real-Time Status Tracking", desc: "Live updates and notifications", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
                      { text: "Official Templates & Guidelines", desc: "Government-approved formats", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                      { text: "Budget & Timeline Forecasting", desc: "Smart resource planning tools", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
                      { text: "Multi-User Collaboration", desc: "Team-based proposal editing", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
                      { text: "Blockchain Audit Trail", desc: "Immutable record keeping", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" }
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-800 block">{feature.text}</span>
                          <span className="text-xs text-slate-500">{feature.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Ministry of Coal</span> • Government of India Initiative
                  </p>
                  <Link href="/login">
                    <button className="px-5 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2">
                      Access Portal
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Content - 4 Columns (Info Widget) */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden sticky top-24 shadow-sm hover:shadow-lg transition-shadow duration-500">
                {/* Tab Header */}
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => setActiveInfoTab('whats-new')}
                    className={`flex-1 py-3.5 px-4 text-sm font-semibold transition-all ${activeInfoTab === 'whats-new'
                      ? 'bg-white text-slate-800 border-b-2 border-blue-600 -mb-px'
                      : 'text-slate-500 hover:text-slate-700 bg-slate-50'
                      }`}
                  >
                    What's New
                  </button>
                  <button
                    onClick={() => setActiveInfoTab('important-info')}
                    className={`flex-1 py-3.5 px-4 text-sm font-semibold transition-all ${activeInfoTab === 'important-info'
                      ? 'bg-white text-slate-800 border-b-2 border-blue-600 -mb-px'
                      : 'text-slate-500 hover:text-slate-700 bg-slate-50'
                      }`}
                  >
                    Notices
                  </button>
                </div>

                {/* Content Area */}
                <div className="p-5 min-h-[380px] bg-white">
                  {activeInfoTab === 'whats-new' && (
                    <div className="space-y-4">
                      {[
                        { text: "New AI-powered proposal evaluation system launched successfully.", date: "25/11/2025", tag: "New" },
                        { text: "Enhanced collaboration features now available for all users.", date: "20/11/2025", tag: "Update" },
                        { text: "Updated R&D proposal submission guidelines published.", date: "15/11/2025", tag: "Guideline" },
                        { text: "Digital transformation initiatives in mining sector expanded.", date: "12/11/2025", tag: "News" }
                      ].map((item, i) => (
                        <div key={i} className="flex gap-3 items-start group cursor-pointer pb-4 border-b border-slate-100 last:border-0 last:pb-0 hover:bg-slate-50/50 -mx-2 px-2 rounded-lg transition-colors">
                          <div className="flex-shrink-0 w-12 text-center bg-slate-100 rounded-xl p-1.5">
                            <span className="block text-lg font-bold text-slate-700">{item.date.split('/')[0]}</span>
                            <span className="block text-[9px] font-semibold text-slate-500 uppercase">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(item.date.split('/')[1]) - 1]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors line-clamp-2 leading-snug">
                              {item.text}
                            </p>
                            <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              item.tag === 'New' ? 'bg-green-100 text-green-700' :
                              item.tag === 'Update' ? 'bg-blue-100 text-blue-700' :
                              item.tag === 'Guideline' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {item.tag}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeInfoTab === 'important-info' && (
                    <div className="space-y-3">
                      {[
                        { text: "System maintenance scheduled for Dec 1, 2025", type: "Maintenance", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
                        { text: "New compliance requirements for research proposals effective Jan 2026", type: "Policy", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                        { text: "Deadline extension for pending submissions until Dec 15, 2025", type: "Deadline", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
                        { text: "Mandatory training session for new reviewers on Dec 5, 2025", type: "Training", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" }
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                            </svg>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block mb-1">{item.type}</span>
                            <p className="text-sm text-slate-700 leading-snug">{item.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <button className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
                    View All Updates
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-slate-50">
        <ProcessFlow />
      </div>

      <section id="services" className="py-14 bg-white relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] [background-size:4rem_4rem] opacity-60"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Clean Government-Style Header */}
          <div className="mb-8 animate-on-scroll">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-600"></div>
              <span className="text-blue-600 font-semibold text-sm tracking-wide uppercase">Our Services</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-600"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 text-center mb-4">Comprehensive Research Support</h2>
            <p className="text-slate-500 text-center max-w-2xl mx-auto">
              End-to-end support for the entire research lifecycle—from proposal submission to project monitoring and evaluation.
            </p>
            {/* Accent underline */}
            <div className="flex justify-center mt-4">
              <div className="h-1 w-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-full"></div>
            </div>
          </div>

          {/* Services Content */}
          <ServicesContent />
        </div>
      </section>

      {/* About Ministry Section */}
      <section id="about" className="py-16 bg-white relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] [background-size:4rem_4rem] opacity-40"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="mb-12 animate-on-scroll">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-600"></div>
              <span className="text-blue-600 font-semibold text-sm tracking-wide uppercase">About Us</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-600"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 text-center mb-4">About Ministry of Coal</h2>
            <p className="text-slate-500 text-center max-w-2xl mx-auto">
              Powering India's progress through sustainable coal research and development since 1975.
            </p>
            <div className="flex justify-center mt-4">
              <div className="h-1 w-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-full"></div>
            </div>
          </div>

          {/* Main Content - Two Column Layout */}
          <div className="grid lg:grid-cols-5 gap-6 mb-8">
            
            {/* Left Column - About Text */}
            <div className="lg:col-span-3 animate-on-scroll">
              <div className="bg-white rounded-2xl border border-slate-200 p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">S&T Research Scheme</h3>
                    <p className="text-sm text-slate-500">Government of India Initiative</p>
                  </div>
                </div>
                
                <div className="space-y-4 text-slate-600 leading-relaxed">
                  <p>
                    The Ministry of Coal, Government of India, operates a dedicated <strong className="text-slate-800">Science & Technology Research Scheme</strong> aimed at advancing the coal sector through systematic research and development activities.
                  </p>
                  <p>
                    Since 1975, this initiative has been supporting R&D projects implemented by premier national institutions including IITs, NITs, IISc, CSIR laboratories, and leading universities in collaboration with coal and lignite producing companies.
                  </p>
                  <p>
                    The scheme focuses on improving production efficiency, enhancing safety standards, developing clean coal technologies, and promoting environmental sustainability across India's coal mining operations.
                  </p>
                </div>

                {/* Key Stats Row */}
                <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">50+</div>
                    <div className="text-xs text-slate-500 mt-1">Years of Excellence</div>
                  </div>
                  <div className="text-center border-x border-slate-100">
                    <div className="text-2xl font-bold text-blue-600">342</div>
                    <div className="text-xs text-slate-500 mt-1">Projects Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">₹409 Cr</div>
                    <div className="text-xs text-slate-500 mt-1">Total Investment</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Quick Info Cards */}
            <div className="lg:col-span-2 flex flex-col gap-4 animate-on-scroll">
              {/* Vision Card */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <h4 className="font-bold">Our Vision</h4>
                </div>
                <p className="text-blue-100 text-sm leading-relaxed">
                  To secure availability of coal in an eco-friendly, sustainable and cost-effective manner while augmenting production through advanced technologies.
                </p>
              </div>

              {/* Mission Card */}
              <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-6 text-white flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h4 className="font-bold">Our Mission</h4>
                </div>
                <ul className="text-slate-300 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Adopt clean coal technologies for safety & sustainability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Develop infrastructure for efficient coal evacuation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Support environmental protection initiatives</span>
                  </li>
                </ul>
              </div>

              {/* Official Link */}
              <a href="https://www.coal.nic.in" target="_blank" rel="noopener noreferrer" 
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center group-hover:border-blue-200">
                    <svg className="w-5 h-5 text-slate-600 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 group-hover:text-blue-700 text-sm">Ministry of Coal</p>
                    <p className="text-xs text-slate-500">coal.nic.in</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>

          {/* Governance Structure - Full Width */}
          <div className="animate-on-scroll">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-900">Governance Structure</h3>
                <p className="text-sm text-slate-500 mt-1">Three-tier approval system for research proposals</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* CMPDIL */}
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    <span className="text-xs font-semibold text-emerald-600 uppercase">Nodal Agency</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">CMPDIL, Ranchi</h4>
                  <p className="text-xs text-slate-500 mb-2">Central Mine Planning & Design Institute</p>
                  <p className="text-sm text-slate-600">Handles proposal processing, fund disbursement, and progress monitoring.</p>
                </div>

                {/* Technical Sub-committee */}
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    <span className="text-xs font-semibold text-indigo-600 uppercase">Technical Review</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">Technical Sub-committee</h4>
                  <p className="text-xs text-slate-500 mb-2">HOD Mining, IIT (Rotational)</p>
                  <p className="text-sm text-slate-600">Conducts technical evaluation and expert review of proposals.</p>
                </div>

                {/* SSRC */}
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                    <span className="text-xs font-semibold text-blue-600 uppercase">Final Approval</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">SSRC</h4>
                  <p className="text-xs text-slate-500 mb-2">Standing Scientific Research Committee</p>
                  <p className="text-sm text-slate-600">Final approval authority headed by Secretary (Coal), MOC.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="research" className="py-14 bg-slate-50 relative">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [background-size:4rem_4rem] opacity-50"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Clean Header */}
          <div className="mb-8 animate-on-scroll">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-600"></div>
              <span className="text-blue-600 font-semibold text-sm tracking-wide uppercase">Data Insights</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-600"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 text-center mb-4">
              NaCCER's Indian Footprint
            </h2>
            <p className="text-slate-500 text-center max-w-2xl mx-auto">
              Distribution of research proposals and scientific contributions across the nation.
            </p>
            <div className="flex justify-center mt-6">
              <div className="h-1 w-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-full"></div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left: State Info and Chart - 4 Columns */}
            <div className="lg:col-span-4 space-y-6 animate-on-scroll-left">
              {/* Selected State Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Selected Region</span>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full animate-pulse-soft">Active</span>
                </div>

                <div className="mb-6">
                  <div className="text-2xl md:text-3xl font-bold text-slate-900 transition-all duration-300" key={selectedState + '-text'}>
                    {selectedState}
                  </div>
                </div>

                <div className="h-px w-full bg-slate-200 mb-6"></div>

                <div key={selectedState + '-count'}>
                  <p className="text-sm text-slate-500 mb-2">Total Proposals (2014-2025)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900 animate-count-up">{stateProposalsData[selectedState].count}</span>
                    <span className="text-sm text-slate-500">proposals</span>
                  </div>
                </div>
              </div>

              {/* Timeline Chart */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-lg transition-shadow duration-500" key={selectedState + '-chart'}>
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
            <div className="lg:col-span-8 animate-on-scroll-right">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-xl transition-shadow duration-500">
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 relative overflow-hidden" style={{ height: '600px' }}>

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
                  <div className="absolute top-4 right-4 bg-white p-3.5 rounded-xl shadow-lg border border-slate-200 max-w-[180px] animate-float hover:shadow-xl transition-shadow">
                    <div className="text-xs font-medium text-slate-500 mb-1">Highest Activity</div>
                    <div className="text-base font-bold text-slate-900">Jharkhand</div>
                    <div className="text-sm font-semibold text-blue-600">44 Proposals</div>
                  </div>

                  <div className="absolute bottom-4 left-4 bg-white p-3.5 rounded-xl shadow-lg border border-slate-200 animate-float hover:shadow-xl transition-shadow" style={{ animationDelay: '1s' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600 hover:scale-110 transition-transform cursor-pointer">
                            {['MH', 'WB', 'TS'][i - 1]}
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-slate-600">
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
              { label: "Projects Completed", value: "342", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "Total Outlay", value: "₹409.23 Cr", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "States Covered", value: Object.keys(stateProposalsData).length, icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "Time Period", value: "2014-25", isText: true, icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`animate-on-scroll stagger-${idx + 1} bg-white rounded-2xl p-6 text-center border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 group cursor-default`}
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {stat.isText ? stat.value : stat.value}
                </div>
                <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-14 bg-white relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] [background-size:4rem_4rem] opacity-60"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Consistent Header */}
          <div className="mb-10 animate-on-scroll">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-600"></div>
              <span className="text-blue-600 font-semibold text-sm tracking-wide uppercase">Gallery</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-600"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 text-center mb-4">Media Gallery</h2>
            <p className="text-slate-500 text-center max-w-2xl mx-auto">
              Highlights from recent events, conferences, and technological milestones in the coal sector.
            </p>
            <div className="flex justify-center mt-6">
              <div className="h-1 w-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-full"></div>
            </div>
          </div>

          {/* Mining Operations Slideshow */}
          <div className="mb-12">
            <div className="relative aspect-[21/9] overflow-hidden rounded-2xl shadow-lg border border-slate-200 bg-slate-900">
              {miningSlides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ${index === currentMiningSlide ? 'opacity-100' : 'opacity-0'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent z-10"></div>
                  <img
                    src={slide.img}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute top-0 left-0 h-full w-full md:w-2/3 p-8 md:p-12 flex flex-col justify-center z-20 ${index === currentMiningSlide ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-blue-400 text-xs font-semibold uppercase tracking-wide mb-2">Featured</span>
                    <h3 className="text-xl md:text-3xl font-bold text-white mb-2 leading-tight">{slide.title}</h3>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-lg">{slide.description}</p>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setCurrentMiningSlide((prev) => (prev - 1 + miningSlides.length) % miningSlides.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/10 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all border border-white/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={() => setCurrentMiningSlide((prev) => (prev + 1) % miningSlides.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/10 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all border border-white/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <div className="absolute bottom-4 right-6 z-30 flex gap-1.5">
                {miningSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentMiningSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentMiningSlide ? 'w-6 bg-blue-500' : 'w-1.5 bg-white/50 hover:bg-white'}`}
                  />
                ))}
              </div>
            </div>
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
              <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className={`animate-on-scroll-scale stagger-${(idx % 3) + 1} group relative block h-72 rounded-xl overflow-hidden shadow-md hover:shadow-2xl cursor-pointer transition-shadow duration-500`}>
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url("${item.img}")` }}
                ></div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500"></div>

                {/* Content */}
                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                  <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="inline-block px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Event</span>
                    <h3 className="text-lg font-bold text-white mb-1 leading-tight group-hover:text-blue-200 transition-colors duration-300">{item.title}</h3>
                    <p className="text-slate-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{item.date}</p>
                  </div>

                  <div className="flex items-center gap-2 text-white text-sm font-semibold mt-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500 delay-150">
                    View Details
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
          
          {/* View All Link */}
          <div className="mt-10 text-center animate-on-scroll">
            <a href="#" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-full transition-all duration-300 group">
              View Complete Gallery
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div >
  );
}
