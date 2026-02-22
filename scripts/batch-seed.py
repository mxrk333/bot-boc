import firebase_admin
from firebase_admin import firestore
from google.cloud import aiplatform
from vertexai.language_models import TextEmbeddingModel
from google.cloud.firestore_v1.vector import Vector
import os
import time

# 1. Setup
if not firebase_admin._apps:
    firebase_admin.initialize_app()
db = firestore.client()

aiplatform.init(project="boc-bot", location="us-central1")
model = TextEmbeddingModel.from_pretrained("text-embedding-004")

def chunk_text(text, chunk_size=1000, chunk_overlap=200):
    chunks = []
    for i in range(0, len(text), chunk_size - chunk_overlap):
        chunks.append(text[i:i + chunk_size].strip())
    return chunks

def run_batch_seeding():
    input_folder = "extracted_texts"
    collection = db.collection("faq_chunks")

    if not os.path.exists(input_folder):
        print(f"❌ Folder '{input_folder}' not found!")
        return

    # Look for all .txt files you just extracted
    files = [f for f in os.listdir(input_folder) if f.endswith(".txt")]
    print(f"📂 Found {len(files)} text files to index.")

    for filename in files:
        # Clean up the name for metadata (e.g., 'CMTA_RA_10863')
        source_name = filename.replace(".txt", "").upper()
        print(f"\n📖 Processing {source_name}...")
        
        with open(os.path.join(input_folder, filename), "r", encoding="utf-8") as f:
            content = f.read()

        chunks = chunk_text(content)
        print(f"✂️  Split into {len(chunks)} chunks.")

        for i, chunk in enumerate(chunks):
            # Stability Retry Logic
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    embeddings = model.get_embeddings([chunk])
                    vector_values = embeddings[0].values
                    
                    doc_data = {
                        "text": chunk,
                        "vector": Vector(vector_values),
                        "metadata": {
                            "source": source_name,
                            "chunk_index": i,
                            "processed_at": firestore.SERVER_TIMESTAMP
                        }
                    }
                    collection.add(doc_data)
                    print(f"  ✅ Chunk {i+1}/{len(chunks)} indexed.")
                    break 
                except Exception as e:
                    print(f"  ⚠️ Attempt {attempt+1} failed (Likely internet spike): {e}")
                    time.sleep(3) 
            
        print(f"🎉 Finished indexing {source_name}")

if __name__ == "__main__":
    run_batch_seeding()
    print("\n🚀 DATABASE FULLY LOADED. BOC Bot is now a polymath!")