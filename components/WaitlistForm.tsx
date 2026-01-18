"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePostHog } from "posthog-js/react";

interface WaitlistFormProps {
  onSuccess?: () => void;
  className?: string;
}

/**
 * Premium Waitlist Form Component
 * - Sophisticated design
 * - Smooth state transitions
 * - AI-themed accents
 */
export default function WaitlistForm({ onSuccess, className }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState("");

  const posthog = usePostHog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || "You're on the list!");
        posthog?.capture('waitlist_joined', { email, source: 'waitlist_form' });
        onSuccess?.();
      } else {
        setStatus('error');
        setMessage(data.error || "Something went wrong.");
      }
    } catch (err) {
      setStatus('error');
      setMessage("Failed to join waitlist. Please try again.");
    }
  };

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center text-center p-6 space-y-3"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <CheckCircle2 className="text-primary w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold">You're In!</h4>
            <p className="text-muted-foreground text-sm max-w-[250px]">
              {message}
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-amber-500/50 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-background rounded-lg border border-primary/20 p-1">
                <input
                  type="email"
                  placeholder="name@firm.co.za"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  className="bg-transparent border-none focus:ring-0 text-sm px-4 py-2 flex-1 outline-none"
                  required
                />
                <Button 
                  type="submit" 
                  disabled={status === 'loading'}
                  size="sm"
                  className="px-4 py-2 shadow-none"
                >
                  {status === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Join <Send className="w-3 h-3 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-2 text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              <Sparkles size={10} className="text-primary" />
              <span>Limited Alpha Access Available</span>
            </div>
            
            {status === 'error' && (
              <p className="text-xs text-red-500 text-center animate-shake">
                {message}
              </p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
