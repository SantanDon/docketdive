"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = "Search legal documents..." }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search bar when pressing Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
    if (e.key === "Escape") {
      setSearchQuery("");
      inputRef.current?.blur();
    }
  };

  return (
    <div className={cn(
      "relative flex items-center w-full transition-all duration-200 ease-in-out group",
      "bg-gray-100/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl",
      isFocused 
        ? "ring-2 ring-blue-500/20 border-blue-500 bg-white dark:bg-gray-950 shadow-sm" 
        : "hover:bg-gray-100 dark:hover:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
    )}>
      <div className="flex items-center pl-3 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
        <Search size={16} />
      </div>
      <input
        ref={inputRef}
        type="text"
        className="w-full bg-transparent border-none focus:ring-0 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <div className="flex items-center pr-2 gap-1">
        {searchQuery ? (
          <button
            onClick={() => { setSearchQuery(""); onSearch(""); inputRef.current?.focus(); }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-200/50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700 opacity-60">
            <span className="text-xs">⌘</span>K
          </kbd>
        )}
      </div>
    </div>
  );
}