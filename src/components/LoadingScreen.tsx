import React, { useEffect, useRef } from 'react';
import '@/styles/loading.css';

export const LoadingScreen: React.FC<{ message?: string }> = ({ message }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const path = svg.querySelector('#neonPath');
    if (!path) return;

    const onAnimEnd = () => {
      // mark as drawn to enable pulsing glow
      svg.classList.add('drawn');
    };

    path.addEventListener('animationend', onAnimEnd);
    return () => {
      path.removeEventListener('animationend', onAnimEnd);
    };
  }, []);

  return (
    <div className="unk-loading-root">
      <div className="unk-loading-stage">
        <div className="unk-logo-wrap">
          <img src="/logo.png" alt="UNK" className="unk-logo-img" />
          <svg ref={svgRef} className="unk-logo-neon" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <linearGradient id="neonGrad" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="45%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#93c5fd" />
              </linearGradient>
              <filter id="neonBlur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Path manually tuned to traverse the 'unk' logo stroke - adjustable */}
            <path id="neonPath" d="M80,260 C160,320 220,160 320,190 C380,210 430,260 500,220 C560,190 620,80 680,150 C740,220 800,260 880,230 C940,205 1020,120 1100,140"
              fill="none" stroke="url(#neonGrad)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />

            {/* white core stroke for contrast */}
            <path id="neonPathCore" d="M80,260 C160,320 220,160 320,190 C380,210 430,260 500,220 C560,190 620,80 680,150 C740,220 800,260 880,230 C940,205 1020,120 1100,140"
              fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" filter="url(#neonBlur)" />
          </svg>
        </div>

        <div className="unk-loading-message">{message ?? 'Carregando...'}</div>
      </div>
    </div>
  );
};

export default LoadingScreen;
