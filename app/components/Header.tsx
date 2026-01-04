"use client";

import { useTheme } from "next-themes";
import { type MouseEventHandler, useState, useEffect } from "react";
import { FloatingDock } from "@/components/ui/floating-dock";
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  ArrowUpTrayIcon, 
  SunIcon, 
  MoonIcon, 
  UserIcon,
  XMarkIcon,
  ScaleIcon
} from "@heroicons/react/24/outline";
import SearchBar from "./SearchBar";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

// Import new tool components
import ToolsMenu from "@/components/ToolsMenu";
import LanguageSelector from "@/components/LanguageSelector";
import LegalAidToggle from "@/components/LegalAidToggle";

/**
 * Premium Professional Header
 * - Clean, sophisticated design inspired by top-tier AI assistants
 * - Smooth animations and elegant visual hierarchy
 * - Professional legal aesthetic with modern touches
 */

export default function Header({
  onOpenProfile,
  onUpload,
  loggedIn,
  onSearch,
}: {
  onOpenProfile: () => void;
  onUpload?: () => void;
  loggedIn: boolean;
  onSearch?: (query: string) => void;
}) {
  const { theme, setTheme } = useTheme();
  const [showSearch, setShowSearch] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (query: string) => {
    if (query && onSearch) {
      onSearch(query);
      setShowSearch(false);
    }
  };

  const dockItems: { title: string; icon: React.ReactNode; href: string; onClick?: () => void }[] = [
    {
      title: "Home",
      icon: <HomeIcon className="h-full w-full text-slate-500 dark:text-slate-300" />,
      href: "#",
      onClick: () => window.location.reload(),
    },
    {
      title: "Upload",
      icon: <ArrowUpTrayIcon className="h-full w-full text-slate-500 dark:text-slate-300" />,
      href: "#",
      onClick: () => {
        console.log("Upload clicked");
        if (onUpload) onUpload();
      },
    },
    {
      title: "Theme",
      icon: !mounted ? (
        <SunIcon className="h-full w-full text-slate-500 dark:text-slate-300" />
      ) : theme === "dark" ? (
        <MoonIcon className="h-full w-full text-slate-500 dark:text-slate-300" />
      ) : (
        <SunIcon className="h-full w-full text-slate-500 dark:text-slate-300" />
      ),
      href: "#",
      onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
    },
    {
      title: loggedIn ? "Profile" : "Sign In",
      icon: <UserIcon className="h-full w-full text-slate-500 dark:text-slate-300" />,
      href: "#",
      onClick: () => onOpenProfile(),
    },
  ];

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="z-50 w-full bg-white/60 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/80"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="relative h-10 w-10 rounded-xl overflow-hidden ring-2 ring-blue-500/20 dark:ring-blue-400/20 shadow-lg">
              <Image 
                src="/assets/WhatsApp Image 2025-08-05 at 13.57.52_050c3907.jpg" 
                alt="DocketDive Logo" 
                fill 
                className="object-cover"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                DocketDive
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                <ScaleIcon className="h-3 w-3 text-blue-500" />
                Legal Intelligence
              </p>
            </div>
          </motion.div>

          {/* Search Bar (Conditional) */}
          {showSearch && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
            >
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search legal documents, cases, or topics..."
              />
              <button 
                onClick={() => setShowSearch(false)}
                className="absolute -right-10 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-slate-500" />
              </button>
            </motion.div>
          )}

          {/* Floating Dock - Centered */}
          <motion.div 
            className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FloatingDock items={dockItems.map(item => ({...item, href: item.href || '#'}))} />
          </motion.div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Legal Tools Menu */}
            <ToolsMenu />
            
            {/* Language Selector */}
            <LanguageSelector />
            
            {/* Legal Aid Mode Toggle */}
            <LegalAidToggle />
            
            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            
            {/* Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </Button>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
                    <UserIcon className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onOpenProfile}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  {loggedIn ? "Profile" : "Sign In"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {mounted && theme === "dark" ? (
                    <>
                      <SunIcon className="mr-2 h-4 w-4" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <MoonIcon className="mr-2 h-4 w-4" />
                      Dark Mode
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
