import firebase_admin
from firebase_admin import firestore
import os
from dotenv import load_dotenv
import random

# --- THE FIX: Correct Imports for Vector and DistanceMeasure ---
from google.cloud.firestore_v1.vector import Vector
from google.cloud.firestore_v1.base_vector_query import DistanceMeasure
# -------------------------------------------------------------

load_dotenv()

# 1. Initialize Firebase
if not firebase_admin._apps:
    firebase_admin.initialize_app(options={'projectId': os.getenv('FIREBASE_PROJECT_ID')})

db = firestore.client()

def test_vector_search():
    print("🔍 Simulating a user query...")
    
    # Matching your seed dimension (768)
    query_vector = [random.uniform(-1, 1) for _ in range(768)]
    
    collection = db.collection("faq_chunks")

    try:
        # 2. Perform the 'Find Nearest' search
        # We use the DistanceMeasure.COSINE enum object here
        query = collection.find_nearest(
            vector_field="vector",
            query_vector=Vector(query_vector), 
            distance_measure=DistanceMeasure.COSINE, 
            limit=3
        )

        results = query.get()

        if not results:
            print("⚠️ No matches found. Check your 'faq_chunks' collection in the console.")
            return

        print(f"✅ Found {len(results)} matches:")
        for doc in results:
            data = doc.to_dict()
            print(f"\n📄 Text Match: {data.get('text')}")
            print(f"🔗 Source: {data.get('metadata', {}).get('source')}")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_vector_search()