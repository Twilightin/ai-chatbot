# AI Chatbot - Azure OpenAI Edition

A Next.js AI chatbot with real-time streaming, document artifacts, multimodal input, and conversational memory. Powered by Azure OpenAI GPT-4o.

## Features

- 🤖 **Azure OpenAI GPT-4o** - Advanced language model with vision capabilities
- 💾 **Memory System** - Cross-conversation context with importance scoring
- 📄 **File Support** - PDF/TXT text extraction, image vision analysis
- 📝 **Document Artifacts** - Create and edit text, code, spreadsheets
- 🎨 **Modern UI** - Built with Next.js 15, Tailwind CSS, Radix UI
- 🗄️ **PostgreSQL** - Persistent chat history and memory storage

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- Azure OpenAI account with GPT-4o deployment

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Twilightin/ai-chatbot.git
   cd ai-chatbot
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```bash
   # Database (required)
   POSTGRES_URL=postgresql://user:password@localhost:5432/chatbot

   # Azure OpenAI (required)
   AZURE_OPENAI_API_KEY=your-azure-api-key
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
   AZURE_OPENAI_LLM_DEP_NAME=gpt-4o

   # Optional (not used in local development)
   AUTH_SECRET=generate-with-openssl-rand-base64-32
   REDIS_URL=redis://localhost:6379
   ```

4. **Set up the database**
   ```bash
   # Run migrations
   pnpm db:migrate
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## Database Setup

### Option 1: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb chatbot

# Set POSTGRES_URL in .env.local
POSTGRES_URL=postgresql://localhost:5432/chatbot
```

### Option 2: Vercel Postgres

1. Create a Vercel Postgres database
2. Copy the `POSTGRES_URL` from Vercel dashboard
3. Add to `.env.local`

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed instructions.

## Azure OpenAI Setup

1. **Create Azure OpenAI resource**
   - Go to [Azure Portal](https://portal.azure.com)
   - Create an OpenAI resource
   - Deploy GPT-4o model

2. **Get credentials**
   - Copy API key from "Keys and Endpoint" section
   - Copy endpoint URL
   - Copy deployment name

3. **Add to `.env.local`**
   ```bash
   AZURE_OPENAI_API_KEY=abc123...
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
   AZURE_OPENAI_LLM_DEP_NAME=gpt-4o
   ```

## Available Commands

### Development
```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Check code quality
pnpm format       # Auto-fix code issues
```

### Database
```bash
pnpm db:migrate   # Run database migrations
pnpm db:generate  # Generate new migration
pnpm db:studio    # Open Drizzle Studio (GUI)
```

### Testing
```bash
pnpm test         # Run Playwright tests
```

## File Upload Support

The app supports uploading files with automatic processing:

- **PDF files** - Text extracted and sent to AI
- **TXT files** - Content read and sent to AI
- **Images (PNG/JPG)** - Vision analysis with GPT-4o

Files are stored locally in `public/uploads/` directory.

## Memory System

The chatbot remembers information across conversations:

- Personal preferences and facts
- Context from previous chats
- Importance-based retrieval (only relevant memories loaded)

See [LLM_MEMORY_SYSTEM.md](LLM_MEMORY_SYSTEM.md) for details.

## Project Structure

```
ai-chatbot/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication (disabled in local dev)
│   └── (chat)/              # Chat pages and API routes
├── components/              # React components
├── lib/
│   ├── ai/                  # AI provider, models, prompts, tools
│   ├── db/                  # Database schema, queries, memory
│   └── utils/               # Utilities
├── public/uploads/          # Local file storage
└── .env.local              # Environment variables (create this)
```

## Important Notes

### Authentication
Authentication is **disabled** for local development. Original auth code is preserved with `// ORIGINAL:` comments in:
- `middleware.ts`
- `app/(chat)/api/chat/route.ts`

To re-enable, uncomment the original authentication logic.

### Rate Limiting
Rate limiting is **disabled** in local development. No message limits enforced.

### Production Deployment
⚠️ **Do not deploy this configuration to production** without re-enabling authentication and rate limiting.

## Documentation

- [CLAUDE.md](CLAUDE.md) - Guide for AI assistants working on this codebase
- [CODE_STRUCTURE.md](CODE_STRUCTURE.md) - Detailed architecture documentation
- [MODIFICATIONS.md](MODIFICATIONS.md) - Changes from original Vercel template
- [LLM_MEMORY_SYSTEM.md](LLM_MEMORY_SYSTEM.md) - Memory system details
- [QUICKSTART.md](QUICKSTART.md) - Quick reference guide

## Troubleshooting

### Database Connection Failed
```bash
# Check POSTGRES_URL in .env.local
# Ensure PostgreSQL is running
pnpm db:migrate  # Run migrations
```

### AI Requests Failing
```bash
# Verify Azure OpenAI credentials in .env.local
# Check deployment name matches your Azure deployment
# Ensure GPT-4o model is deployed
```

### Build Errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules
pnpm install
pnpm build
```

## Technology Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **AI SDK**: Vercel AI SDK 5.0
- **AI Provider**: Azure OpenAI GPT-4o
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: Tailwind CSS, Radix UI, Framer Motion
- **File Storage**: Local filesystem
- **Code Quality**: Biome (via ultracite)

## Contributing

This is a customized fork of the Vercel AI Chatbot template. Contributions welcome!

## License

See LICENSE file for details.

## Credits

Based on [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) template.
