// Stub for tool-detector module
export const detectToolInvocation = (text: string) => {
  return { toolId: null, confidence: 0 };
};

export const TOOLS = {
  "contract-analysis": {
    name: "Contract Analysis",
    keywords: ["contract", "agreement", "analyze"],
  },
};