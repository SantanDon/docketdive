# DocketGPT - South African Legal AI Assistant

DocketGPT is a comprehensive legal technology platform designed specifically for South African law. It combines artificial intelligence with legal expertise to provide students, legal professionals, and the general public with accessible legal assistance and educational resources.

## 🎯 Purpose & Mission

DocketGPT aims to democratize legal knowledge in South Africa by providing:
- **Accessible Legal Assistance**: AI-powered chat interface for legal queries
- **Educational Support**: Study aids and learning resources for law students
- **Document Analysis**: Automated processing and analysis of legal documents
- **Template Generation**: Customizable legal document templates
- **Research Tools**: Case law research and parliamentary bill tracking

## 🚀 Key Features

### Core Functionality
- **AI Chat Interface**: Conversational AI trained on South African legal content
- **Document Upload & Analysis**: Support for PDF documents with intelligent extraction
- **Legal Templates**: Comprehensive library of customizable legal documents
- **Case Law Research**: Search and analysis of South African case law
- **Parliamentary Bill Tracking**: Monitor and analyze current legislation

### Specialized Features
- **Student Mode**: Enhanced features for law students including quiz generation
- **Voice Input/Output**: Speech-to-text and text-to-speech capabilities
- **Mobile Responsive**: Optimized for mobile devices
- **Document Drafting**: AI-assisted legal document creation
- **Email Template Generation**: Automated legal correspondence templates

## 🛠 Technical Architecture

### Frontend
- **Framework**: Next.js 14 with React 18
- **Styling**: CSS Modules with responsive design
- **UI Components**: Custom component library
- **Mobile Optimization**: Dedicated mobile-first approach

### Backend & APIs
- **Runtime**: Node.js with Next.js API routes
- **AI Integration**: Multiple LLM providers (Groq, OpenAI, etc.)
- **Database**: PostgreSQL with Prisma ORM
- **File Processing**: PDF parsing and text extraction
- **Security**: Rate limiting, input validation, CORS protection

### Key API Endpoints
- `/api/chat` - AI chat interface
- `/api/pdfroute` - Document upload and analysis
- `/api/templates` - Legal template management
- `/api/parliament-bills` - Legislative tracking
- `/api/tts` - Text-to-speech conversion
- `/api/usage` - Usage analytics

## 📚 Legal Content & Data Sources

### Document Libraries
- **Legal Textbooks**: Comprehensive collection of South African legal texts
- **Case Law**: Database of South African court decisions
- **Legislation**: Current and historical South African laws
- **Legal Templates**: Pre-built templates for common legal documents

### Categories Covered
- Criminal Law
- Contract Law
- Constitutional Law
- Property Law
- Family Law
- Business Law
- Intellectual Property
- Tax Law (SARS documentation)

## 🎓 Educational Features

### Student Support
- **Quiz Generation**: AI-powered study aids
- **Exam Paper Analysis**: Upload and analyze past exam papers
- **Conversational Learning**: Interactive legal education
- **Case Study Tools**: Guided case analysis

### Research Capabilities
- **Citation Linking**: Automatic linking to legal sources
- **Cross-referencing**: Related case and statute identification
- **Legal Writing Assistance**: Drafting support for legal documents

## 🔧 Development & Deployment

### Local Development
```bash
# Clone repository
git clone [repository-url]
cd docketgpt

# Install dependencies
npm install

# Environment Variables
# Note: Environment variables are already configured in the .env file
# Review the .env file to ensure all required API keys and configurations are present

# Run development server
npm run dev
```

### Environment Configuration
The project includes a pre-configured `.env` file with:
- **Database**: AstraDB configuration for data storage
- **AI Providers**: Groq, OpenAI, and OpenRouter API keys
- **Search**: Google Custom Search API for web searches
- **TTS**: Voice synthesis API configurations
- **Deployment**: Vercel deployment protection

### Production Deployment
- **Platform**: Vercel optimized
- **Docker**: Containerized deployment support
- **Environment**: Production-ready configuration
- **Monitoring**: Built-in performance monitoring

## 🔒 Security & Compliance

- **Data Protection**: Secure file handling and storage
- **Privacy**: User data protection measures
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Comprehensive security validation
- **CORS Protection**: Cross-origin request security

## 📱 Mobile Experience

DocketGPT is designed with a mobile-first approach:
- **Responsive Design**: Optimized for all screen sizes
- **Touch Interface**: Mobile-friendly interactions
- **Performance**: Optimized for mobile networks
- **Accessibility**: Screen reader and accessibility support

## 🌟 Future Roadmap

- **Enhanced AI Models**: Integration with more specialized legal AI
- **Expanded Content**: Broader South African legal coverage
- **Collaborative Features**: Multi-user document editing
- **Advanced Analytics**: Detailed usage and learning analytics
- **Integration APIs**: Third-party system integration

## 🤝 Contributing

We welcome contributions from the legal and tech communities:
- **Legal Experts**: Help improve content accuracy
- **Developers**: Contribute to platform development
- **Students**: Provide feedback on educational features
- **Users**: Report issues and suggest improvements

## 📞 Support & Contact

For support, questions, or collaboration opportunities, please reach out through the appropriate channels in the repository.

---

**DocketGPT** - Making South African law accessible, one query at a time.
