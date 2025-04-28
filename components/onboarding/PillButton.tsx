'use client';

import React from 'react';

interface PillButtonProps {
  text: string;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

const PillButton: React.FC<PillButtonProps> = ({ text, isSelected, onClick, className = '' }) => {
  const baseStyle = "px-2.5 py-1.5 border rounded-full text-xs cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A4923]";
  const inactiveStyle = "bg-off-white/10 border-off-white/20 text-off-white/80 focus:ring-green-300";
  const activeStyle = "bg-green-100 border-[#84F7AC] text-green-900 focus:ring-[#84F7AC]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseStyle} ${isSelected ? activeStyle : inactiveStyle} ${className}`}
    >
      {text}
    </button>
  );
};

export default PillButton; 