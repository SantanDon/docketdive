"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { EnhancedBackground } from "@/components/ui/enhanced-background";
import { useChat } from "@/app/context/ChatContext";
import MinimalHeader from "@/components/MinimalHeader";
import Sidebar from "@/components/Sidebar";
import MessageList from "./components/MessageList";
import FloatingInput from "@/components/FloatingInput";
import MinimalWelcome from "@/components/MinimalWelcome";
import LoginModal from "./components/LoginModal";
import StudentModeToggle from "./components/StudentModeToggle";
import UploadModal from "./components/UploadModal";
import PrivacySettings from "@/components/PrivacySettings";
import { motion } from "framer-motion";

// Dynamically import AppTour to avoid SSR issues with localStorage
const AppTour = dynamic(() => import("@/components/AppTour"), { ssr: false });

/**
 * Premium Main Application Page
 * - Minimalist, professional design
 * - Elegant animations and transitions
 * - Premium user experience
 */
export default function MainPage() {
  const { messages, isLoading, mode, inputMessage, setInputMessage } = useChat();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Permanent on Desktop (lg:), Toggleable on Mobile */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        isMobile={isMobile} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Minimal Header */}
        <MinimalHeader
          onOpenProfile={() => setShowLoginModal(true)}
          loggedIn={loggedIn}
        />

        {/* Chat / Content Container */}
        <main className="flex-1 overflow-hidden flex flex-col pt-12">
          {/* Messages Area - Wide Centered Container */}
          <div className="flex-1 overflow-y-auto relative scroll-smooth">
            <div className="max-w-5xl mx-auto w-full py-8">
               {messages.length === 0 ? (
                 <MinimalWelcome setInputMessage={setInputMessage} textareaRef={inputRef} />
               ) : (
                 <MessageList 
                   messages={messages} 
                   isLoading={isLoading} 
                   mode={mode} 
                   messagesEndRef={messagesEndRef} 
                 />
               )}
            </div>
          </div>

          {/* Input Area - Wide Centered Container */}
          <div className="w-full">
            <div className="max-w-5xl mx-auto w-full py-8">
              <FloatingInput onUpload={() => setShowUploadModal(true)} />
            </div>
          </div>
        </main>

        {/* Modals & Other Components */}
        {showLoginModal && (
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onLogin={() => {
              setLoggedIn(true);
              setShowLoginModal(false);
            }}
          />
        )}

        {showUploadModal && (
          <UploadModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
          />
        )}

        <AppTour />
      </div>
    </div>
  );
}