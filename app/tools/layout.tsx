"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import MinimalHeader from "@/components/MinimalHeader";
import LoginModal from "../components/LoginModal";
import { ChatProvider } from "@/app/context/ChatContext";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ChatProvider>
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

        {/* Tools Content Container */}
        <main className="flex-1 overflow-y-auto pt-12 pb-24 md:pt-16 md:pb-32 px-4 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Modals */}
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
      </div>
    </div>
    </ChatProvider>
  );
}
