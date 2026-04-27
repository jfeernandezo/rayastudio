import React from "react";

interface LampIllustrationProps {
  isLightOn: boolean;
}

export function LampIllustration({ isLightOn }: LampIllustrationProps) {
  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
      {/* Brilho radial no fundo da página que acende com a lâmpada */}
      <div 
        className="absolute w-[900px] h-[900px] rounded-full pointer-events-none transition-opacity duration-700 ease-in-out"
        style={{
          background: "radial-gradient(circle, rgba(255, 245, 200, 0.18) 0%, rgba(255, 245, 200, 0) 65%)",
          opacity: isLightOn ? 1 : 0,
          transform: "translate(-5%, -10%)" // Centraliza o brilho mais perto da cúpula
        }}
      />

      <svg
        viewBox="0 0 400 400"
        className="relative w-full max-w-[400px] h-auto drop-shadow-2xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glow principal da cúpula da luminária */}
          <filter id="lamp-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="20" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="ball-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="light-beam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 250, 230, 0.9)" />
            <stop offset="30%" stopColor="rgba(255, 250, 230, 0.4)" />
            <stop offset="100%" stopColor="rgba(255, 250, 230, 0)" />
          </linearGradient>
        </defs>

        {/* Centralizando a luminária na viewBox */}
        <g transform="translate(100, 70)">
          
          {/* Feixe de luz sólido cônico abaixando da cúpula (bem suave) */}
          <path 
            d="M 25 80 L 175 80 L 280 280 L -80 280 Z" 
            fill="url(#light-beam)"
            style={{
              opacity: isLightOn ? 1 : 0,
              transition: "opacity 0.7s ease-in-out"
            }}
          />

          {/* === HASTE === */}
          <rect x="94" y="80" width="12" height="190" fill="#e6e2d6" />
          
          {/* === BASE === */}
          <rect x="40" y="270" width="120" height="10" rx="5" fill="#e6e2d6" />
          
          {/* === CORDINHA === */}
          {/* Linha da cordinha */}
          <line x1="140" y1="80" x2="140" y2="150" stroke="#5c5a58" strokeWidth="2" />
          {/* Bolinha da cordinha */}
          <circle 
            cx="140" cy="150" r="7" fill="#d6a073" 
            style={{
              filter: isLightOn ? "url(#ball-glow)" : "none",
              transition: "filter 0.3s ease"
            }}
          />

          {/* === CÚPULA === */}
          {/* Um meio círculo perfeito usando Arc */}
          <path 
            d="M 10 80 A 90 70 0 0 1 190 80 Z" 
            fill={isLightOn ? "#ffffff" : "#e6e2d6"} 
            style={{
              filter: isLightOn ? "url(#lamp-glow)" : "none",
              transition: "fill 0.5s ease, filter 0.5s ease"
            }}
          />
        </g>
      </svg>
    </div>
  );
}
