import React from 'react';

interface AvaiLogoProps {
  className?: string;
  size?: number;
}

export const AvaiLogo: React.FC<AvaiLogoProps> = ({ 
  className = "", 
  size = 24 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${size <= 20 ? 'antialiased' : ''}`}
      style={{ 
        imageRendering: size <= 20 ? 'pixelated' : 'auto',
        shapeRendering: size <= 20 ? 'crispEdges' : 'auto'
      }}
    >
      {/* Background circle */}
      <circle cx="16" cy="16" r="16" fill="#4F46E5"/>
      
      {/* Doctor's head */}
      <circle cx="16" cy="13" r="7" fill="#FDE68A"/>
      
      {/* Doctor's hat */}
      <ellipse cx="16" cy="7.5" rx="6" ry="2" fill="#FFFFFF"/>
      
      {/* Medical cross on hat */}
      <rect x="15" y="6" width="2" height="2.5" fill="#EF4444"/>
      <rect x="14" y="6.8" width="4" height="1.4" fill="#EF4444"/>
      
      {/* Eyes */}
      <circle cx="13.5" cy="11.5" r="0.8" fill="#1F2937"/>
      <circle cx="18.5" cy="11.5" r="0.8" fill="#1F2937"/>
      
      {/* Smile */}
      <path d="M13 14.5 Q16 16 19 14.5" stroke="#1F2937" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      
      {/* Shield */}
      <path d="M16 19 L20 20 Q20 22.5 18.5 24.5 Q17 26 16 26 Q15 26 13.5 24.5 Q12 22.5 12 20 L16 19 Z" fill="#10B981"/>
      
      {/* Medical cross on shield */}
      <rect x="15.2" y="20.5" width="1.6" height="4" fill="#FFFFFF"/>
      <rect x="13.5" y="21.8" width="5" height="1.4" fill="#FFFFFF"/>
    </svg>
  );
};
