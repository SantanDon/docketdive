"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolTheme } from "@/components/ui/tool-themes";

interface DocumentDropzoneProps {
  onDocumentLoaded: (content: string, metadata: DocumentMetadata) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  enableOCR?: boolean; // Enable OCR for scanned PDFs and images
  variant?: "full" | "compact";
  toolTheme?: ToolTheme; // Tool-specific theme for customization
}

interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  pageCount: number;
  wordCount: number;
  charCount: number;
  isScanned?: boolean;
  ocrConfidence?: number;
}

type UploadState = "idle" | "dragging" | "uploading" | "ocr" | "success" | "error";

export default function DocumentDropzone({
  onDocumentLoaded,
  onError,
  accept = ".pdf,.docx,.txt,.png,.jpg,.jpeg",
  maxSize = 50,
  className,
  disabled = false,
  enableOCR = true,
  variant = "full",
  toolTheme,
}: DocumentDropzoneProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadedFile, setLoadedFile] = useState<DocumentMetadata | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setState("dragging");
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState("idle");
  }, []);

  // Client-side OCR using Tesseract.js
  const performOCR = useCallback(async (imageData: string): Promise<{ text: string; confidence: number }> => {
    try {
      // Dynamically import Tesseract.js
      const Tesseract = await import('tesseract.js');
      
      const result = await Tesseract.recognize(
        imageData,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        }
      );
      
      return {
        text: result.data.text,
        confidence: result.data.confidence
      };
    } catch (error) {
      console.error('OCR error:', error);
      throw new Error('OCR processing failed');
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      const error = `File size exceeds ${maxSize}MB limit`;
      setErrorMessage(error);
      setState("error");
      onError?.(error);
      return;
    }

    // Validate file type - now includes images
    const validTypes = [
      "application/pdf", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
      "text/plain",
      "image/png",
      "image/jpeg",
      "image/jpg"
    ];
    const isValidType = validTypes.includes(file.type) || 
                        file.name.endsWith(".pdf") || 
                        file.name.endsWith(".docx") || 
                        file.name.endsWith(".txt") ||
                        file.name.endsWith(".png") ||
                        file.name.endsWith(".jpg") ||
                        file.name.endsWith(".jpeg");
    
    if (!isValidType) {
      const error = "Invalid file type. Supported: PDF, DOCX, TXT, PNG, JPG";
      setErrorMessage(error);
      setState("error");
      onError?.(error);
      return;
    }

    setState("uploading");
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (enableOCR) {
        formData.append("enableOCR", "true");
      }

      setProgress(30);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setProgress(70);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      
      // Check if we need to do client-side OCR
      if (data.requiresClientOCR && enableOCR) {
        setState("ocr");
        setOcrProgress(0);
        
        try {
          const ocrResult = await performOCR(data.imageData);
          
          const metadata: DocumentMetadata = {
            fileName: data.metadata.fileName,
            fileSize: data.metadata.fileSize,
            fileType: data.metadata.fileType,
            pageCount: 1,
            wordCount: ocrResult.text.trim().split(/\s+/).filter((w: string) => w.length > 0).length,
            charCount: ocrResult.text.length,
            isScanned: true,
            ocrConfidence: Math.round(ocrResult.confidence),
          };

          setLoadedFile(metadata);
          setState("success");
          onDocumentLoaded(ocrResult.text, metadata);
        } catch {
          throw new Error('OCR processing failed. Please try a clearer image.');
        }
      } else {
        setProgress(100);

        const metadata: DocumentMetadata = {
          fileName: data.metadata.fileName,
          fileSize: data.metadata.fileSize,
          fileType: data.metadata.fileType,
          pageCount: data.metadata.pageCount,
          wordCount: data.metadata.wordCount,
          charCount: data.metadata.charCount,
          isScanned: data.metadata.isScanned,
          ocrConfidence: data.metadata.ocrConfidence,
        };

        setLoadedFile(metadata);
        setState("success");
        onDocumentLoaded(data.text, metadata);
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setState("idle");
      }, 3000);

    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to process document";
      setErrorMessage(errorMsg);
      setState("error");
      onError?.(errorMsg);
    }
  }, [maxSize, onDocumentLoaded, onError, enableOCR, performOCR]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]!);
    }
  }, [disabled, processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]!);
    }
  }, [processFile]);

  const handleClick = useCallback(() => {
    if (!disabled && state !== "uploading" && state !== "ocr") {
      fileInputRef.current?.click();
    }
  }, [disabled, state]);

  const handleReset = useCallback(() => {
    setState("idle");
    setErrorMessage("");
    setLoadedFile(null);
    setProgress(0);
    setOcrProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      
      <motion.div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-3xl transition-all duration-300 cursor-pointer overflow-hidden",
          "flex flex-col items-center justify-center gap-3",
          variant === "full" ? "p-10 min-h-[220px]" : "p-6 min-h-[140px]",
          "bg-muted/20 border border-border/40 hover:bg-muted/30 hover:border-primary/40",
          state === "dragging" && "border-primary/60 bg-primary/5 scale-[1.01]",
          (state === "uploading" || state === "ocr") && "cursor-wait",
          state === "success" && "border-green-500/40 bg-green-500/5",
          state === "error" && "border-destructive/40 bg-destructive/5",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        animate={{
          scale: state === "dragging" ? 1.01 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <div className={cn(
                "rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg transition-transform hover:scale-105",
                variant === "full" ? "h-14 w-14" : "h-10 w-10"
              )}>
                <Upload className={cn("text-white", variant === "full" ? "h-6 w-6" : "h-5 w-5")} />
              </div>
              <div>
                <p className={cn("font-medium text-slate-900 dark:text-slate-100", variant === "full" ? "text-lg" : "text-base")}>
                  {variant === "full" ? (toolTheme ? toolTheme.uploadMessage : "Drop your document here") : "Click to upload document"}
                </p>
                {variant === "full" && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {toolTheme ? "Upload and analyze with AI" : "or select from your computer"}
                  </p>
                )}
              </div>
              {variant === "full" && (
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1 rounded-full">
                  <span>PDF, DOCX, TXT, images • {maxSize}MB</span>
                </div>
              )}
            </motion.div>
          )}

          {state === "dragging" && (
            <motion.div
              key="dragging"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
              >
                <FileText className="h-8 w-8 text-primary-foreground" />
              </motion.div>
              <p className="font-medium text-primary text-lg">Drop to upload</p>
            </motion.div>
          )}

          {state === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 w-full max-w-xs"
            >
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
              </div>
              <div className="w-full">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Processing...</span>
                  <span className="text-primary font-medium">{progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {state === "ocr" && (
            <motion.div
              key="ocr"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 w-full max-w-xs"
            >
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <Eye className="h-8 w-8 text-primary-foreground" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-primary"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
              <div className="w-full">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Running OCR...</span>
                  <span className="text-primary font-medium">{ocrProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${ocrProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Extracting text from image...
                </p>
              </div>
            </motion.div>
          )}

          {state === "success" && loadedFile && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg"
              >
                <CheckCircle2 className="h-8 w-8 text-white" />
              </motion.div>
              <div className="text-center">
                <p className="font-medium text-green-600 dark:text-green-400 text-lg">
                  Document loaded!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {loadedFile.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {loadedFile.wordCount.toLocaleString()} words • {loadedFile.pageCount} pages
                </p>
                {loadedFile.isScanned && (
                  <div className="mt-2 flex items-center justify-center gap-1 text-xs">
                    <Eye className="h-3 w-3 text-primary" />
                    <span className="text-muted-foreground">OCR processed</span>
                    {loadedFile.ocrConfidence !== undefined && loadedFile.ocrConfidence < 70 && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 ml-2">
                        <AlertTriangle className="h-3 w-3" />
                        Low confidence ({loadedFile.ocrConfidence}%)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {state === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-destructive to-red-600 flex items-center justify-center shadow-lg">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <div className="text-center">
                <p className="font-medium text-destructive text-lg">Upload failed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {errorMessage}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="text-sm text-primary hover:underline font-medium"
              >
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reset button for success state */}
        {state === "success" && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            className="absolute top-3 right-3 p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Upload another document"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
