import firebase_admin
from firebase_admin import firestore
from google.cloud.firestore_v1.vector import Vector # <--- IMPORTANT
import os
from dotenv import load_dotenv
import random

load_dotenv()

if not firebase_admin._apps:
    firebase_admin.initialize_app(options={'projectId': os.getenv('FIREBASE_PROJECT_ID')})

db = firestore.client()
dummy_vector = [random.uniform(-1, 1) for _ in range(768)]

print("💾 Seeding clean Vector data into Firestore...")

doc_data = {
    "text": "BOC De Minimis Rule: PHP 10,000 or less is tax-exempt.",
    "vector": Vector(dummy_vector), # <--- THIS IS THE KEY CHANGE
    "metadata": {"source": "MANUAL_TEST", "is_mock": True}
}

db.collection("faq_chunks").add(doc_data)
print("✅ SUCCESS! You now have a searchable Vector document.")