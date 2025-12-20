/**
 * Context Awareness Test for RAG Chatbot
 * 
 * This test verifies that the chatbot maintains context across messages
 * and correctly interprets follow-up questions based on previous conversation.
 * 
 * Test Case: Wills and Witness Age
 * - First message: "What makes a will legally binding in South Africa?"
 * - Follow-up: "what age must a witness be"
 * - Expected: Should answer about witness age for WILLS (14 years), not general witness age (18 years)
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
  status: string;
  sources?: any[];
}

async function testContextAwareness() {
  console.log("\n🧪 === CONTEXT AWARENESS TEST ===\n");
  
  const conversationHistory: Message[] = [];
  const conversationId = `test_${Date.now()}`;
  const userId = "test_user";
  
  // Test 1: Initial question about wills
  console.log("📝 Test 1: Initial question about wills");
  console.log("User: What makes a will legally binding in South Africa?\n");
  
  const response1 = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "What makes a will legally binding in South Africa?",
      provider: "ollama",
      conversationHistory: [],
      conversationId,
      userId
    })
  });
  
  const data1 = await response1.json();
  console.log("Assistant:", data1.response.substring(0, 300) + "...\n");
  console.log(`Sources: ${data1.sources?.length || 0}`);
  console.log(`Response time: ${data1.metadata?.responseTime}\n`);
  
  // Add to conversation history
  conversationHistory.push({
    id: `msg_${Date.now()}_user`,
    content: "What makes a will legally binding in South Africa?",
    role: "user",
    timestamp: new Date().toISOString(),
    status: "sent"
  });
  
  conversationHistory.push({
    id: `msg_${Date.now() + 1}_assistant`,
    content: data1.response,
    role: "assistant",
    timestamp: new Date().toISOString(),
    status: "sent",
    sources: data1.sources
  });
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Follow-up question about witness age
  console.log("📝 Test 2: Follow-up question about witness age");
  console.log("User: what age must a witness be\n");
  
  const response2 = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "what age must a witness be",
      provider: "ollama",
      conversationHistory,
      conversationId,
      userId
    })
  });
  
  const data2 = await response2.json();
  console.log("Assistant:", data2.response.substring(0, 500) + "...\n");
  console.log(`Sources: ${data2.sources?.length || 0}`);
  console.log(`Response time: ${data2.metadata?.responseTime}\n`);
  
  // Verify the answer mentions "14 years" (witness to a will) not "18 years" (general witness)
  const mentions14 = data2.response.includes("14") || data2.response.includes("fourteen");
  const mentions18 = data2.response.includes("18") || data2.response.includes("eighteen");
  const mentionsWill = data2.response.toLowerCase().includes("will") || 
                       data2.response.toLowerCase().includes("testament");
  
  console.log("\n=== TEST RESULTS ===");
  console.log(`✓ Mentions 14 years (correct for wills): ${mentions14 ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`✓ Mentions will/testament context: ${mentionsWill ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`✓ Does NOT mention 18 years (general witness): ${!mentions18 ? "✅ PASS" : "⚠️ WARNING"}`);
  
  if (mentions14 && mentionsWill) {
    console.log("\n🎉 TEST PASSED: Context awareness is working correctly!");
    return true;
  } else {
    console.log("\n❌ TEST FAILED: Context awareness needs improvement");
    console.log("\nFull response:");
    console.log(data2.response);
    return false;
  }
}

// Run the test
testContextAwareness()
  .then(passed => {
    process.exit(passed ? 0 : 1);
  })
  .catch(err => {
    console.error("Test error:", err);
    process.exit(1);
  });
