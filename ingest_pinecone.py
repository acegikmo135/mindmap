"""
ingest_pinecone.py
Inserts Chapter 1 (Crop Production and Management) into Pinecone.
10 topic-level chunks, properly flattened for Pinecone's schema rules.

Run:
    python ingest_pinecone.py
"""

import json, os, time
from pinecone import Pinecone

API_KEY    = "pcsk_VteHo_EEgFW47dr75Nk9udT5nC2EdNgA6FLn22JjteEtifw9qAwPQoA9oEy1qMq1t85CP"
INDEX_NAME = "cognistruct-rag"
NAMESPACE  = "class8-science"
DATASET    = os.path.join(os.path.dirname(__file__), "dataset", "class8_science_crop_production_and_management.json")

def main():
    # ── Connect ────────────────────────────────────────────────────────────────
    pc = Pinecone(api_key=API_KEY)
    print(f"Connected. Indexes: {[i.name for i in pc.list_indexes()]}")

    # ── Create index if missing ────────────────────────────────────────────────
    if INDEX_NAME not in [i.name for i in pc.list_indexes()]:
        print("Creating index...")
        pc.create_index_for_model(
            name=INDEX_NAME,
            cloud="aws",
            region="us-east-1",
            embed={"model": "multilingual-e5-large", "field_map": {"text": "text"}},
        )
        while not pc.describe_index(INDEX_NAME).status.ready:
            time.sleep(2)
        print("Index ready.")

    index = pc.Index(INDEX_NAME)

    # ── Delete everything in the namespace ────────────────────────────────────
    print("Deleting all existing records in namespace...")
    index.delete(delete_all=True, namespace=NAMESPACE)
    time.sleep(3)
    print("Namespace cleared.")

    # ── Load and flatten records ───────────────────────────────────────────────
    with open(DATASET, encoding="utf-8") as f:
        raw = json.load(f)

    records = []
    for item in raw:
        m = item["metadata"]
        records.append({
            "_id":           item["id"],          # e.g. class8_science_topic_001
            "text":          item["text"],         # this gets embedded by Pinecone
            "subject":       m["subject"],
            "class_":        m["class"],           # 'class' is a reserved word so use class_
            "chapter":       m["chapter"],
            "topic":         m["topic"],
            "chunk_index":   str(m["chunk_index"]),
            "keywords":      m["keywords"],        # list[str] — allowed by Pinecone
        })

    print(f"\nLoaded {len(records)} chunks from dataset.")
    for r in records:
        print(f"  {r['_id']} | {r['topic']}")

    # ── Upsert all 10 records ──────────────────────────────────────────────────
    print("\nUpserting to Pinecone...")
    index.upsert_records(NAMESPACE, records)
    print("Upsert sent.")

    # ── Wait then verify ───────────────────────────────────────────────────────
    print("Waiting 8s for indexing...")
    time.sleep(8)

    stats = index.describe_index_stats()
    ns_info = (stats.namespaces or {}).get(NAMESPACE)
    count = getattr(ns_info, "record_count", None) or getattr(ns_info, "vector_count", None)
    print(f"\nRecords in '{NAMESPACE}': {count}")

    # ── Test searches ──────────────────────────────────────────────────────────
    queries = [
        "what is irrigation",
        "what are kharif and rabi crops",
        "what is manure and fertiliser",
        "how is sowing done with seed drill",
    ]

    print("\n── Search tests ──────────────────────────────────────────")
    for q in queries:
        result = index.search(
            namespace=NAMESPACE,
            query={"inputs": {"text": q}, "top_k": 1},
        )
        hits = result.get("result", {}).get("hits", [])
        if hits:
            h = hits[0]
            print(f"Q: {q}")
            print(f"   → [{h['_score']:.3f}] {h['_id']} | {h['fields'].get('topic','')}")
        else:
            print(f"Q: {q} → No hits")
        print()


if __name__ == "__main__":
    main()
