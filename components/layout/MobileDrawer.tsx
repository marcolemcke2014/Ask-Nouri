import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Menu items with icons
const MENU_ITEMS = [
  { icon: "user", label: "Profile", href: "/profile" },
  { icon: "bar-chart-2", label: "My Stats", href: "/stats" },
  { icon: "clipboard-list", label: "Reports", href: "/reports" },
  { icon: "file-text", label: "My Requests", href: "/requests" },
  { icon: "settings", label: "Settings", href: "/settings" },
  { icon: "help-circle", label: "Help & Support", href: "/help" },
  { icon: "moon", label: "Theme: Auto", href: "#", hasDropdown: true },
];

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
}

export default function MobileDrawer({
  isOpen,
  onClose,
  userName = "Marco Lemcke",
  userRole = "Health Enthusiast",
  userAvatar = ""
}: MobileDrawerProps) {
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevent body scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Icon component for menu items
  const Icon = ({ name }: { name: string }) => {
    switch (name) {
      case 'user':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        );
      case 'bar-chart-2':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        );
      case 'clipboard-list':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            <path d="M9 12h6"></path>
            <path d="M9 16h6"></path>
            <path d="M9 8h1"></path>
          </svg>
        );
      case 'file-text':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        );
      case 'settings':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        );
      case 'help-circle':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      case 'moon':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        );
      case 'log-out':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        );
      case 'chevron-right':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 left-0 h-full w-4/5 max-w-xs bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* User Profile Section */}
        <div className="p-6 flex items-center border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xl font-bold overflow-hidden">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            ) : (
              userName.charAt(0)
            )}
          </div>
          <div className="ml-3">
            <h2 className="font-medium text-gray-800">{userName}</h2>
            <p className="text-sm text-gray-500">{userRole}</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {MENU_ITEMS.map((item, index) => {
            const isActive = router.pathname === item.href;
            return (
              <React.Fragment key={index}>
                <Link href={item.href}>
                  <a
                    className={`
                      flex items-center py-3 px-6 text-gray-700 hover:bg-gray-50 transition-colors
                      ${isActive ? 'text-green-600 bg-green-50' : ''}
                    `}
                    onClick={item.hasDropdown ? (e) => e.preventDefault() : onClose}
                  >
                    <span className="w-8 h-8 flex items-center justify-center mr-3 text-gray-500">
                      <Icon name={item.icon} />
                    </span>
                    <span className="flex-1 font-medium text-base">{item.label}</span>
                    {item.hasDropdown && (
                      <span className="ml-2 text-gray-400">
                        <Icon name="chevron-right" />
                      </span>
                    )}
                  </a>
                </Link>
                {index < MENU_ITEMS.length - 1 && <div className="border-b border-gray-100 mx-6" />}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Log Out Button */}
        <div className="border-t border-gray-100 p-6">
          <button
            className="flex items-center text-left w-full text-green-600 py-3 px-2 rounded-lg hover:bg-green-50 transition-colors"
            onClick={() => {
              // Handle logout action
              console.log('Logging out...');
              onClose();
            }}
          >
            <span className="w-8 h-8 flex items-center justify-center mr-3">
              <Icon name="log-out" />
            </span>
            <span className="font-medium">Log out</span>
          </button>
        </div>

        {/* Version Info */}
        <div className="p-4 text-center text-gray-400 text-sm">
          <p>Version 1.0.0</p>
        </div>
      </div>
    </>
  );
} 