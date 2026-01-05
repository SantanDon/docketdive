import "./global.css";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "./components/ErrorBoundary";
import { PostHogProvider } from "./providers/PostHogProvider";
import FeedbackPopup from "../components/FeedbackPopup";
import { ErrorProvider } from "./context/ErrorContext";
import { ToastProvider } from "../components/ui/Toast";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "DocketDive - South African Legal AI Assistant",
  description:
    "Your AI-powered legal assistant specializing in South African law",
  icons: {
    icon: "/assets/WhatsApp Image 2025-08-05 at 13.57.52_050c3907.jpg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Professional Legal Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>
        <ErrorBoundary>
          <ErrorProvider>
            <ToastProvider>
              <Suspense fallback={<div>Loading...</div>}>
                <PostHogProvider>
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                  >
                    {children}
                    <FeedbackPopup />
                    <footer className="bg-muted/50 border-t mt-16">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="text-center text-sm text-muted-foreground">
                      <p className="mb-2">
                        <strong>Disclaimer:</strong> DocketDive is still in development.
                        While we strive for accuracy, please verify information with official legal sources.
                        Feedback is greatly appreciated!
                      </p>
                      <p>
                        Built with ❤️ for South African legal research
                      </p>
                    </div>
                  </div>
                </footer>
                   </ThemeProvider>
                 </PostHogProvider>
                </Suspense>
                </ToastProvider>
                </ErrorProvider>
                </ErrorBoundary>
                </body>
                </html>
                );
                }
