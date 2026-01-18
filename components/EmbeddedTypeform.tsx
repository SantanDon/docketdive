"use client";

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface EmbeddedTypeformProps {
  formId: string;
  onClose?: () => void;
}

/**
 * Embedded Typeform Component
 * Displays Typeform feedback form in a modal within the application
 */
export const EmbeddedTypeform: React.FC<EmbeddedTypeformProps> = ({ 
  formId, 
  onClose 
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load Typeform embed script
    const script = document.createElement('script');
    script.src = 'https://embed.typeform.com/embed.js';
    script.async = true;
    
    script.onload = () => {
      setIsLoading(false);
      // Reload typeform if it exists
      if ((window as any).typeformEmbed) {
        (window as any).typeformEmbed.load();
      }
    };

    script.onerror = () => {
      setIsLoading(false);
      console.error('Failed to load Typeform embed script');
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Share Your Feedback
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            aria-label="Close feedback form"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Container */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading feedback form...</p>
              </div>
            </div>
          )}
          
          <div
            data-tf-live={`form/${formId}`}
            style={{ 
              width: '100%',
              minHeight: '500px',
              display: isLoading ? 'none' : 'block'
            }}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Your feedback helps us improve DocketDive • Your privacy is protected
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmbeddedTypeform;
