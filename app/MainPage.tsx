"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { EnhancedBackground } from "@/components/ui/enhanced-background";
import { useChat } from "@/app/context/ChatContext";
import MinimalHeader from "@/components/MinimalHeader";
import MessageList from "./components/MessageList";
import FloatingInput from "@/components/FloatingInput";
import MinimalWelcome from "@/components/MinimalWelcome";
import LoginModal from "./components/LoginModal";
import StudentModeToggle from "./components/StudentModeToggle";
import UploadModal from "./components/UploadModal";
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
  const [loggedIn, setLoggedIn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <EnhancedBackground className="h-screen w-screen overflow-hidden">
      <div className="flex flex-col h-screen">
         {/* Minimal Header */}
         <MinimalHeader
           onOpenProfile={() => setShowLoginModal(true)}
           loggedIn={loggedIn}
         />

         {/* Main Content Area - Messages */}
         <div className="flex-1 overflow-y-auto relative">
           {/* Student Mode Toggle - Floating */}
           <motion.div 
             className="absolute top-4 right-4 z-30"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.5 }}
           >
             <StudentModeToggle />
           </motion.div>

           {/* Messages or Welcome Screen */}
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

         {/* Floating Input - Fixed at Bottom */}
         <FloatingInput onUpload={() => setShowUploadModal(true)} />

        {/* Login Modal */}
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

        {/* Upload Modal */}
        {showUploadModal && (
          <UploadModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
          />
        )}

        {/* Interactive Tour */}
        <AppTour />
      </div>
    </EnhancedBackground>
  );
}