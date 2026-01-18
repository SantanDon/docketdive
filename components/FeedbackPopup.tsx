"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues
const EmbeddedTypeform = dynamic(() => import('./EmbeddedTypeform'), { 
  ssr: false,
  loading: () => null
});

interface FeedbackPopupProps {
  onSkip?: () => void;
  onComplete?: () => void;
  embedded?: boolean; // New prop to control behavior
}

const FeedbackPopup: React.FC<FeedbackPopupProps> = ({ 
  onSkip, 
  onComplete,
  embedded = true // Default to embedded for better UX
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showEmbedded, setShowEmbedded] = useState(false);

  useEffect(() => {
    // Check if user has already completed feedback
    const hasCompleted = localStorage.getItem('docketdive-feedback-completed');
    const lastShown = localStorage.getItem('docketdive-feedback-last-shown');
    const now = Date.now();

    if (hasCompleted === 'true') {
      return; // Don't show if already completed
    }

    // Show after 5 minutes of interaction, or if not shown in last 24 hours
    const shouldShow = !lastShown || (now - parseInt(lastShown)) > 24 * 60 * 60 * 1000;

    if (shouldShow) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        localStorage.setItem('docketdive-feedback-last-shown', now.toString());
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearTimeout(timer);
    }
  }, []);

  const handleFeedback = () => {
    if (embedded) {
      // Show embedded form
      setShowEmbedded(true);
    } else {
      // Open in new tab (fallback)
      window.open('https://form.typeform.com/to/ZwVyutgQ', '_blank');
      handleComplete();
    }
  };

  const handleComplete = () => {
    onComplete?.();
    setIsVisible(false);
    setShowEmbedded(false);
    localStorage.setItem('docketdive-feedback-completed', 'true');
  };

  const handleSkip = () => {
    onSkip?.();
    setIsVisible(false);
    // Will show again after 24 hours
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && !showEmbedded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative"
            >
              <button
                onClick={handleSkip}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center">
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
                    <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Help Us Improve DocketDive! 🌟
                  </h3>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Your feedback helps us make DocketDive even better for South African legal research.
                  It only takes 2 minutes!
                </p>

                <div className="flex gap-3">
                  <Button
                    onClick={handleFeedback}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Share Feedback
                  </Button>
                  <Button
                    onClick={handleSkip}
                    variant="outline"
                    className="flex-1"
                  >
                    Maybe Later
                  </Button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  {embedded ? 'Opens below' : 'Opens in a new tab'} • Your privacy is protected
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showEmbedded && (
          <EmbeddedTypeform 
            formId="ZwVyutgQ"
            onClose={handleComplete}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackPopup;

