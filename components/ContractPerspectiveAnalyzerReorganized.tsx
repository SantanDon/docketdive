"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Scale, 
  Users, 
  Loader2, 
  Upload,
  Sparkles,
  FileSearch,
  CheckCircle,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import DocumentDropzone from "@/components/DocumentDropzone";
import type { ContractAnalysis, AnalysisPerspective } from "@/types/legal-tools";
import ToolFlowWrapper from "./ToolFlowWrapper";
import type { ToolStep } from "./ToolFlowWrapper";
import { ToolLoadingState } from "./LoadingStates";

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
    { id: "results" as ToolStep, label: "Results", icon: FileSearch },
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
      setAnalysis(data.analysis || data); // Handle both response formats
      setCurrentStep("results");
    } catch (err: any) {
      setError(err.message);
      setCurrentStep("configure");
    } finally {
      setLoading(false);
    }
  };

  if (content && currentStep === "upload") {
    setCurrentStep("configure");
  }

  return (
    <div className="w-full flex flex-col gap-12 py-8">
      {/* Tool Header - Minimalist */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 bg-muted/30 px-2 py-0.5 rounded">
            Legal Suite / Contract Analysis
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          Perspective <span className="text-primary/60 font-medium">Analyzer</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed opacity-80">
          Critical contract review from specific party viewpoints with automated risk exposure scoring.
        </p>
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
            className="max-w-4xl mx-auto space-y-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 space-y-8">
                {/* Task Checklist */}
                <div className="p-6 rounded-2xl bg-muted/5 border border-border/40 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Audit Workflow</h4>
                  <div className="space-y-3">
                    {[
                      { label: "Upload or Paste Contract", done: !!content },
                      { label: "Select Analysis Perspective", done: currentStep !== "upload" },
                      { label: "Run Risk Analysis", done: !!analysis },
                      { label: "Review Remediation", done: !!analysis },
                    ].map((task, i) => (
                      <div key={i} className="flex items-center gap-3 px-1">
                        <div className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                          task.done ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border"
                        )}>
                          {task.done && <CheckCircle2 className="w-2.5 h-2.5" />}
                        </div>
                        <span className={cn("text-[11px] font-medium", task.done ? "text-foreground" : "text-muted-foreground/60")}>
                          {task.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-1 w-6 bg-primary rounded-full opacity-60" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Configuration</h3>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">
                      Source Document
                    </label>
                    <DocumentDropzone
                      onDocumentLoaded={handleDocumentLoaded}
                      onError={setError}
                      disabled={loading}
                      variant="compact"
                    />
                    {uploadedFileName && (
                      <div className="px-3 py-1.5 rounded-lg bg-green-500/5 border border-green-500/10 text-[9px] font-bold text-green-600/80 uppercase tracking-widest mt-2 flex items-center gap-2">
                         <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                         {uploadedFileName}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                <div className="relative group">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste contract text here..."
                    className="w-full h-[400px] p-6 rounded-2xl bg-background/50 border border-border/40 text-foreground text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none resize-none transition-all leading-relaxed"
                    disabled={loading}
                  />
                  <div className="absolute bottom-4 right-6 text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest">
                    {content.length.toLocaleString()} Chars
                  </div>
                </div>
                {content && (
                  <Button
                    onClick={() => setCurrentStep("configure")}
                    className="w-full h-14 rounded-2xl font-bold"
                  >
                    Select Perspective
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Configure Perspective */}
        {currentStep === "configure" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-12"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-1 w-6 bg-primary rounded-full" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Select Viewpoint</h3>
              </div>
              <PerspectiveSelector
                value={perspective}
                onChange={setPerspective}
                disabled={loading}
              />
            </div>

            <div className="flex flex-col items-center gap-6">
              <Button
                onClick={handleAnalyze}
                disabled={!content.trim() || loading}
                className="w-full max-w-md h-16 rounded-2xl text-lg font-bold shadow-sm"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  "Audit Contract"
                )}
              </Button>
              {error && <p className="text-xs font-bold text-destructive uppercase tracking-widest">{error}</p>}
            </div>
          </motion.div>
        )}

        {/* Step 3: Processing */}
        {currentStep === "processing" && (
          <div className="max-w-xl mx-auto py-24">
            <ToolLoadingState
              toolName="Contract Audit"
              message={`Analyzing risks from ${perspective.replace('_', ' ')} perspective...`}
            />
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === "results" && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Risk Score & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4">
                <RiskScoreCircle score={analysis.riskScore} />
              </div>

              <div className="lg:col-span-8 flex flex-col justify-center space-y-8">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-6 bg-primary rounded-full" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Executive Summary</h3>
                </div>
                <div className="prose-wilson max-w-none text-xl font-medium leading-relaxed text-foreground">
                  <p>{analysis.summary}</p>
                </div>
              </div>
            </div>

            {/* Clauses */}
            {analysis.clauses && analysis.clauses.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Clause Analysis</h3>
                <div className="grid gap-3">
                  {analysis.clauses.map((clause: any, idx: number) => (
                    <ClauseCard
                      key={idx}
                      clause={clause}
                      type={clause.riskLevel === "high" || clause.type === 'risky' ? "risky" : "favorable"}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {analysis.modificationSuggestions && analysis.modificationSuggestions.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                    Remediation Suggestions
                  </h3>
                </div>
                <div className="grid gap-3">
                  {analysis.modificationSuggestions.map((suggestion: any, idx: number) => (
                    <SuggestionCard key={idx} suggestion={suggestion} />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-8 flex flex-col sm:flex-row gap-4">
              <Button
                className="flex-1 h-14 rounded-2xl font-bold"
                onClick={() => {
                  setAnalysis(null);
                  setCurrentStep("configure");
                }}
              >
                Refine Perspective
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-2xl font-bold"
                onClick={() => {
                  setAnalysis(null);
                  setContent("");
                  setCurrentStep("upload");
                }}
              >
                Analyze New Contract
              </Button>
            </div>
          </motion.div>
        )}
      </ToolFlowWrapper>
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
    { id: "party_a" as const, label: "Party A", desc: "Provider/Seller perspective" },
    { id: "party_b" as const, label: "Party B", desc: "Client/Buyer perspective" },
    { id: "neutral" as const, label: "Neutral", desc: "Balanced legal analysis" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {perspectives.map((p) => {
        const isSelected = value === p.id;
        return (
          <button
            key={p.id}
            onClick={() => !disabled && onChange(p.id)}
            disabled={disabled}
            className={`p-6 rounded-2xl border transition-all text-left ${
              isSelected
                ? "bg-primary/5 border-primary shadow-sm"
                : "bg-muted/10 border-border/40 hover:bg-muted/20"
            }`}
          >
            <div className="space-y-1">
              <h4 className={`font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                {p.label}
              </h4>
              <p className="text-xs text-muted-foreground">{p.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function RiskScoreCircle({ score }: { score: number }) {
  const colorClass = score > 75 ? "text-destructive" : score > 40 ? "text-warning" : "text-primary";
  
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-muted/20 border border-border/40 aspect-square">
      <div className="relative flex items-center justify-center">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="60"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-muted/20"
          />
          <circle
            cx="64"
            cy="64"
            r="60"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={376.8}
            strokeDashoffset={376.8 * (1 - score / 100)}
            className={`${colorClass} transition-all duration-1000 ease-out`}
          />
        </svg>
        <span className={`absolute text-4xl font-bold ${colorClass}`}>{score}</span>
      </div>
      <span className="mt-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Risk Exposure Score
      </span>
    </div>
  );
}

function ClauseCard({ clause, type }: { clause: any; type: 'risky' | 'favorable' }) {
  return (
    <div className="group p-6 rounded-2xl bg-muted/10 border border-border/40 hover:bg-muted/20 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-foreground">{clause.clauseName || clause.clauseNumber}</h4>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
              type === 'risky' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
            }`}>
              {clause.riskLevel || type}
            </span>
          </div>
          <p className="text-xs text-muted-foreground italic">&quot;{clause.clauseText || clause.originalText}&quot;</p>
        </div>
      </div>
      <div className="prose-wilson prose-sm max-w-none text-muted-foreground">
        <p>{clause.analysis}</p>
      </div>
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: any }) {
  return (
    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <h4 className="text-sm font-bold text-foreground">Suggested Change</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Original Language</span>
            <p className="text-xs text-muted-foreground italic bg-muted/30 p-3 rounded-xl border border-border/20">
              &quot;{suggestion.currentText || suggestion.originalPart}&quot;
            </p>
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Revised Amendment</span>
            <p className="text-xs text-foreground font-medium bg-primary/10 p-3 rounded-xl border border-primary/20">
              {suggestion.suggestedText || suggestion.remedy}
            </p>
          </div>
        </div>
        <div className="pt-2 border-t border-primary/10">
          <p className="text-[11px] text-muted-foreground">
            <span className="font-bold text-primary mr-2">RATIONALE:</span>
            {suggestion.rationale}
          </p>
        </div>
      </div>
    </div>
  );
}
