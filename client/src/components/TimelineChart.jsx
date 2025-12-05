'use client';

import { useState, useEffect, useRef } from 'react';

export default function TimelineChart() {
  const scrollContainerRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState(0.5); // 0 to 1, center is 0.5
  const [activeIndex, setActiveIndex] = useState(null);

  // Horizontal Timeline Mock Data - NaCCER Evolution
  const horizontalTimeline = [
    {
      year: '2014',
      title: 'NaCCER Establishment',
      description: 'National Centre for Coal and Energy Research established under Ministry of Coal to promote research and innovation.',
    },
    {
      year: '2016',
      title: 'Research Grants Program',
      description: 'Launched comprehensive research funding program for coal technology advancement and clean energy initiatives.',
    },
    {
      year: '2018',
      title: 'Digital Transformation',
      description: 'Introduced online proposal submission system and digital review process for improved efficiency and transparency.',
    },
    {
      year: '2020',
      title: 'AI Integration Pilot',
      description: 'Pilot program for AI-assisted proposal screening and automated compliance checking launched successfully.',
    },
    {
      year: '2022',
      title: 'PRISM Platform Launch',
      description: 'Full-scale launch of PRISM - AI-powered Proposal Review and Innovation System Management platform.',
    },
    {
      year: '2024',
      title: 'Blockchain Integration',
      description: 'Implemented blockchain technology for transparent and immutable record-keeping of research proposals and funding.',
    },
    {
      year: '2025',
      title: 'Advanced AI & ML',
      description: 'Current state with advanced machine learning models for plagiarism detection, novelty assessment, and predictive analytics.',
    }
  ];

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let animationFrameId;

    const scroll = () => {
      if (!container) return;

      // Base speed
      let speed = 1;

      if (isHovering) {
        // Calculate speed based on mouse position relative to center
        // 0 (left) -> -speed
        // 1 (right) -> +speed
        // 0.5 (center) -> 0
        const factor = (mousePos - 0.5) * 2; // -1 to 1

        // Dead zone in the middle
        if (Math.abs(factor) < 0.2) {
          speed = 0;
        } else {
          // Non-linear speed for better control
          speed = Math.sign(factor) * Math.pow(Math.abs(factor), 2) * 8;
        }
      } else {
        // Auto scroll when not hovering
        speed = 0.5;
      }

      container.scrollLeft += speed;

      // Infinite scroll logic (reset)
      if (container.scrollLeft >= container.scrollWidth / 2 && speed > 0) {
        container.scrollLeft = 0;
      } else if (container.scrollLeft <= 0 && speed < 0) {
        container.scrollLeft = container.scrollWidth / 2;
      }

      // Calculate active item (closest to center)
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      const items = container.querySelectorAll('.timeline-item');
      let closestDist = Infinity;
      let closestIndex = -1;

      items.forEach((item, index) => {
        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.left + itemRect.width / 2;
        const dist = Math.abs(containerCenter - itemCenter);

        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = index;
        }
      });

      // Only update if the closest item is within a reasonable range (e.g., +/- 150px from center)
      // This prevents "flipping" when items are far away if the list is short, though with infinite scroll it's less of an issue.
      // We'll just set the closest one.
      if (closestIndex !== -1 && closestIndex !== activeIndex) {
        setActiveIndex(closestIndex);
      }

      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovering, mousePos, activeIndex]);

  const handleMouseMove = (e) => {
    if (!scrollContainerRef.current) return;
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    setMousePos(Math.max(0, Math.min(1, x / width)));
  };

  return (
    <div className="space-y-8 py-12">
      {/* Consistent Government-Style Header */}
      <div className="mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-600"></div>
          <span className="text-blue-600 font-semibold text-sm tracking-wide uppercase">Milestones</span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-600"></div>
        </div>
        <h3 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4">
          NaCCER's Journey of Innovation
        </h3>
        <p className="text-slate-600 text-center max-w-2xl mx-auto text-lg">
          A decade of advancing coal research through technology, transparency, and transformative initiatives.
        </p>
        <div className="flex justify-center mt-6">
          <div className="h-1 w-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-full"></div>
        </div>
      </div>

      <div
        className="relative w-full group bg-white/50 backdrop-blur-sm"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
      >
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto hide-scrollbar"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            cursor: isHovering ? 'ew-resize' : 'default'
          }}
        >
          <div className="flex items-center min-w-max px-20 relative h-[500px]">
            {/* Central Continuous Line */}
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-blue-800 -translate-y-1/2"></div>

            {/* Items Container */}
            <div className="flex gap-80 pl-24 pr-24">
              {/* Duplicate items for seamless looping */}
              {[...horizontalTimeline, ...horizontalTimeline].map((item, index) => (
                <div key={index} className="timeline-item relative flex-shrink-0 w-10 flex justify-center items-center">

                  {/* Dot on the line */}
                  <div className={`w-6 h-6 rounded-full relative z-20 border-4 border-white shadow-sm transition-all duration-300 ${index === activeIndex ? 'bg-orange-500 scale-150' : 'bg-blue-500 group-hover/item:scale-125'}`}></div>

                  {/* Top Card (Even Index) */}
                  {index % 2 === 0 && (
                    <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 mb-3 flex flex-col items-center group/item">
                      {/* Connector Line */}
                      <div className={`w-0.5 h-12 mb-2 transition-colors duration-300 ${index === activeIndex ? 'bg-orange-500' : 'bg-blue-800'}`}></div>

                      {/* Flip Card Container */}
                      <div className="w-72 h-48 [perspective:1000px] group/card cursor-pointer">
                        <div className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-xl rounded-2xl ${index === activeIndex ? '[transform:rotateY(180deg)]' : 'group-hover/card:[transform:rotateY(180deg)]'}`}>

                          {/* Front Face (Year Only) */}
                          <div className="absolute inset-0 w-full h-full bg-white rounded-2xl border border-slate-100 flex items-center justify-center [backface-visibility:hidden]">
                            <span className={`text-6xl font-bold tracking-tighter select-none transition-colors ${index === activeIndex ? 'text-orange-500' : 'text-blue-600 group-hover/card:text-blue-600'}`}>
                              {item.year}
                            </span>
                            <div className={`absolute bottom-4 text-xs font-bold text-slate-400 uppercase tracking-widest transition-opacity delay-100 ${index === activeIndex ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'}`}>
                              View Details
                            </div>
                          </div>

                          {/* Back Face (Content) */}
                          <div className="absolute inset-0 w-full h-full bg-white rounded-2xl border border-blue-100 p-6 flex flex-col justify-center text-center [transform:rotateY(180deg)] [backface-visibility:hidden] bg-gradient-to-br from-white to-blue-50/50">
                            <div className="text-sm font-bold text-blue-600 mb-2">{item.year}</div>
                            <h4 className="text-slate-800 font-bold text-lg mb-2 leading-tight">{item.title}</h4>
                            <p className="text-slate-500 text-xs leading-relaxed line-clamp-4">{item.description}</p>
                          </div>

                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Card (Odd Index) */}
                  {index % 2 !== 0 && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-3 flex flex-col items-center group/item">
                      {/* Connector Line */}
                      <div className={`w-0.5 h-12 mt-2 order-first transition-colors duration-300 ${index === activeIndex ? 'bg-orange-500' : 'bg-blue-800'}`}></div>

                      {/* Flip Card Container */}
                      <div className="w-72 h-48 [perspective:1000px] group/card cursor-pointer">
                        <div className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-xl rounded-2xl ${index === activeIndex ? '[transform:rotateY(180deg)]' : 'group-hover/card:[transform:rotateY(180deg)]'}`}>

                          {/* Front Face (Year Only) */}
                          <div className="absolute inset-0 w-full h-full bg-white rounded-2xl border border-slate-100 flex items-center justify-center [backface-visibility:hidden]">
                            <span className={`text-6xl font-bold tracking-tighter select-none transition-colors ${index === activeIndex ? 'text-orange-500' : 'text-blue-600 group-hover/card:text-blue-600'}`}>
                              {item.year}
                            </span>
                            <div className={`absolute bottom-4 text-xs font-bold text-slate-400 uppercase tracking-widest transition-opacity delay-100 ${index === activeIndex ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'}`}>
                              View Details
                            </div>
                          </div>

                          {/* Back Face (Content) */}
                          <div className="absolute inset-0 w-full h-full bg-white rounded-2xl border border-blue-100 p-6 flex flex-col justify-center text-center [transform:rotateY(180deg)] [backface-visibility:hidden] bg-gradient-to-br from-white to-blue-50/50">
                            <div className="text-sm font-bold text-blue-600 mb-2">{item.year}</div>
                            <h4 className="text-slate-800 font-bold text-lg mb-2 leading-tight">{item.title}</h4>
                            <p className="text-slate-500 text-xs leading-relaxed line-clamp-4">{item.description}</p>
                          </div>

                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gradient Overlays for Fade Effect */}
        <div className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-30"></div>
        <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-30"></div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}