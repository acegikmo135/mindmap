"""
search_pinecone.py
Search the Pinecone index and return top matching chunks.

Usage:
    python search_pinecone.py
    python search_pinecone.py "what is irrigation"
"""

import sys
from pinecone import Pinecone

API_KEY    = "pcsk_VteHo_EEgFW47dr75Nk9udT5nC2EdNgA6FLn22JjteEtifw9qAwPQoA9oEy1qMq1t85CP"
INDEX_NAME = "cognistruct-rag"
NAMESPACE  = "class8-science"
TOP_K      = 3


def search(query: str, top_k: int = TOP_K):
    pc    = Pinecone(api_key=API_KEY)
    index = pc.Index(INDEX_NAME)

    result = index.search(
        namespace=NAMESPACE,
        query={"inputs": {"text": query}, "top_k": top_k},
    )

    hits = result.get("result", {}).get("hits", [])
    return hits


def main():
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
    else:
        query = input("Enter search query: ").strip()

    if not query:
        print("No query provided.")
        return

    print(f"\nSearching for: \"{query}\"\n")
    hits = search(query)

    if not hits:
        print("No results found.")
        return

    for i, hit in enumerate(hits, 1):
        fields = hit.get("fields", {})
        print(f"{'─'*60}")
        print(f"Result #{i}")
        print(f"  ID       : {hit['_id']}")
        print(f"  Score    : {hit['_score']:.4f}")
        print(f"  Topic    : {fields.get('topic', 'N/A')}")
        print(f"  Chapter  : {fields.get('chapter', 'N/A')}")
        print(f"  Keywords : {', '.join(fields.get('keywords', []))}")
        print(f"\n  Full Text:\n")
        print(f"  {fields.get('text', '')}")
        print()


if __name__ == "__main__":
    main()
