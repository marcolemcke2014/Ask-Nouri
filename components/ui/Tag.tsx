import React from 'react';
import { FlagLevel } from '@/types/menu';

interface TagProps {
  label: string;
  icon?: string;
  color?: string;
  level?: FlagLevel;
  className?: string;
  onClick?: () => void;
}

/**
 * Tag component for displaying food attributes, dietary info, or warnings
 */
export default function Tag({
  label,
  icon,
  color,
  level,
  className = '',
  onClick,
}: TagProps) {
  // Default styles based on level (if provided)
  let baseStyles = 'inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium transition-colors';
  let defaultColor = '';
  
  if (level) {
    switch (level) {
      case FlagLevel.INFO:
        defaultColor = 'bg-blue-100 text-blue-800';
        break;
      case FlagLevel.WARNING:
        defaultColor = 'bg-amber-100 text-amber-800';
        break;
      case FlagLevel.ALERT:
        defaultColor = 'bg-red-100 text-red-800';
        break;
      default:
        defaultColor = 'bg-gray-100 text-gray-800';
    }
  } else {
    // Default color if no level or custom color provided
    defaultColor = 'bg-gray-100 text-gray-800';
  }
  
  // Use custom color if provided, otherwise use default based on level
  const colorStyle = color ? { backgroundColor: `${color}20`, color } : '';
  
  // If tag is clickable
  const clickableStyles = onClick ? 'cursor-pointer hover:shadow hover:opacity-90' : '';
  
  return (
    <div
      className={`${baseStyles} ${defaultColor} ${clickableStyles} ${className}`}
      style={colorStyle ? colorStyle : undefined}
      onClick={onClick}
    >
      {icon && (
        <span className="mr-1 text-lg leading-none">{icon}</span>
      )}
      <span>{label}</span>
    </div>
  );
} 