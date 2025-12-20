/**
 * Quick test to verify server has loaded new context-aware code
 */

async function testServerVersion() {
  console.log("\n🔍 Testing if server has new context-aware code...\n");
  
  const testMessages = [
    {
      id: "1",
      role: "user",
      content: "What makes a will legally binding in South Africa?",
      timestamp: new Date().toISOString(),
      status: "sent"
    },
    {
      id: "2",
      role: "assistant",
      content: "A will is considered legally binding in South Africa if it meets certain formalities including execution by the testator, signature requirements, and witnesses who must sign each page.",
      timestamp: new Date().toISOString(),
      status: "sent"
    }
  ];
  
  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "what age must a witness be",
        provider: "ollama",
        conversationHistory: testMessages,
        conversationId: `test_${Date.now()}`,
        userId: "test_user"
      })
    });
    
    if (!response.ok) {
      console.error("❌ Server error:", response.status, response.statusText);
      return false;
    }
    
    const data = await response.json();
    
    console.log("📝 Query sent: 'what age must a witness be'");
    console.log("📚 Conversation history: 2 messages about wills");
    console.log("\n🤖 Response preview:");
    console.log(data.response.substring(0, 300) + "...\n");
    
    // Check if response mentions the correct age
    const mentions14 = data.response.includes("14") || data.response.toLowerCase().includes("fourteen");
    const mentions18 = data.response.includes("18") || data.response.toLowerCase().includes("eighteen");
    const mentionsWill = data.response.toLowerCase().includes("will") || data.response.toLowerCase().includes("testament");
    
    console.log("=== ANALYSIS ===");
    console.log(`✓ Mentions 14 years (correct): ${mentions14 ? "✅ YES" : "❌ NO"}`);
    console.log(`✓ Mentions will context: ${mentionsWill ? "✅ YES" : "❌ NO"}`);
    console.log(`✓ Avoids 18 years (wrong): ${!mentions18 ? "✅ YES" : "⚠️ NO (mentioned 18)"}`);
    
    if (mentions14 && mentionsWill) {
      console.log("\n🎉 SUCCESS: Context awareness is working!");
      return true;
    } else {
      console.log("\n❌ FAIL: Context awareness not working yet");
      console.log("\n💡 Possible issues:");
      console.log("  1. Server hasn't reloaded new code (restart needed)");
      console.log("  2. Database doesn't have documents about witness age for wills");
      console.log("  3. Query enrichment not triggering (check server logs)");
      return false;
    }
    
  } catch (error) {
    console.error("❌ Test failed with error:", error);
    return false;
  }
}

testServerVersion()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error("Test error:", err);
    process.exit(1);
  });
