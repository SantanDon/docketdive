import { DataAPIClient } from "@datastax/astra-db-ts";

// Configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const EMBED_MODEL = process.env.EMBED_MODEL || "nomic-embed-text:v1.5";
const CHAT_MODEL = process.env.CHAT_MODEL || "granite3.3:2b";
const COLLECTION_NAME = process.env.COLLECTION_NAME || "docketdive";
const ASTRA_DB_TOKEN = process.env.ASTRA_DB_APPLICATION_TOKEN;
const ASTRA_DB_ENDPOINT = process.env.ENDPOINT;

export async function GET() {
  const startTime = Date.now();
  const healthCheck: any = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {},
    configuration: {},
    checks: {},
  };

  // Check 1: Environment Variables
  healthCheck.checks.environment = {
    status: "checking",
    details: {},
  };

  const hasToken = !!ASTRA_DB_TOKEN;
  const hasEndpoint = !!ASTRA_DB_ENDPOINT;
  const hasOllamaUrl = !!OLLAMA_BASE_URL;

  healthCheck.checks.environment = {
    status: hasToken && hasEndpoint && hasOllamaUrl ? "pass" : "fail",
    details: {
      astraToken: hasToken ? "configured" : "missing",
      astraEndpoint: hasEndpoint ? "configured" : "missing",
      ollamaUrl: hasOllamaUrl ? "configured" : "missing",
    },
  };

  if (!hasToken || !hasEndpoint || !hasOllamaUrl) {
    healthCheck.status = "unhealthy";
    healthCheck.checks.environment.message =
      "Missing required environment variables";
    console.error(
      `Health check failed: Missing environment variables: ${JSON.stringify(
        healthCheck.checks.environment.details,
      )}`,
    );
  } else {
    console.log(
      "Health check: All required environment variables are present.",
    );
  }

  // Check 2: Ollama Connection
  healthCheck.checks.ollama = {
    status: "checking",
  };

  try {
    console.log(
      `Health check: Attempting to connect to Ollama at ${OLLAMA_BASE_URL}`,
    );
    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (ollamaResponse.ok) {
      const ollamaData = await ollamaResponse.json();
      const availableModels = ollamaData.models?.map((m: any) => m.name) || [];
      console.log(
        "Health check: Successfully connected to Ollama. Available models:",
        availableModels,
      );
      const hasChatModel = availableModels.some((name: string) =>
        name.includes(CHAT_MODEL),
      );
      const hasEmbedModel = availableModels.some((name: string) =>
        name.includes(EMBED_MODEL),
      );

      healthCheck.checks.ollama = {
        status: hasChatModel && hasEmbedModel ? "pass" : "warning",
        url: OLLAMA_BASE_URL,
        availableModels: availableModels.length,
        requiredModels: {
          chat: {
            required: CHAT_MODEL,
            available: hasChatModel,
          },
          embedding: {
            required: EMBED_MODEL,
            available: hasEmbedModel,
          },
        },
      };

      if (!hasChatModel || !hasEmbedModel) {
        healthCheck.checks.ollama.message =
          "Some required models are not available. Please pull them using 'ollama pull <model-name>'";
        const missing = [];
        if (!hasChatModel) missing.push(CHAT_MODEL);
        if (!hasEmbedModel) missing.push(EMBED_MODEL);
        console.error(
          `Health check failed: Missing required Ollama models: ${missing.join(
            ", ",
          )}`,
        );
      } else {
        console.log("Health check: All required Ollama models are available.");
      }
    } else {
      healthCheck.checks.ollama = {
        status: "fail",
        url: OLLAMA_BASE_URL,
        error: `HTTP ${ollamaResponse.status}`,
      };
      healthCheck.status = "unhealthy";
      console.error(
        `Health check failed: Ollama returned HTTP ${ollamaResponse.status}`,
      );
    }
  } catch (error: any) {
    healthCheck.checks.ollama = {
      status: "fail",
      url: OLLAMA_BASE_URL,
      error: error.message || "Connection failed",
      message:
        "Could not connect to Ollama. Ensure it is installed and running.",
    };
    healthCheck.status = "unhealthy";
    console.error("Health check failed: Could not connect to Ollama.", error);
  }

  // Check 3: Astra DB Connection
  healthCheck.checks.astraDB = {
    status: "checking",
  };

  if (hasToken && hasEndpoint) {
    try {
      const client = new DataAPIClient(ASTRA_DB_TOKEN);
      const db = client.db(ASTRA_DB_ENDPOINT);
      const collection = db.collection(COLLECTION_NAME);

      // Test connection with a simple query
      await collection.findOne({});

      // Get document count
      const countResult = await collection.countDocuments({}, 1000);

      healthCheck.checks.astraDB = {
        status: "pass",
        endpoint: ASTRA_DB_ENDPOINT,
        collection: COLLECTION_NAME,
        documentCount: countResult || "unknown",
      };

      if (countResult === 0) {
        healthCheck.checks.astraDB.status = "warning";
        healthCheck.checks.astraDB.message =
          "Database is empty. Run 'npm run load-db' to populate with documents.";
      }
    } catch (error: any) {
      healthCheck.checks.astraDB = {
        status: "fail",
        endpoint: ASTRA_DB_ENDPOINT,
        collection: COLLECTION_NAME,
        error: error.message || "Connection failed",
        message:
          "Could not connect to Astra DB. Check your credentials and endpoint.",
      };
      healthCheck.status = "unhealthy";
    }
  } else {
    healthCheck.checks.astraDB = {
      status: "fail",
      message: "Astra DB credentials not configured",
    };
    healthCheck.status = "unhealthy";
  }

  // Configuration Summary
  healthCheck.configuration = {
    ollamaUrl: OLLAMA_BASE_URL,
    chatModel: CHAT_MODEL,
    embedModel: EMBED_MODEL,
    collection: COLLECTION_NAME,
    endpoint: hasEndpoint
      ? ASTRA_DB_ENDPOINT?.substring(0, 50) + "..."
      : "not configured",
  };

  // Overall Status
  const allChecks = Object.values(healthCheck.checks);
  const hasFailure = allChecks.some((check: any) => check.status === "fail");
  const hasWarning = allChecks.some((check: any) => check.status === "warning");

  if (hasFailure) {
    healthCheck.status = "unhealthy";
  } else if (hasWarning) {
    healthCheck.status = "degraded";
  } else {
    healthCheck.status = "healthy";
  }

  // Response time
  healthCheck.responseTime = `${Date.now() - startTime}ms`;

  // Recommendations
  healthCheck.recommendations = [];

  if (healthCheck.checks.ollama?.status === "fail") {
    healthCheck.recommendations.push(
      "Install and start Ollama from https://ollama.ai",
    );
  }

  if (healthCheck.checks.ollama?.requiredModels?.chat?.available === false) {
    healthCheck.recommendations.push(
      `Pull the chat model: ollama pull ${CHAT_MODEL}`,
    );
  }

  if (
    healthCheck.checks.ollama?.requiredModels?.embedding?.available === false
  ) {
    healthCheck.recommendations.push(
      `Pull the embedding model: ollama pull ${EMBED_MODEL}`,
    );
  }

  if (healthCheck.checks.astraDB?.status === "fail") {
    healthCheck.recommendations.push("Check Astra DB credentials in .env file");
  }

  if (healthCheck.checks.astraDB?.documentCount === 0) {
    healthCheck.recommendations.push("Load documents: npm run load-db");
  }

  // Set appropriate HTTP status code
  const statusCode =
    healthCheck.status === "healthy"
      ? 200
      : healthCheck.status === "degraded"
        ? 200
        : 503;

  return new Response(JSON.stringify(healthCheck, null, 2), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
