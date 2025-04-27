'use client';

import React from 'react';

interface SelectionCardProps {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  selected: boolean;
  onSelect: (id: string) => void;
  className?: string;
}

const SelectionCard: React.FC<SelectionCardProps> = ({
  id,
  title,
  description,
  icon,
  selected,
  onSelect,
  className = ''
}) => {
  const baseStyle = "block w-full p-4 border rounded-lg text-left transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A4923]";
  const inactiveStyle = "bg-off-white/10 border-off-white/20 hover:bg-off-white/25 text-off-white";
  const activeStyle = "bg-green-100 border-green-300 ring-2 ring-green-400 text-green-900";

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`${baseStyle} ${selected ? activeStyle : inactiveStyle} ${className}`}
    >
      <div className="flex items-center">
        {icon && <div className="mr-3 flex-shrink-0">{icon}</div>}
        <div className="flex-grow">
          <h3 className={`text-base font-semibold ${selected ? '' : ''}`}>{title}</h3>
          {description && (
            <p className={`text-sm mt-1 ${selected ? 'text-green-800' : 'text-off-white/80'}`}>
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};

export default SelectionCard; 