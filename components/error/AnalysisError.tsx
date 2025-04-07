import React from 'react';
import Link from 'next/link';

interface ErrorDetail {
  error: string;
  code: string;
  details?: string;
}

interface AnalysisErrorProps {
  errorData: ErrorDetail;
  onRetry?: () => void;
}

/**
 * User-friendly error component for menu analysis failures
 */
const AnalysisError: React.FC<AnalysisErrorProps> = ({ errorData, onRetry }) => {
  // Map error codes to user-friendly messages
  const getUserFriendlyMessage = () => {
    switch (errorData.code) {
      case 'MENU_STRUCTURING_FAILED':
        return "We couldn't identify any dishes in this menu. Please try scanning again with a clearer image.";
      
      case 'DISH_NOT_FOUND':
        return "We had trouble matching identified dishes to menu items. Please try scanning again.";
      
      case 'DISH_PROCESSING_FAILED':
        return "We couldn't process one of the dishes on this menu. Please try scanning again.";
      
      case 'INVALID_DISH':
        return "One of the dishes couldn't be properly analyzed. Please try scanning again.";
      
      case 'MISSING_OCR_TEXT':
        return "No menu text was detected. Please try scanning again with a clearer image.";
      
      default:
        return "Something went wrong analyzing this menu. Please try again.";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-red-50 border border-red-200 text-center">
      <div className="w-16 h-16 mb-4 text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z"/>
        </svg>
      </div>
      
      <h3 className="text-xl font-semibold text-red-700 mb-2">Menu Analysis Failed</h3>
      
      <p className="text-gray-700 mb-4">
        {getUserFriendlyMessage()}
      </p>
      
      <div className="flex gap-4 mt-2">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Try Again
          </button>
        )}
        
        <Link href="/support" passHref>
          <a className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition">
            Get Help
          </a>
        </Link>
      </div>
      
      {/* Only show technical details in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-gray-100 rounded text-left w-full">
          <h4 className="font-mono text-sm font-semibold mb-2">Technical Details:</h4>
          <p className="font-mono text-xs break-all mb-2">Code: {errorData.code}</p>
          <p className="font-mono text-xs break-all mb-2">Error: {errorData.error}</p>
          {errorData.details && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-semibold text-gray-600">Stack Trace</summary>
              <pre className="mt-2 p-2 bg-gray-800 text-gray-200 rounded text-xs overflow-x-auto">
                {errorData.details}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisError; 