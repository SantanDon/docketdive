"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Scale, Gavel, Shield, Home } from "lucide-react";
import PromptCard from "@/components/PromptCard";
import { useTranslation } from "@/app/hooks/useTranslation";

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
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const handlePromptClick = (prompt: string) => {
    setInputMessage(t(prompt));
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  return (
    <div key={language} className="flex-1 flex flex-col items-center justify-center px-4 py-8 min-h-[calc(100vh-8rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl mx-auto space-y-8"
      >
        {/* Logo with subtle pulse */}
        <motion.div 
          className="flex justify-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-xl ring-2 ring-border/30 bg-white flex items-center justify-center">
              <Image 
                src="/assets/WhatsApp Image 2025-08-05 at 13.57.52_050c3907.jpg" 
                alt="DocketDive Logo" 
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>
            {/* Subtle pulse glow */}
            <motion.div 
              className="absolute inset-0 rounded-2xl bg-primary/10 -z-10"
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.1, 0.3] 
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>

        {/* Greeting */}
        <motion.div 
          className="text-center space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl md:text-4xl font-semibold text-gradient">
            {t(greeting)}
          </h1>
          <p className="text-muted-foreground text-base">
            {t("How can I help with your legal question?")}
          </p>
        </motion.div>

        {/* Prompt Cards - 2x2 grid on desktop, single column on mobile */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          data-tour="prompt-cards"
        >
          {prompts.map((prompt, index) => (
            <PromptCard
              key={prompt.title}
              icon={prompt.icon}
              title={t(prompt.title)}
              prompt={t(prompt.prompt)}
              onClick={() => handlePromptClick(prompt.prompt)}
              delay={index * 0.05}
            />
          ))}
        </motion.div>

        {/* Minimal footer hint */}
        <motion.p 
          className="text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {t("Press")} <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">Enter</kbd> {t("to send")}
        </motion.p>
      </motion.div>
    </div>
  );
}
