# Fix Knowledge Base Retrieval - Action Plan

## Problem Summary

**Issue**: Queries like "witness age requirement" return no results even though documents are ingested.

**Root Cause**: Documents lack vector embeddings (`$vector` field).

**Health**: 40% - Critical failure in RAG pipeline.

---

## Quick Fix (5 minutes)

### Step 1: Ensure HuggingFace Key
```bash
# Check .env has:
HUGGINGFACE_API_KEY=hf_XXXXXX...
ASTRA_DB_APPLICATION_TOKEN=AstraCS:...
ENDPOINT=https://xxxxx.apps.astra.datastax.com
```

### Step 2: Run Re-embedding Script
```bash
npm run reembed-docs
```

This will:
- ✅ Fetch all documents from Astra DB
- ✅ Generate HuggingFace embeddings (1024-dim)
- ✅ Store vectors in `$vector` field
- ✅ Preserve all metadata

### Step 3: Verify Fix
```bash
npx tsx diagnose-rag.ts
```

Expected output:
```
✅ Vector Dimensions
   Correct dimensions: 1024
   
✅ Keyword Search  
   Found 5/5 keywords: witness, age, 14, will, testament
```

### Step 4: Test Query
```bash
# In app, ask:
"What age must a witness be?"

# Should now return:
✅ "A witness to a will must be at least 14 years old..."
```

---

## Why This Happened

### The Ingestion Pipeline
```
1. Load Document (PDF/DOCX)    ✅
2. Extract Text                ✅
3. Split into Chunks           ✅
4. Generate Embeddings         ❌ SKIPPED
5. Store in Astra DB           ✅ (but without vectors)
```

### Missing Step: Embedding
The `scripts/ingest-folder.ts` does NOT generate embeddings during ingestion.

**Correct Pattern** (per LangChain/LlamaIndex):
```typescript
for (const chunk of chunks) {
  const vector = await embed(chunk);  // ← This step
  await store({ content: chunk, $vector: vector });
}
```

---

## After Re-embedding Works

### Future Ingestion
Update `scripts/ingest-folder.ts` to embed during ingestion:

```typescript
// Add to ingest-folder.ts
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

async function ingestDocuments(files: string[]) {
  for (const file of files) {
    const text = extractText(file);
    const chunks = chunkText(text);
    
    // Generate embeddings
    const docsWithVectors = await Promise.all(
      chunks.map(async (content) => ({
        $vector: await hf.featureExtraction({
          model: "intfloat/multilingual-e5-large",
          inputs: content,
        }),
        content,
        metadata: { source: file }
      }))
    );
    
    await collection.insertMany(docsWithVectors);
  }
}
```

---

## Comparison with Open Source

### LangChain
```typescript
const vectorStore = await AstraDBVectorStore.fromDocuments(
  documents,
  new OpenAIEmbeddings(), // ✅ Embeddings included
  { collection: "docs" }
);
```

### LlamaIndex
```typescript
const index = new VectorStoreIndex.fromDocuments(
  documents,
  { embed_model: embedModel } // ✅ Embeddings required
);
```

### DocketDive (Current)
```typescript
// Missing embeddings - BROKEN
await collection.insertMany(chunks); // ❌
```

### DocketDive (After Fix)
```typescript
// Add embeddings like open source
await collection.insertMany(
  chunks.map(c => ({ $vector: embed(c), content: c }))
); // ✅
```

---

## Timeline

| Step | Time | Status |
|------|------|--------|
| Diagnose issue | ✅ Done | Knowledge base has no vectors |
| Run reembed script | 2-5 min | FIX IT NOW |
| Verify diagnosis | 1 min | Confirm vectors exist |
| Test query | 1 min | "witness age 14" returns result |
| Update future ingestion | 15 min | Prevent recurrence |

---

## Success Criteria

After running `npm run reembed-docs`:

```
✅ Documents have $vector field
✅ Vectors are 1024 dimensions (HuggingFace)
✅ Keyword search finds "witness", "age", "14"
✅ Query "witness age requirement" returns correct answer (14)
```

---

## If Re-embedding Fails

### Error: "HuggingFace API rate limited"
- Wait 1 hour or use `BATCH_SIZE=1` in reembed-docs.ts
- Use local Ollama embedding instead

### Error: "Astra DB connection failed"
- Check `ASTRA_DB_APPLICATION_TOKEN` in .env
- Verify `ENDPOINT` is correct

### Error: "No documents found"
- Ingestion script didn't run
- Run `npm run ingest -- ./data/` first

---

## Next Level: Improve Retrieval

After embeddings are fixed:

1. **Hybrid Search**: Combine vector + keyword matching
2. **Query Expansion**: "witness age" → "witness age requirement" + "testator witness" + "will witness"
3. **Reranking**: Score results by legal relevance
4. **Chunking**: Overlap chunks to preserve context

See `app/api/utils/semantic-search.ts` for current implementation.

---

## Emergency Fallback

If re-embedding doesn't work:
- System already falls back to **internet search (SAFLII)**
- Won't be as fast but will still find answers
- Fix embedding pipeline for long-term improvement

---

**Action**: Run `npm run reembed-docs` now. Report back with results.
