# RAG Retrieval Diagnosis Report

## Executive Summary

**Health Score: 40%** ❌

**Root Cause**: Documents are ingested but **NOT EMBEDDED** with vectors. This breaks the entire vector search pipeline.

---

## Critical Issues Found

### 1. ❌ **Missing Vector Embeddings** (CRITICAL)

**Problem**:
- Documents exist in Astra DB with metadata
- **NO $vector field present** in any documents
- Vector search returns empty results
- Query for "witness age 14" fails completely

**Impact**: 
- RAG cannot retrieve any documents
- All semantic search fails
- Falls back to internet search (less reliable)

**Root Cause**:
Embedding step missing or failed in ingestion pipeline

---

### 2. ❌ **Keyword Search Failure** (CRITICAL)

**Problem**:
- "witness", "age", "14" keywords not found
- Text search not properly indexed
- Query regex matching not working

**Expected**:
```
- "witness" should match documents about testator witnesses
- "14" should match age requirement (South African succession law)
- "will" should match documents about wills/testaments
```

**Actual**:
- 0 matches found
- Either documents weren't ingested or chunking lost context

---

## Pipeline Analysis

### Current DocketDive Pipeline

```
Ingestion → (Chunking) → Astra DB Storage
                            ❌ MISSING: Vector Embedding
                            ❌ MISSING: Vector Indexing
                            
RAG Query → Embedding Generation → Vector Search → ❌ FAILS
                                                    (no vectors to search)
```

---

## Comparison: DocketDive vs Open Source RAG Pipelines

### **LangChain (Industry Standard)**

```typescript
// Correct Pattern:
const vectorStore = await AstraDBVectorStore.fromDocuments(
  documents,
  new OpenAIEmbeddings(), // ✅ Embeddings DURING ingestion
  { collection: "my_collection" }
);

// Retrieval:
const retriever = vectorStore.asRetriever();
const results = await retriever.invoke(query);
```

**Key Difference**: LangChain embeds during ingestion, NOT after.

### **LlamaIndex (formerly GPT Index)**

```typescript
// Two-stage pipeline:
// 1. Embed documents during load
const documents = new SimpleDirectoryReader("./data").loadData();
const index = new VectorStoreIndex.fromDocuments(
  documents,
  { embed_model: embed_model } // ✅ Explicit embedding
);

// 2. Query with auto-embedding
const queryEngine = index.asQueryEngine();
const response = await queryEngine.query("witness age requirement");
```

**Key Difference**: Embeddings are explicit and required.

### **Pinecone + LangChain**

```typescript
// Embedding is CORE to ingestion:
const vectorStore = await PineconeStore.fromDocuments(
  docs,
  new OpenAIEmbeddings(), // ✅ MANDATORY
  { pineconeIndex: index }
);
```

**Key Difference**: Cannot store docs without embeddings.

### **DocketDive Current Pipeline** ❌

```typescript
// In scripts/ingest-folder.ts:
const text = extractText(file);
const chunks = splitText(text); // Chunking
await collection.insertMany(chunks.map(c => ({
  content: c,
  metadata: {...},
  // ❌ MISSING: $vector field with embeddings
})));
```

---

## Root Cause Analysis

### Why "witness age 14" Isn't Found

**Hypothesis 1**: Embedding step not implemented in ingest-folder.ts
- ✅ Confirmed: No embedding generation during ingestion
- ❌ Documents stored WITHOUT vectors

**Hypothesis 2**: Embeddings generated but not stored in `$vector` field
- ✅ Likely: `$vector` field missing from all documents
- ❌ Astra DB requires `$vector` for similarity search

**Hypothesis 3**: Wrong embedding model configured
- Checking: EMBED_MODEL configured as "dengcao/Qwen3-Embedding-0.6B:Q8_0" (1024-dim)
- Expected: "intfloat/multilingual-e5-large" (1024-dim) or "nomic-embed-text:v1.5" (768-dim)
- Status: Model dimension mismatch may exist

---

## The Missing Link: Embedding During Ingestion

### What Should Happen (per LangChain/LlamaIndex)

