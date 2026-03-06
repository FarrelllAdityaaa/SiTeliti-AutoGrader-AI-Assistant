import os, io, fitz, asyncio, tempfile, time, base64
from PIL import Image
from fastapi import UploadFile
from app.core.config import get_llm_parser, VISION_MODEL


# Inisialisasi LLM Groq untuk Vision
client = get_llm_parser()

# FUNGSI PREROCESSING & UTILITIES
def encode_image_to_base64(image: Image.Image) -> str:
    """
    Fungsi untuk mengompres dan mengubah gambar PIL menjadi string 
    Base64 yang siap dikirim ke API Groq Vision.

    Args:
        image (PIL.Image.Image): Gambar yang akan diproses.

    Returns:
        str: String Base64 yang diformat sebagai URI untuk API Groq.

    Output:
        String Base64 yang siap dikirim ke API Groq Vision.
    """

    # Batasi sisi terpanjang 1024px agar hemat token dan ukuran file kecil
    max_size = 1024
    w, h = image.size
    if max(w, h) > max_size:
        scale = max_size / max(w, h)
        image = image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    
    # Ubah ke RGB (jika PNG transparan)
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Buffer untuk menyimpan gambar yang dikompres  
    buffered = io.BytesIO()

    # Quality 85 untuk kompresi yang baik tanpa kehilangan detail penting untuk OCR
    image.save(buffered, format="JPEG", quality=85)
    
    # Encode buffer ke base64 string
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    # Format URI Base64 standar untuk Groq Vision API
    return f"data:image/jpeg;base64,{img_str}"


# FUNGSI UTAMA UNTUK MEMPROSES SETIAP HALAMAN DENGAN API GROQ VISION
async def process_page_groq(base64_image: str, page_num: int) -> str:
    """
    Fungsi untuk memproses satu halaman PDF yang sudah diubah menjadi gambar Base64
    dengan mengirimkannya ke API Groq Vision dan mendapatkan teks hasil OCR.

    Args:
        base64_image (str): Gambar halaman dalam format Base64 yang siap dikirim ke API Groq.
        page_num (int): Nomor halaman yang sedang diproses (untuk logging).

    Returns:
        str: Teks hasil OCR dari halaman tersebut.

    Output:
        Teks hasil OCR dari halaman tersebut.
    """

    start_api = time.time()
    
    # Prompt untuk API Groq Vision
    # Fokus pada ekstraksi teks dengan format Markdown yang bersih dan terstruktur
    prompt = (
        "Anda adalah AI Ahli Ekstraksi Dokumen. "
        "Transkripsikan seluruh konten dari gambar dokumen ini menjadi teks Markdown yang bersih. "
        "ATURAN:\n"
        "1. JANGAN menambahkan kalimat basa-basi pembuka/penutup (seperti 'Berikut adalah teksnya'). Langsung berikan hasil Markdown.\n"
        "2. Jika terdapat blok kode Python ada blok kode lainnya, bungkus dengan rapi menggunakan format ```python atau kode lainnya ... ```.\n"
        "3. Jika terdapat gambar vektor berupa graf, peta, atau pohon (tree), deskripsikan node, sisi (edges), jalur, atau nilainya ke dalam bentuk teks terstruktur.\n"
        "4. Pertahankan format, struktur, dan indentasi (terutama pada kode) seakurat mungkin sesuai gambar asli."
    )

    try:
        response = await client.chat.completions.create(
            model=VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": base64_image
                            }
                        }
                    ]
                }
            ],
            temperature=0.1, 
            max_tokens=2048
        )
        
        # Ambil teks hasil OCR dari response
        result_text = response.choices[0].message.content
        end_api = time.time()
        
        print(f"Groq API Selesai ({end_api - start_api:.2f} detik)")
        return result_text
        
    except Exception as e:
        print(f"[ERROR] API Groq Page {page_num+1}: {e}")
        return ""


# FUNGSI UNTUK MENYIMPAN OUTPUT MARKDOWN UNTUK DEBUGGING
def save_debug_markdown(filename: str, content: str):
    """
    Fungsi untuk menyimpan hasil ekstraksi teks dalam format Markdown ke folder debug_ocr_output.

    Args:
        filename (str): Nama file PDF asli, digunakan untuk membuat nama file debug yang sesuai.
        content (str): Konten teks hasil ekstraksi yang akan disimpan.

    Output:
        File Markdown yang berisi hasil ekstraksi teks, disimpan 
        di folder debug_ocr_output dengan nama yang sesuai.
    """

    debug_dir = os.path.join(os.getcwd(), "debug_ocr_output")
    os.makedirs(debug_dir, exist_ok=True)
    base = os.path.splitext(os.path.basename(filename))[0]
    debug_path = os.path.join(debug_dir, f"{base}.txt")
    with open(debug_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Debug OCR disimpan ke: {debug_path}")


# FUNGSI UTAMA UNTUK EKSTRAKSI TEKS DARI PDF DENGAN GROQ VISION API
async def extract_text_from_pdf_groq(file: UploadFile) -> str:
    total_start_time = time.time()
    
    # Simpan file PDF sementara untuk diproses dengan fitz
    file_ext = os.path.splitext(file.filename)[1] or ".pdf"
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name

    doc = fitz.open(tmp_path)
    final_markdown = ""

    # Catat total halaman untuk logging
    total_pages = len(doc)
    print(f"Memproses {total_pages} Halaman dengan Groq Vision API...")

    try:
        # Proses setiap halaman secara berurutan untuk menghindari rate limit token
        for i, page in enumerate(doc):
            print(f"Memproses Halaman {i+1}...")
            
            # Render halaman ke gambar (Zoom 2.0 agar resolusi cukup untuk OCR)
            pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
            img_data = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_data)).convert("RGB")
            
            # Encode & Kompres
            base64_img = encode_image_to_base64(image)
            
            # Panggil API Groq
            page_text = await process_page_groq(base64_img, i)
            
            final_markdown += f"\n\n--- PAGE {i+1} ---\n{page_text}"

            # Jeda 2 detik setiap halaman untuk menghindari rate limit API Groq
            if i < total_pages - 1:
                print("[WAIT] Jeda 2 detik untuk rate limit token...")
                await asyncio.sleep(2)

        # Simpan untuk debug
        save_debug_markdown(file.filename, final_markdown)
        
        total_end_time = time.time()
        print("\n==============================")
        print("EXTRACTION SELESAI")
        print(f"TOTAL TIME: {total_end_time - total_start_time:.2f} detik")
        print("==============================\n")
        
        return final_markdown

    except Exception as e:
        print(f"[ERROR] Ekstraksi Gagal: {e}")
        return ""
    finally:
        doc.close()
        os.remove(tmp_path)
        await file.seek(0)
