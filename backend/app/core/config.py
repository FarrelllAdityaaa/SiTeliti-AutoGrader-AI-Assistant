import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from groq import AsyncGroq


# Load environment variables dari file .env
load_dotenv()

# Variabel untuk nama model Vision Groq
VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

def get_llm_parser():
    """
    Fungsi untuk menginisialisasi dan mengembalikan instance LLM ChatGroq 
    yang dioptimalkan untuk tugas parsing dan ekstraksi informasi dari teks.

    Returns:
        ChatGroq: Instance LLM yang telah dikonfigurasi untuk parsing.
    """
    
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY tidak ditemukan di file .env")
        
    return AsyncGroq(api_key=api_key)

def get_llm_grader():
    """
    Fungsi untuk menginisialisasi dan mengembalikan instance LLM ChatGroq 
    berdasarkan konfigurasi dari file .env.

    Returns:
        ChatGroq: Instance LLM yang telah dikonfigurasi untuk grading.
    """
    
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY tidak ditemukan di file .env")
        
    return ChatGroq(
        temperature=0,
        model_name="llama-3.3-70b-versatile",
        api_key=api_key,
        max_tokens=4096
    )
