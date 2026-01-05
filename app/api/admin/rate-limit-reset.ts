import { rateLimiter } from "../../utils/rate-limiter";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const resetAll = searchParams.get("resetAll") === "true";

  // Optional: Add authentication check
  // const authHeader = request.headers.get("authorization");
  // if (!authHeader?.startsWith("Bearer ")) {
  //   return new Response("Unauthorized", { status: 401 });
  // }

  if (resetAll) {
    rateLimiter.clearAllQuotas();
    return new Response(JSON.stringify({ 
      success: true, 
      message: "All quotas cleared" 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!userId) {
    return new Response(JSON.stringify({ 
      error: "userId parameter required" 
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  rateLimiter.resetUserQuota(userId);

  return new Response(JSON.stringify({ 
    success: true, 
    message: `Quota reset for user ${userId}` 
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
