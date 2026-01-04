"use client";

import { GraduationCap, Scale, Sparkles, BookOpen, Library, Star, Zap } from "lucide-react";
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
import { motion } from "framer-motion";

/**
 * Premium Student Mode Toggle Component
 * - Elegant design with smooth animations
 * - Professional legal aesthetic
 * - Enhanced visual feedback
 */
export default function StudentModeToggle() {
  const { mode, setMode, eliLevel, setEliLevel } = useChat();

  const modeOptions = [
    {
      value: "normal",
      label: "Select Mode",
      icon: Scale,
      description: "Full legal terminology",
      color: "from-blue-500 to-indigo-500",
    },
    {
      value: "student",
      subOptions: [
        {
          value: "ELI5",
          label: "ELI5 - Simple",
          icon: Star,
          description: "Age 5-10 level explanations",
          color: "from-emerald-500 to-teal-600",
        },
        {
          value: "ELI15",
          label: "ELI15 - Intermediate",
          icon: BookOpen,
          description: "Age 11-17 level explanations",
          color: "from-amber-500 to-orange-600",
        },
        {
          value: "ELI25",
          label: "ELI25 - Advanced",
          icon: Library,
          description: "Age 18+ level explanations",
          color: "from-indigo-500 to-purple-600",
        },
      ],
    },
  ];

  const getCurrentIcon = () => {
    if (mode === "normal") return Scale;
    if (eliLevel === "ELI5") return Star;
    if (eliLevel === "ELI15") return BookOpen;
    return Library;
  };

  const getCurrentColor = () => {
    if (mode === "normal") return "from-blue-500 to-indigo-500";
    if (eliLevel === "ELI5") return "from-emerald-500 to-teal-600";
    if (eliLevel === "ELI15") return "from-amber-500 to-orange-600";
    return "from-indigo-500 to-purple-600";
  };

  const CurrentIcon = getCurrentIcon();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant={mode === "student" ? "default" : "outline"}
            size="sm"
            className={`rounded-full shadow-lg transition-all duration-300 border-2 overflow-hidden ${
              mode === "student"
                ? `bg-gradient-to-r ${getCurrentColor()} text-white border-transparent shadow-lg hover:shadow-xl`
                : "bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 backdrop-blur-md hover:border-blue-400 dark:hover:border-indigo-400 hover:shadow-xl"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${mode === "student" ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
              <CurrentIcon size={14} className={mode === "student" ? 'text-white' : 'text-slate-600 dark:text-slate-400'} />
            </div>
            <span className="ml-2 font-medium">
              {mode === "student" ? eliLevel : "Select Mode"}
            </span>
            {mode === "student" && (
              <motion.div
                className="ml-2 flex items-center"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap size={12} className="text-amber-300" />
              </motion.div>
            )}
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl">
        {/* Professional Mode */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0 }}
        >
          <DropdownMenuItem
            onClick={() => {
              setMode("normal");
            }}
            className={`p-3 rounded-lg mb-1 ${
              mode === "normal" 
                ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800" 
                : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <div className="flex items-center gap-3 w-full">
              <div className={`p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md`}>
                <Scale size={16} />
              </div>
              <div className="flex-1">
                <div className={`font-medium ${mode === "normal" ? "text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-slate-100"}`}>
                  Select Mode
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Full legal terminology
                </div>
              </div>
              {mode === "normal" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 rounded-full bg-blue-500"
                />
              )}
            </div>
          </DropdownMenuItem>
        </motion.div>

        <DropdownMenuSeparator className="my-2" />

        {/* Student Mode Options */}
        <DropdownMenuLabel className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3">
          Student Mode
        </DropdownMenuLabel>
        
        {[
          { value: "ELI5", label: "ELI5 - Simple", icon: Star, description: "Age 5-10 level", color: "from-emerald-500 to-teal-600" },
          { value: "ELI15", label: "ELI15 - Intermediate", icon: BookOpen, description: "Age 11-17 level", color: "from-amber-500 to-orange-600" },
          { value: "ELI25", label: "ELI25 - Advanced", icon: Library, description: "Age 18+ level", color: "from-indigo-500 to-purple-600" },
        ].map((option, index) => {
          const Icon = option.icon;
          const isActive = mode === "student" && eliLevel === option.value;
          
          return (
            <motion.div
              key={option.value}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (index + 1) * 0.1 }}
            >
              <DropdownMenuItem
                onClick={() => {
                  setMode("student");
                  setEliLevel(option.value as "ELI5" | "ELI15" | "ELI25");
                }}
                className={`p-3 rounded-lg mb-1 ${
                  isActive 
                    ? `bg-gradient-to-r ${option.color}/10 border border-${option.color.split('-')[1]}-200 dark:border-${option.color.split('-')[1]}-800` 
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${option.color} text-white shadow-md`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-900 dark:text-slate-100"}`}>
                      {option.label}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {option.description}
                    </div>
                  </div>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`w-2 h-2 rounded-full bg-gradient-to-r ${option.color}`}
                    />
                  )}
                </div>
              </DropdownMenuItem>
            </motion.div>
          );
        })}

        {/* Info Box */}
        <motion.div 
          className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-start gap-2">
            <Sparkles size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Student Mode simplifies legal concepts to match your understanding level while maintaining accuracy.
            </p>
          </div>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
