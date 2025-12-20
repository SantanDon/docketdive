"use client";

import { useState, useEffect, useRef } from "react";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

import { useChat } from "@/app/context/ChatContext";
import Header from "./components/Header";
import MessageList from "./components/MessageList";
import InputArea from "./components/InputArea";
import WelcomeScreen from "./components/WelcomeScreen";
import LoginModal from "./components/LoginModal";
import StudentModeToggle from "./components/StudentModeToggle";
import UploadModal from "./components/UploadModal";

/**
 * Main Application Page - Modern Clean Layout
 * - Claude.com inspired design
 * - Clean, minimal interface
 * - Professional legal assistant experience
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
    <BackgroundGradientAnimation containerClassName="h-screen w-screen">
      <div className="flex flex-col h-full">
      {/* Header */}
      <Header 
        onOpenProfile={() => setShowLoginModal(true)}
        onUpload={() => setShowUploadModal(true)} 
        loggedIn={loggedIn} 
        onSearch={(query) => {
          setInputMessage(query);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Student Mode Toggle - Floating */}
        <div className="absolute top-20 right-4 z-30">
          <StudentModeToggle />
        </div>

        {/* Messages or Welcome Screen */}
        {messages.length === 0 ? (
          <WelcomeScreen setInputMessage={setInputMessage} textareaRef={inputRef} />
        ) : (
          <MessageList 
            messages={messages} 
            isLoading={isLoading} 
            mode={mode} 
            messagesEndRef={messagesEndRef} 
          />
        )}

        {/* Input Area */}
        <InputArea />
      </div>

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
      </div>
    </BackgroundGradientAnimation>
  );
}