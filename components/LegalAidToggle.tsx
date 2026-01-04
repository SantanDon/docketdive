"use client";

import { useState, useEffect } from "react";
import { Heart, Info, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion } from "framer-motion";

// ============================================
// Main Component
// ============================================

export default function LegalAidToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem("docketdive_legal_aid");
    if (saved === "true") {
      setIsEnabled(true);
    }
  }, []);

  const toggleMode = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    localStorage.setItem("docketdive_legal_aid", String(newValue));
    
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent("legalAidModeChange", { detail: { enabled: newValue } }));
  };

  return (
    <div className="flex items-center gap-1">
      <Popover open={showInfo} onOpenChange={setShowInfo}>
        <PopoverTrigger asChild>
          <Button
            variant={isEnabled ? "default" : "ghost"}
            size="sm"
            onClick={toggleMode}
            className={`gap-2 transition-all ${
              isEnabled 
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600" 
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Heart size={16} className={isEnabled ? "fill-white" : ""} />
            <span className="hidden sm:inline">Legal Aid</span>
            {isEnabled && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs bg-white/20 px-1.5 py-0.5 rounded"
              >
                ON
              </motion.span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500">
                <Heart size={16} className="text-white fill-white" />
              </div>
              <div>
                <h4 className="font-semibold">Legal Aid Mode</h4>
                <p className="text-xs text-gray-500">
                  {isEnabled ? "Currently active" : "Click to enable"}
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              When enabled, responses use simple, plain language and include free legal resources available in South Africa.
            </p>
            
            <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg space-y-2">
              <p className="text-xs font-medium text-pink-700 dark:text-pink-300">
                Free Legal Help:
              </p>
              <div className="flex items-center gap-2 text-sm text-pink-600 dark:text-pink-400">
                <Phone size={14} />
                <span>Legal Aid SA: 0800 110 110</span>
              </div>
              <a 
                href="https://legal-aid.co.za" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-pink-600 dark:text-pink-400 hover:underline"
              >
                <ExternalLink size={14} />
                <span>legal-aid.co.za</span>
              </a>
            </div>
            
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              <span>
                You may qualify for free legal help if you earn less than R8,000/month.
              </span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
