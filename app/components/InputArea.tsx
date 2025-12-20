"use client";

import { Send, Paperclip, GraduationCap, Scale } from "lucide-react";
import { useChat } from "../context/ChatContext";
import { useRef, useEffect } from "react";
import type { KeyboardEvent, ChangeEvent } from "react";


/**
 * Modern Input Area - Inspired by Claude.com
 * - Auto-resizing textarea
 * - Clean, minimal design
 * - Smooth interactions
 */
export default function InputArea() {
  const {
    inputMessage,
    setInputMessage,
    isLoading,
    mode,
    eliLevel,
    sendMessage
  } = useChat();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [inputMessage]);

  // Handle Enter key to send message (Shift+Enter for new line)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
  };

  return (
    <footer className="sticky bottom-0 z-40 bg-transparent">
      <div className="container mx-auto px-4 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg focus-within:border-blue-500 dark:focus-within:border-cyan-500 focus-within:shadow-xl transition-all duration-300 overflow-hidden">
            <textarea
              ref={textareaRef}
              className="flex-1 min-h-[52px] max-h-[200px] px-4 py-3 bg-transparent resize-none outline-none text-[15px] text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 relative z-10"
              placeholder={mode === "student" ? "Ask a legal question (Student Mode)..." : "Ask me about South African law..."}
              value={inputMessage}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              aria-label="Type your message here"
              rows={1}
              aria-busy={isLoading}
            />
            <div className="flex items-center gap-1 pr-2 pb-2 relative z-10">
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                disabled={isLoading}
                title="Attach document (coming soon)"
              >
                <Paperclip size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
              <button
                onClick={() => sendMessage()}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  inputMessage.trim() && !isLoading
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                }`}
                disabled={!inputMessage.trim() || isLoading}
                aria-label="Send message"
                title={inputMessage.trim() && !isLoading ? "Send message" : "Type a message to send"}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          
          <div className="mt-2 px-2 text-xs text-gray-500 dark:text-gray-400 text-center flex items-center justify-center gap-1.5">
            {mode === "student" ? (
              <>
                <GraduationCap className="h-3 w-3" />
                <span>Student Mode: {eliLevel} explanations • Press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono">Shift + Enter</kbd> for new line</span>
              </>
            ) : (
              <>
                <Scale className="h-3 w-3" />
                <span>Powered by verified South African legal sources • Press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono">Shift + Enter</kbd> for new line</span>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
