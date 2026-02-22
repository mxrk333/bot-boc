import os
import io
import time
import firebase_admin
from firebase_admin import storage, firestore
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# 1. Setup Firebase
firebase_admin.initialize_app(options={
    'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET'),
    'projectId': os.getenv('FIREBASE_PROJECT_ID')
})

db = firestore.client()
bucket = storage.bucket()

# 2. Setup Gemini (WITH THE v1beta FIX)
gemini_client = genai.Client(
    api_key=os.getenv('GEMINI_API_KEY'),
    http_options={'api_version': 'v1beta'} 
)

def ingest_from_bucket(blob_name, doc_label):
    blob = bucket.blob(blob_name)
    print(f"\n🚀 Processing PDF: {blob_name}")
    
    try:
        # Download PDF bytes
        pdf_bytes = blob.download_as_bytes()
        
        # 3. Send the WHOLE PDF to Gemini (More efficient for Quota)
        print(f"📡 Sending PDF to Gemini...")
        response = gemini_client.models.generate_content(
            model="gemini-1.5-flash",
            contents=[
                types.Part.from_bytes(data=pdf_bytes, mime_type='application/pdf'),
                "OCR this document. Provide the text for each page. Separate pages with '---PAGE_BREAK---'."
            ]
        )
        
        # Split text into pages
        pages_text = response.text.split('---PAGE_BREAK---')
        print(f"✅ Gemini read {len(pages_text)} pages!")

        for i, page_text in enumerate(pages_text):
            if not page_text.strip(): continue # Skip empty pages
            
            try:
                # 4. Generate Embedding
                print(f"🔢 Embedding Page {i+1}...")
                emb_response = gemini_client.models.embed_content(
                    model="text-embedding-004",
                    contents=page_text,
                    config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
                )
                
                # 5. Save to Firestore
                print(f"💾 Saving Page {i+1} to Firestore...")
                db.collection("faq_chunks").add({
                    "text": page_text.strip(),
                    "vector": firestore.Vector(emb_response.embeddings[0].values), 
                    "metadata": {
                        "source": doc_label, 
                        "page": i + 1,
                        "ingested_at": firestore.SERVER_TIMESTAMP
                    }
                })
                print(f"🎉 SUCCESS! Page {i+1} saved.")
                
                # Small pause to avoid Firestore write limits
                time.sleep(2)

            except Exception as e:
                print(f"⚠️ Error on Page {i+1}: {e}")
                time.sleep(10) # Wait if embedding/saving fails

    except Exception as e:
        if "429" in str(e) or "quota" in str(e).lower():
            print("🚨 Quota hit on PDF upload. The free tier is tight today!")
        else:
            print(f"❌ Error: {e}")

# Process the list
files_to_ingest = [
    {"blob_name": "boc-pdfs/CAO-2-2016-ONAR-DE-MINIMIS.pdf", "label": "CAO_DE_MINIMIS"},
]

for item in files_to_ingest:
    ingest_from_bucket(item["blob_name"], item["label"])

print("\n🏁 Mission accomplished.")