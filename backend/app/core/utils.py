import json_repair, re


# FUNCTION: extract_json_from_text
def extract_json_from_text(text: str):
    """
    Fungsi untuk mengekstrak JSON dari teks yang mungkin mengandung banyak noise.

    Args:
        text: Teks yang dihasilkan oleh LLM yang mungkin mengandung JSON yang valid atau rusak, 
        serta banyak teks lain di sekitarnya.

    Returns:
        dict: Hasil parsing JSON yang sudah diperbaiki, atau None jika tidak ditemukan JSON valid.

    Output:
        JSON yang sudah diperbaiki dari teks LLM, siap untuk diproses lebih lanjut.
    """

    # Guard clause
    # Pastikan input valid
    if not text or not isinstance(text, str):
        return None

    try:
        # Cari pola JSON yang valid menggunakan regex, mulai dari kurung kurawal pertama hingga akhir string
        match = re.search(r'\{\s*"(?:nama_mahasiswa|nilai|alasan_perhitungan|detail_nilai)"[\s\S]*', text)

        # Jika ditemukan, ambil substring JSON dan coba perbaiki dengan json_repair
        if match:
            json_str = match.group(0)

            # Gunakan json_repair untuk memperbaiki JSON yang mungkin rusak
            parsed = json_repair.loads(json_str)

            # Pastikan hasilnya adalah dict, jika tidak kembalikan None
            if isinstance(parsed, dict):
                return parsed
                
            # Jika LLM mereturn list, bungkus ke dict
            if isinstance(parsed, list):
                print("[WARNING] LLM mereturn List, membungkus ulang ke Dict...")
                # Asumsikan setiap item di list adalah analisis per soal, buat dict dengan struktur yang lebih generik
                return {
                    "nama_mahasiswa": "Terdeteksi Format List",
                    "nim": "-",
                    "nilai": 0,
                    "analisis_per_soal": [item for item in parsed if isinstance(item, dict)],
                    "detail_nilai": [item for item in parsed if isinstance(item, dict)],
                    "status": "Error Format"
                }
                
        return None

    except Exception as e:
        print(f"[JSON PARSE ERROR] {e}")
        return None


# FUNCTION: optimize_report_text
def optimize_report_text(raw_text: str) -> dict:
    """
    Fungsi untuk membersihkan dan mengoptimalkan teks laporan hasil ekstraksi PDF.

    Args:
        raw_text: Teks mentah hasil ekstraksi dari PDF, yang mungkin mengandung banyak noise, 
        informasi identitas, dan format yang tidak rapi.

    Returns:
        dict: 
        {
            "identity_summary": "Nama: ... | NPM: ...",
            "cleaned_content": "Teks yang sudah dibersihkan dan dipotong jika terlalu panjang"
        }

    Output:
        Teks yang sudah dioptimalkan siap untuk diproses lebih lanjut oleh LLM,
        dengan informasi identitas yang dirangkum secara singkat.
    """


    # Mengekstrak informasi identitas (Nama, NPM) dengan regex
    nama_match = re.search(
        r"(?:Nama|Name)\s*[:\-]?\s*(.+)",
        raw_text,
        re.IGNORECASE
    )

    npm_match = re.search(
        r"(?:NPM|NIM)\s*[:\-]?\s*([0-9]{6,})",
        raw_text,
        re.IGNORECASE
    )

    # Jika tidak ditemukan, set ke "Tidak Terdeteksi"
    nama = (
        nama_match.group(1).strip()
        if nama_match
        else "Tidak Terdeteksi"
    )

    npm = (
        npm_match.group(1).strip()
        if npm_match
        else "Tidak Terdeteksi"
    )

    # Bersihkan teks dari noise umum secara bertahap
    lines = raw_text.split("\n")
    cleaned_lines = []

    for line in lines:
        # Hapus spasi berlebih
        line = line.strip()

        # Skip empty line
        if not line:
            continue

        # Skip separator line yang hanya 
        # berisi karakter seperti "======" atau "------"
        if re.match(r"^={5,}|^-{3,}", line):
            continue

        # Skip marker halaman dari parser
        if "--- PAGE" in line:
            continue
        
        # Skip hasil OCR yang biasanya muncul di tengah teks
        if "HASIL OCR" in line:
            continue

        # Skip footer berulang yang hanya berisi nama
        if (
            nama != "Tidak Terdeteksi"
            and nama.lower() in line.lower()
        ):

            if len(line) < len(nama) + 5:

                continue

        # Hapus karakter non-ASCII yang biasanya noise karena hasil OCR
        line = re.sub(
            r"\b([A-Za-z])\s+(?=[A-Za-z]\b)",
            r"\1",
            line
        )
        cleaned_lines.append(line)

    # Gabungkan kembali menjadi teks bersih
    content_body = "\n".join(cleaned_lines)

    # Jika teks terlalu panjang, potong untuk menjaga performa LLM
    MAX_CHARS = 25000

    if len(content_body) > MAX_CHARS:
        content_body = content_body[:MAX_CHARS]

    # Kembalikan hasil dalam format terstruktur
    return {
        "identity_summary":
            f"Nama: {nama} | NPM: {npm}",
        "cleaned_content":
            content_body

    }