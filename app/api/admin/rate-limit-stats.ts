import { rateLimiter } from "../../utils/rate-limiter";

export async function GET(request: Request) {
  // Optional: Add authentication check here
  // const authHeader = request.headers.get("authorization");
  // if (!authHeader?.startsWith("Bearer ")) {
  //   return new Response("Unauthorized", { status: 401 });
  // }

  const activeUsers = rateLimiter.getActiveUsers();
  
  return new Response(JSON.stringify({
    timestamp: new Date().toISOString(),
    totalActiveUsers: activeUsers.length,
    users: activeUsers,
    summary: {
      totalRequests: activeUsers.reduce((sum, u) => sum + u.requestsUsed, 0),
      totalTokens: activeUsers.reduce((sum, u) => sum + u.tokensUsed, 0),
      totalConcurrent: activeUsers.reduce((sum, u) => sum + u.concurrentRequests, 0),
    },
    info: "Use /api/admin/rate-limit-reset?userId=USER_ID to reset a user's quota"
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
