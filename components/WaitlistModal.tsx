"use client";

import { motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import WaitlistForm from "./WaitlistForm";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Premium Waitlist Modal
 * - Used for header CTAs and on-demand waitlist signups
 */
export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-primary/20 shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-amber-500 to-primary animate-pulse"></div>
        
        <DialogHeader className="space-y-3 pb-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles size={24} />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            Join the DocketDive Alpha
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground text-sm leading-relaxed">
            Get early access to South Africa's most advanced legal AI tools. 
            We're onboarding firms and independent lawyers in batches.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <WaitlistForm onSuccess={() => setTimeout(onClose, 2500)} />
        </div>

        <div className="pt-2 text-center">
          <p className="text-[10px] text-muted-foreground/60">
            By joining, you agree to receive updates about our beta release. 
            No spam, ever.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
