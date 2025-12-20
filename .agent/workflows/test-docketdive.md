---
description: Comprehensive DocketDive Testing Workflow
---

# DocketDive Testing Workflow

## Overview
This workflow tests all aspects of DocketDive to ensure it works as expected, matching the original functionality shown in the demo video.

## Test Categories

### 1. System Health Checks
- Verify Ollama is running and models are available
- Check database connectivity
- Verify environment variables are properly configured

### 2. RAG Pipeline Tests
- Test document retrieval with various queries
- Verify semantic search and query expansion
- Check context building and source attribution
- Validate response generation

### 3. Response Quality Tests
- Verify markdown formatting matches expected format
- Check citation format (「quoted text」 [Source X, s Y(Z)])
- Ensure proper source attribution
- Validate disclaimer inclusion

### 4. Performance Tests
- Measure response time for typical queries
- Compare against baseline performance
- Check for any performance degradation

### 5. Edge Case Tests
- Test with irrelevant queries (should refuse gracefully)
- Test with no context available
- Test with very specific legal queries
- Test with general legal questions

## Expected Behavior (from video)

### Response Format
- Clean, professional markdown formatting
- Inline citations using 「quoted text」 [Source X] format
- Sources section at the end with full references
- Disclaimer at the very end
- No "thinking" or internal deliberation visible

### Response Speed
- Typical queries: 3-8 seconds
- Complex queries: 8-15 seconds
- Should not exceed 20 seconds for any query

### Citation Style
- Every factual claim should be cited
- Citations should be inline, not just at the end
- Source references should include document title and citation number
- Relevance percentage should be shown in sources section

## Test Execution Steps

1. Run system health checks
2. Run test-rag-prompt.ts to verify prompt structure
3. Run test-full-pipeline.ts to verify end-to-end functionality
4. Test via browser interface with sample queries
5. Compare results against expected behavior
6. Document any discrepancies
