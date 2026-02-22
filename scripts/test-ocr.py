import firebase_admin
from firebase_admin import firestore
from google.cloud import vision
import os

# Initialize Firebase (ADC mode: no JSON key needed!)
if not firebase_admin._apps:
    firebase_admin.initialize_app()

def test_ocr_single_page(image_path):
    # This automatically uses your 'gcloud' login
    client = vision.ImageAnnotatorClient()

    with open(image_path, "rb") as image_file:
        content = image_file.read()

    image = vision.Image(content=content)

    print(f"🛰️ Sending {image_path} to Google Vision...")
    
    # OCR for document-heavy images
    response = client.document_text_detection(image=image)
    
    if response.error.message:
        print(f"❌ API Error: {response.error.message}")
        return

    text = response.full_text_annotation.text
    print("\n--- OCR RESULT ---")
    print(text if text else "⚠️ No text detected.")
    print("------------------\n")

if __name__ == "__main__":
    # IMPORTANT: Since Vision's standard OCR takes images, 
    # use one of your JPGs or a single PDF page for this test.
    # We will use 'async_batch_annotate_files' for multi-page PDFs later.
    TEST_FILE = "path/to/your/scanned_document.jpg" 
    test_ocr_single_page(TEST_FILE)