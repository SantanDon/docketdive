"use client";

import { useEffect, useState } from "react";
import { Scale } from "lucide-react";

interface WelcomeScreenProps {
  username: string;
}

export default function WelcomeScreen({ username }: WelcomeScreenProps) {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Extract first name for a more personal touch
  const firstName = username.split(" ")[0];

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center space-y-6 animate-in fade-in duration-700">
      <div className="w-16 h-16 rounded-2xl bg-legal-blue-100 dark:bg-legal-blue-900/30 text-legal-blue-600 dark:text-legal-blue-400 flex items-center justify-center mb-4">
        <Scale className="w-8 h-8" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        {greeting}, {firstName}
      </h1>
      
      <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto">
        I can help you research South African case law, analyze legal documents, or draft legal correspondence.
      </p>
    </div>
  );
}
