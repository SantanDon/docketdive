"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SimpleUploadButtonProps {
  onFileSelected: (file: File) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

/**
 * Simple, unobtrusive upload button
 * Inspired by Vercel and Linear's minimal upload patterns
 */
export function SimpleUploadButton({
  onFileSelected,
  onError,
  accept = ".pdf,.docx,.txt,.png,.jpg,.jpeg",
  maxSize = 50,
  disabled = false,
  className,
  variant = "outline",
  size = "md",
}: SimpleUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-5 text-base",
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      onError?.(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    // Validate file type
    const acceptedTypes = accept.split(",").map((t) => t.trim());
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      onError?.(`File type not supported. Accepted: ${accept}`);
      return;
    }

    setUploading(true);
    setUploaded(false);

    try {
      // Simulate upload delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 300));
      onFileSelected(file);
      setUploaded(true);
      setTimeout(() => setUploaded(false), 2000);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploading}
      />
      <Button
        type="button"
        variant={variant}
        size={size === "md" ? "default" : size}
        onClick={handleClick}
        disabled={disabled || uploading}
        className={cn(
          "gap-2 transition-all",
          sizeClasses[size],
          className
        )}
      >
        <AnimatePresence mode="wait">
          {uploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading...</span>
            </motion.div>
          ) : uploaded ? (
            <motion.div
              key="uploaded"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 text-green-600 dark:text-green-400"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Uploaded</span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Document</span>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </>
  );
}


