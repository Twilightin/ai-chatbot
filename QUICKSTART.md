# Quick Start Guide - Local Development

## Prerequisites

✅ PostgreSQL installed and running
✅ Node.js 18+ installed
✅ pnpm installed

## Setup Steps

### 1. Environment Variables

Edit `.env.local`:

```bash
# Database (already configured)
POSTGRES_URL=postgresql://localhost:5432/ai_chatbot

# Azure OpenAI (already configured)
AZURE_OPENAI_API_KEY=your-azure-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview
AZURE_OPENAI_LLM_DEP_NAME=gpt-4o

# Authentication (NOT USED - authentication disabled)
# AUTH_SECRET=not-needed

# Blob Storage (NOT USED - using local storage)
# BLOB_READ_WRITE_TOKEN=not-needed

# AI Gateway (NOT USED - using Azure OpenAI directly)
# AI_GATEWAY_API_KEY=not-needed
```

### 2. Verify Azure OpenAI Credentials

Your `.env.local` is already configured with Azure OpenAI credentials. No additional setup needed!

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run the Application

```bash
pnpm dev
```

### 5. Access the App

Open your browser to:

```
http://localhost:3000
```

## Features

### ✅ Available Features

- Chat with AI (Azure OpenAI GPT-4o)
- Create documents (text, code, spreadsheets)
- Upload images (saved to `/public/uploads/`)
- Chat history (saved in PostgreSQL)
- No login required!

### ❌ Disabled Features

- User authentication
- Rate limiting
- User permissions
- Vercel Blob storage

## File Locations

### Uploaded Files

- **Location**: `/public/uploads/`
- **Access**: `http://localhost:3000/uploads/filename.ext`

### Database

- **Host**: localhost:5432
- **Database**: ai_chatbot
- **Tables**: User, Chat, Message_v2, Document, etc.

### Logs

- **Terminal**: See pnpm dev output
- **Browser**: Check browser console (F12)

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
pg_isready

# If not running:
brew services start postgresql@16  # macOS with Homebrew
```

### Azure OpenAI Connection Error

```
Error: Failed to connect to Azure OpenAI
```

**Solution**: Verify your Azure credentials in `.env.local` are correct

### Port Already in Use

```
Error: Port 3000 is already in use
```

**Solution**:

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
pnpm dev -- -p 3001
```

### Cannot Find Module Error

```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
```

## Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# Format code
pnpm format

# Database commands
pnpm db:studio      # Open Drizzle Studio GUI
pnpm db:generate    # Generate new migration
pnpm db:migrate     # Run migrations
pnpm db:push        # Push schema changes (dev only)
```

## Database Management

### View Tables

```bash
psql ai_chatbot -c "\dt"
```

### View Users

```bash
psql ai_chatbot -c "SELECT * FROM \"User\";"
```

### View Chats

```bash
psql ai_chatbot -c "SELECT * FROM \"Chat\" LIMIT 10;"
```

### Clear All Data

```bash
psql ai_chatbot -c "TRUNCATE \"User\", \"Chat\", \"Message_v2\", \"Document\" CASCADE;"
```

### Open Drizzle Studio (GUI)

```bash
pnpm db:studio
```

Then open: http://localhost:4983

## Security Notice

⚠️ **This setup is for LOCAL DEVELOPMENT ONLY!**

**Never deploy this to production because**:

- No authentication = anyone can access
- No rate limiting = potential abuse
- No user permissions = anyone can delete anything
- Files stored locally = not scalable

## Restoring Authentication

See `MODIFICATIONS.md` for detailed instructions on how to restore the original authentication system.

---

**Happy coding!** 🚀
