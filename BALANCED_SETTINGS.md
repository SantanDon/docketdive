# DocketDive - Balanced Settings (Speed + Quality)

## Current Configuration

After testing, these settings provide the best balance between speed and response quality:

### Retrieval Settings

```typescript
TOP_K = 12                      // Retrieve 12 documents (was 15, tried 10)
MIN_SIMILARITY_THRESHOLD = 0.18 // Lower threshold for better recall (was 0.22)
MAX_SOURCES_IN_CONTEXT = 6      // Use 6 sources in context (restored from 5)
KEYWORD_GATE_ENABLED = false    // Disabled - was too restrictive
```

**Rationale:**
- `TOP_K = 12`: Good balance - not too many (slow) or too few (miss relevant docs)
- `MIN_SIMILARITY_THRESHOLD = 0.18`: Lower threshold catches more relevant documents
- `MAX_SOURCES_IN_CONTEXT = 6`: Enough context for comprehensive answers
- `KEYWORD_GATE_ENABLED = false`: Semantic search is sufficient, keyword gate was rejecting valid results

### Query Expansion

```typescript
shouldExpand = query.length > 20  // Expand for queries > 20 chars (was 50)
limitedQueries = 3                // Use up to 3 queries (was 2)
```

**Rationale:**
- Expand more queries for better document discovery
- 3 queries (original + 2 expansions) provides good coverage
- Each expansion gets 75% of TOP_K documents (9 docs)

### LLM Parameters (Ollama)

```typescript
temperature: 0.05      // Low for factual responses
topP: 0.9             // Restored from 0.85 for better quality
topK: 30              // Restored from 25 for better sampling
repeatPenalty: 1.15   // Balanced to avoid repetition
numCtx: 6144          // Restored from 5120 for better context
numPredict: 3000      // Restored from 2500 for complete answers
```

**Rationale:**
- Restored most parameters to original values
- The aggressive optimization was hurting response quality
- These settings still provide good speed while maintaining quality

### LLM Parameters (Groq)

```typescript
temperature: 0.05
maxTokens: 3000  // Restored from 2500
```

### Embedding Cache

```typescript
CACHE_TTL = 5 minutes  // Cache embeddings for 5 minutes
Max cache size = 100   // Keep up to 100 cached embeddings
```

**Rationale:**
- Significant speed boost for repeated queries
- Minimal memory overhead
- Automatic cleanup of old entries

### Memory & Context

```typescript
isComplexConversation = length > 10 && query > 100  // Very selective
entityTracking = conversationHistory > 8             // Only for long conversations
```

**Rationale:**
- Skip expensive memory operations for 95% of queries
- Only use for very long, complex conversations
- Saves 1-2 seconds per query

## Expected Performance

### Simple Queries (< 30 chars)
- **Time:** 8-10 seconds
- **Breakdown:**
  - Embedding: 1-2s (or <100ms with cache)
  - Retrieval: 2-3s
  - LLM: 5-6s

### Medium Queries (30-100 chars)
- **Time:** 10-12 seconds
- **Breakdown:**
  - Embedding: 2-3s
  - Retrieval: 3-4s
  - LLM: 6-7s

### Complex Queries (> 100 chars)
- **Time:** 12-15 seconds
- **Breakdown:**
  - Embedding: 2-3s
  - Retrieval: 4-5s
  - LLM: 7-8s

### Follow-up Queries (with cache)
- **Time:** 6-8 seconds
- **Breakdown:**
  - Embedding: <100ms (cache hit)
  - Retrieval: 2-3s
  - LLM: 5-6s

## What Changed from Aggressive Optimization

