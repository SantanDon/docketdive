// utils/messageProcessor.ts
import type { Message } from '../types';

/**
 * Formats the response with better legal structure based on mode
 */
export const formatResponse = (
  response: string,
  mode: 'normal' | 'student',
  eliLevel: 'ELI5' | 'ELI15' | 'ELI25'
): string => {
  let formattedResponse = response;
  
  // Add legal-specific formatting if in student mode
  if (mode === "student") {
    const levelText = 
      eliLevel === "ELI5" ? "ELI5 level" :
      eliLevel === "ELI15" ? "ELI15 level" : "ELI25 level";
    
    formattedResponse = `🎓 **Student Mode (${levelText}):**\n\n${response}`;
  }
  
  return formattedResponse;
};

/**
 * Creates an error message for API failures
 */
export const createErrorMessage = (): Message => ({
  id: String(Date.now() + 2),
  content: "⚠️ I apologize, but I encountered an error processing your legal query. Please try again or rephrase your question.",
  role: "assistant",
  timestamp: new Date().toISOString(),
  status: "sent",
});

/**
 * Creates an assistant message from API response
 */
export const createAssistantMessage = (
  response: any,
  mode: 'normal' | 'student',
  eliLevel: 'ELI5' | 'ELI15' | 'ELI25'
): Message => {
  const formattedResponse = formatResponse(
    response?.response ?? "Sorry, something went wrong.",
    mode,
    eliLevel
  );
  
  return {
    id: String(Date.now() + 1),
    content: formattedResponse,
    role: "assistant",
    timestamp: new Date().toISOString(),
    status: "sent",
    sources: response?.sources ?? [],
  };
};

/**
 * Creates an enhanced message for student mode
 */
export const enhanceMessageForStudentMode = (
  rawMessage: string,
  eliLevel: 'ELI5' | 'ELI15' | 'ELI25'
): string => {
  if (eliLevel === "ELI5") {
    return `Explain this in very simple terms for a 5-year-old, using easy examples and simple words. ${rawMessage}`;
  } else if (eliLevel === "ELI15") {
    return `Explain this clearly for a teenager, with relatable examples and slightly more detail. ${rawMessage}`;
  } else {
    return `Explain this for a young adult, with detailed examples and proper legal terminology. ${rawMessage}`;
  }
};