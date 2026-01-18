import { DataAPIClient } from "@datastax/astra-db-ts";
import { NextResponse } from "next/server";
import dotenv from "dotenv";
import path from "path";

// Load environment variables (identical to rag.ts logic)
if (!process.env.ASTRA_DB_APPLICATION_TOKEN || !process.env.ASTRA_DB_API_ENDPOINT) {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
}

const token = (process.env.ASTRA_DB_APPLICATION_TOKEN || '').trim();
const endpoint = (process.env.ASTRA_DB_API_ENDPOINT || '').trim();

/**
 * API Route to handle waitlist signups
 * Saves to Astra DB 'waitlist' collection
 */
export async function POST(req: Request) {
  try {
    const { email, name, role } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (!token || !endpoint) {
      console.error("Waitlist Error: Astra DB credentials missing");
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const client = new DataAPIClient(token);
    const db = client.db(endpoint);
    
    // We use a dedicated waitlist collection
    const collection = db.collection("waitlist");

    // Check if email already exists
    const existing = await collection.findOne({ email });
    if (existing) {
      return NextResponse.json({ message: "You're already on the waitlist! 🚀" }, { status: 200 });
    }

    await collection.insertOne({
      email,
      name: name || "",
      role: role || "lawyer", // Default role
      joinedAt: new Date().toISOString(),
      source: "docketdive_v1_waitlist"
    });

    return NextResponse.json({ 
      success: true, 
      message: "Welcome to the future of SA law! We'll be in touch. 🇿🇦" 
    });

  } catch (error: any) {
    console.error("Waitlist API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
