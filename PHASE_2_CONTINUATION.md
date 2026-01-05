# Phase 2.4 Continuation - API Error Handling Implementation

**Status**: In Progress (5/12 routes completed)  
**Last Updated**: January 5, 2026  
**Session**: Continuation from previous session  

---

## Completed Routes ✅

1. ✅ `app/api/upload/route.ts` - withErrorHandling applied
2. ✅ `app/api/popia/route.ts` - withErrorHandling applied (POST + GET)
3. ✅ `app/api/drafting/route.ts` - withErrorHandling applied (POST + GET)
4. ✅ `app/api/simplify/route.ts` - withErrorHandling applied (POST + GET)
5. ✅ `app/api/chat/route.ts` - Already has streaming, left for now

---

## Critical Routes to Update (PRIORITY ORDER)

### 1. `app/api/contract-analysis/route.ts` 🔴 HIGH PRIORITY
- **Type**: POST + GET
- **Lines**: Find `export async function POST` and `export async function GET`
- **Pattern to Apply**:
  ```typescript
  import { withErrorHandling } from '../utils/route-handler';
  
  const contractAnalysisPostHandler = async (request: NextRequest) => {
    // ... existing code ...
  };
  export const POST = withErrorHandling(contractAnalysisPostHandler);
  
  const contractAnalysisGetHandler = async (request: NextRequest) => {
    // ... existing code ...
  };
  export const GET = withErrorHandling(contractAnalysisGetHandler);
  ```
- **Status**: ⏳ TODO

### 2. `app/api/audit/route.ts` 🔴 HIGH PRIORITY
- **Type**: POST + GET
- **Pattern**: Same as contract-analysis above
- **Status**: ⏳ TODO

### 3. `app/api/analyze/route.ts` 🔴 HIGH PRIORITY
- **Type**: POST
- **Pattern**: Apply withErrorHandling to POST only
- **Status**: ⏳ TODO

### 4. `app/api/compare/route.ts` 🔴 HIGH PRIORITY
- **Type**: POST
- **Pattern**: Apply withErrorHandling to POST only
- **Status**: ⏳ TODO

### 5. `app/api/document-chat/route.ts` 🟡 MEDIUM PRIORITY
- **Type**: POST (streaming, similar to chat)
- **Note**: May need special handling like chat route
- **Status**: ⏳ TODO

### 6. `app/api/legal-aid/route.ts` 🟡 MEDIUM PRIORITY
- **Type**: POST + GET
- **Pattern**: Standard POST/GET wrapping
- **Status**: ⏳ TODO

### 7. `app/api/export/route.ts` 🟡 MEDIUM PRIORITY
- **Type**: POST
- **Pattern**: Apply withErrorHandling to POST only
- **Status**: ⏳ TODO

---

## Optional Routes (Can defer to later)

- `app/api/language/route.ts` - GET only, simple config
- `app/api/health/route.ts` - GET only, diagnostics
- `app/api/heartbeat/route.ts` - POST, simple health check
- `app/api/ubuntu/route.ts` - Unknown purpose, can defer

---

## Implementation Template

**For Each Route:**

1. Add import at top:
   ```typescript
   import { withErrorHandling } from '../utils/route-handler';
   ```

2. Find the export line:
   ```typescript
   export async function POST(request: NextRequest) {
   ```

3. Convert to handler:
   ```typescript
   const [routeName]PostHandler = async (request: NextRequest) => {
     // ... all existing code stays the same ...
   };
   ```

4. Close handler and export:
   ```typescript
   };
   
   export const POST = withErrorHandling([routeName]PostHandler);
   ```

5. Repeat for GET, PUT, DELETE if they exist

6. **Test immediately after each route**:
   ```bash
   npm run build 2>&1 | findstr "Compiled successfully"
   ```

---

## Key Files Reference

- **Error Handler**: `app/api/utils/route-handler.ts`
- **Response Handler**: `app/api/utils/response-handler.ts`
- **Error Types**: `lib/error-types.ts`
- **Context**: `app/context/ErrorContext.tsx`

---

## Testing Checklist

After completing all 7 routes:

- [ ] `npm run build` passes (all 7 routes)
- [ ] Test query in browser - should still work
- [ ] Check for any console errors
- [ ] Verify error messages display in chat
- [ ] No React rendering issues

---

## Next Phase After This

**PHASE 3**: Reintroduce markdown formatting
- Carefully add FormattedResponse back to ChatBubble
- Test after each small change
- Do NOT use wrapper divs - use `<p>` tags directly

---

## Important Notes

⚠️ **DO NOT**:
- Use wrapper divs around text
- Change logic, only wrap handlers
- Skip the build test after each route
- Merge multiple routes into one edit

✅ **DO**:
- Test build after each route
- Keep existing error handling intact
- Use exactly the pattern shown above
- Document as you go

---

## Session Continuation Checklist

When resuming:
1. Read this file
2. Start with contract-analysis (first in list)
3. Apply pattern shown above
4. Test build
5. Move to next route
6. After all 7: create new continuation doc for Phase 3

