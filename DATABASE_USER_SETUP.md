# Database User Setup - Troubleshooting Guide

This document explains the database user error encountered during local development and how it was resolved.

---

## Problem Overview

When attempting to send messages in the chat application, the following errors occurred:

### Error 1: Database Error (400)

```
{
  code: 'bad_request:database',
  message: 'An error occurred while executing a database query.',
  cause: 'Failed to save chat'
}
POST /api/chat 400 in 1542ms
```

### Error 2: Unauthorized History Access (401)

```
GET /api/history?limit=20 401 in 35ms
GET /api/history?limit=20 401 in 19ms
```

---

## Root Causes

### 1. **Random User ID Generation**

**Location**: `app/(chat)/api/chat/route.ts`

**Original Code** (Problematic):

```typescript
// This generated a NEW user ID on EVERY request!
const mockUserId = "local-user-" + generateUUID();
```

**Problem**:

- Each API request created a different user ID
- First request: Creates chat with user ID `local-user-abc123`
- Second request: Tries to access chat with user ID `local-user-xyz789`
- Database foreign key constraint violations
- User ownership mismatches

### 2. **User Table Schema Mismatch**

**Attempted**:

```sql
INSERT INTO "User" (id, email, type)
VALUES ('local-dev-user', 'local@user.com', 'regular');
```

**Error**:

```
ERROR: column "type" of relation "User" does not exist
```

**Actual Schema**:

```sql
Table "public.User"
  Column  |         Type          | Nullable |      Default
----------+-----------------------+----------+-------------------
 id       | uuid                  | not null | gen_random_uuid()
 email    | character varying(64) | not null |
 password | character varying(64) |          |
```

**Problems Identified**:

- ❌ No `type` column exists in User table
- ❌ `id` column requires UUID format (not string)
- ❌ User ID must be consistent across all requests

### 3. **Authentication Still Enabled in History API**

**Location**: `app/(chat)/api/history/route.ts`

**Original Code**:

```typescript
import { auth } from "@/app/(auth)/auth";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }
  // ...
}
```

**Problem**:

- Authentication check was NOT disabled in history API
- All other routes had auth disabled, but this one was missed
- Resulted in 401 Unauthorized errors when fetching chat history

---

## Solutions Implemented

### Solution 1: Fixed User ID (UUID Format)

**Updated Code** in `app/(chat)/api/chat/route.ts`:

```typescript
// NEW: Create a mock user session for database operations
// Using a fixed user ID (UUID format) to ensure consistency across requests
const mockUserId = "00000000-0000-0000-0000-000000000001";
const mockSession = {
  user: {
    id: mockUserId,
    email: "local@user.com",
    type: "regular" as const,
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};
```

**Benefits**:

- ✅ Consistent user ID across ALL requests
- ✅ Proper UUID format matching database schema
- ✅ No foreign key constraint violations
- ✅ Chats are correctly associated with the same user

### Solution 2: Create Mock User in Database

**Command**:

```sql
INSERT INTO "User" (id, email)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'local@user.com')
ON CONFLICT (id) DO NOTHING;
```

**Result**:

```
INSERT 0 1
```

**Verification**:

```sql
SELECT * FROM "User";

                  id                  |     email      | password
--------------------------------------+----------------+----------
 00000000-0000-0000-0000-000000000001 | local@user.com |
(1 row)
```

### Solution 3: Disable Authentication in History API

**Updated Code** in `app/(chat)/api/history/route.ts`:

```typescript
import type { NextRequest } from "next/server";
// ORIGINAL: Authentication import - COMMENTED OUT (authentication disabled)
// import { auth } from "@/app/(auth)/auth";
import { getChatsByUserId, deleteAllChatsByUserId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  // ...existing code...

  // ORIGINAL: Authentication check - COMMENTED OUT (authentication disabled)
  // const session = await auth();
  // if (!session?.user) {
  //   return new ChatSDKError("unauthorized:chat").toResponse();
  // }

  // NEW: Use mock user for local development (UUID format)
  const mockUserId = "00000000-0000-0000-0000-000000000001";

  const chats = await getChatsByUserId({
    id: mockUserId,
    limit,
    startingAfter,
    endingBefore,
  });

  return Response.json(chats);
}

export async function DELETE() {
  // Same pattern - use mock user ID
  const mockUserId = "00000000-0000-0000-0000-000000000001";
  const result = await deleteAllChatsByUserId({ userId: mockUserId });
  return Response.json(result, { status: 200 });
}
```

---

## Database Foreign Key Relationships

The User table has the following relationships:

```sql
Referenced by:
  TABLE "Chat" CONSTRAINT "Chat_userId_User_id_fk"
    FOREIGN KEY ("userId") REFERENCES "User"(id)

  TABLE "Document" CONSTRAINT "Document_userId_User_id_fk"
    FOREIGN KEY ("userId") REFERENCES "User"(id)

  TABLE "Suggestion" CONSTRAINT "Suggestion_userId_User_id_fk"
    FOREIGN KEY ("userId") REFERENCES "User"(id)
```

**Why This Matters**:

- All chats, documents, and suggestions MUST have a valid userId
- The userId MUST exist in the User table (foreign key constraint)
- Using a random ID on each request violates this constraint
- Using a fixed ID that exists in the database solves this

---

