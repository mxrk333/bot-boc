import firebase_admin
from firebase_admin import firestore
from google.cloud import aiplatform
from vertexai.language_models import TextEmbeddingModel
from google.cloud.firestore_v1.vector import Vector
from google.cloud.firestore_v1.base_vector_query import DistanceMeasure
# Change this import!
from vertexai.generative_models import GenerativeModel, Part

# 1. Setup
if not firebase_admin._apps:
    firebase_admin.initialize_app()
db = firestore.client()

# Initialize Vertex AI for everything
aiplatform.init(project="boc-bot", location="us-central1")

# Use Vertex AI's version of the models
embedding_model = TextEmbeddingModel.from_pretrained("text-embedding-004")
gemini_model = GenerativeModel("gemini-2.5-flash")

def ask_boc_expert(question):
    print(f"\n🔍 Thinking about: '{question}'...")
    
    # PHASE 1: RETRIEVAL
    embeddings = embedding_model.get_embeddings([question])
    query_vector = embeddings[0].values
    
    collection = db.collection("faq_chunks")
    query = collection.find_nearest(
        vector_field="vector",
        query_vector=Vector(query_vector),
        distance_measure=DistanceMeasure.COSINE,
        limit=3 
    )
    results = query.get()

    context_text = ""
    for doc in results:
        data = doc.to_dict()
        source = data.get('metadata', {}).get('source', 'Unknown Document')
        context_text += f"\n--- SOURCE: {source} ---\n{data['text']}\n"

    prompt = f"""
    You are an expert Philippine Bureau of Customs assistant. 
    Below are snippets from various official Customs laws (CMTA, CAO, CMO).
    Use the provided CONTEXT to answer the user's question. 

    LANGUAGE RULES:
    1. Support both English and Taglish. 
    2. If the user asks in Tagalog or Taglish, respond in helpful, friendly Taglish.
    3. If the user asks in English, keep it professional.

    RULES:
    1. Only use the provided context. 
    2. Mention the source (e.g., "Ayon sa CMTA...").

    CONTEXT:
    {context_text}

    USER QUESTION: {question}
    
    EXPERT ANSWER:"""

    # Generate content using Vertex AI's Gemini
    response = gemini_model.generate_content(prompt)
    
    print("\n" + "="*50)
    print("🤖 BOC BOT RESPONSE:")
    print(response.text)
    print("="*50 + "\n")

if __name__ == "__main__":
    query = input("Ask the BOC Expert: ")
    ask_boc_expert(query)