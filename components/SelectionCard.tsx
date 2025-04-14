import React from 'react';

interface SelectionCardProps {
  id: string;
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}

const SelectionCard: React.FC<SelectionCardProps> = ({
  id,
  title,
  description,
  selected,
  onSelect,
}) => {
  return (
    <div 
      onClick={onSelect}
      className={`p-4 rounded-lg border-2 mb-3 cursor-pointer transition-all
        ${selected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}
    >
      <div className="flex items-center">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div 
          className={`w-5 h-5 rounded-full border flex items-center justify-center
            ${selected 
              ? 'border-blue-500 bg-blue-500' 
              : 'border-gray-300'
            }`}
        >
          {selected && (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="white" 
              className="w-3 h-3"
            >
              <path 
                fillRule="evenodd" 
                d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" 
                clipRule="evenodd" 
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectionCard; 