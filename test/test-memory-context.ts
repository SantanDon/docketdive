import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const API_URL = "http://localhost:3000/api/chat";

async function testMemoryAndContext() {
  console.log("🧠 Testing Memory and Context Limits...");

  const conversationId = `test_conv_${Date.now()}`;
  const userId = "test_user";
  let conversationHistory: any[] = [];

  // 1. Start a conversation
  console.log("\n1️⃣  Sending first message...");
  try {
    const res1 = await axios.post(API_URL, {
      message: "What is actio de pauperie?",
      conversationId,
      userId,
      conversationHistory
    });
    console.log("✅ Response 1:", res1.data.response.substring(0, 100) + "...");
    
    // Update history
    conversationHistory.push({ role: "user", content: "What is actio de pauperie?" });
    conversationHistory.push({ role: "assistant", content: res1.data.response });

  } catch (error: any) {
    console.error("❌ Request 1 failed:", error.message);
  }

  // 2. Follow up (testing memory)
  console.log("\n2️⃣  Sending follow-up (testing memory)...");
  try {
    const res2 = await axios.post(API_URL, {
      message: "What are the defenses against it?",
      conversationId,
      userId,
      conversationHistory
    });
    console.log("✅ Response 2:", res2.data.response.substring(0, 100) + "...");
    
    // Update history
    conversationHistory.push({ role: "user", content: "What are the defenses against it?" });
    conversationHistory.push({ role: "assistant", content: res2.data.response });

  } catch (error: any) {
    console.error("❌ Request 2 failed:", error.message);
  }

  // 3. Simulate Long Conversation to trigger warning
  console.log("\n3️⃣  Simulating long conversation to trigger context warning...");
  
  // Add dummy messages to fill context
  const longText = "This is a very long filler text to ensure we exceed the context window limit. ".repeat(50); // ~3500 chars
  
  for (let i = 0; i < 10; i++) {
    conversationHistory.push({ role: "user", content: `Filler message ${i}: ${longText}` });
    conversationHistory.push({ role: "assistant", content: `Filler response ${i}: ${longText}` });
  }

  try {
    const res3 = await axios.post(API_URL, {
      message: "Summarize our discussion.",
      conversationId,
      userId,
      conversationHistory
    });
    
    const response = res3.data.response;
    console.log("✅ Response 3:", response.substring(0, 100) + "...");
    
    if (response.includes("start a new chat")) {
      console.log("✅ Context warning detected!");
    } else {
      console.log("⚠️  Context warning NOT detected (Context might not be full yet).");
      console.log("Response length:", response.length);
      console.log("Metadata:", res3.data.metadata);
    }

  } catch (error: any) {
    console.error("❌ Request 3 failed:", error.message);
  }
}

testMemoryAndContext();
