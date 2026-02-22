import time
import json
import os
from google.cloud import vision
from google.cloud import storage

# --- CONFIGURATION ---
BUCKET_NAME = "boc-bot-transit-bucket"
OUTPUT_DIR = "extracted_texts"
# Add any file you already finished here!
FILES_TO_SKIP = ["CAO-2-2016-ONAR-DE-MINIMIS.pdf"] 

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def extract_text_from_pdf(bucket_name, file_name):
    vision_client = vision.ImageAnnotatorClient()
    storage_client = storage.Client()

    gcs_source_uri = f"gs://{bucket_name}/{file_name}"
    unique_folder = file_name.replace(".pdf", "").replace(" ", "_")
    gcs_destination_uri = f"gs://{bucket_name}/ocr_output/{unique_folder}/"

    feature = vision.Feature(type_=vision.Feature.Type.DOCUMENT_TEXT_DETECTION)
    input_config = vision.InputConfig(
        gcs_source=vision.GcsSource(uri=gcs_source_uri), 
        mime_type='application/pdf'
    )
    output_config = vision.OutputConfig(
        gcs_destination=vision.GcsDestination(uri=gcs_destination_uri), 
        batch_size=1
    )

    async_request = vision.AsyncAnnotateFileRequest(
        features=[feature], 
        input_config=input_config, 
        output_config=output_config
    )

    print(f"🚀 Starting AI OCR for {file_name}...")
    operation = vision_client.async_batch_annotate_files(requests=[async_request])
    operation.result(timeout=420) 

    bucket = storage_client.get_bucket(bucket_name)
    blob_list = list(bucket.list_blobs(prefix=f"ocr_output/{unique_folder}/"))
    blob_list.sort(key=lambda x: x.name)
    
    full_text = ""
    for blob in blob_list:
        if blob.name.endswith(".json"):
            json_string = blob.download_as_text()
            response = json.loads(json_string)
            for page_response in response.get('responses', []):
                annotation = page_response.get('fullTextAnnotation')
                if annotation:
                    full_text += annotation.get('text', '') + "\n"
    
    return full_text

def run_batch_process():
    storage_client = storage.Client()
    bucket = storage_client.get_bucket(BUCKET_NAME)
    
    blobs = bucket.list_blobs()
    pdf_files = [blob.name for blob in blobs if blob.name.endswith(".pdf")]

    for pdf in pdf_files:
        # 🛡️ THE SKIP LOGIC
        if pdf in FILES_TO_SKIP:
            print(f"⏭️  Skipping {pdf} (Already done last night!)")
            continue

        clean_name = pdf.replace(".pdf", ".txt").replace("/", "_")
        local_path = os.path.join(OUTPUT_DIR, clean_name)

        if os.path.exists(local_path):
            print(f"⏭️  Skipping {pdf} (TXT already exists locally).")
            continue

        try:
            text = extract_text_from_pdf(BUCKET_NAME, pdf)
            if text:
                with open(local_path, "w", encoding="utf-8") as f:
                    f.write(text)
                print(f"✅ Saved: {local_path}")
            print("-" * 30)
        except Exception as e:
            print(f"❌ Failed to process {pdf}: {e}")

if __name__ == "__main__":
    run_batch_process()
    print("\n🏁 EXTRACTION FINISHED. You are ready to seed the new data!")