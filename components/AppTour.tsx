"use client";

import { useEffect, useState } from "react";
import Shepherd from "shepherd.js";
// Note: We use custom styles in global.css instead of default shepherd.css

const TOUR_COMPLETED_KEY = "docketdive_tour_completed";

export default function AppTour() {
  const [tourStarted, setTourStarted] = useState(false);

  useEffect(() => {
    // Check if tour was already completed
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (tourCompleted) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      startTour();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const startTour = () => {
    if (tourStarted) return;
    setTourStarted(true);

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: "shepherd-theme-custom",
        scrollTo: { behavior: "smooth", block: "center" },
        cancelIcon: { enabled: true },
      },
    });

    // Step 1: Welcome
    tour.addStep({
      id: "welcome",
      title: "Welcome to DocketDive! 🎉",
      text: "Your AI-powered South African legal assistant. Let me show you around.",
      buttons: [
        {
          text: "Skip Tour",
          action: () => {
            localStorage.setItem(TOUR_COMPLETED_KEY, "true");
            tour.cancel();
          },
          classes: "shepherd-button-secondary",
        },
        {
          text: "Let's Go!",
          action: tour.next,
        },
      ],
    });

    // Step 2: Chat Input
    tour.addStep({
      id: "chat-input",
      title: "Ask Legal Questions",
      text: "Type your legal questions here. DocketDive uses AI and South African case law to provide accurate answers.",
      attachTo: { element: "textarea", on: "top" },
      buttons: [
        { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
        { text: "Next", action: tour.next },
      ],
    });

    // Step 3: Tools Menu
    tour.addStep({
      id: "tools-menu",
      title: "Legal Tools",
      text: "Access powerful legal tools: Document Simplifier, Contract Analyzer, Clause Auditor, and more.",
      attachTo: { element: "[data-tour='tools-menu']", on: "bottom" },
      buttons: [
        { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
        { text: "Next", action: tour.next },
      ],
    });

    // Step 4: Language Selector
    tour.addStep({
      id: "language",
      title: "Multiple Languages",
      text: "Switch between English, Afrikaans, Zulu, and other South African languages.",
      attachTo: { element: "[data-tour='language-selector']", on: "bottom" },
      buttons: [
        { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
        { text: "Next", action: tour.next },
      ],
    });

    // Step 5: Theme Toggle
    tour.addStep({
      id: "theme",
      title: "Dark/Light Mode",
      text: "Toggle between dark and light themes for comfortable reading.",
      attachTo: { element: "[data-tour='theme-toggle']", on: "bottom" },
      buttons: [
        { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
        { text: "Next", action: tour.next },
      ],
    });

    // Step 6: Prompt Cards
    tour.addStep({
      id: "prompts",
      title: "Quick Start Prompts",
      text: "Click any of these cards to quickly start a conversation about common legal topics.",
      attachTo: { element: "[data-tour='prompt-cards']", on: "top" },
      buttons: [
        { text: "Back", action: tour.back, classes: "shepherd-button-secondary" },
        { text: "Finish", action: tour.next },
      ],
    });

    // Step 7: Complete
    tour.addStep({
      id: "complete",
      title: "You're All Set! ✨",
      text: "Start asking questions or explore the tools. DocketDive is here to help with your South African legal queries.",
      buttons: [
        {
          text: "Start Using DocketDive",
          action: () => {
            localStorage.setItem(TOUR_COMPLETED_KEY, "true");
            tour.complete();
          },
        },
      ],
    });

    tour.start();
  };

  return null;
}

// Export function to manually restart tour
export function restartTour() {
  localStorage.removeItem(TOUR_COMPLETED_KEY);
  window.location.reload();
}
