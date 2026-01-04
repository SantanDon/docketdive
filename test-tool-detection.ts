/**
 * Tool Detection Test Suite
 * Tests each tool with multiple phrasings to measure reliability
 */

import { detectToolInvocation, TOOLS } from "./lib/tool-detector";

const testCases: Record<string, { phrases: string[]; expectedTool: string }> = {
  "contract-analysis": {
    expectedTool: "contract-analysis",
    phrases: [
      // Aliases
      "analyze this contract",
      "contract analysis please",
      "perspective analyzer for this agreement",
      "contract analyzer",
      // Keywords
      "I need to review this agreement for risks",
      "analyze the contract from party a perspective",
      "what are the risks in this contract",
      "review this agreement",
      // Casual/varied
      "can you break down this contract",
      "I want to understand this agreement",
      "analyze my contract",
      "look at this deal",
    ],
  },
  "simplify": {
    expectedTool: "simplify",
    phrases: [
      // Aliases
      "simplify this document",
      "simplifier needed",
      "plain language version please",
      "remove the jargon",
      // Keywords
      "this is too complex, make it simpler",
      "explain this in plain language",
      "convert to easier words",
      // Casual
      "what does this mean in simple terms",
      "can you dumb this down",
      "translate this to plain English",
      "make it less legal-sounding",
    ],
  },
  "drafting": {
    expectedTool: "drafting",
    phrases: [
      // Aliases
      "draft a contract",
      "create a document",
      "generate a contract",
      "write a lease agreement",
      // Keywords
      "I need to create a new agreement",
      "generate a service contract",
      "make a letter of intent",
      // Casual
      "help me write a contract",
      "can you create a document for me",
      "I need a new agreement drafted",
      "help write a non-disclosure agreement",
    ],
  },
  "audit": {
    expectedTool: "audit",
    phrases: [
      // Aliases
      "audit this contract",
      "check for missing clauses",
      "clause auditor",
      "audit contract for risks",
      // Keywords
      "review for missing clauses",
      "check what clauses are missing",
      "is this contract missing anything",
      // Casual
      "what am I missing in this agreement",
      "check this for problems",
      "review for gaps",
      "are there missing provisions",
    ],
  },
  "popia": {
    expectedTool: "popia",
    phrases: [
      // Aliases
      "check popia compliance",
      "popia checker",
      "data protection review",
      "privacy compliance check",
      // Keywords
      "is this compliant with data protection laws",
      "check gdpr compliance",
      "review for privacy issues",
      // Casual
      "does this meet privacy requirements",
      "is this compliant",
      "check for data protection issues",
      "does this comply with popia",
    ],
  },
  "compare": {
    expectedTool: "compare",
    phrases: [
      // Aliases
      "compare these documents",
      "document compare",
      "show the differences",
      "diff these versions",
      // Keywords
      "what's different between these",
      "compare the two versions",
      "show me the changes",
      // Casual
      "what changed in the new version",
      "compare this to the old contract",
      "show differences",
      "what's new in this version",
    ],
  },
};

// Run tests
console.log("🧪 TOOL DETECTION RELIABILITY TEST\n");
console.log("=".repeat(80));

let totalTests = 0;
let passedTests = 0;
const results: { tool: string; passed: number; total: number; details: string[] }[] = [];

for (const [toolName, { expectedTool, phrases }] of Object.entries(testCases)) {
  const details: string[] = [];
  let toolPassed = 0;

  console.log(`\n📋 Testing: ${toolName.toUpperCase()}`);
  console.log("-".repeat(80));

  for (const phrase of phrases) {
    totalTests++;
    const result = detectToolInvocation(phrase);

    const detected = result?.toolId === expectedTool;
    const confidence = result?.confidence || 0;

    if (detected) {
      toolPassed++;
      passedTests++;
      console.log(`✅ "${phrase}"`);
      console.log(`   Detected: ${result?.toolId} (confidence: ${(confidence * 100).toFixed(0)}%)\n`);
      details.push(`✅ "${phrase}" → ${confidence}`);
    } else {
      console.log(`❌ "${phrase}"`);
      console.log(
        `   Expected: ${expectedTool}, Got: ${result?.toolId || "NONE"} (confidence: ${(confidence * 100).toFixed(0)}%)\n`
      );
      details.push(
        `❌ "${phrase}" → Got ${result?.toolId || "NONE"} instead (${(confidence * 100).toFixed(0)}%)`
      );
    }
  }

  results.push({
    tool: toolName,
    passed: toolPassed,
    total: phrases.length,
    details,
  });

  const accuracy = ((toolPassed / phrases.length) * 100).toFixed(1);
  console.log(
    `📊 ${toolName}: ${toolPassed}/${phrases.length} passed (${accuracy}% accuracy)\n`
  );
}

// Summary
console.log("=".repeat(80));
console.log("\n📊 SUMMARY\n");

for (const result of results) {
  const accuracy = ((result.passed / result.total) * 100).toFixed(0);
  const bar = "█".repeat(Math.round(result.passed / 2)) + "░".repeat(Math.round((result.total - result.passed) / 2));
  console.log(`${result.tool.padEnd(20)} [${bar}] ${accuracy}% (${result.passed}/${result.total})`);
}

const overallAccuracy = ((passedTests / totalTests) * 100).toFixed(1);
console.log(`\n🎯 Overall Accuracy: ${overallAccuracy}% (${passedTests}/${totalTests})\n`);

if (parseFloat(overallAccuracy) >= 80) {
  console.log("✨ Tool detection is RELIABLE\n");
} else if (parseFloat(overallAccuracy) >= 60) {
  console.log("⚠️  Tool detection needs improvement\n");
} else {
  console.log("🔧 Tool detection needs significant work\n");
}