## Testing the Fix

### Step 1: Verify User Exists

```bash
psql -d ai_chatbot -c "SELECT * FROM \"User\";"
```

Expected output:

```
                  id                  |     email      | password
--------------------------------------+----------------+----------
 00000000-0000-0000-0000-000000000001 | local@user.com |
```

### Step 2: Refresh Application

- Refresh browser at http://localhost:3000
- The app should reload with new code

### Step 3: Send Test Message

- Type a message in the chat
- Click Send
- Message should be processed successfully

### Step 4: Verify Chat History

- Chat should appear in the sidebar
- No 401 errors in browser console
- Chat is associated with mock user

### Step 5: Check Database

```sql
-- View all chats
SELECT * FROM "Chat";

-- View all messages
SELECT * FROM "Message_v2";
```

All records should have `userId = '00000000-0000-0000-0000-000000000001'`

---

## Files Modified

### 1. `app/(chat)/api/chat/route.ts`

- Changed from random UUID to fixed UUID
- Ensures consistent user ID across requests

### 2. `app/(chat)/api/history/route.ts`

- Disabled authentication checks
- Uses same fixed mock user ID
- Allows chat history to be fetched

### 3. Database

- Created mock user record with proper UUID format
- Satisfies foreign key constraints

---

## Common Errors & Solutions

### Error: "column 'type' does not exist"

**Problem**: Trying to insert into non-existent column

**Solution**: Check actual table schema:

```bash
psql -d ai_chatbot -c "\d \"User\""
```

Only insert into columns that exist.

### Error: "invalid input syntax for type uuid"

**Problem**: Trying to use string as UUID

**Solution**: Cast string to UUID:

```sql
'00000000-0000-0000-0000-000000000001'::uuid
```

### Error: "violates foreign key constraint"

**Problem**: Referenced user doesn't exist

**Solution**: Create the user first:

```sql
INSERT INTO "User" (id, email)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'local@user.com');
```

### Error: 401 Unauthorized on /api/history

**Problem**: Authentication still enabled

**Solution**:

1. Comment out `auth()` imports
2. Use mock user ID instead of session
3. Remove authentication checks

---

## Why Not Use Real User Registration?

For local development without authentication:

**Pros of Mock User**:

- ✅ No login required
- ✅ Instant access to application
- ✅ Simplified development workflow
- ✅ All features work normally
- ✅ Easy to reset (just delete chats)

**Cons of Real Registration** (for local dev):

- ❌ Requires authentication system
- ❌ Need to create/manage user accounts
- ❌ More complex setup
- ❌ Slower development iteration
- ❌ Not necessary for testing

**For Production**: You would enable authentication and require real user registration.

---

## Mock User Details

**User ID**: `00000000-0000-0000-0000-000000000001` (UUID format)  
**Email**: `local@user.com`  
**Type**: `regular` (in application logic)  
**Password**: NULL (not required without authentication)

**Usage**:

- All chat messages
- All documents/artifacts
- All chat history
- All suggestions

---

## Verification Commands

### Check if user exists:

```bash
psql -d ai_chatbot -c "SELECT COUNT(*) FROM \"User\" WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;"
```

### View all chats for mock user:

```bash
psql -d ai_chatbot -c "SELECT id, title, \"createdAt\" FROM \"Chat\" WHERE \"userId\" = '00000000-0000-0000-0000-000000000001'::uuid;"
```

### Count messages by mock user:

```bash
psql -d ai_chatbot -c "SELECT COUNT(*) FROM \"Message_v2\" m JOIN \"Chat\" c ON m.\"chatId\" = c.id WHERE c.\"userId\" = '00000000-0000-0000-0000-000000000001'::uuid;"
```

### Reset all data (start fresh):

```bash
# Delete all chats (cascades to messages)
psql -d ai_chatbot -c "DELETE FROM \"Chat\" WHERE \"userId\" = '00000000-0000-0000-0000-000000000001'::uuid;"

# Delete all documents
psql -d ai_chatbot -c "DELETE FROM \"Document\" WHERE \"userId\" = '00000000-0000-0000-0000-000000000001'::uuid;"
```

---

## Summary

The database errors were caused by:

1. ❌ Random user IDs on each request
2. ❌ Schema mismatch (missing columns, wrong data type)
3. ❌ Incomplete authentication removal (history API)

Solutions implemented:

1. ✅ Fixed UUID user ID: `00000000-0000-0000-0000-000000000001`
2. ✅ Created mock user in database with correct schema
3. ✅ Disabled authentication in all API routes
4. ✅ Consistent user ID across all requests

**Result**: Chat application now works correctly without authentication, using a single mock user for all operations.

---

## Production Considerations

⚠️ **This setup is for LOCAL DEVELOPMENT ONLY**

**For Production Deployment**:

1. ❌ Remove mock user
2. ✅ Enable authentication (uncomment all auth code)
3. ✅ Require real user registration
4. ✅ Add rate limiting
5. ✅ Add user ownership checks
6. ✅ Use environment-specific user IDs
7. ✅ Enable password hashing
8. ✅ Add email verification
9. ✅ Implement session management

See `MODIFICATIONS.md` for instructions on restoring authentication.

---

**Created**: November 7, 2025  
**Purpose**: Document database user setup issues and solutions  
**Status**: ✅ Resolved
