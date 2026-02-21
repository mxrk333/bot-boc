import firebase_admin
from firebase_admin import storage, firestore
from google import genai
from google.genai import types
from pdf2image import convert_from_bytes
import io

# 1. Setup Firebase & Gemini (ADC Version)
# No service account JSON path needed here. 
# Make sure you ran 'gcloud auth application-default login' in your terminal!
firebase_admin.initialize_app(options={
    'storageBucket': 'your-project-id.firebasestorage.app', # Replace with your actual ID
    'projectId': 'your-project-id'                         # Replace with your actual ID
})

db = firestore.client()
bucket = storage.bucket()
gemini_client = genai.Client(api_key="YOUR_GEMINI_API_KEY")

def ingest_from_bucket(blob_name, doc_label):
    # Re-access bucket through the initialized app
    blob = bucket.blob(blob_name)
    
    # Download PDF as bytes directly from Firebase
    print(f"Reading {blob_name}...")
    pdf_bytes = blob.download_as_bytes()
    
    # Convert PDF bytes to images (300 DPI)
    # Ensure 'poppler' is installed on your OS for this to work
    pages = convert_from_bytes(pdf_bytes, dpi=300)
    
    for i, page in enumerate(pages):
        # Buffer image to memory to send to Gemini
        img_byte_arr = io.BytesIO()
        page.save(img_byte_arr, format='JPEG')
        
        # 2. Gemini 2.0 Flash OCR
        # We send the raw bytes of the image to Gemini for high-accuracy vision-to-text
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                "OCR this page. Keep tables in Markdown. Preserve legal section headers.", 
                types.Part.from_bytes(data=img_byte_arr.getvalue(), mime_type='image/jpeg')
            ]
        )
        page_text = response.text

        # 3. Generate Vector Embedding
        # This turns the text into a list of 768 numbers (a vector)
        emb_response = gemini_client.models.embed_content(
            model="text-embedding-004",
            contents=page_text,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
        )
        vector = emb_response.embeddings[0].values

        # 4. Save to Firestore with Native Vector field
        # Using firestore.Vector() is what enables the kNN search in 2026
        db.collection("faq_chunks").add({
            "text": page_text,
            "vector": firestore.Vector(vector), 
            "metadata": {
                "source": doc_label,
                "page": i + 1,
                "blob_path": blob_name
            }
        })
        print(f"Indexed {doc_label} Page {i+1}")

# Execute the ingestion
# Make sure "raw/CMTA-RA-10863.pdf" is exactly how it appears in your bucket!
ingest_from_bucket("raw/CMTA-RA-10863.pdf", "CMTA_RA_10863")