# Database Setup Guide - PostgreSQL

This guide provides step-by-step instructions for setting up the PostgreSQL database for the AI Chatbot application.

---

## Prerequisites

- PostgreSQL 14+ installed on your system
- Terminal/Command Line access
- Basic knowledge of PostgreSQL commands

---

## Installation

### macOS (using Homebrew)

```bash
# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Verify installation
psql --version
```

### Ubuntu/Debian

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

### Windows

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. Follow the installation wizard
4. Set a password for the postgres user
5. Verify installation in Command Prompt:
   ```cmd
   psql --version
   ```

---

## Database Creation

### Step 1: Access PostgreSQL

```bash
# macOS/Linux - Login as postgres user
psql postgres

# OR if you have a default user
psql -U your_username -d postgres
```

### Step 2: Create Database

```sql
-- Create the database
CREATE DATABASE ai_chatbot;

-- Verify database was created
\l

-- Expected output should include:
-- ai_chatbot | your_user | UTF8 | ...
```

### Step 3: Connect to the Database

```sql
-- Connect to the new database
\c ai_chatbot

-- You should see: "You are now connected to database "ai_chatbot"..."
```

### Step 4: Verify Connection

```sql
-- Check current database
SELECT current_database();

-- Should return: ai_chatbot
```

---

## Database Schema Setup

The application uses Drizzle ORM to manage database schema and migrations.

### Step 1: Install Dependencies

```bash
# Make sure you're in the project directory
cd /Users/twilightin/TruthSetYouFree/NodeJS/ai-chatbot

# Install dependencies (if not already done)
pnpm install
```

### Step 2: Configure Environment

Edit `.env.local` file:

```bash
# Local PostgreSQL connection
POSTGRES_URL=postgresql://localhost:5432/ai_chatbot

# OR with username/password if required
# POSTGRES_URL=postgresql://username:password@localhost:5432/ai_chatbot
```

### Step 3: Generate Migration Files

```bash
# Generate migration files from schema
pnpm drizzle-kit generate
```

This will create migration files in the `drizzle/` directory based on your schema definitions.

### Step 4: Run Migrations

```bash
# Apply all pending migrations to the database
pnpm drizzle-kit migrate

# OR use push for development (syncs schema without migrations)
pnpm drizzle-kit push
```

### Step 5: Verify Tables

```bash
# Connect to PostgreSQL
psql -d ai_chatbot

# List all tables
\dt

# Expected tables:
# - User
# - Chat
# - Message_v2
# - Document
# - Suggestion
# - Vote
```

---

## Database Schema Overview

### Tables Created

1. **User**

   - `id` (TEXT, PRIMARY KEY)
   - `email` (TEXT, UNIQUE, NOT NULL)
   - `password` (TEXT)
   - `type` (TEXT, DEFAULT 'regular')

2. **Chat**

   - `id` (UUID, PRIMARY KEY)
   - `createdAt` (TIMESTAMP, NOT NULL)
   - `title` (TEXT, NOT NULL)
   - `userId` (TEXT, REFERENCES User.id)
   - `visibility` (TEXT, DEFAULT 'private')

3. **Message_v2**

   - `id` (UUID, PRIMARY KEY)
   - `chatId` (UUID, REFERENCES Chat.id)
   - `role` (TEXT, NOT NULL)
   - `content` (JSONB, NOT NULL)
   - `createdAt` (TIMESTAMP, NOT NULL)

4. **Document**

   - `id` (UUID, PRIMARY KEY)
   - `createdAt` (TIMESTAMP, NOT NULL)
   - `title` (TEXT, NOT NULL)
   - `content` (TEXT)
   - `kind` (TEXT, DEFAULT 'text')
   - `userId` (TEXT, REFERENCES User.id)

5. **Suggestion**

   - `id` (UUID, PRIMARY KEY)
   - `documentId` (UUID, REFERENCES Document.id)
   - `originalText` (TEXT, NOT NULL)
   - `suggestedText` (TEXT, NOT NULL)
   - `description` (TEXT)
   - `isResolved` (BOOLEAN, DEFAULT false)
   - `userId` (TEXT, REFERENCES User.id)
   - `createdAt` (TIMESTAMP, NOT NULL)

6. **Vote**
   - `chatId` (UUID, REFERENCES Chat.id)
   - `messageId` (UUID, NOT NULL)
   - `isUpvoted` (BOOLEAN, NOT NULL)

---

## Verification Commands

### Check Database Connection

```bash
# Test connection
psql -d ai_chatbot -c "SELECT version();"
```

### Check Database Status

```bash
# Check if PostgreSQL is running
pg_isready

# Expected output: /tmp:5432 - accepting connections
```

### View All Tables

```sql
-- Connect to database
psql -d ai_chatbot

-- List tables with details
\dt+

-- View specific table structure
\d User
\d Chat
\d Message_v2
```

### Count Records

