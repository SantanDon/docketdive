"use client";

import {
  Scale,
  FileText,
  GraduationCap,
  Shield,
  Home,
  Briefcase,
  Sparkles,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Lightbulb,
  Gavel,
  Users,
  Building,
  AlertCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";

import { TextType } from "@/components/ui/text-type";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { motion } from "framer-motion";
import { useTranslation } from "@/app/hooks/useTranslation";

// Enhanced legal prompts - comprehensive legal categories
const legalPrompts = [
  {
    icon: Scale,
    category: "Constitutional Law",
    text: "What makes a will legally binding in South Africa?",
    description: "Understanding the requirements for valid wills",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    icon: Gavel,
    category: "Legal Principles",
    text: "How does ubuntu shape our constitutional democracy?",
    description: "The role of ubuntu in South African jurisprudence",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Shield,
    category: "Consumer Rights",
    text: "What are my rights under the Consumer Protection Act?",
    description: "Comprehensive guide to consumer protections",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Home,
    category: "Property Law",
    text: "Tenant vs Landlord rights under the Rental Housing Act",
    description: "Understanding rental agreements and disputes",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Users,
    category: "Labour Law",
    text: "What are my workplace rights as an employee?",
    description: "Employment laws and worker protections",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Building,
    category: "Government",
    text: "How do Parliament, Courts, and the President work together?",
    description: "Understanding South African governance",
    gradient: "from-indigo-500 to-purple-500",
  },
];

// Quick actions for faster access
const quickActions = [
  { icon: FileText, label: "Case Research", description: "Search through legal precedents" },
  { icon: Scale, label: "Legal Advice", description: "Get AI-powered legal guidance" },
  { icon: BookOpen, label: "Document Review", description: "Analyze legal documents" },
  { icon: AlertCircle, label: "Rights Check", description: "Understand your legal rights" },
];

interface WelcomeScreenProps {
  setInputMessage: (message: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

/**
 * Premium Welcome Screen
 * - Elegant, professional design with sophisticated animations
 * - Comprehensive legal category access
 * - Enhanced user experience with quick actions
 */
export default function WelcomeScreen({ setInputMessage, textareaRef }: WelcomeScreenProps) {
  const { t, language } = useTranslation();
  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const greeting = t(greetingKey);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="relative z-10 px-4 py-8">
        <motion.div 
          className="max-w-5xl mx-auto space-y-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero Section */}
          <motion.div 
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Logo */}
            <motion.div 
              className="flex justify-center mb-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            >
              <div className="relative">
                <motion.div 
                  className="h-28 w-28 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-blue-500/20"
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Image 
                    src="/assets/WhatsApp Image 2025-08-05 at 13.57.52_050c3907.jpg" 
                    alt="DocketDive Logo" 
                    fill
                    className="object-cover"
                    priority
                  />
                </motion.div>
                {/* Glow effect */}
                <motion.div 
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-xl -z-10"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>
            </motion.div>
            
            {/* Greeting */}
            <div>
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 dark:from-blue-400 dark:via-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  {greeting}
                </span>
              </motion.h1>
              <motion.div 
                className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-light h-10 flex items-center justify-center mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <TextType 
                  text={t("Your AI-powered legal research assistant for South African law")} 
                  speed={40}
                  delay={800}
                />
              </motion.div>
            </div>

            {/* Feature Pills */}
            <motion.div 
              className="flex flex-wrap justify-center gap-3 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <motion.span 
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-sm font-medium border border-blue-100 dark:border-blue-900/50 cursor-default"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t("AI-Powered Analysis")}
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-sm font-medium border border-purple-100 dark:border-purple-900/50 cursor-default"
              >
                <Scale className="h-3.5 w-3.5" />
                {t("SA Legal Database")}
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium border border-emerald-100 dark:border-emerald-900/50 cursor-default"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("Verified Sources")}
              </motion.span>
            </motion.div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-card p-4 rounded-xl text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-colors">
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {t(action.label)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Prompt Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {t("Explore Legal Topics")}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                {t("Get started with these common legal questions")}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {legalPrompts.map((prompt, index) => {
                const Icon = prompt.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                  >
                    <SpotlightCard className="h-full glass-card hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 group">
                      <motion.button
                        onClick={() => {
                          setInputMessage(t(prompt.text));
                          setTimeout(() => textareaRef.current?.focus(), 100);
                        }}
                        className="w-full h-full p-5 text-left"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-start gap-4">
                          <motion.div 
                            className={`shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br ${prompt.gradient} flex items-center justify-center text-white shadow-lg`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <Icon size={24} />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {t(prompt.category)}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                              {t(prompt.text)}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 line-clamp-1">
                              {prompt.description}
                            </p>
                          </div>
                          <motion.div
                            className="shrink-0 text-slate-400 group-hover:text-blue-500"
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <ChevronRight size={20} />
                          </motion.div>
                        </div>
                      </motion.button>
                    </SpotlightCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Info Card */}
          <motion.div 
            className="relative overflow-hidden rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-cyan-500/5 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-cyan-500/10" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
            
            <div className="relative p-6 rounded-2xl glass-card">
              <div className="flex items-start gap-4">
                <motion.div 
                  className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                >
                  <Sparkles size={24} />
                </motion.div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-2">
                    {t("Professional Legal Research")}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    DocketDive uses advanced AI to analyze South African legal documents, statutes, and case law. 
                    Get well-structured, professionally formatted answers with proper citations and verified sources.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-500 dark:text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-blue-500" />
                      <span>Instant Analysis</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={14} className="text-green-500" />
                      <span>1000+ Cases</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-purple-500" />
                      <span>Verified Sources</span>
                    </div>
                  </div>
                  <motion.div 
                    className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                  >
                    <Lightbulb size={16} className="text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      <span className="font-semibold">Pro Tip:</span> Activate Student Mode for simplified explanations of complex legal concepts tailored to your understanding level.
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div 
            className="text-center text-xs text-slate-500 dark:text-slate-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <p>DocketDive AI Assistant • South African Legal Intelligence</p>
            <p className="mt-1">Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">Enter</kbd> to send your question</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
