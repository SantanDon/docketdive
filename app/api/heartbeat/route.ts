import { NextResponse } from 'next/server';
import { DataAPIClient } from '@datastax/astra-db-ts';

interface HeartbeatResult {
  name: string;
  success: boolean;
  message: string;
  timestamp: string;
}

async function pingDatabase(
  name: string,
  token: string | undefined,
  endpoint: string | undefined,
  collection: string
): Promise<HeartbeatResult> {
  const timestamp = new Date().toISOString();

  if (!token || !endpoint) {
    return {
      name,
      success: false,
      message: 'Missing credentials',
      timestamp
    };
  }

  try {
    const client = new DataAPIClient(token);
    const db = client.db(endpoint);
    const coll = db.collection(collection);
    
    // Simple query to keep database active
    const result = await coll.findOne({});
    
    return {
      name,
      success: true,
      message: result ? 'Active with data' : 'Active (empty collection)',
      timestamp
    };
  } catch (error) {
    return {
      name,
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp
    };
  }
}

export async function GET() {
  const results: HeartbeatResult[] = [];

  // Ping DocketDive database
  const docketdiveResult = await pingDatabase(
    'DocketDive',
    process.env.ASTRA_DB_APPLICATION_TOKEN,
    process.env.ENDPOINT,
    process.env.COLLECTION_NAME || 'docketdive'
  );
  results.push(docketdiveResult);

  // Ping StudyLM database (add these env vars to your Vercel project)
  const studylmResult = await pingDatabase(
    'StudyLM',
    process.env.STUDYLM_ASTRA_TOKEN,
    process.env.STUDYLM_ASTRA_ENDPOINT,
    process.env.STUDYLM_COLLECTION || 'users'
  );
  results.push(studylmResult);

  const allSuccess = results.every(r => r.success);
  
  return NextResponse.json({
    status: allSuccess ? 'healthy' : 'degraded',
    heartbeat: new Date().toISOString(),
    databases: results
  }, { 
    status: allSuccess ? 200 : 207 
  });
}
