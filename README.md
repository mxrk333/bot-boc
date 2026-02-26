# 📦 BOC AI Assistant: Monorepo Stack

An AI-powered Philippine Bureau of Customs (BOC) Assistant built with a production-grade **RAG (Retrieval-Augmented Generation)** pipeline. This bot identifies items via Gemini Vision and provides authoritative tariff information using Vertex AI and Firestore Vector Search.

## 🎭 The BOC Bot Production

Building an AI assistant is like putting on a high-tech theater production!

| Tool                        | Role           | The "BOC Bot" Analogy                                            |
| --------------------------- | -------------- | ---------------------------------------------------------------- |
| **Gemini 2.0 Flash**        | The Lead Actor | The "brain" that reads the laws and answers the user.            |
| **Vertex AI (Embeddings)**  | The Librarian  | Translates questions into math (vectors) to find the right laws. |
| **Firestore Vector Search** | The Archive    | The massive shelf of BOC documents and tariff rates.             |
| **tRPC**                    | The Script     | Ensures the Frontend and Backend speak the same language.        |
| **React + Tailwind**        | The Stage      | The user interface where the "Customs Assistant" performs.       |
| **Turborepo**               | Stage Manager  | Coordinates the monorepo tasks so everything runs in sync.       |

---

## 🧠 Knowledge Scope & Capabilities

The BOC AI Assistant is specifically grounded in the **Customs Modernization and Tariff Act (CMTA)** and official BOC administrative orders.

### ✅ What the bot CAN answer:

- **Balikbayan Boxes:** Rules for OFWs and Qualifying Residents (e.g., the ₱150,000 annual exemption).
- **De Minimis Value:** Tax-free import limits for small items (₱10,000 and below).
- **Tariff Identification:** Estimating duty rates for specific items (electronics, luxury goods, etc.).
- **Prohibited vs. Restricted:** What items require permits (SRA, NTC, FDA) and what is flat-out banned.
- **Passenger Guidelines:** Currency limits ($10k USD / ₱50k PHP) and duty-free allowances for travelers.

### 🚫 Current Limitations (Out of Scope)

- **Real-time Parcel Tracking:** The bot does not have access to the BOC Parcel Tracking System.
- **Legal Representation:** Guidance is informational and not a substitute for a licensed Customs Broker.
- **Dynamic Exchange Rates:** Calculations are based on static tariff percentages.

---

## 🏗️ Project Architecture (RAG Pipeline)

The app uses **Retrieval-Augmented Generation (RAG)** to ensure the AI doesn't hallucinate.

1. **Vision Phase:** User uploads an image; Gemini 2.0 Flash Vision identifies the item.
2. **Vector Search:** We convert the query into a 768-dimension vector using `text-embedding-004`.
3. **Context Injection:** We perform a **COSINE similarity search** in Firestore to find relevant BOC law chunks.
4. **Generation:** Gemini provides a professional answer based **only** on the provided BOC context.

---

## 🛠️ Technical Specifications

| Feature           | Model / Service         | Purpose                                            |
| ----------------- | ----------------------- | -------------------------------------------------- |
| **LLM Engine**    | `gemini-2.0-flash`      | Fast, bilingual generation and reasoning.          |
| **Vision Model**  | `gemini-2.0-flash`      | High-fidelity OCR and object identification.       |
| **Embeddings**    | `text-embedding-004`    | Semantic document retrieval.                       |
| **Vector Search** | Firestore Vector Search | Native vector similarity matching.                 |
| **Backend**       | Cloud Functions v2      | Hosted in `us-central1` for low-latency AI access. |

---

## 📂 Monorepo Structure

```bash
├── apps/
│   ├── web/              # React frontend (Vite + Tailwind)
│   │   ├── src/App.tsx   # Main Chat UI & Conversation Logic
│   │   └── src/hooks/    # useAuth, useConversations (Firestore logic)
│   │
│   └── functions/        # Cloud Functions (tRPC Backend)
│       ├── src/index.ts  # api function gateway (us-central1)
│       └── src/trpc/     # botRouter.ts (Gemini & Vector Search logic)
│
├── packages/
│   ├── ui/               # Shared UI Components (Calculator, ChatPanel)
│   ├── shared/           # Zod schemas (Validation for Chat queries)
│   └── typescript-config/# Shared TS configurations
│
├── firebase.json         # Hosting rewrites & Cloud Run configuration
└── turbo.json            # Monorepo pipeline

```

---

## 🚀 Development & Deployment

### Local Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure .env.local in apps/web
VITE_API_URL=https://us-central1-boc-bot.cloudfunctions.net/api/trpc

# 3. Start dev servers
pnpm dev

```

### Production Deployment

```bash
# Deploy Backend Logic
firebase deploy --only functions

# Deploy Frontend Website
pnpm build
firebase deploy --only hosting

# Update Security Rules
firebase deploy --only firestore:rules

```

---

## 🔒 Security & Data Protection

- **CORS:** Restricted to the production domain to prevent API "leaking."
- **Firestore Rules:** `faq_chunks` (Knowledge Base) is set to `allow read, write: if false;` to prevent scraping.
- **User Data:** Conversations are protected by `request.auth.uid` checks.
- **Vertex AI:** Secured via Google Service Accounts (ADC) with short-lived tokens.

---

## 💬 Example Prompts to Try

- _"May tax ba ang sapatos na nagkakahalaga ng 8,000 pesos galing abroad?"_
- _"How many times a year can an OFW send a Balikbayan box duty-free?"_
- _"Anong requirements para mag-uwi ng dalawang laptop sa airport?"_
- _(Upload an image)_: _"Magkano ang tariff rate para sa item na ito?"_

---

Built with ❤️ for BOC AI Assistant Project.

---
