Technical Design Document: BOC Tariff Bot
Project Codename: Proyekto Gabay
Stack: Google Cloud Platform (Serverless), Gemini 2.0 Flash, Firestore, Node.js/TypeScript.

1. System Architecture
   The system follows a decoupled RAG (Retrieval-Augmented Generation) pattern. It separates the Data Ingestion (Cold Path) from the User Query (Hot Path) to ensure that compute costs are only incurred during active usage.
   Component Overview
   Storage: Google Cloud Storage (GCS) for raw BOC PDF/Policy documents.
   Database: Firestore (Native Mode) for storing text chunks and their corresponding vector embeddings.
   Embedding Model: text-embedding-004 (High dimensionality, low cost).
   Reasoning Engine: gemini-2.0-flash (Optimized for speed and Taglish nuance).
   Compute: Cloud Functions (Firebase) for the API layer.

2. Data Engineering (The "Hacker" Route)
   Instead of an expensive 24/7 vector engine, we use a one-time Python ingestion script to prep our knowledge base.
   2.1 Chunking Strategy
   Method: Recursive Character Text Splitting.
   Chunk Size: 1,000 characters with a 200-character overlap to maintain legal context across sentences.
   Metadata: Each chunk in Firestore will include source_document, section_id, and last_updated to support the "Check Grounding" feature.
   2.2 Vector Storage (Firestore)
   We will utilize Firestore’s VectorValue data type.
   Index Type: Single-Field Vector Index.
   Distance Measure: COSINE (Optimal for comparing text similarity).

3. The Retrieval & Generation Pipeline
   Step 1: Query Embedding
   When a user asks, "How many cans of spam can I send?", the request is sent to a Cloud Function. The function calls text-embedding-004 to turn that question into a 768-dimension vector.
   Step 2: Firestore findNearest()
   We execute a vector similarity search directly in Firestore:
   TypeScript

const collection = db.collection('tariff_knowledge');
const query = collection.findNearest('embedding_field', userQueryVector, {
limit: 5,
distanceMeasure: 'COSINE'
});

Step 3: Prompt Augmentation (The "Logic Layer")
The retrieved chunks (e.g., CAO rules on consumables) are injected into a system prompt for Gemini 2.0 Flash:
"You are an expert BOC Consultant. Using the provided snippets from the CMTA, answer the user in Taglish. If the item exceeds 20 units, flag it as a commercial quantity."

4. Feature Implementation Details
   Feature
   Technical Implementation
   Tax-Exemption Calc
   TypeScript Logic: A stateless function that takes user input (current shipment value + previous 2 shipments) and compares it against the 150,000 constant.
   Multimodal Finder
   Gemini Vision: The image is passed directly to Gemini 2.0 Flash with the instruction: "Identify this item and provide the most likely AHTN category based on your internal knowledge."
   Scam Grounding
   Google Search Tool: Enable the Google Search_retrieval tool in the Gemini API config to fetch real-time BOC notices on fly-by-night forwarders.

5. Cost Infrastructure (Monthly Estimate)
   Based on the "Cheap-but-Real" philosophy:
   Firestore: $0.00 (Stay within the 50k free daily reads / 1GiB storage).
   Cloud Functions: ~$0.00 (First 2M invocations/month are free).
   Gemini 2.0 Flash: ~$0.10 - $1.00 (Pay-per-token; extremely cheap for text).
   Embeddings: ~$0.01 (Negligible cost for text-embedding-004).
   Total Estimated Monthly OpEx: <$5.00 (Well under the $50 target).

6. Security & Compliance
   Data Privacy: No PII (Personally Identifiable Information) is stored in the vector database. Shipments are processed ephemerally.
   Legal Disclaimer: Every response must prepend a disclaimer: "This is an AI guide, not a formal BOC ruling."

Next Step: Would you like me to write the Python Script for the "Chunk & Embed" phase to help you get your PDFs into Firestore?
