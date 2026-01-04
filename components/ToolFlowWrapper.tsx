"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToolStep = "upload" | "configure" | "processing" | "results";

interface ToolFlowWrapperProps {
  currentStep: ToolStep;
  steps: Array<{
    id: ToolStep;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  children: React.ReactNode;
  onStepChange?: (step: ToolStep) => void;
}

export default function ToolFlowWrapper({
  currentStep,
  steps,
  children,
  onStepChange,
}: ToolFlowWrapperProps) {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4 px-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;
          const isUpcoming = index > currentStepIndex;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <motion.button
                onClick={() => onStepChange?.(step.id)}
                disabled={isUpcoming}
                className={cn(
                  "relative flex flex-col items-center gap-2 transition-all duration-300",
                  isUpcoming && "opacity-40 cursor-not-allowed",
                  !isUpcoming && "cursor-pointer hover:scale-105"
                )}
                whileHover={!isUpcoming ? { scale: 1.05 } : {}}
                whileTap={!isUpcoming ? { scale: 0.95 } : {}}
              >
                <div
                  className={cn(
                    "relative h-14 w-14 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isActive &&
                      "bg-gradient-to-br from-primary to-accent border-primary shadow-lg shadow-primary/20 scale-110",
                    isCompleted &&
                      "bg-green-500 border-green-500 shadow-md",
                    isUpcoming &&
                      "bg-muted border-border"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  ) : isActive ? (
                    <Icon className="h-6 w-6 text-white" />
                  ) : (
                    <Icon className="h-6 w-6 text-muted-foreground" />
                  )}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/20"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors duration-300 whitespace-nowrap",
                    isActive && "text-primary font-semibold",
                    isCompleted && "text-green-600 dark:text-green-400",
                    isUpcoming && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </motion.button>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="w-16 md:w-24 h-0.5 mx-2 relative">
                  <div className="absolute inset-0 bg-border" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary to-accent"
                    initial={{ scaleX: 0 }}
                    animate={{
                      scaleX: isCompleted || isActive ? 1 : 0,
                    }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ transformOrigin: "left" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Content Area with Smooth Transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


