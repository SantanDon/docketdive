# ⚖️ DocketDive - South African Legal AI Assistant

An intelligent RAG (Retrieval-Augmented Generation) chatbot specialized in South African law, powered by LangChain, Ollama, and DataStax Astra DB.

![DocketDive Banner](https://img.shields.io/badge/Legal%20AI-South%20Africa-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-green)

## 🎉 What's New (November 2025)

### ✨ Recent Improvements:
- **✅ Professional Citations**: Now shows actual document names (e.g., "*Contract Law in South Africa*") instead of generic "Source 1"
- **⚡ 47% Faster Responses**: Optimized RAG pipeline from 45s to 24s
- **📤 Document Upload**: Upload PDF, DOCX, or TXT files for quick AI analysis or knowledge base integration
- **🤖 Groq Integration**: Optional Groq API support for 10x faster analysis
- **🧪 Comprehensive Testing**: 100% test coverage with automated E2E tests

👉 **[See Quick Reference](QUICK_REFERENCE.md)** | **[Read Full Report](FINAL_REPORT.md)**

User Query
    ↓
Frontend (Next.js + React)
    ↓
API Route (/api/chat)
    ↓
1. Generate Query Embedding (Ollama)
    ↓
2. Vector Similarity Search (Astra DB)
    ↓
3. Retrieve Top-K Documents
    ↓
4. Build Context with Retrieved Docs
    ↓
5. Generate Response (Ollama + LangChain)
    ↓
Return Response + Sources
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Ollama** ([Download here](https://ollama.ai))
- **DataStax Astra DB Account** (Free tier available at [astra.datastax.com](https://astra.datastax.com))

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd docketdive
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install and Configure Ollama

Download and install Ollama from [ollama.ai](https://ollama.ai), then pull the required models:

```bash
# Pull the chat model (choose one)
ollama pull llama3          # Recommended for general use
# ollama pull llama3.1      # Larger, more capable
# ollama pull mistral       # Alternative option

# Pull the embedding model
ollama pull all-minilm:22m  # Fast and efficient
# ollama pull nomic-embed-text  # Alternative option
```

Verify Ollama is running:
```bash
ollama list
```

### 4. Set Up Astra DB

1. Go to [astra.datastax.com](https://astra.datastax.com)
2. Create a new database (Free tier is sufficient)
3. Create a new collection named `docketdive`
4. Enable Vector Search on the collection
5. Copy your **Application Token** and **API Endpoint**

### 5. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

```env
# Astra DB Configuration
ASTRA_DB_APPLICATION_TOKEN=AstraCS:xxxxxxxxxxxxx
ENDPOINT=https://xxxxx.apps.astra.datastax.com
ASTRA_DB_ID=xxxxx-xxxxx-xxxxx
ASTRA_DB_REGION=us-east1
COLLECTION_NAME=docketdive

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
EMBED_MODEL=all-minilm:22m
CHAT_MODEL=llama3

# Document Processing
CHUNK_SIZE=700
CHUNK_OVERLAP=150
```

### 6. Load Legal Documents into Database

Place your PDF files in the `smaterial/` directory, then run:

```bash
npm run load-db
```

This will:
- Extract text from all PDF files
- Create intelligent text chunks
- Generate embeddings for each chunk
- Store everything in Astra DB

Expected output:
```
🚀 Starting DocketDive PDF Processing...
📚 Found 19 PDF file(s) to process
📄 Processing: Constitutional_Law.pdf
   ✂️  Created 47 chunks
   ✅ Successfully inserted 47/47 chunks
...
✅ PDF processing complete!
```

### 7. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
docketdive/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts          # Main RAG chat API endpoint
│   │   └── utils/
│   │       └── rag.ts             # RAG utility functions
│   ├── global.css                 # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main chat interface
├── scripts/
│   └── loadDb.ts                  # PDF processing script
├── smaterial/                     # Legal documents (PDFs)
├── public/                        # Static assets
├── .env                           # Environment variables (not in git)
├── .env.example                   # Environment template
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
└── README.md                      # This file
```

## 🔧 Key Components

### Frontend (`app/page.tsx`)

- Modern, responsive chat interface
- Real-time message streaming
- Source citation display
- Suggested questions
- Mobile-friendly design

### Chat API (`app/api/chat/route.ts`)

1. **Query Processing**: Sanitizes and validates user input
2. **Document Retrieval**: Performs vector similarity search
3. **Context Building**: Formats retrieved documents
4. **Response Generation**: Uses LLM with context
5. **Source Attribution**: Returns relevant document sources

### Database Loader (`scripts/loadDb.ts`)

- PDF text extraction
- Smart text chunking (preserves context)
- Batch processing with retry logic
- Progress tracking and error handling
- Metadata extraction

## 🎨 Customization

### Adjust Retrieval Settings

In `app/api/chat/route.ts`:

```typescript
const TOP_K = 5; // Number of documents to retrieve (default: 5)
```

### Change Chunk Size

In `.env`:

```env
CHUNK_SIZE=700      # Smaller chunks = more precise but less context
CHUNK_OVERLAP=150   # Overlap maintains context between chunks
```

### Modify LLM Temperature

In `app/api/chat/route.ts`:

```typescript
const chatModel = new ChatOllama({
  baseUrl: OLLAMA_BASE_URL,
  model: CHAT_MODEL,
  temperature: 0.1,  // Lower = more factual, Higher = more creative
});
```

## 🐛 Troubleshooting

### Ollama Connection Issues

**Problem**: "Could not connect to the AI service"

**Solutions**:
- Verify Ollama is running: `ollama list`
- Check the URL in `.env` matches your Ollama server
- Try restarting Ollama: `ollama serve`

### Database Connection Errors

**Problem**: "Database connection error"

**Solutions**:
- Verify credentials in `.env`
- Check Astra DB dashboard is accessible
- Ensure collection `docketdive` exists
- Verify vector search is enabled

### No Results Returned

**Problem**: Chatbot says "No relevant documents found"

**Solutions**:
- Run `npm run load-db` to populate the database
- Check that PDFs were successfully processed
- Verify embeddings are being generated
- Try a more specific query

### PDF Processing Fails

**Problem**: "No text extracted from PDF"

**Solutions**:
- Ensure PDFs are not image-based (need OCR)
- Check PDF files are not corrupted
- Verify sufficient disk space
- Try processing fewer files at once

## 📊 Performance Optimization

### Improve Response Speed

1. **Use smaller models**: Switch to `phi3` or `mistral` in `.env`
2. **Reduce TOP_K**: Retrieve fewer documents (3-5 is optimal)
3. **Enable GPU**: Configure Ollama to use GPU if available
4. **Optimize chunks**: Smaller chunks = faster processing

### Improve Answer Quality

1. **Use larger models**: Switch to `llama3.1` or `mixtral`
2. **Increase TOP_K**: Retrieve more context (7-10 documents)
3. **Better chunking**: Increase `CHUNK_SIZE` and `CHUNK_OVERLAP`
4. **Better embeddings**: Use `nomic-embed-text` or `mxbai-embed-large`

## 🔐 Security Considerations

- **Never commit `.env`** to version control
- **Sanitize user inputs** (already implemented)
- **Rate limiting**: Consider adding for production
- **CORS policies**: Configure for production deployment
- **Database security**: Use read-only tokens where possible

## 🚢 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

**Note**: Ollama must be accessible from your deployment. Consider:
- Running Ollama on a cloud server
- Using Ollama's cloud API (when available)
- Alternative LLM providers (OpenAI, Anthropic)

### Deploy to Railway/Render

Similar process - ensure environment variables are set and Ollama is accessible.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 Legal Disclaimer

**IMPORTANT**: DocketDive is an AI assistant for informational purposes only. It does not provide legal advice. Always consult a qualified legal professional for specific legal matters.

- ✅ Use for research and general information
- ✅ Use for understanding legal concepts
- ❌ Do not use as a substitute for legal counsel
- ❌ Do not make legal decisions based solely on AI responses

## 📝 License

[Your License Here]

## 🙏 Acknowledgments

- **DataStax Astra DB** for vector database infrastructure
- **Ollama** for local LLM capabilities
- **LangChain** for RAG orchestration
- **Next.js** for the modern web framework
- South African legal community for knowledge resources

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: [your-email@example.com]

---

**Built with ⚖️ for the South African legal community**