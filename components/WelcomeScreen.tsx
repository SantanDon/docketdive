"use client";

import { useEffect, useState } from "react";
import { Scale, Sparkles, Search, FileText, PenTool } from "lucide-react";
import { motion } from "framer-motion";
import WaitlistForm from "./WaitlistForm";

interface WelcomeScreenProps {
  username: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function WelcomeScreen({ username }: WelcomeScreenProps) {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Extract first name for a more personal touch
  const firstName = username.split(" ")[0];

  return (
    <motion.section
      className="flex flex-col items-center justify-center h-full min-h-[60vh] w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 lg:py-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Icon with subtle animation */}
      <motion.div
        variants={itemVariants}
        className="mb-6 sm:mb-8"
      >
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-legal-blue-100 to-legal-blue-50 dark:from-legal-blue-900/40 dark:to-legal-blue-900/20 text-legal-blue-600 dark:text-legal-blue-400 flex items-center justify-center shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105">
          <Scale className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
      </motion.div>

      {/* Greeting heading with fluid typography */}
      <motion.div variants={itemVariants} className="mb-4 sm:mb-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-slate-900 dark:text-slate-50">
          <span className="block">{greeting},</span>
          <span className="block bg-gradient-to-r from-legal-blue-600 to-legal-blue-500 dark:from-legal-blue-400 dark:to-legal-blue-300 bg-clip-text text-transparent">
            {firstName}
          </span>
        </h1>
      </motion.div>

      {/* Description with improved readability */}
      <motion.div variants={itemVariants} className="mb-8 sm:mb-12 space-y-3">
        <p className="text-base sm:text-lg md:text-xl text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
          Welcome to DocketDive—your AI-powered legal research assistant
        </p>
        <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          I specialize in South African law and can help you research case law, analyze legal documents, draft correspondence, and ensure compliance with data protection regulations.
        </p>
      </motion.div>

      {/* Quick capability highlights */}
      <motion.div
        variants={itemVariants}
        className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3"
      >
        {[
          { icon: Search, label: "Research", desc: "Case law & precedents" },
          { icon: FileText, label: "Analyze", desc: "Documents & contracts" },
          { icon: PenTool, label: "Draft", desc: "Legal documents" },
        ].map((capability, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="group p-4 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-900/30 dark:to-transparent hover:border-legal-blue-300 dark:hover:border-legal-blue-700 transition-all duration-200 cursor-default focus-within:ring-2 focus-within:ring-legal-blue-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-900"
          >
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">
              <capability.icon className="h-8 w-8" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 text-sm">
                {capability.label}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {capability.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA suggestion */}
      <motion.div variants={itemVariants} className="mt-10 sm:mt-14 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-legal-blue-50 dark:bg-legal-blue-900/20 border border-legal-blue-200 dark:border-legal-blue-800/50 mb-8">
          <Sparkles className="w-4 h-4 text-legal-blue-600 dark:text-legal-blue-400" />
          <p className="text-xs sm:text-sm font-medium text-legal-blue-700 dark:text-legal-blue-300">
            Try asking me to analyze a contract or research a legal topic
          </p>
        </div>

        {/* Waitlist Section */}
        <div className="mt-8 pt-8 border-t border-slate-200/50 dark:border-slate-700/50 w-full max-w-lg mx-auto">
          <h3 className="text-lg font-semibold mb-2">Want full access?</h3>
          <p className="text-sm text-muted-foreground mb-6">
            We're currently in closed alpha. Join the waitlist to get notified when we open more spots.
          </p>
          <WaitlistForm className="max-w-md mx-auto" />
        </div>
      </motion.div>
    </motion.section>
  );
}