```sql
-- Check if tables are empty (initially should be 0)
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Chat";
SELECT COUNT(*) FROM "Message_v2";
```

---

## Common Issues & Solutions

### Issue 1: "psql: command not found"

**Problem**: PostgreSQL is not in your PATH

**Solution**:

```bash
# macOS - Add to .zshrc or .bash_profile
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Reload shell
source ~/.zshrc
```

### Issue 2: "database does not exist"

**Problem**: Database not created

**Solution**:

```bash
# Create the database
psql postgres -c "CREATE DATABASE ai_chatbot;"
```

### Issue 3: "connection refused"

**Problem**: PostgreSQL service not running

**Solution**:

```bash
# macOS
brew services start postgresql@16

# Linux
sudo systemctl start postgresql

# Check status
pg_isready
```

### Issue 4: "permission denied"

**Problem**: User doesn't have database permissions

**Solution**:

```sql
-- Grant all privileges to your user
GRANT ALL PRIVILEGES ON DATABASE ai_chatbot TO your_username;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
```

### Issue 5: Migration fails

**Problem**: Schema conflicts or connection issues

**Solution**:

```bash
# Check environment variable
echo $POSTGRES_URL

# Drop and recreate database (WARNING: deletes all data!)
psql postgres -c "DROP DATABASE ai_chatbot;"
psql postgres -c "CREATE DATABASE ai_chatbot;"

# Run migrations again
pnpm drizzle-kit push
```

---

## Database Management Commands

### Backup Database

```bash
# Create backup
pg_dump ai_chatbot > backup_$(date +%Y%m%d).sql

# Create compressed backup
pg_dump ai_chatbot | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
# Restore from backup
psql ai_chatbot < backup_20251107.sql

# Restore from compressed backup
gunzip -c backup_20251107.sql.gz | psql ai_chatbot
```

### Reset Database

```bash
# Drop all tables (keeps database)
psql ai_chatbot -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migrations
pnpm drizzle-kit push
```

### Delete Database

```bash
# WARNING: This deletes ALL data permanently!
psql postgres -c "DROP DATABASE ai_chatbot;"
```

---

## Drizzle Studio (Database GUI)

Drizzle provides a web-based GUI to explore your database:

```bash
# Start Drizzle Studio
pnpm drizzle-kit studio

# Access at: https://local.drizzle.studio
```

Features:

- Browse all tables
- View and edit data
- Run SQL queries
- Visualize relationships

---

## Environment Variables Reference

```bash
# Basic connection (no authentication)
POSTGRES_URL=postgresql://localhost:5432/ai_chatbot

# With authentication
POSTGRES_URL=postgresql://username:password@localhost:5432/ai_chatbot

# With specific host and port
POSTGRES_URL=postgresql://username:password@localhost:5432/ai_chatbot

# SSL enabled (for production)
POSTGRES_URL=postgresql://username:password@host:5432/ai_chatbot?sslmode=require
```

---

## Initial Data (Optional)

### Create a Test User

```sql
-- Insert a test user (for development only)
INSERT INTO "User" (id, email, type)
VALUES ('test-user-123', 'test@example.com', 'regular');

-- Verify
SELECT * FROM "User";
```

### Create a Test Chat

```sql
-- Insert a test chat
INSERT INTO "Chat" (id, "createdAt", title, "userId", visibility)
VALUES (
  gen_random_uuid(),
  NOW(),
  'Test Chat',
  'test-user-123',
  'private'
);

-- Verify
SELECT * FROM "Chat";
```

---

## Quick Start Commands (Summary)

```bash
# 1. Create database
psql postgres -c "CREATE DATABASE ai_chatbot;"

# 2. Verify connection
psql -d ai_chatbot -c "SELECT current_database();"

# 3. Run migrations
pnpm drizzle-kit push

# 4. Verify tables
psql -d ai_chatbot -c "\dt"

# 5. Start the application
pnpm dev
```

---

## PostgreSQL Configuration (Advanced)

### Optimize for Development

Edit `postgresql.conf` (location varies by installation):

```conf
# Development settings for better performance
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 128MB
```

### Restart PostgreSQL

```bash
# macOS
brew services restart postgresql@16

# Linux
sudo systemctl restart postgresql
```

---

## Security Notes

⚠️ **For Local Development Only**

Current setup uses:

- No password authentication (localhost only)
- Default PostgreSQL port (5432)
- No SSL/TLS encryption

**For Production**:

- Use strong passwords
- Enable SSL/TLS
- Restrict network access
- Use environment-specific users
- Enable audit logging

---

## Additional Resources

- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Drizzle ORM Docs**: https://orm.drizzle.team/
- **Drizzle Kit CLI**: https://orm.drizzle.team/kit-docs/overview

---

**Created**: November 7, 2025  
**Purpose**: Local PostgreSQL database setup for AI Chatbot  
**Database**: ai_chatbot  
**Version**: PostgreSQL 14+