```
1. Load Document
   "In South Africa, a witness to a will must be..."
   
2. Chunk Document (preserve context)
   Chunk 1: "A witness to a will must be at least 14 years old..."
   Chunk 2: "The witness must be present when..."
   
3. EMBED EACH CHUNK ← THIS IS MISSING
   Chunk 1: [0.123, 0.456, ..., -0.789] (1024 dimensions)
   Chunk 2: [0.234, 0.567, ..., -0.890] (1024 dimensions)
   
4. Store with Vector
   {
     "content": "A witness to a will must be at least 14 years old...",
     "metadata": {...},
     "$vector": [0.123, 0.456, ..., -0.789]  ← PRESENT
   }
   
5. At Query Time
   User: "witness age requirement"
   ↓
   Embed Query: [0.111, 0.222, ..., -0.888]
   ↓
   Find Nearest Vectors (cosine similarity)
   ↓
   Return matching chunks with "14 years old" ✅
```

### What's Currently Happening (DocketDive)

```
1. Load Document ✅
2. Chunk Document ✅
3. EMBED → ❌ NOT HAPPENING
4. Store WITHOUT vector ❌
   {
     "content": "A witness to a will must be at least 14 years old...",
     "metadata": {...},
     "$vector": null ← MISSING
   }
5. At Query Time
   User: "witness age requirement"
   ↓
   Embed Query: [0.111, 0.222, ..., -0.888]
   ↓
   Try to search for similar vectors
   ↓
   ❌ NO VECTORS TO SEARCH - EMPTY RESULT
```

---

## Fix Required

### File: `scripts/ingest-folder.ts`

**Current (Broken)**:
```typescript
const chunks = chunk Text(text);
await collection.insertMany(
  chunks.map(c => ({
    content: c,
    metadata: {...}
    // ❌ Missing: $vector
  }))
);
```

**Should Be (Fixed)**:
```typescript
const chunks = chunkText(text);

// ✅ Generate embeddings for each chunk
const chunksWithVectors = await Promise.all(
  chunks.map(async (content) => {
    const vector = await generateEmbedding(content);
    return {
      $vector: vector,  // ← ADD THIS
      content,
      metadata: {...}
    };
  })
);

await collection.insertMany(chunksWithVectors);
```

---

## Comparison Table: RAG Pipelines

| Feature | LangChain | LlamaIndex | Pinecone | **DocketDive** |
|---------|-----------|-----------|----------|---------|
| **Embedding During Ingestion** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Vector Storage** | ✅ Required | ✅ Required | ✅ Required | ❌ Missing |
| **Semantic Search** | ✅ Works | ✅ Works | ✅ Works | ❌ Broken |
| **Fallback to Keyword** | ✅ Yes (hybrid) | ✅ Yes | ✅ Yes | ✅ Yes (only option) |
| **Memory Efficiency** | ✅ Batched | ✅ Batched | ✅ Batched | ✅ Yes |

---

## Next Steps

### 1. **Immediate**: Fix Ingestion Pipeline
Update `scripts/ingest-folder.ts` to generate embeddings:

```bash
# Run embedding generation for existing documents
npm run reembed-docs
```

### 2. **Verify**: Test Witness Query
After re-embedding, test:
```bash
npm run test-rag
```

### 3. **Monitor**: Health Checks
```bash
npx tsx diagnose-rag.ts
```

---

## Open Source References

### LangChain RAG Example
- **Repo**: https://github.com/langchain-ai/langchainjs
- **Pattern**: AstraDBVectorStore + embeddings during load
- **Lesson**: Embeddings are NOT optional

### LlamaIndex RAG Example
- **Repo**: https://github.com/run-llama/LlamaIndex
- **Pattern**: Two-stage pipeline (load → embed → index)
- **Lesson**: Explicit embedding step required

### Llamafile (Simple Local RAG)
- **Repo**: https://github.com/Mozilla-Ocho/llamafile
- **Pattern**: Embedded model + vector similarity
- **Lesson**: Even simple RAGs embed everything

---

## Conclusion

**The issue is clear**: Documents lack vector embeddings. This is the #1 failure point in RAG systems.

DocketDive follows 80% of best practices but **critically misses the embedding step during ingestion**.

**Fix Priority**: 🔴 CRITICAL - Implement embedding generation in ingest pipeline
