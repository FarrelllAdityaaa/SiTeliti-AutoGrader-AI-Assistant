import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

print("🔍 Sedang mengambil daftar model dari Groq...\n")

try:
    models = client.models.list()
    
    print("===== DAFTAR MODEL VISION YANG AKTIF =====")
    found = False
    for model in models.data:
        # Cari model yang mengandung "vision" di ID-nya (case-insensitive)
        if "vision" in model.id.lower():
            print(f"✅ ID: {model.id}")
            print(f"   Owner: {model.owned_by}")
            print(f"   Context: {model.context_window}")
            print("-" * 30)
            found = True
            
    if not found:
        print("❌ Tidak ditemukan model dengan nama 'vision'. Coba cek model lain:")
        for model in models.data:
            print(f"- {model.id}")

except Exception as e:
    print(f"Error: {e}")