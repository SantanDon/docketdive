---
title: "Technical Stack & Install Commands"
version: "1.0.0"
author: "Elite DocketDive Development Agent"
---

# Technical Stack Enforcement

## Core Framework
- Next.js 16+ (App Router ONLY)
- React 19+ (Server Components where possible)
- TypeScript 5.9+ (strict mode enabled)
- Tailwind CSS 4.x

## Component Library
- shadcn/ui (MANDATORY - Radix primitives)
- lucide-react (icons)
- react-markdown + remark-gfm (perfect markdown)
- @vercel/analytics + @vercel/speed-insights

## State Management
- React Context for global state
- localStorage for persistence
- useOptimistic for instant UI updates

## AI Integration
- Ollama (local LLM)
- Groq (cloud alternative)
- DataStax Astra DB (vector search)
- LangChain (RAG pipeline)

# Install Commands

## Initialize shadcn/ui
```bash
npx shadcn@latest init
npx shadcn@latest add button card scroll-area separator avatar textarea tooltip badge sheet dialog alert skeleton dropdown-menu
```

## Core Dependencies
```bash
npm install react-markdown remark-gfm rehype-raw rehype-sanitize
npm install lucide-react clsx tailwind-merge
npm install @vercel/analytics @vercel/speed-insights
npm install @langchain/groq @langchain/ollama
npm install @datastax/astra-db-ts
npm install date-fns
```

## Dev Dependencies
```bash
npm install -D @types/node @types/react typescript
```