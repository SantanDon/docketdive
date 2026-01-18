"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Scale, Gavel, Shield, Home } from "lucide-react";
import PromptCard from "@/components/PromptCard";
import { useTranslation } from "@/app/hooks/useTranslation";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Premium Welcome Screen Component
 * 
 * Critical comparison to ChatGPT/Claude:
 * 
 * ChatGPT:
 * - Large centered logo
 * - "How can I help you today?" greeting
 * - 4 suggestion cards in 2x2 grid
 * - Clean, minimal design
 * 
 * Claude:
 * - Friendly greeting with time awareness
 * - Suggestion prompts as pills/cards
 * - Subtle animations on load
 * - Warm, approachable tone
 * 
 * DocketDive Premium:
 * - Time-appropriate greeting (Good morning/afternoon/evening)
 * - Animated logo with subtle pulse
 * - 2x2 grid on desktop, single column on mobile
 * - Staggered card entrance animations
 * - Glass morphism effects
 * - Legal-focused prompt suggestions
 */

// Simplified to exactly 4 prompts per design spec
const prompts = [
  {
    icon: Scale,
    title: "Constitutional Law",
    prompt: "What makes a will legally binding in South Africa?",
  },
  {
    icon: Gavel,
    title: "Legal Principles",
    prompt: "How does ubuntu shape our constitutional democracy?",
  },
  {
    icon: Shield,
    title: "Consumer Rights",
    prompt: "What are my rights under the Consumer Protection Act?",
  },
  {
    icon: Home,
    title: "Property Law",
    prompt: "Tenant vs Landlord rights under the Rental Housing Act",
  },
];

interface MinimalWelcomeProps {
  setInputMessage: (message: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export default function MinimalWelcome({ 
  setInputMessage, 
  textareaRef 
}: MinimalWelcomeProps) {
  const { t, language } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  
  // Time-appropriate greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const handlePromptClick = (prompt: string) => {
    setInputMessage(t(prompt));
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
        delayChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  return (
    <div key={language} className="flex-1 flex flex-col items-center justify-center px-4 py-8 min-h-[calc(100vh-8rem)]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-2xl mx-auto space-y-8"
      >
        {/* Logo with premium pulse animation */}
        <motion.div 
          variants={itemVariants}
          className="flex justify-center"
        >
          <div className="relative">
            {/* Main logo container */}
            <motion.div 
              className="h-20 w-20 rounded-2xl overflow-hidden shadow-xl ring-2 ring-border/30 bg-white flex items-center justify-center"
              initial={prefersReducedMotion ? {} : { scale: 0.8, opacity: 0 }}
              animate={prefersReducedMotion ? {} : { scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 20,
                delay: 0.1
              }}
            >
              <Image 
                src="/assets/WhatsApp Image 2025-08-05 at 13.57.52_050c3907.jpg" 
                alt="DocketDive Logo" 
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </motion.div>
            
            {/* Subtle pulse glow - only if motion allowed */}
            {!prefersReducedMotion && (
              <motion.div 
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 -z-10"
                animate={{ 
                  scale: [1, 1.15, 1],
                  opacity: [0.4, 0.1, 0.4] 
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </div>
        </motion.div>

        {/* Greeting with gradient text */}
        <motion.div 
          variants={itemVariants}
          className="text-center space-y-3"
        >
          <h1 className="text-3xl md:text-4xl font-semibold text-gradient">
            {t(greeting)}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            {t("How can I help with your legal question?")}
          </p>
        </motion.div>

        {/* Prompt Cards - 2x2 grid on desktop, single column on mobile */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
          data-tour="prompt-cards"
        >
          {prompts.map((prompt, index) => (
            <PromptCard
              key={prompt.title}
              icon={prompt.icon}
              title={t(prompt.title)}
              prompt={t(prompt.prompt)}
              onClick={() => handlePromptClick(prompt.prompt)}
              delay={prefersReducedMotion ? 0 : 0.3 + index * 0.08}
            />
          ))}
        </motion.div>

        {/* Keyboard hint with subtle styling */}
        <motion.p 
          variants={itemVariants}
          className="text-center text-xs text-muted-foreground/80"
        >
          {t("Press")}{" "}
          <kbd className="px-1.5 py-0.5 rounded-md bg-muted/80 border border-border/50 text-[10px] font-mono shadow-sm">
            Enter
          </kbd>{" "}
          {t("to send")}
        </motion.p>
      </motion.div>
    </div>
  );
}
