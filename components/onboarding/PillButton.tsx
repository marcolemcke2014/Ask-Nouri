'use client';

import React from 'react';

interface PillButtonProps {
  text: string;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

const PillButton: React.FC<PillButtonProps> = ({ text, isSelected, onClick, className = '' }) => {
  const baseStyle = "px-4 py-2 border rounded-full text-sm cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A4923]";
  const inactiveStyle = "bg-off-white/20 border-off-white/30 hover:bg-off-white/30 text-off-white";
  const activeStyle = "bg-green-200 border-green-400 ring-2 ring-green-500 text-green-900";

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