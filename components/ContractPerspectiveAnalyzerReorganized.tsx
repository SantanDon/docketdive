"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scale, 
  Users, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  FileText, 
  Upload,
  Sparkles,
  ArrowRight,
  FileSearch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DocumentDropzone from "@/components/DocumentDropzone";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ContractAnalysis, AnalysisPerspective, ClauseAnalysis, ModificationSuggestion } from "@/types/legal-tools";
import ToolFlowWrapper from "./ToolFlowWrapper";
import type { ToolStep } from "./ToolFlowWrapper";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

function RiskScoreCircle({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 70) return "text-green-500 bg-green-500/10 border-green-500/20";
    if (score >= 40) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
  };

  const label = score >= 70 ? "Low Risk" : score >= 40 ? "Moderate Risk" : "High Risk";
  const ringColor = score >= 70 ? "stroke-green-500" : score >= 40 ? "stroke-amber-500" : "stroke-red-500";

  return (
    <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-muted/20 border border-border/40">
      <div className="relative h-32 w-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="58"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/20"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="58"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={364}
            initial={{ strokeDashoffset: 364 }}
            animate={{ strokeDashoffset: 364 - (364 * score) / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={ringColor}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold tracking-tighter text-foreground">{score}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Score</span>
        </div>
      </div>
      <div className={cn("px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.15em] border", getColor())}>
        {label}
      </div>
    </div>
  );
}

function PerspectiveSelector({
  value,
  onChange,
  disabled,
}: {
  value: AnalysisPerspective;
  onChange: (p: AnalysisPerspective) => void;
  disabled: boolean;
}) {
  const perspectives = [
    { id: "party_a" as const, label: "Party A", icon: User, desc: "Provider/Seller perspective", color: "from-blue-500 to-indigo-600" },
    { id: "party_b" as const, label: "Party B", icon: User, desc: "Client/Buyer perspective", color: "from-purple-500 to-pink-600" },
    { id: "neutral" as const, label: "Neutral", icon: Scale, desc: "Balanced legal analysis", color: "from-emerald-500 to-teal-600" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {perspectives.map((p) => {
        const Icon = p.icon;
        const isSelected = value === p.id;
        return (
          <motion.button
            key={p.id}
            onClick={() => !disabled && onChange(p.id)}
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            className={cn(
              "relative p-6 rounded-2xl border-2 transition-all duration-300 text-left",
              isSelected
                ? "bg-gradient-to-br " + p.color + " border-transparent text-white shadow-lg"
                : "bg-card border-border hover:border-primary/50 hover:bg-muted/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex flex-col gap-3">
              <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center",
                isSelected ? "bg-white/20" : "bg-primary/10"
              )}>
                <Icon className={cn(
                  "h-6 w-6",
                  isSelected ? "text-white" : "text-primary"
                )} />
              </div>
              <div>
                <h4 className={cn(
                  "font-bold text-lg mb-1",
                  isSelected ? "text-white" : "text-foreground"
                )}>
                  {p.label}
                </h4>
                <p className={cn(
                  "text-sm",
                  isSelected ? "text-white/80" : "text-muted-foreground"
                )}>
                  {p.desc}
                </p>
              </div>
            </div>
            {isSelected && (
              <motion.div
                className="absolute top-3 right-3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <CheckCircle className="h-5 w-5 text-white" />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

function ClauseCard({ clause, type }: { clause: ClauseAnalysis; type: "favorable" | "risky" }) {
  const isFavorable = type === "favorable";
  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "p-5 rounded-2xl border-2 transition-all duration-300",
        isFavorable
          ? "bg-green-500/5 border-green-500/20 hover:bg-green-500/10"
          : "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
          isFavorable ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
        )}>
          {isFavorable ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              {clause.clauseNumber}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest",
              isFavorable
                ? "bg-green-500/20 text-green-600 border border-green-500/30"
                : "bg-red-500/20 text-red-600 border border-red-500/30"
            )}>
              {type}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground leading-relaxed mb-2">
            {clause.clauseText}
          </p>
          {clause.riskLevel && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">Risk Level:</span>
              <span className="font-bold">{clause.riskLevel}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: ModificationSuggestion }) {
  const [expanded, setExpanded] = useState(false);
  const priorityColors = {
    critical: "bg-red-500/10 text-red-600 border-red-500/20",
    recommended: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    optional: "bg-blue-500/10 text-blue-600 border-blue-500/20"
  };

  return (
    <motion.div
      variants={itemVariants}
      className="rounded-2xl border border-border/40 bg-muted/5 hover:bg-muted/10 transition-all duration-300 overflow-hidden"
    >
      <div
        className="p-5 cursor-pointer flex items-center gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles size={20} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              {suggestion.clauseReference}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border",
              priorityColors[suggestion.priority as keyof typeof priorityColors]
            )}>
              {suggestion.priority}
            </span>
          </div>
          <p className="text-sm font-bold text-foreground leading-snug">{suggestion.rationale}</p>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/40"
          >
            <div className="p-5 space-y-4 bg-muted/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500/60">Current Text</p>
                  <p className="text-xs text-muted-foreground line-through bg-red-500/5 p-3 rounded-xl border border-red-500/10 leading-relaxed italic">
                    {suggestion.currentText}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-500/60">Proposed Amendment</p>
                  <p className="text-xs font-bold text-foreground bg-green-500/5 p-3 rounded-xl border border-green-500/10 leading-relaxed">
                    {suggestion.suggestedText}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ContractPerspectiveAnalyzer({ documentContent, onClose }: { documentContent?: string; onClose?: () => void }) {
  const [content, setContent] = useState(documentContent || "");
  const [perspective, setPerspective] = useState<AnalysisPerspective>("neutral");
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<ToolStep>("upload");

  const steps = [
    { id: "upload" as ToolStep, label: "Upload", icon: Upload },
    { id: "configure" as ToolStep, label: "Perspective", icon: Users },
    { id: "processing" as ToolStep, label: "Processing", icon: Loader2 },
    { id: "results" as ToolStep, label: "Results", icon: FileText },
  ];

  const handleDocumentLoaded = (text: string, metadata: any) => {
    setContent(text);
    setUploadedFileName(metadata.fileName);
    setCurrentStep("configure");
  };

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setCurrentStep("processing");
    setLoading(true);
    setError(null);
    setAnalysis(null);
    
    try {
      const res = await fetch("/api/contract-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, perspective }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Analysis failed");
      }
      const data: { analysis: ContractAnalysis } = await res.json();
      setAnalysis(data.analysis);
      setCurrentStep("results");
    } catch (err: any) {
      setError(err.message);
      setCurrentStep("configure");
    } finally {
      setLoading(false);
    }
  };

  // Auto-advance to configure when content is loaded
  if (content && currentStep === "upload") {
    setCurrentStep("configure");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4 shadow-lg shadow-primary/20">
          <Scale size={32} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Contract Perspective Analyzer</h1>
        <p className="text-muted-foreground text-lg">Analyze contracts from different party viewpoints</p>
      </div>

      <ToolFlowWrapper
        currentStep={currentStep}
        steps={steps}
        onStepChange={(step) => {
          if (step === "upload" || (step === "configure" && content) || (step === "results" && analysis)) {
            setCurrentStep(step);
          }
        }}
      >
        {/* Step 1: Upload */}
        {currentStep === "upload" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Upload Your Contract</h2>
                <p className="text-muted-foreground">Upload a document or paste text to get started</p>
              </div>
              <DocumentDropzone
                onDocumentLoaded={handleDocumentLoaded}
                onError={(err) => setError(err)}
                disabled={loading}
                variant="full"
              />
              <div className="relative my-8 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <span className="relative px-4 bg-card text-sm text-muted-foreground">or</span>
              </div>
              <div className="space-y-4">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste contract text here..."
                  className="w-full h-64 p-4 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                  disabled={loading}
                />
                {content && (
                  <Button
                    onClick={() => setCurrentStep("configure")}
                    className="w-full h-12"
                    size="lg"
                  >
                    Continue to Perspective Selection
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Configure Perspective */}
        {currentStep === "configure" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Select Analysis Perspective</h2>
                <p className="text-muted-foreground">Choose which party's viewpoint to analyze from</p>
              </div>
              <div className="mb-8">
                <PerspectiveSelector
                  value={perspective}
                  onChange={setPerspective}
                  disabled={loading}
                />
              </div>
              {uploadedFileName && (
                <div className="mb-6 p-4 rounded-xl bg-muted/50 border border-border flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{uploadedFileName}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {content.length.toLocaleString()} characters
                  </span>
                </div>
              )}
              <Button
                onClick={handleAnalyze}
                disabled={!content.trim() || loading}
                className="w-full h-14 text-lg font-semibold"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Scale className="mr-2 h-5 w-5" />
                    Analyze Contract
                  </>
                )}
              </Button>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3"
                >
                  <AlertTriangle size={20} />
                  {error}
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Step 3: Processing */}
        {currentStep === "processing" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <Card className="p-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent mb-6"
              >
                <Loader2 className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Analyzing Contract</h2>
              <p className="text-muted-foreground">Processing from {perspective} perspective...</p>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Results */}
        {currentStep === "results" && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Risk Score & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RiskScoreCircle score={analysis.riskScore} />
              <Card className="p-8 flex flex-col justify-center">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Perspective</p>
                <h3 className="text-2xl font-bold text-foreground capitalize mb-2">{analysis.perspective} POV</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This analysis identifies advantages and risks specifically for {analysis.perspective}.
                </p>
              </Card>
            </div>

            {/* Executive Summary */}
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Executive Summary</h3>
              </div>
              <p className="text-lg font-medium leading-relaxed text-foreground">{analysis.summary}</p>
            </Card>

            {/* Clauses */}
            {analysis.clauses && analysis.clauses.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Clause Analysis</h3>
                  <span className="px-3 py-1 rounded-full bg-muted text-xs font-bold">
                    {analysis.clauses.length} clauses
                  </span>
                </div>
                <div className="grid gap-4">
                  {analysis.clauses.map((clause, idx) => (
                    <ClauseCard
                      key={idx}
                      clause={clause}
                      type={clause.riskLevel === "high" ? "risky" : "favorable"}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {analysis.modificationSuggestions && analysis.modificationSuggestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
                    Modification Suggestions
                  </h3>
                </div>
                <div className="grid gap-4">
                  {analysis.modificationSuggestions.map((suggestion, idx) => (
                    <SuggestionCard key={idx} suggestion={suggestion} />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setAnalysis(null);
                  setCurrentStep("configure");
                }}
                className="flex-1"
              >
                Analyze Again
              </Button>
              <Button
                onClick={() => {
                  setAnalysis(null);
                  setContent("");
                  setCurrentStep("upload");
                }}
                className="flex-1"
              >
                New Analysis
              </Button>
            </div>
          </motion.div>
        )}
      </ToolFlowWrapper>
    </motion.div>
  );
}


