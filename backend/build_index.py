from medical_chatbot_simple import load_or_build_index, PDF_PATH

if __name__ == "__main__":
    print("Building medical knowledge base index...")
    load_or_build_index(PDF_PATH, force_rebuild=True)
    print("Index created successfully!")
