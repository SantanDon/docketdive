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
} from "lucide-react";
import Image from "next/image";

import { TextType } from "@/components/ui/text-type";
import { SpotlightCard } from "@/components/ui/spotlight-card";

// Enhanced legal prompts - clean and professional
const legalPrompts = [
  {
    icon: Scale,
    category: "Constitutional Law",
    text: "What makes a will legally binding in South Africa?",
  },
  {
    icon: FileText,
    category: "Legal Principles",
    text: "How does ubuntu shape our constitutional democracy?",
  },
  {
    icon: Shield,
    category: "Consumer Rights",
    text: "What are my rights under the Consumer Protection Act?",
  },
  {
    icon: Home,
    category: "Property Law",
    text: "Tenant vs Landlord rights under the Rental Housing Act",
  },
  {
    icon: Briefcase,
    category: "Labour Law",
    text: "What are my workplace rights as an employee?",
  },
  {
    icon: GraduationCap,
    category: "Government",
    text: "How do Parliament, Courts, and the President work together?",
  },
];

interface WelcomeScreenProps {
  setInputMessage: (message: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

/**
 * Modern Welcome Screen - Claude.com Inspired
 * - Clean, minimal design
 * - Professional prompt cards
 * - Elegant animations
 */
export default function WelcomeScreen({ setInputMessage, textareaRef }: WelcomeScreenProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="relative z-10 px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12 animate-in">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="relative h-24 w-24 rounded-2xl overflow-hidden animate-pulse-slow hover:scale-105 transition-transform duration-500">
                <Image 
                  src="/assets/WhatsApp Image 2025-08-05 at 13.57.52_050c3907.jpg" 
                  alt="DocketDive Logo" 
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            
            <div>
              <h1 className="text-5xl font-bold tracking-tight bg-linear-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-400 dark:via-blue-300 dark:to-cyan-300 bg-clip-text text-transparent mb-3">
                {(() => {
                  const hour = new Date().getHours();
                  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
                  return greeting;
                })()}
              </h1>
              <div className="text-xl text-gray-600 dark:text-gray-400 font-light h-8 flex items-center justify-center">
                <TextType 
                  text="Your AI-powered legal research assistant for South African law" 
                  speed={50}
                  delay={500}
                />
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-sm font-medium border border-blue-100 dark:border-blue-900">
                <Sparkles className="h-3.5 w-3.5" />
                AI-Powered Analysis
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-sm font-medium border border-purple-100 dark:border-purple-900">
                <Scale className="h-3.5 w-3.5" />
                SA Legal Database
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 text-sm font-medium border border-green-100 dark:border-green-900">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Sources
              </span>
            </div>
          </div>

          {/* Prompt Cards */}
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Explore Legal Topics
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Get started with these common legal questions
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {legalPrompts.map((prompt, index) => {
                const Icon = prompt.icon;
                return (
                  <SpotlightCard key={index} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 group">
                    <button
                      onClick={() => {
                        setInputMessage(prompt.text);
                        setTimeout(() => textareaRef.current?.focus(), 100);
                      }}
                      className="w-full h-full p-5 text-left"
                    >
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {prompt.category}
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {prompt.text}
                          </div>
                        </div>
                        <ArrowRight size={16} className="shrink-0 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>

          {/* Info Card */}
          <div className="p-6 rounded-xl bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-900/50 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Professional Legal Research
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  DocketDive uses advanced AI to analyze South African legal documents, statutes, and case law. 
                  Get well-structured, professionally formatted answers with proper citations and sources.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-3 italic flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <span>Tip: Activate Student Mode for simplified explanations of complex legal concepts</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
