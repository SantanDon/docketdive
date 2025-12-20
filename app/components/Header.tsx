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
  XMarkIcon
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

/**
 * Modern Professional Header - Inspired by Claude.com
 * - Clean, minimal design with professional logo
 * - Smooth theme transitions
 * - Elegant search integration
 * - Responsive layout
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
      icon: <HomeIcon className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "#",
      onClick: () => window.location.reload(),
    },
    {
      title: "Upload",
      icon: <ArrowUpTrayIcon className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "#",
      onClick: () => {
        console.log("Upload clicked");
        if (onUpload) onUpload();
      },
    },
    {
      title: "Theme",
      icon: !mounted ? (
        <SunIcon className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ) : theme === "dark" ? (
        <MoonIcon className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ) : (
        <SunIcon className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
      onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
    },
    {
      title: loggedIn ? "Profile" : "Sign In",
      icon: <UserIcon className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "#",
      onClick: () => onOpenProfile(),
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-lg overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 shadow-sm">
              <Image 
                src="/assets/WhatsApp Image 2025-08-05 at 13.57.52_050c3907.jpg" 
                alt="DocketDive Logo" 
                fill 
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                DocketDive
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Legal Intelligence
              </p>
            </div>
          </div>

          {/* Search Bar (Conditional) */}
          {showSearch && (
             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50">
                <SearchBar
                  onSearch={handleSearch}
                  placeholder="Search legal documents..."
                />
                <button 
                  onClick={() => setShowSearch(false)}
                  className="absolute -right-8 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
             </div>
          )}

          {/* Floating Dock - Centered */}
          <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
             <FloatingDock items={dockItems.map(item => ({...item, href: item.href || '#'}))} />
          </div>

          {/* Mobile Menu Fallback (simplified for now) */}
          <div className="md:hidden">
             {/* Mobile menu implementation if needed */}
          </div>
        </div>
      </div>
    </header>
  );
}
