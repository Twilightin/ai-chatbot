# Document API Authentication Fix

## Issue

Artifacts could not be re-opened because the `/api/document` endpoint was returning **403 Forbidden**.

## Root Cause

The `/app/(chat)/api/document/route.ts` endpoint still had authentication checks enabled, while other API endpoints (chat, history) were using a mock user for local development.

### Error Logs

```
GET /api/document?id=35b867cb-7470-4737-b73a-20abdefd52c9 403 in 22ms
GET /api/document?id=35b867cb-7470-4737-b73a-20abdefd52c9 403 in 26ms
GET /api/document?id=35b867cb-7470-4737-b73a-20abdefd52c9 403 in 24ms
```

### Impact

When users tried to:

1. **Re-open artifacts** - The artifact.tsx component tried to fetch document content
2. **SWR fetch triggered** - `GET /api/document?id=...`
3. **403 Forbidden returned** - Authentication check failed
4. **No content loaded** - Artifact appeared blank/empty

## Solution

Updated `/app/(chat)/api/document/route.ts` to use the same mock user pattern as other API endpoints.

### Changes Made

#### GET Method (Fetch Document)

**Before:**

```typescript
const session = await auth();

if (!session?.user) {
  return new ChatSDKError("unauthorized:document").toResponse();
}

// ...

if (document.userId !== session.user.id) {
  return new ChatSDKError("forbidden:document").toResponse();
}
```

**After:**

```typescript
// ORIGINAL: Authentication check - COMMENTED OUT (authentication disabled)
// const session = await auth();
// if (!session?.user) {
//   return new ChatSDKError("unauthorized:document").toResponse();
// }

// NEW: Use mock user for local development (UUID format)
const mockUserId = "00000000-0000-0000-0000-000000000001";

// ...

// NEW: Check ownership with mock user
if (document.userId !== mockUserId) {
  return new ChatSDKError("forbidden:document").toResponse();
}
```

#### POST Method (Save Document)

**Before:**

```typescript
const session = await auth();
if (!session?.user) {
  return new ChatSDKError("not_found:document").toResponse();
}

// ...

userId: session.user.id,
```

**After:**

```typescript
// NEW: Use mock user for local development
const mockUserId = "00000000-0000-0000-0000-000000000001";

// ...

userId: mockUserId,
```

#### DELETE Method (Delete Document Versions)

**Before:**

```typescript
const session = await auth();
if (!session?.user) {
  return new ChatSDKError("unauthorized:document").toResponse();
}

if (document.userId !== session.user.id) {
  return new ChatSDKError("forbidden:document").toResponse();
}
```

**After:**

```typescript
// NEW: Use mock user for local development
const mockUserId = "00000000-0000-0000-0000-000000000001";

if (document.userId !== mockUserId) {
  return new ChatSDKError("forbidden:document").toResponse();
}
```

## Testing

### Before Fix

1. Create artifact: "write a haiku in the artifacts" ✅
2. Minimize artifact ✅
3. Re-open artifact ❌ **Blank/Empty**
4. Check logs: `403 Forbidden` errors

### After Fix

1. Create artifact: "write a haiku in the artifacts" ✅
2. Minimize artifact ✅
3. Re-open artifact ✅ **Shows content!**
4. Check logs: `200 OK` responses

## Mock User Consistency

All API endpoints now use the same mock user ID for local development:

```
00000000-0000-0000-0000-000000000001
```

### Endpoints Using Mock User

1. ✅ `/app/(chat)/api/history/route.ts` - Chat history
2. ✅ `/app/(chat)/api/chat/route.ts` - Chat messages
3. ✅ `/app/(chat)/actions.ts` - Server actions
4. ✅ `/app/(chat)/layout.tsx` - User context
5. ✅ `/app/(chat)/api/document/route.ts` - **NOW FIXED** ✨

## Re-enabling Authentication

When ready to re-enable authentication:

### 1. Restore Document API

```typescript
// In /app/(chat)/api/document/route.ts

// GET
const session = await auth();
if (!session?.user) {
  return new ChatSDKError("unauthorized:document").toResponse();
}

if (document.userId !== session.user.id) {
  return new ChatSDKError("forbidden:document").toResponse();
}

// POST
const document = await saveDocument({
  id,
  content,
  title,
  kind,
  userId: session.user.id, // Use real user ID
});

// DELETE
if (document.userId !== session.user.id) {
  return new ChatSDKError("forbidden:document").toResponse();
}
```

### 2. Restore Other Endpoints

- Uncomment authentication checks in history, chat, and actions
- Remove mock user constants
- Use `session.user.id` instead of mockUserId

## Benefits

✅ **Artifacts now load correctly** when re-opened  
✅ **Consistent authentication** across all API endpoints  
✅ **Proper error handling** maintained  
✅ **Easy to re-enable** real authentication later

## Related Issues Fixed

This fix resolves:

1. ❌ **Blank artifacts on re-open** → ✅ Content loads
2. ❌ **403 Forbidden errors** → ✅ 200 OK responses
3. ❌ **Inconsistent auth handling** → ✅ All endpoints use mock user

## Files Modified

- `/app/(chat)/api/document/route.ts` - All three methods (GET, POST, DELETE)

## Status

✅ **Complete** - Document API now works with mock user authentication

## Date

2025-11-08

## Testing Checklist

- [x] Create artifact with "write a haiku in the artifacts"
- [x] Verify artifact displays on creation
- [x] Minimize artifact
- [x] Re-open artifact
- [x] Verify content loads (no blank screen)
- [x] Check console - no 403 errors
- [x] Verify GET /api/document returns 200
- [ ] Test POST /api/document (editing content)
- [ ] Test DELETE /api/document (version management)
