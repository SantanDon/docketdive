"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  BookOpen,
  Clock,
  AlertCircle,
  ChevronDown,
  Loader2,
  Sparkles,
  Scale,
  Calendar,
  Shield,
  MessageSquare,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DocumentDropzone from "@/components/DocumentDropzone";
import DocumentChat from "@/components/DocumentChat";
import { cn } from "@/lib/utils";
import { ToolIconLarge } from "@/components/ui/tool-icons";
import { getToolTheme } from "@/components/ui/tool-themes";
import type {
  SimplificationResult,
  SimplifiedClause,
  JargonTerm,
  Obligation,
  Right,
  Deadline,
} from "@/types/legal-tools";

// ============================================
// Animation Variants
// ============================================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// ============================================
// Readability Score Display
// ============================================

function ReadabilityComparison({ scores }: { scores: { original: number; simplified: number } }) {
  const getGradeLabel = (grade: number) => {
    if (grade <= 6) return "Elementary";
    if (grade <= 8) return "Middle School";
    if (grade <= 12) return "High School";
    if (grade <= 16) return "College";
    return "Graduate";
  };

  const improvement = scores.original - scores.simplified;
  
  return (
    <motion.div 
      variants={itemVariants}
      className="p-6 rounded-2xl bg-muted/30 border border-border/50 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-6">Readability Index</p>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-tight">Original</p>
            <p className="text-4xl font-extrabold text-foreground tracking-tighter">Grade {scores.original}</p>
            <p className="text-sm text-muted-foreground italic mt-1">{getGradeLabel(scores.original)} level</p>
          </div>

          <div className="relative flex-1 flex flex-col items-center">
            <div className="w-full h-px bg-border absolute top-1/2 -z-10 hidden sm:block" />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="px-6 py-2 bg-primary/10 dark:bg-primary/20 rounded-full border border-primary/20 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                <span className="text-sm font-bold text-primary">-{improvement} Grades easier</span>
              </div>
            </motion.div>
          </div>

          <div className="text-center sm:text-right">
            <p className="text-sm font-medium text-primary mb-1 uppercase tracking-tight">Simplified</p>
            <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent tracking-tighter">Grade {scores.simplified}</p>
            <p className="text-sm text-muted-foreground italic mt-1">{getGradeLabel(scores.simplified)} level</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Clause Card
// ============================================

function ClauseCard({ clause }: { clause: SimplifiedClause }) {
  const [expanded, setExpanded] = useState(false);
  
  const importanceConfig = {
    critical: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: "🔴" },
    important: { color: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800", icon: "🟡" },
    standard: { color: "bg-muted text-muted-foreground border-border", icon: "⚪" },
  };

  const config = importanceConfig[clause.importance];

  return (
    <motion.div 
      variants={itemVariants}
      layout 
      className="glass-card overflow-hidden"
    >
      <div
        className="p-4 cursor-pointer flex items-start gap-3 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <span className={cn("text-xs px-2 py-0.5 rounded-full border", config.color)}>
            {clause.importance}
          </span>
          <p className="text-sm text-foreground mt-2">
            {clause.simplified}
          </p>
        </div>
        <motion.button 
          className="p-1 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          animate={{ rotate: expanded ? 180 : 0 }}
        >
          <ChevronDown size={18} />
        </motion.button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border p-4 bg-muted/30"
          >
            <p className="text-xs font-medium text-muted-foreground mb-1">Original Text:</p>
            <p className="text-sm text-muted-foreground italic">
              "{clause.original}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


// ============================================
// Jargon Term Card
// ============================================

function JargonCard({ term }: { term: JargonTerm }) {
  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -2, rotate: 1 }}
      className="p-5 rounded-2xl bg-muted/20 border border-primary/10 hover:border-primary/30 transition-all duration-300 group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
          <Sparkles size={16} />
        </div>
        <p className="font-bold text-foreground tracking-tight">{term.term}</p>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{term.definition}</p>
      {term.context && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50 mb-1">Context</p>
          <p className="text-xs text-muted-foreground italic leading-relaxed">"{term.context}"</p>
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// Obligation/Right/Deadline Cards
// ============================================

function ObligationCard({ obligation }: { obligation: Obligation }) {
  return (
    <motion.div 
      variants={itemVariants}
      className="p-5 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm">
          <Scale size={20} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground leading-relaxed">{obligation.description}</p>
          <div className="flex flex-wrap gap-4 mt-3">
            {obligation.party && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-border/50 text-[11px] font-medium text-muted-foreground">
                <span className="opacity-70">👤</span> {obligation.party}
              </div>
            )}
            {obligation.deadline && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-border/50 text-[11px] font-medium text-muted-foreground">
                <span className="opacity-70">📅</span> {obligation.deadline}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RightCard({ right }: { right: Right }) {
  return (
    <motion.div 
      variants={itemVariants}
      className="p-5 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/20 flex items-center justify-center shrink-0 shadow-sm">
          <Shield size={20} className="text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground leading-relaxed">{right.description}</p>
          <div className="flex flex-wrap gap-4 mt-3">
            {right.party && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-border/50 text-[11px] font-medium text-muted-foreground">
                <span className="opacity-70">👤</span> {right.party}
              </div>
            )}
            {right.conditions && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100/50 dark:bg-red-900/20 border border-red-200/50 text-[11px] font-bold text-red-600 dark:text-red-400">
                <span className="opacity-70">⚠️</span> {right.conditions}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DeadlineCard({ deadline }: { deadline: Deadline }) {
  return (
    <motion.div 
      variants={itemVariants}
      className="p-5 rounded-2xl bg-red-500/5 border border-destructive/20 hover:bg-red-500/10 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0 shadow-sm">
          <Calendar size={20} className="text-destructive" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground leading-relaxed">{deadline.description}</p>
          <div className="space-y-2 mt-3">
            {deadline.date && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-destructive uppercase tracking-wider">
                <span className="text-base leading-none">📅</span> {deadline.date}
              </div>
            )}
            {deadline.consequence && (
              <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/10 text-xs text-destructive leading-relaxed font-medium italic">
                <span className="font-bold uppercase tracking-tight mr-1">Consequence:</span>
                {deadline.consequence}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Section Header
// ============================================

function SectionHeader({ icon: Icon, title, count }: { icon: React.ElementType; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon size={16} className="text-primary" />
      </div>
      <h3 className="font-medium text-foreground">
        {title} {count !== undefined && <span className="text-muted-foreground">({count})</span>}
      </h3>
    </div>
  );
}


// ============================================
// Main Component
// ============================================

interface DocumentSimplifierProps {
  documentContent?: string;
  onClose?: () => void;
}

export default function DocumentSimplifier({ documentContent, onClose }: DocumentSimplifierProps) {
  const theme = getToolTheme('simplifier');
  const [content, setContent] = useState(documentContent || "");
  const [result, setResult] = useState<SimplificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "clauses" | "glossary" | "obligations">("summary");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  const handleDocumentLoaded = (text: string, metadata: { fileName: string }) => {
    setContent(text);
    setUploadedFileName(metadata.fileName);
    setError(null);
  };

  const simplifyDocument = async () => {
    if (!content.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, targetReadingLevel: 8 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Simplification failed");
      }

      const data = await res.json();
      setResult(data.result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "summary" as const, label: "Summary", icon: FileText },
    { id: "clauses" as const, label: "Clauses", icon: BookOpen },
    { id: "glossary" as const, label: "Glossary", icon: Sparkles },
    { id: "obligations" as const, label: "Key Points", icon: Scale },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full flex flex-col gap-10"
    >
      {/* Tool Header - Floating Island style */}
      <div className={cn("relative p-10 rounded-[2.5rem] border overflow-hidden", theme.headerBg)}>
        <div className={cn("absolute inset-0 pointer-events-none", theme.gradient)} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <ToolIconLarge toolId="simplify" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Document<span className={theme.textColor}>Simplifier</span></h1>
              <p className="text-muted-foreground text-lg font-medium opacity-80 mt-1">{theme.description}</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-12 w-12 hover:bg-muted/40">
              <XCircle size={24} className="text-muted-foreground/60" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Input/Upload Side */}
        <div className="lg:col-span-5 space-y-10">
          {!result ? (
            <section className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="h-1.5 w-10 bg-primary rounded-full" />
                <h3 className="text-xs uppercase font-black tracking-widest text-muted-foreground">Input Source</h3>
              </div>
              <div className="p-8 rounded-4xl bg-muted/10 border border-border/40 space-y-8">
                <DocumentDropzone
                  onDocumentLoaded={handleDocumentLoaded}
                  onError={(err: string) => setError(err)}
                  disabled={loading}
                  toolTheme={theme}
                />
                
                <div className="relative h-px bg-border/40">
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-background text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Direct Entry</span>
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <textarea
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value);
                        setUploadedFileName(null);
                      }}
                      placeholder="Paste complex legal text here..."
                      className={cn(
                        "w-full h-80 p-6 rounded-3xl bg-background/50 border border-border/60 transition-all duration-500",
                        "focus:ring-4 focus:ring-primary/10 focus:border-primary/40 outline-none resize-none text-sm leading-relaxed font-medium"
                      )}
                      disabled={loading}
                    />
                    {content && (
                      <div className="absolute bottom-4 right-6 text-[10px] font-black text-muted-foreground/20 uppercase tracking-widest">
                        {content.length.toLocaleString()} Chars
                      </div>
                    )}
                  </div>

                  {uploadedFileName && (
                    <div className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-[11px] font-bold text-green-600 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      LOADED: {uploadedFileName}
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-xl flex items-center gap-3 border border-destructive/20 text-xs font-bold">
                      <AlertCircle size={16} />
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={simplifyDocument}
                    disabled={!content.trim() || loading}
                    className={cn(
                      "w-full h-16 rounded-2xl font-black text-lg transition-all duration-300",
                      "bg-gradient-to-r from-primary via-primary to-accent text-white shadow-2xl shadow-primary/20",
                      "hover:scale-[1.01] hover:shadow-primary/30 active:scale-95 disabled:opacity-50"
                    )}
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="animate-spin" size={24} />
                        <span className="uppercase tracking-widest text-sm">Processing Nuances</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Sparkles size={24} />
                        <span className="uppercase tracking-widest text-sm">Simplify Document</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </section>
          ) : (
            /* Left side actions when result exists */
            <div className="space-y-6 sticky top-24">
              <Button
                variant="outline"
                onClick={() => setShowChat(!showChat)}
                className={cn(
                  "w-full h-16 rounded-2xl border-primary/30 hover:bg-primary/5 font-black uppercase tracking-widest text-xs",
                  showChat && "bg-primary/10"
                )}
              >
                <MessageSquare className="mr-3" size={20} />
                {showChat ? "Hide Chat Assistant" : "Chat with Document"}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setContent("");
                  setUploadedFileName(null);
                  setShowChat(false);
                }}
                className="w-full h-16 rounded-2xl border-border/40 hover:bg-muted/50 font-black uppercase tracking-widest text-xs"
              >
                Simplify New Document
              </Button>

              <AnimatePresence>
                {showChat && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="pt-4"
                  >
                    <DocumentChat
                      documentContent={content}
                      documentName={uploadedFileName || undefined}
                      onClose={() => setShowChat(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Results/Content Side */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[700px] flex flex-col items-center justify-center text-center p-12 rounded-[2.5rem] bg-muted/5 border-2 border-dashed border-border/40"
              >
                <div className="p-10 rounded-full bg-muted/10 border border-border/20 mb-8">
                  <Sparkles size={72} className="text-muted-foreground/20" />
                </div>
                <h3 className="text-3xl font-black text-foreground mb-4">Awaiting Intel</h3>
                <p className="text-muted-foreground text-lg font-medium max-w-md opacity-60">Paste your complex documents to transform them into clear, actionable intelligence.</p>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-10"
              >
                {/* Scorecards */}
                <ReadabilityComparison scores={result.readabilityScores} />

                {/* Content Controls */}
                <div className={cn("flex p-2 gap-2 rounded-3xl items-center overflow-x-auto no-scrollbar", theme.cardBg)}>
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "relative flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                          isActive ? "text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="simplifier-tab-bg"
                            className={cn("absolute inset-0 rounded-2xl shadow-xl -z-10", theme.primary.replace('from-', 'bg-gradient-to-r from-').replace(' to-', ' to-'))}
                          />
                        )}
                        <Icon size={16} />
                        <span>{tab.label}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Tab Views */}
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {activeTab === "summary" && (
                    <section className="p-10 rounded-[2.5rem] bg-muted/10 border border-border/40 space-y-6">
                      <div className="flex items-center gap-3 opacity-60">
                        <FileText size={20} className="text-primary" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest">Global Overview</h3>
                      </div>
                      <p className="text-lg font-medium text-foreground leading-[1.8] whitespace-pre-line">
                        {result.simplifiedSummary}
                      </p>
                    </section>
                  )}

                  {activeTab === "clauses" && (
                    <div className="space-y-4">
                      {result.clauseBreakdown.map((clause, idx) => (
                        <ClauseCard key={idx} clause={clause} />
                      ))}
                    </div>
                  )}

                  {activeTab === "glossary" && (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {result.jargonGlossary.map((term, idx) => (
                        <JargonCard key={idx} term={term} />
                      ))}
                    </div>
                  )}

                  {activeTab === "obligations" && (
                    <div className="space-y-12">
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                            <Scale size={20} />
                          </div>
                          <h3 className="text-xs uppercase font-black tracking-widest">Mandatory Obligations</h3>
                        </div>
                        <div className="space-y-4">
                          {result.keyObligations.map((ob, idx) => (
                            <ObligationCard key={idx} obligation={ob} />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                          <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                            <Shield size={20} />
                          </div>
                          <h3 className="text-xs uppercase font-black tracking-widest">Reserved Rights</h3>
                        </div>
                        <div className="space-y-4">
                          {result.keyRights.map((right, idx) => (
                            <RightCard key={idx} right={right} />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                          <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
                            <Clock size={20} />
                          </div>
                          <h3 className="text-xs uppercase font-black tracking-widest">Critical Deadlines</h3>
                        </div>
                        <div className="space-y-4">
                          {result.keyDeadlines.map((deadline, idx) => (
                            <DeadlineCard key={idx} deadline={deadline} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
