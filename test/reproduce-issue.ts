import { POST } from "../app/api/chat/route";
import { NextRequest } from "next/server";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
  console.log("Starting API reproduction test...");
  console.log("ASTRA_DB_API_ENDPOINT present:", !!process.env.ASTRA_DB_API_ENDPOINT);
  console.log("ASTRA_DB_APPLICATION_TOKEN present:", !!process.env.ASTRA_DB_APPLICATION_TOKEN);
  console.log("GROQ_API_KEY present:", !!process.env.GROQ_API_KEY);

  try {
    const mockRequest = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          { role: "user", content: "Hello, can you help me with SA law?" }
        ],
        mode: "professional"
      }),
    });

    const response = await POST(mockRequest);
    console.log("Response status:", response.status);
    
    if (response.status === 200) {
      console.log("SUCCESS: API returned 200 OK");
      // Consume the stream to ensure no runtime errors during streaming
      const reader = response.body?.getReader();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // process.stdout.write(new TextDecoder().decode(value));
        }
        console.log("\nStream consumed successfully.");
      }
    } else {
      console.error("FAILURE: API returned", response.status);
      const text = await response.text();
      console.error("Response body:", text);
    }
  } catch (error) {
    console.error("CRITICAL FAILURE: Exception thrown during POST execution");
    console.error(error);
  }
}

runTest();
