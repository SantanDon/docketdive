'use client';

import { useState, useEffect } from 'react';
import { Shield, ShieldOff, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PrivacySettingsProps {
  onPrivacyChange?: (enabled: boolean) => void;
}

export default function PrivacySettings({ onPrivacyChange }: PrivacySettingsProps) {
  const [privacyEnabled, setPrivacyEnabled] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('docketdive_privacy_mode');
    if (saved) {
      setPrivacyEnabled(saved === 'true');
      onPrivacyChange?.(saved === 'true');
    }
  }, [onPrivacyChange]);

  const handleToggle = (enabled: boolean) => {
    setPrivacyEnabled(enabled);
    localStorage.setItem('docketdive_privacy_mode', String(enabled));
    onPrivacyChange?.(enabled);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Privacy Toggle */}
      <div className="flex items-center gap-2">
        <span className={`text-sm ${privacyEnabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
          {privacyEnabled ? (
            <span className="flex items-center gap-1">
              <Shield size={16} />
              Private
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <ShieldOff size={16} />
              Shared
            </span>
          )}
        </span>
        
        <button
          onClick={() => setShowDisclaimer(true)}
          className="p-1 rounded-full hover:bg-muted/50 transition-colors"
          title="What is privacy mode?"
        >
          <Info size={14} className="text-muted-foreground" />
        </button>
      </div>

      {/* Toggle Switch */}
      <button
        onClick={() => handleToggle(!privacyEnabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          privacyEnabled ? 'bg-green-500' : 'bg-muted'
        }`}
        role="switch"
        aria-checked={privacyEnabled}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ${
            privacyEnabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>

      {/* Disclaimer Modal */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowDisclaimer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md rounded-3xl bg-background/80 backdrop-blur-2xl p-8 shadow-2xl border border-white/20 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <Shield size={22} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">
                    Privacy Mode
                  </h3>
                </div>
                <button
                  onClick={() => setShowDisclaimer(false)}
                  className="p-2 rounded-full hover:bg-muted/80 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 text-sm relative z-10">
                <div className="p-5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                  <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Private Mode (Recommended)
                  </h4>
                  <ul className="space-y-2 text-emerald-700/80 dark:text-emerald-300/80">
                    <li className="flex gap-2"><span>•</span> <span>Only <strong>YOU</strong> can see your uploaded documents</span></li>
                    <li className="flex gap-2"><span>•</span> <span>Documents are <strong>isolated</strong> from other users</span></li>
                    <li className="flex gap-2"><span>•</span> <span>Ideal for confidential legal work</span></li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 shadow-sm shadow-amber-500/5">
                  <h4 className="font-bold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Shared Mode (Default)
                  </h4>
                  <ul className="space-y-2 text-amber-700/80 dark:text-amber-300/80">
                    <li className="flex gap-2"><span>•</span> <span>Documents are visible to the community</span></li>
                    <li className="flex gap-2"><span>•</span> <span>Helps build our open legal knowledge base</span></li>
                    <li className="flex gap-2"><span>•</span> <span>Faster retrieval for public documents</span></li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                  <p className="text-muted-foreground text-[11px] leading-normal italic">
                    <Info size={12} className="inline mr-1 mb-0.5" />
                    System resources like SAFLII case law are always public and verified.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end relative z-10">
                <button
                  onClick={() => {
                    handleToggle(true);
                    setShowDisclaimer(false);
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  Enable Private Mode
                </button>
              </div>

              {/* Decorative background element */}
              <div className="absolute -bottom-10 -right-10 opacity-[0.03] rotate-12">
                <Shield size={200} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook to use privacy mode anywhere in the app
export function usePrivacyMode() {
  const [privacyEnabled, setPrivacyEnabled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('docketdive_privacy_mode');
    setPrivacyEnabled(saved === 'true');
  }, []);

  const toggle = (enabled: boolean) => {
    setPrivacyEnabled(enabled);
    localStorage.setItem('docketdive_privacy_mode', String(enabled));
  };

  return { privacyEnabled, setPrivacyMode: toggle };
}
