import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  route?: string;
  action?: () => void;
  accent?: boolean;
  hasDivider?: boolean;
  onClick?: () => void;
}

/**
 * A reusable menu item component for the mobile drawer
 */
export default function MenuItem({
  icon,
  label,
  route,
  action,
  accent = false,
  hasDivider = false,
  onClick
}: MenuItemProps) {
  const router = useRouter();
  const isActive = route && router.pathname === route;

  const handleClick = () => {
    if (action) {
      action();
    }
    if (onClick) {
      onClick();
    }
  };

  const baseClasses = `
    flex items-center py-3.5 px-6 relative transition-colors duration-200
    ${accent 
      ? 'text-green-600 hover:bg-green-50' 
      : 'text-gray-700 hover:bg-gray-50'
    }
    ${isActive ? 'bg-green-50 text-green-600 font-medium' : ''}
  `;

  const content = (
    <>
      <span className="w-8 h-8 flex items-center justify-center mr-3 text-gray-500">
        {icon}
      </span>
      <span className="flex-1 font-medium text-base">{label}</span>
      {hasDivider && <div className="absolute bottom-0 left-6 right-6 h-px bg-gray-100" />}
    </>
  );

  // If route is provided, render as a Link
  if (route) {
    return (
      <Link href={route}>
        <a className={baseClasses} onClick={handleClick}>
          {content}
        </a>
      </Link>
    );
  }

  // Otherwise, render as a button
  return (
    <button className={`${baseClasses} w-full text-left`} onClick={handleClick}>
      {content}
    </button>
  );
} 