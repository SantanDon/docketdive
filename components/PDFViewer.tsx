"use client";

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PDFViewerRef, PDFViewerState, TextHighlight } from "@/types/document-processing";

// ============================================
// Types
// ============================================

interface PDFViewerProps {
  file: File | string | null;
  onTextSelect?: (text: string, page: number) => void;
  highlights?: TextHighlight[];
  initialPage?: number;
  className?: string;
}

// ============================================
// Constants
// ============================================

const MIN_SCALE = 0.25;
const MAX_SCALE = 4.0;
const SCALE_STEP = 0.25;

// ============================================
// PDF Viewer Component
// ============================================

const PDFViewer = forwardRef<PDFViewerRef, PDFViewerProps>(
  ({ file, onTextSelect, highlights = [], initialPage = 1, className }, ref) => {
    const [state, setState] = useState<PDFViewerState>({
      currentPage: initialPage,
      totalPages: 0,
      scale: 1.0,
      isLoading: true,
      error: null,
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const pdfDocRef = useRef<any>(null);
    const renderTaskRef = useRef<any>(null);

    // ============================================
    // Navigation Functions
    // ============================================

    const goToPage = useCallback((page: number) => {
      if (!pdfDocRef.current) return;
      const totalPages = pdfDocRef.current.numPages;
      const newPage = Math.max(1, Math.min(page, totalPages));
      setState(prev => ({ ...prev, currentPage: newPage }));
    }, []);

    const nextPage = useCallback(() => {
      goToPage(state.currentPage + 1);
    }, [state.currentPage, goToPage]);

    const prevPage = useCallback(() => {
      goToPage(state.currentPage - 1);
    }, [state.currentPage, goToPage]);

    // ============================================
    // Zoom Functions
    // ============================================

    const setScale = useCallback((newScale: number) => {
      const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
      setState(prev => ({ ...prev, scale: clampedScale }));
    }, []);

    const zoomIn = useCallback(() => {
      setScale(state.scale + SCALE_STEP);
    }, [state.scale, setScale]);

    const zoomOut = useCallback(() => {
      setScale(state.scale - SCALE_STEP);
    }, [state.scale, setScale]);

    const fitToWidth = useCallback(() => {
      if (!containerRef.current || !pdfDocRef.current) return;
      
      pdfDocRef.current.getPage(state.currentPage).then((page: any) => {
        const viewport = page.getViewport({ scale: 1 });
        const containerWidth = containerRef.current!.clientWidth - 32; // padding
        const newScale = containerWidth / viewport.width;
        setScale(newScale);
      });
    }, [state.currentPage, setScale]);

    const highlightText = useCallback((text: string, page: number) => {
      // Text highlighting would require text layer implementation
      console.log('Highlight:', text, 'on page', page);
    }, []);

    // ============================================
    // Expose Methods via Ref
    // ============================================

    useImperativeHandle(ref, () => ({
      goToPage,
      nextPage,
      prevPage,
      setScale,
      fitToWidth,
      highlightText,
    }), [goToPage, nextPage, prevPage, setScale, fitToWidth, highlightText]);

    // ============================================
    // Load PDF Document
    // ============================================

    useEffect(() => {
      if (!file) {
        setState(prev => ({ ...prev, isLoading: false, error: 'No file provided' }));
        return;
      }

      const loadPDF = async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
          const pdfjsLib = await import('pdfjs-dist');
          
          // Configure worker
          if (typeof window !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 
              `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
          }

          let pdfData: ArrayBuffer | string;
          
          if (file instanceof File) {
            pdfData = await file.arrayBuffer();
          } else {
            pdfData = file;
          }

          const loadingTask = pdfjsLib.getDocument({ data: pdfData });
          const pdf = await loadingTask.promise;
          
          pdfDocRef.current = pdf;
          setState(prev => ({
            ...prev,
            totalPages: pdf.numPages,
            isLoading: false,
            currentPage: Math.min(initialPage, pdf.numPages),
          }));
        } catch (error: any) {
          console.error('PDF load error:', error);
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error.message || 'Failed to load PDF',
          }));
        }
      };

      loadPDF();

      return () => {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }
      };
    }, [file, initialPage]);

    // ============================================
    // Render Current Page
    // ============================================

    useEffect(() => {
      if (!pdfDocRef.current || !canvasRef.current) return;

      const renderPage = async () => {
        try {
          // Cancel any ongoing render
          if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
          }

          const page = await pdfDocRef.current.getPage(state.currentPage);
          const viewport = page.getViewport({ scale: state.scale });
          
          const canvas = canvasRef.current!;
          const context = canvas.getContext('2d')!;
          
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const renderContext = {
            canvasContext: context,
            viewport,
            canvas,
          };

          renderTaskRef.current = page.render(renderContext);
          await renderTaskRef.current.promise;
        } catch (error: any) {
          if (error.name !== 'RenderingCancelledException') {
            console.error('Render error:', error);
          }
        }
      };

      renderPage();
    }, [state.currentPage, state.scale]);

    // ============================================
    // Render
    // ============================================

    if (state.error) {
      return (
        <div className={cn("flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg", className)}>
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 dark:text-red-400 text-center">{state.error}</p>
        </div>
      );
    }

    if (state.isLoading) {
      return (
        <div className={cn("flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg", className)}>
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading PDF...</p>
        </div>
      );
    }

    if (!file) {
      return (
        <div className={cn("flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg", className)}>
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No PDF loaded</p>
        </div>
      );
    }

    return (
      <div className={cn("flex flex-col bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden", className)}>
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevPage}
              disabled={state.currentPage <= 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[80px] text-center">
              {state.currentPage} / {state.totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextPage}
              disabled={state.currentPage >= state.totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomOut}
              disabled={state.scale <= MIN_SCALE}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[50px] text-center">
              {Math.round(state.scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomIn}
              disabled={state.scale >= MAX_SCALE}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fitToWidth}
              className="h-8 w-8 p-0"
              title="Fit to width"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Canvas Container */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto p-4 flex justify-center"
        >
          <motion.canvas
            ref={canvasRef}
            className="shadow-lg bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    );
  }
);

PDFViewer.displayName = 'PDFViewer';

export default PDFViewer;
