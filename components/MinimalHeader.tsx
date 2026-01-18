"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Sun,
  Moon,
  Menu,
  X,
  Scale,
  Settings,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomSheet from "@/components/BottomSheet";
import ToolsMenu from "@/components/ToolsMenu";
import LanguageSelector from "@/components/LanguageSelector";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import WaitlistModal from "./WaitlistModal";
import { Sparkles as SparklesIcon } from "lucide-react";

/**
 * Premium Header Component
 * 
 * Critical comparison to ChatGPT/Claude:
 * 
 * ChatGPT:
 * - Fixed header with logo on left
 * - Model selector in center
 * - User menu on right
 * - Clean, minimal design
 * - Subtle shadow on scroll
 * 
 * Claude:
 * - Similar layout to ChatGPT
 * - Glass morphism effect
 * - Smooth theme toggle animation
 * - Mobile hamburger menu
 * 
 * DocketDive Premium:
 * - Glass morphism with backdrop blur
 * - Scroll-triggered shadow enhancement
 * - Animated theme toggle with rotation
 * - Mobile bottom sheet menu
 * - Gradient avatar for profile
 */

interface MinimalHeaderProps {
  onOpenProfile?: () => void;
  loggedIn?: boolean;
}

export default function MinimalHeader({
  onOpenProfile,
  loggedIn = false
}: MinimalHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const menuItems = [
    ...(loggedIn ? [{ icon: User, label: "Profile", onClick: onOpenProfile }] : []),
    { icon: Settings, label: "Settings", onClick: () => {} },
  ];

  return (
    <>
      <motion.header
        initial={prefersReducedMotion ? { opacity: 0 } : { y: -20, opacity: 0 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.25, 0.1, 0.25, 1] as const }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "h-12",
          // Glass morphism
          "bg-background/40 backdrop-blur-md",
          "border-b border-border/40",
          // Scroll shadow transition
          "transition-all duration-300",
          isScrolled && "bg-background/80 shadow-sm"
        )}
      >
        <div className="h-full max-w-full mx-auto px-6 flex items-center justify-between">
          {/* Brand Info */}
          <div className="flex items-center gap-3">
             <Link href="/" className="hidden sm:flex items-center gap-2 hover:opacity-70 transition-opacity">
                <span className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
                  DocketDive
                </span>
                <span className="h-2.5 w-px bg-border/40 mx-1" />
                <span className="text-[10px] font-medium text-muted-foreground/60 tracking-wider">
                  South Africa
                </span>
             </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-1">
            <ToolsMenu />
            <LanguageSelector />
            
            <div className="w-px h-5 bg-border/50 mx-1" />
            
            {/* Theme Toggle with premium animation */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={cn(
                "h-9 w-9 rounded-lg",
                "hover:bg-muted/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label={mounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : "Switch theme"}
              data-tour="theme-toggle"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mounted && (
                  <motion.div
                    key={theme}
                    initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0, rotate: -90 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1, rotate: 0 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0, rotate: 90 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                  >
                    {theme === "dark" ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

            <Button
              onClick={() => setIsWaitlistOpen(true)}
              className="ml-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              size="sm"
            >
              <SparklesIcon className="w-3.5 h-3.5 mr-2" />
              Join Waitlist
            </Button>


            {/* Profile with gradient avatar removed as per user request */}
            {/* 
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenProfile}
              className={cn(
                "h-9 w-9 rounded-lg",
                "hover:bg-muted/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label={loggedIn ? "Open profile" : "Sign in"}
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm ring-1 ring-white/20">
                <User className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            </Button>
            */}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-1">
            {/* Theme Toggle - Always visible on mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={mounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : "Switch theme"}
            >
              {mounted && (theme === "dark" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              ))}
            </Button>
            
            {/* Hamburger Menu */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(true)}
              className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-14" />

      {/* Mobile Bottom Sheet Menu */}
      <BottomSheet isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(false)}
              className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-lg"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Menu Items */}
          <div className="space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.label}
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                  transition={{ delay: prefersReducedMotion ? 0 : index * 0.05 }}
                  onClick={() => {
                    item.onClick?.();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
          
          {/* Tools Section */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2 px-3">Tools</p>
            <div className="flex items-center gap-2 px-3">
              <ToolsMenu />
              <LanguageSelector variant="modal" />
            </div>
          </div>
        </div>
      </BottomSheet>

      <WaitlistModal 
        isOpen={isWaitlistOpen} 
        onClose={() => setIsWaitlistOpen(false)} 
      />
    </>
  );
}
