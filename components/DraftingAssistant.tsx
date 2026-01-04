"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Loader2,
  Scale,
  Gavel,
  FileSignature,
  ScrollText,
  BookOpen,
  AlertCircle,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { getToolTheme } from "@/components/ui/tool-themes";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

type DocumentType = "contract" | "letter_of_demand" | "pleading" | "motion" | "legal_opinion" | "cease_and_desist";
type ToneProfile = "formal" | "aggressive" | "conciliatory" | "plain_language";

interface Template {
  id: string;
  name: string;
  documentType: DocumentType;
  description: string;
  requiredFields: string[];
}

interface ToneOption {
  id: ToneProfile;
  name: string;
  description: string;
}

// ============================================
// Document Type Icons
// ============================================

const documentIcons: Record<DocumentType, typeof FileText> = {
  contract: FileSignature,
  letter_of_demand: AlertCircle,
  pleading: Gavel,
  motion: ScrollText,
  legal_opinion: BookOpen,
  cease_and_desist: Scale,
};

// ============================================
// Main Component
// ============================================

interface DraftingAssistantProps {
  onClose?: () => void;
}

export default function DraftingAssistant({ onClose }: DraftingAssistantProps) {
  const theme = getToolTheme('drafter');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [toneOptions, setToneOptions] = useState<ToneOption[]>([]);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [selectedTone, setSelectedTone] = useState<ToneProfile>("formal");
  const [context, setContext] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showToneDropdown, setShowToneDropdown] = useState(false);
  const draftRef = useRef<HTMLDivElement>(null);

  // Load templates on mount
  useEffect(() => {
    fetch("/api/drafting")
      .then(res => res.json())
      .then(data => {
        setTemplates(data.templates || []);
        setToneOptions(data.toneProfiles || []);
      })
      .catch(console.error);
  }, []);

  // Generate draft
  const generateDraft = async () => {
    if (!selectedType || !context.trim()) return;

    setLoading(true);
    setDraft("");
    setStatus("Preparing draft...");

    try {
      const res = await fetch("/api/drafting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: selectedType,
          tone: selectedTone,
          context: context.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to generate draft");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.trim());

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === "text_delta") {
              setDraft(prev => prev + (parsed.content as string));
              setStatus("");
            } else if (parsed.type === "status" && parsed.content) {
              setStatus(parsed.content as string);
            } else if (parsed.type === "error") {
              throw new Error(parsed.content as string);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    } catch (error: any) {
      console.error("Draft generation error:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Export draft
  const exportDraft = async (format: "docx" | "txt") => {
    if (!draft) return;

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: draft,
          format,
          title: templates.find(t => t.documentType === selectedType)?.name || "Legal Document",
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Export failed");
      }

      // Download the file
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `draft.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Export error:", error);
      alert(error.message);
    }
  };

  const selectedTemplate = templates.find(t => t.documentType === selectedType);
  const selectedToneOption = toneOptions.find(t => t.id === selectedTone);

  return (
    <div className="w-full flex flex-col gap-10">
      {/* Header Island */}
      <div className={cn("w-full pt-6 px-1", theme.headerBg)}>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center border", theme.cardBg)}>
              <FileSignature size={32} className={theme.textColor} />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Drafting<span className={cn("font-light", theme.textColor)}>Assistant</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl font-medium">
                {theme.description}
              </p>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full h-10 w-10 hover:bg-muted"
            >
              <AlertCircle size={20} className="text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Island: Configuration */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 flex flex-col gap-6"
        >
          <div className="p-8 rounded-4xl bg-muted/10 backdrop-blur-sm space-y-8 h-fit sticky top-24">
            <div className="space-y-6">
              {/* Document Type Selector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                  Document Type
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                    className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-background border border-border gap-3 hover:border-indigo-500/50 hover:bg-muted/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      {selectedTemplate ? (
                        <>
                          {(() => {
                            const Icon = documentIcons[selectedType!];
                            return <Icon size={22} className="text-indigo-500" />;
                          })()}
                          <span className="font-medium text-foreground">{selectedTemplate.name}</span>
                        </>
                      ) : (
                        <>
                          <BookOpen size={20} className="text-muted-foreground" />
                          <span className="text-muted-foreground">Select a template...</span>
                        </>
                      )}
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-muted-foreground transition-transform duration-300 ${showTypeDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {showTypeDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-50 w-full mt-3 p-2 bg-background border border-border rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl"
                      >
                        <div className="max-h-80 overflow-y-auto scrollbar-hide">
                          {templates.map(template => {
                            const Icon = documentIcons[template.documentType];
                            return (
                              <button
                                key={template.id}
                                onClick={() => {
                                  setSelectedType(template.documentType);
                                  setShowTypeDropdown(false);
                                }}
                                className={`w-full flex items-start gap-4 p-4 rounded-2xl hover:bg-muted/80 transition-all text-left group ${
                                  selectedType === template.documentType ? "bg-indigo-500/10" : ""
                                }`}
                              >
                                <div className={`p-2 rounded-xl transition-colors ${
                                  selectedType === template.documentType ? "bg-indigo-500 text-white" : "bg-muted group-hover:bg-indigo-500/20 text-muted-foreground group-hover:text-indigo-500"
                                }`}>
                                  <Icon size={18} />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{template.name}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">{template.description}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Tone Selector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                  Drafting Tone
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowToneDropdown(!showToneDropdown)}
                    className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-background border border-border gap-3 hover:border-indigo-500/50 hover:bg-muted/30 transition-all text-left"
                  >
                    <span className="font-medium text-foreground">
                      {selectedToneOption?.name || "Formal"}
                    </span>
                    <ChevronDown
                      size={20}
                      className={`text-muted-foreground transition-transform duration-300 ${showToneDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {showToneDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-50 w-full mt-3 p-2 bg-background border border-border rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl"
                      >
                        {toneOptions.map(tone => (
                          <button
                            key={tone.id}
                            onClick={() => {
                              setSelectedTone(tone.id);
                              setShowToneDropdown(false);
                            }}
                            className={`w-full flex items-start gap-4 p-4 rounded-2xl hover:bg-muted/80 transition-all text-left ${
                              selectedTone === tone.id ? "bg-indigo-500/10" : ""
                            }`}
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">{tone.name}</p>
                              <p className="text-xs text-muted-foreground">{tone.description}</p>
                            </div>
                            {selectedTone === tone.id && (
                              <div className="h-2 w-2 rounded-full bg-indigo-500 self-center" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Context Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                  Context & Requirements
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Describe the specific purpose, parties involved, and key terms for this draft..."
                  className="w-full h-48 px-5 py-4 rounded-2xl bg-background border border-border/60 text-foreground resize-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-muted-foreground/50 leading-relaxed"
                />
              </div>
            </div>

            <Button
              onClick={generateDraft}
              disabled={!selectedType || !context.trim() || loading}
              className="w-full h-16 rounded-2xl text-lg font-bold shadow-sm transition-all"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-3" size={20} />
                  <span>Drafting in Progress...</span>
                </>
              ) : (
                <>
                  <Sparkles className="mr-3" size={20} />
                  <span>Execute AI Draft</span>
                </>
              )}
            </Button>
            
            {status && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium text-center"
              >
                {status}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Right Island: Preview/Output */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 flex flex-col gap-6 h-[800px]"
        >
          <div className="flex-1 rounded-4xl bg-muted/10 backdrop-blur-sm overflow-hidden flex flex-col shadow-sm">
            <div className="p-6 border-b border-border/40 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center border border-border">
                  <FileText size={16} className="text-muted-foreground" />
                </div>
                <span className="font-bold text-sm tracking-widest uppercase text-muted-foreground">Document Preview</span>
              </div>
              
              {draft && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exportDraft("docx")}
                    className="rounded-xl h-9 hover:bg-background border border-transparent hover:border-border transition-all"
                  >
                    <Download size={14} className="mr-2" />
                    Word
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exportDraft("txt")}
                    className="rounded-xl h-9 hover:bg-background border border-transparent hover:border-border transition-all"
                  >
                    <Download size={14} className="mr-2" />
                    Text
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-10 scrollbar-hide" ref={draftRef}>
              {draft ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="prose prose-slate dark:prose-invert max-w-none 
                    prose-headings:font-bold prose-headings:tracking-tight
                    prose-p:leading-relaxed prose-p:text-foreground/90 
                    prose-strong:text-indigo-600 dark:prose-strong:text-indigo-400"
                >
                  <ReactMarkdown>{draft}</ReactMarkdown>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 space-y-4">
                  <div className="p-8 rounded-full bg-muted/20 border-2 border-dashed border-muted relative">
                    <FileText size={64} className="opacity-20" />
                    {loading && (
                      <motion.div
                        className="absolute inset-0 border-2 border-indigo-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-medium text-muted-foreground/60">No draft available</p>
                    <p className="text-sm">Configure your requirements and click Generate.</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-border/40 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground font-medium">
              <div className="flex items-center gap-4">
                <span>STATUS: {loading ? "DRAFTING..." : (draft ? "READY" : "IDLE")}</span>
                {draft && <span>WORDS: {draft.split(/\s+/).length}</span>}
              </div>
              <div className="flex items-center gap-1">
                <Sparkles size={12} className="text-indigo-500" />
                <span>AI ASSISTED</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
