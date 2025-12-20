"use client";

import { GraduationCap, Scale, Sparkles, BookOpen, Library } from "lucide-react";
import { useChat } from "../context/ChatContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/**
 * Student Mode Toggle Component
 * - Floating button for easy access
 * - Allows selecting ELI level
 */
export default function StudentModeToggle() {
  const { mode, setMode, eliLevel, setEliLevel } = useChat();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={mode === "student" ? "default" : "outline"}
          size="sm"
          className={`rounded-full shadow-lg transition-all duration-300 border-2 ${
            mode === "student"
              ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-blue-400 dark:border-cyan-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] dark:shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] dark:hover:shadow-[0_0_25px_rgba(34,211,238,0.6)]"
              : "bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 backdrop-blur-md hover:border-blue-400 dark:hover:border-cyan-400 hover:shadow-xl"
          }`}
        >
          <GraduationCap size={16} className="mr-2" />
          {mode === "student" ? `Student (${eliLevel})` : "Student Mode"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Student Mode</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setMode("normal");
          }}
        >
          <div className={`flex items-center gap-2 ${mode === "normal" ? "font-bold text-blue-600" : ""}`}>
            <Scale size={16} />
            <span>Professional Mode</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setMode("student");
            setEliLevel("ELI5");
          }}
        >
          <div className={`flex items-center gap-2 ${mode === "student" && eliLevel === "ELI5" ? "font-bold text-blue-600" : ""}`}>
            <Sparkles size={16} />
            <span>ELI5 - Simple (Age 5-10)</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setMode("student");
            setEliLevel("ELI15");
          }}
        >
          <div className={`flex items-center gap-2 ${mode === "student" && eliLevel === "ELI15" ? "font-bold text-blue-600" : ""}`}>
            <BookOpen size={16} />
            <span>ELI15 - Intermediate (Age 11-17)</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setMode("student");
            setEliLevel("ELI25");
          }}
        >
          <div className={`flex items-center gap-2 ${mode === "student" && eliLevel === "ELI25" ? "font-bold text-blue-600" : ""}`}>
            <Library size={16} />
            <span>ELI25 - Advanced (Age 18+)</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
