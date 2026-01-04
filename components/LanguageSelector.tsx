"use client";

import { useState, useEffect, useCallback } from "react";
import { Languages, Check, Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ============================================
// Types
// ============================================

interface Language {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
}

// ============================================
// Google Translate-style Language Selector
// ============================================

// ============================================
// Google Translate-style Language Selector
// ============================================

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'modal';
}

export default function LanguageSelector({ variant = 'dropdown' }: LanguageSelectorProps) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const res = await fetch("/api/language");
        if (res.ok) {
          const data = await res.json();
          setLanguages(data.languages || []);
          
          // Load saved preference
          const saved = localStorage.getItem("docketdive_language");
          if (saved) {
            setSelectedLanguage(saved);
          }
        }
      } catch (err) {
        console.error("Failed to load languages:", err);
        // Fallback languages
        setLanguages([
          { code: "en", name: "English", nativeName: "English", isDefault: true },
          { code: "af", name: "Afrikaans", nativeName: "Afrikaans", isDefault: false },
          { code: "zu", name: "Zulu", nativeName: "isiZulu", isDefault: false },
          { code: "xh", name: "Xhosa", nativeName: "isiXhosa", isDefault: false },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.language-selector')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLanguageChange = useCallback(async (code: string) => {
    if (code === selectedLanguage) {
      setIsOpen(false);
      return;
    }

    setIsTranslating(true);
    setSelectedLanguage(code);
    localStorage.setItem("docketdive_language", code);
    
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent("languageChange", { detail: { code } }));
    
    // Simulate translation delay for UX feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsTranslating(false);
    setIsOpen(false);
  }, [selectedLanguage]);

  const currentLanguage = languages.find(l => l.code === selectedLanguage);

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <Globe size={16} className="animate-pulse" />
      </Button>
    );
  }

  // Common Language List Content
  const LanguageList = () => (
    <div className="overflow-y-auto max-h-[300px] py-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`
            w-full flex items-center justify-between px-4 py-3
            text-left transition-colors duration-150 rounded-lg
            ${selectedLanguage === lang.code 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }
          `}
        >
          <div className="flex flex-col">
            <span className="font-medium text-sm">{lang.nativeName}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {lang.name}
            </span>
          </div>
          {selectedLanguage === lang.code && (
            <Check size={16} className="text-blue-500 flex-shrink-0" />
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="language-selector relative">
      {/* Trigger Button - Google Translate Style */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`
          gap-2 px-3 py-2 h-9
          text-slate-600 dark:text-slate-300 
          hover:text-slate-900 dark:hover:text-white
          hover:bg-slate-100 dark:hover:bg-slate-800
          border border-transparent hover:border-slate-200 dark:hover:border-slate-700
          rounded-lg transition-all duration-200
          ${isOpen && variant === 'dropdown' ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' : ''}
        `}
        data-tour="language-selector"
      >
        <Globe size={16} className={isTranslating ? 'animate-spin' : ''} />
        <span className="hidden sm:inline font-medium text-sm">
          {currentLanguage?.nativeName || "English"}
        </span>
        <ChevronDown 
          size={14} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </Button>

      {/* Modal Variant */}
      <Dialog open={isOpen && variant === 'modal'} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-primary" />
              Select Language
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-4">
              Results will be translated to your selected language.
            </p>
            <LanguageList />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dropdown Variant */}
      <AnimatePresence>
        {isOpen && variant === 'dropdown' && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="
              absolute right-0 top-full mt-2 z-[100]
              w-72 max-h-[400px] overflow-hidden
              bg-background backdrop-blur-sm
              border border-border
              rounded-xl shadow-xl
              ring-1 ring-black/5 dark:ring-white/5
            "
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Languages size={16} className="text-blue-500" />
                <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                  Response Language
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                AI responses will be in your selected language
              </p>
            </div>

            {/* Language List - Reusing same list logic but inline for dropdown structure if needed, or just Component */}
            <LanguageList />

            {/* Footer Note */}
            <div className="px-4 py-2.5 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground leading-relaxed">
                💡 Legal terms will include English equivalents for accuracy
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Export hook for other components to use
export function useLanguagePreference() {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    // Load initial preference
    const saved = localStorage.getItem("docketdive_language");
    if (saved) setLanguage(saved);

    // Listen for changes
    const handleChange = (e: CustomEvent) => {
      setLanguage(e.detail.code);
    };

    window.addEventListener("languageChange", handleChange as EventListener);
    return () => window.removeEventListener("languageChange", handleChange as EventListener);
  }, []);

  return language;
}
