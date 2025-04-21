import React from 'react';

type SocialProvider = 'google';

interface SocialLoginButtonProps {
  provider: SocialProvider;
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}

const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  onClick,
  isLoading = false,
  className = '',
}) => {
  const icons: Record<SocialProvider, React.ReactNode> = {
    google: <GoogleIcon />
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoading) {
      onClick();
    }
  };

  const labels: Record<SocialProvider, string> = {
    google: 'Sign Up with Google'
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`w-full h-12 flex items-center justify-center rounded-lg border border-off-white/15 bg-off-white/80 backdrop-blur-sm hover:bg-off-white/90 active:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-green-600 font-['Poppins',sans-serif] ${className} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      aria-label={labels[provider]}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <div className="flex items-center justify-center gap-2 text-gray-700 text-sm">
          {icons[provider]}
          <span>{labels[provider]}</span>
        </div>
      )}
    </button>
  );
};

// Social Icon Component
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_googleicon)">
      <path d="M19.999 10.2217C20.0111 9.53428 19.934 8.84788 19.8081 8.17737H10.2041V11.8884H15.8276C15.7211 12.5391 15.4814 13.162 15.1229 13.7195C14.7644 14.2771 14.2946 14.7578 13.7416 15.1328L13.722 15.257L16.7512 17.5567L16.9609 17.5772C18.8883 15.8328 19.9996 13.266 19.9996 10.2217" fill="#4285F4"/>
      <path d="M10.2042 19.9999C12.9592 19.9999 15.2721 19.111 16.9609 17.5777L13.7417 15.1332C12.88 15.7221 11.7235 16.1333 10.2042 16.1333C8.91385 16.126 7.65863 15.7206 6.61663 14.9747C5.57464 14.2287 4.79879 13.1802 4.39915 11.9777L4.27957 11.9877L1.12973 14.3765L1.08856 14.4887C1.93689 16.1456 3.23879 17.5386 4.84869 18.512C6.45859 19.4855 8.31301 20.001 10.2046 19.9999" fill="#34A853"/>
      <path d="M4.39911 11.9777C4.17592 11.3411 4.06075 10.673 4.05819 9.99996C4.0623 9.32799 4.17322 8.66075 4.38696 8.02225L4.38127 7.88968L1.19282 5.4624L1.08852 5.51101C0.372885 6.90343 0.00012207 8.4408 0.00012207 9.99987C0.00012207 11.5589 0.372885 13.0963 1.08852 14.4887L4.39911 11.9777Z" fill="#FBBC05"/>
      <path d="M10.2042 3.86663C11.6663 3.84438 13.0804 4.37803 14.1498 5.35558L17.0296 2.59996C15.1826 0.901848 12.7366 -0.0298855 10.2042 -3.6784e-05C8.3126 -0.000477834 6.45819 0.514732 4.8483 1.48798C3.2384 2.46124 1.93649 3.85416 1.08813 5.51101L4.38775 8.02225C4.79132 6.82005 5.56974 5.77231 6.61327 5.02675C7.6568 4.28118 8.91279 3.87541 10.2042 3.86663Z" fill="#EB4335"/>
    </g>
    <defs>
      <clipPath id="clip0_googleicon">
        <rect width="20" height="20" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

export default SocialLoginButton; 