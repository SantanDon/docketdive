'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Loader2, Check, X, Zap, Database, FileUp } from 'lucide-react';

interface UploadedFile {
  text: string;
  metadata: {
    fileName: string;
    fileSize: number;
    fileType: string;
    pageCount: number;
    wordCount: number;
    charCount: number;
  };
}

export default function DocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [addingToKB, setAddingToKB] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadedFile(data);
      setSuccess(`Successfully extracted ${data.metadata.wordCount.toLocaleString()} words from ${data.metadata.fileName}`);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.docx')) {
        setError('Invalid file type. Only PDF, DOCX, and TXT files are supported.');
        return;
      }

      // Validate file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size exceeds 50MB limit');
        return;
      }

      handleFileUpload(file);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFileUpload(file);
    }
  };

  const handleQuickAnalysis = async () => {
    if (!uploadedFile) return;

    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: uploadedFile.text,
          fileName: uploadedFile.metadata.fileName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysis(data.analysis);
      setSuccess(`Analysis completed in ${data.metadata.responseTime}`);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddToKnowledgeBase = async () => {
    if (!uploadedFile) return;

    setAddingToKB(true);
    setError(null);

    try {
      const response = await fetch('/api/documents/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: uploadedFile.text,
          fileName: uploadedFile.metadata.fileName,
          metadata: {
            category: 'Legal Document',
            fileType: uploadedFile.metadata.fileType,
            pageCount: uploadedFile.metadata.pageCount,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add to knowledge base');
      }

      setSuccess(`Added ${data.chunksStored} chunks to knowledge base. You can now query this document!`);
    } catch (err: any) {
      setError(err.message || 'Failed to add to knowledge base');
    } finally {
      setAddingToKB(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Document Upload & Analysis</h2>
        <p className="text-gray-600">
          Upload legal documents (PDF, DOCX, TXT) for quick analysis or to add to your knowledge base
        </p>
      </div>

      {/* Upload Area with Drag & Drop */}
      <div
        className={`border-2 rounded-lg p-8 text-center transition-colors mb-6
          ${isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-dashed border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
        `}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
      >
        <div className="flex flex-col items-center justify-center">
          <FileUp className={`mx-auto h-12 w-12 ${isDragActive ? 'text-blue-600' : 'text-gray-400'} mb-4`} />
          <p className="text-lg font-medium mb-2">
            {isDragActive ? 'Drop your file here' : 'Drag & drop your file, or click to browse'}
          </p>
          <p className="text-sm text-gray-500 mb-4">PDF, DOCX, or TXT (Max 50MB)</p>

          <button
            type="button"
            className={`px-4 py-2 rounded-lg font-medium transition-colors
              ${isDragActive
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}
            `}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || analyzing || addingToKB}
          >
            {uploading ? 'Processing...' : 'Select File'}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.docx,.txt"
            onChange={handleFileInputChange}
            disabled={uploading || analyzing || addingToKB}
          />
        </div>
      </div>

      {/* Loading State */}
      {uploading && (
        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg mb-6">
          <Loader2 className="animate-spin mr-2 text-blue-600" />
          <span className="text-blue-600">Extracting text from document...</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start p-4 bg-red-50 rounded-lg mb-6">
          <X className="mr-2 text-red-600 shrink-0 mt-0.5" />
          <span className="text-red-600">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && !error && (
        <div className="flex items-start p-4 bg-green-50 rounded-lg mb-6">
          <Check className="mr-2 text-green-600 shrink-0 mt-0.5" />
          <span className="text-green-600">{success}</span>
        </div>
      )}

      {/* Uploaded File Info */}
      {uploadedFile && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-start mb-4">
            <FileText className="mr-3 text-gray-600 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2 truncate">{uploadedFile.metadata.fileName}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="mr-1">📄</span> Pages: {uploadedFile.metadata.pageCount}
                </div>
                <div className="flex items-center">
                  <span className="mr-1">📝</span> Words: {uploadedFile.metadata.wordCount.toLocaleString()}
                </div>
                <div className="flex items-center">
                  <span className="mr-1">💾</span> Size: {formatBytes(uploadedFile.metadata.fileSize)}
                </div>
                <div className="flex items-center md:hidden">
                  <span className="mr-1">🔤</span> Chars: {uploadedFile.metadata.charCount.toLocaleString()}
                </div>
              </div>
              <div className="hidden md:flex text-sm text-gray-600 mt-1">
                <div className="flex items-center mr-4">
                  <span className="mr-1">🔤</span> Characters: {uploadedFile.metadata.charCount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleQuickAnalysis}
              disabled={analyzing || addingToKB}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[150px]"
            >
              {analyzing ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Quick Analysis
                </>
              )}
            </button>

            <button
              onClick={handleAddToKnowledgeBase}
              disabled={analyzing || addingToKB}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[150px]"
            >
              {addingToKB ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Adding...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Add to Knowledge Base
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">📊 Analysis Results</h3>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">{analysis}</div>
          </div>
        </div>
      )}
    </div>
  );
}
