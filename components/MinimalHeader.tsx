"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import Image from "next/image";
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
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`
          fixed top-0 left-0 right-0 z-50
          h-14 md:h-14
          glass
          transition-shadow duration-base
          ${isScrolled ? "shadow-md" : ""}
        `}
      >
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-2.5"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative h-9 w-9 rounded-xl overflow-hidden ring-1 ring-border/30 bg-white flex items-center justify-center">
              <Image 
                src="/assets/WhatsApp Image 2025-08-05 at 13.57.52_050c3907.jpg" 
                alt="DocketDive" 
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-gradient">
                DocketDive
              </h1>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 -mt-0.5">
                <Scale className="h-2.5 w-2.5" />
                Legal AI
              </p>
            </div>
          </motion.div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-1">
            <ToolsMenu />
            <LanguageSelector />
            
            <div className="w-px h-5 bg-border mx-1" />
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-lg focus-ring"
              aria-label="Toggle theme"
              data-tour="theme-toggle"
            >
              {mounted && (
                <motion.div
                  key={theme}
                  initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </motion.div>
              )}
            </Button>



            {/* Profile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenProfile}
              className="h-9 w-9 rounded-lg focus-ring"
              aria-label={loggedIn ? "Open profile" : "Sign in"}
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-1">
            {/* Theme Toggle - Always visible on mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-10 w-10 min-h-touch min-w-touch rounded-lg focus-ring"
              aria-label="Toggle theme"
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
              className="h-10 w-10 min-h-touch min-w-touch rounded-lg focus-ring"
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-14 md:h-14" />

      {/* Mobile Bottom Sheet Menu */}
      <BottomSheet isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(false)}
              className="h-10 w-10 min-h-touch min-w-touch rounded-lg"
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
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    item.onClick?.();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors min-h-touch focus-ring"
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
    </>
  );
}