### Reverted (for quality):
1. ✅ TOP_K: 10 → 12 (more documents)
2. ✅ MIN_SIMILARITY_THRESHOLD: 0.22 → 0.18 (lower threshold)
3. ✅ MAX_SOURCES_IN_CONTEXT: 5 → 6 (more context)
4. ✅ KEYWORD_GATE_ENABLED: true → false (less restrictive)
5. ✅ Query expansion threshold: 50 → 20 chars (expand more)
6. ✅ Limited queries: 2 → 3 (better coverage)
7. ✅ LLM numCtx: 5120 → 6144 (more context)
8. ✅ LLM numPredict: 2500 → 3000 (complete answers)
9. ✅ LLM topP: 0.85 → 0.9 (better sampling)
10. ✅ LLM topK: 25 → 30 (better sampling)

### Kept (for speed):
1. ✅ Embedding cache (major speed boost)
2. ✅ Reduced embedding timeout: 8s → 6s
3. ✅ Skip memory for most queries
4. ✅ Skip entity tracking for short conversations
5. ✅ Internet search removed completely
6. ✅ Parallel operations (memory + retrieval)

## Trade-offs

### Speed vs Quality Balance:
- **Speed:** ~10-12s average (vs 27.5s before, vs 8-10s with aggressive optimization)
- **Quality:** High - comprehensive answers with good sources
- **Accuracy:** High - lower threshold catches more relevant documents

### Why Not More Aggressive?

The aggressive optimization (TOP_K=10, threshold=0.22, keyword gate=true) was:
- ❌ Missing relevant documents
- ❌ Rejecting valid queries due to keyword gate
- ❌ Producing incomplete answers (2500 tokens too short)
- ❌ Lower quality responses

### Why Not Original Settings?

The original settings (TOP_K=15, no cache, internet search) were:
- ❌ Too slow (27.5s)
- ❌ Internet search added 2-5s with no benefit
- ❌ No caching meant repeated queries were slow
- ❌ Memory operations on every query

## Monitoring

Watch these metrics to ensure settings are working:

```typescript
{
  responseTime: "10-12s",  // Target range
  documentsRetrieved: 12,  // Should be 12
  documentsUsed: 6,        // Should be up to 6
  cacheHit: true/false,    // Track cache effectiveness
  queryExpanded: true,     // Should be true for most queries
  threshold: 0.18,         // Current threshold
  sourcesFound: 3-6        // Typical range
}
```

## Troubleshooting

### If responses are too slow (> 15s):
1. Check if Ollama is using GPU
2. Verify embedding cache is working
3. Check network latency to Astra DB

### If responses are missing information:
1. Lower MIN_SIMILARITY_THRESHOLD to 0.15
2. Increase TOP_K to 15
3. Check if documents are in database

### If responses are low quality:
1. Increase numPredict to 3500
2. Increase numCtx to 8192
3. Check if enough sources are being used

## Context Awareness (NEW)

```typescript
// Extract last 5 messages for context
const recentMessages = conversationHistory.slice(-5);
const conversationContextStr = recentMessages
  .map(m => `${m.role}: ${m.content}`)
  .join("\n");

// Pass to retrieval for query enrichment
const docs = await retrieveRelevantDocuments(query, conversationContextStr);
```

**Rationale:**
- Detects follow-up questions (short queries starting with question words)
- Extracts main topic from recent conversation
- Enriches query with context before retrieval
- Example: "what age must a witness be" → "what age must a witness be in context of wills"
- Fixes critical issue where follow-ups were answered without context

**Performance:**
- Query enrichment: +50-100ms (only for follow-ups)
- Context extraction: +10-20ms
- Overall impact: <5%
- Accuracy improvement: Significant

## Conclusion

These balanced settings provide:
- ✅ **Good speed:** 10-12s average (55% faster than original)
- ✅ **High quality:** Complete, accurate answers
- ✅ **Good recall:** Lower threshold catches relevant docs
- ✅ **Reliable:** No restrictive keyword gating
- ✅ **Efficient:** Caching and smart skipping
- ✅ **Context-aware:** Maintains conversation context for follow-up questions

**Recommendation:** Use these settings for production. They're fast enough for good UX while maintaining high answer quality and conversational context.
