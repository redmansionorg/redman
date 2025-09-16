import React from 'react';

interface StampProps {
  text: string;
  className?: string;
  rotate?: number;
  width?: number;
  height?: number;
  color?: string;
}

const Stamp: React.FC<StampProps> = ({
  text = 'RMC',
  className = '',
  rotate = -15,
  width = 180,
  height = 80,
  color = 'green',
}) => {
  const svgWidth = width;
  const svgHeight = height;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  return (
    <div className={`relative ${className}`} style={{ width: `${width}px`, height: `${height}px` }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="absolute w-full h-full opacity-80 drop-shadow-[0_0_5px_rgba(0,255,0,0.6)]"
        style={{ transform: `rotate(${rotate}deg)` }}
      >
        {/* Stamp border - now rotates with the whole SVG */}
        <rect
          x="5"
          y="5"
          width={svgWidth - 10}
          height={svgHeight - 10}
          rx="12"
          ry="12"
          fill="none"
          stroke={color}
          strokeWidth="3"
        />
        
        {/* Stamp text */}
        <text
          x={centerX}
          y={centerY}
          fontFamily="SimSun, STKaiti, serif"
          fontSize="40"
          fill={color}
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-bold"
        >
          {text}
        </text>

        {/* Optional: Add some "ink splatter" effect */}
        <circle cx={centerX - 30} cy={centerY + 20} r="2" fill={color} opacity="0.6" />
        <circle cx={centerX + 25} cy={centerY - 15} r="1.5" fill={color} opacity="0.6" />
      </svg>
    </div>
  );
};

export default Stamp;