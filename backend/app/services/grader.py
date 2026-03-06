import os, json
from datetime import datetime
from app.core.config import get_llm_grader
from app.core.utils import optimize_report_text, extract_json_from_text


# Helper function untuk logs hasil prompt chain
def write_log(filepath: str, content: str):
    with open(filepath, "a", encoding="utf-8") as f:
        f.write(content + "\n")

# Fungsi grade submission untuk menilai laporan mahasiswa
async def grade_submission(text_laporan: str, instruction: str):
    # LOG SETUP
    total_start = datetime.now()
    log_dir = "logs/grading"
    os.makedirs(log_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    log_path = os.path.join(log_dir, f"grading_{timestamp}.txt")

    write_log(log_path, "=== GRADING LOG ===")
    write_log(log_path, f"Timestamp   : {timestamp}")

    # Inisialisasi LLM
    llm = get_llm_grader()

    # PREPROCESSING TEKS
    preprocess_start = datetime.now()
    optimized = optimize_report_text(text_laporan)
    preprocess_time = (datetime.now() - preprocess_start).total_seconds()

    student_meta = optimized["identity_summary"]
    clean_text = optimized["cleaned_content"]

    write_log(log_path, f"Mahasiswa   : {student_meta}")
    write_log(log_path, f"PREPROCESS TIME: {preprocess_time:.2f}s")
    write_log(log_path, f"TEXT LENGTH: {len(clean_text)} chars")
    write_log(log_path, "\n=== INSTRUCTION ===")
    write_log(log_path, instruction)
    write_log(log_path, "\n=== CLEANED OCR TEXT (TRUNCATED) ===")


    # CHAIN 1: ANALYZER
    analyzer_messages = [
        {
            "role": "system",
            "content": (
                "Anda adalah DOSEN PENGOREKSI.\n"
                "Tugas Anda hanya menganalisis jawaban laporan praktikum mahasiswa.\n"
                "JANGAN menghitung nilai.\n"
                "JANGAN memberikan kesimpulan akhir.\n"
                "JANGAN menggunakan Markdown.\n"
                "Keluarkan JSON VALID SAJA.\n"
                "WAJIB melakukan ESCAPE pada tanda kutip ganda di dalam teks (gunakan \\\").\n"
                "DILARANG KERAS menggunakan baris baru (raw enter) di dalam value string JSON. Gunakan spasi atau \\n."
            )
        },
        {
            "role": "user",
            "content": f"""
    IDENTITAS:
    {student_meta}

    SOAL & INSTRUKSI:
    {instruction}

    JAWABAN MAHASISWA:
    {clean_text}

    FORMAT JSON:
    {{
    "nama_mahasiswa": "...",
    "nim": "...",
    "analisis_per_soal": [
        {{
        "soal": "...",
        "jawaban_ada": true/false,
        "sesuai_instruksi": true/false,
        "catatan": "Berikan analisis kritis. JIKA ADA KODE, sebutkan nama fungsinya sebagai bukti. JIKA ADA OUTPUT, sebutkan outputnya. JIKA TIDAK LENGKAP, jelaskan bagian mana yang hilang."
        }}
    ]
    }}
    """
        }
    ]

    # Terapkan chain 1 dan ekstrak JSON hasil analisis
    chain1_start = datetime.now()
    analysis_result = await llm.ainvoke(analyzer_messages)
    chain1_time = (datetime.now() - chain1_start).total_seconds()
    write_log(log_path, f"\nCHAIN 1 TIME: {chain1_time:.2f}s")

    write_log(log_path, "\n=== CHAIN 1 RAW OUTPUT ===")
    write_log(log_path, analysis_result.content[:4000])
    analysis_json = extract_json_from_text(analysis_result.content)

    write_log(log_path,"\n=== CHAIN 1 PARSED JSON ===")
    write_log(
        log_path,
        json.dumps(
            analysis_json,
            ensure_ascii=False,
            indent=2
        )
        if analysis_json
        else "FAILED"
    ) 

    if not analysis_json:
        write_log(log_path, "CHAIN 1 FAILED")

        return {
            "nama_mahasiswa": "Tidak Terdeteksi",
            "nim": "-",
            "nilai": 0,
            "feedback": "Gagal menganalisis dokumen. Format jawaban tidak dikenali.",
            "status": "Error"
        }

    # CHAIN 2: SCORING
    scoring_messages = [
        {
            "role": "system",
            "content": (
                "Anda adalah SISTEM PENILAIAN AKADEMIK yang sangat ketat.\n"
                "HANYA KELUARKAN JSON VALID. JANGAN ADA TEKS APAPUN DI LUAR JSON.\n"
                "Karakter pertama output Anda WAJIB '{' dan terakhir WAJIB '}'.\n"
                "Hitung nilai secara objektif berdasarkan instruksi dan hasil analisis."
            )
        },
        {
            "role": "user",
            "content": f"""
    DATA ANALISIS:
    {json.dumps(analysis_json, ensure_ascii=False)}

    SOAL & INSTRUKSI ASLI:
    {instruction}

    ATURAN NILAI:
    - Gunakan bobot nilai per soal JIKA disebutkan secara eksplisit dalam instruksi
    - Jika tidak ada bobot eksplisit, bagi nilai secara proporsional
    - Jawaban tidak sesuai instruksi = 0
    - Total nilai maksimum = 100

    TULIS PENILAIAN ANDA DALAM FORMAT JSON BERIKUT (TANPA TEKS DI LUAR JSON):
    {{
    "alasan_perhitungan": "Tuliskan langkah perhitungan dan alasan penalti Anda di sini secara detail sebelum memberikan skor akhir...",
    "detail_nilai": [
        {{ "soal": "...", "skor": 0 }}
    ],
    "nilai": 0,
    "status": "Lulus / Tidak Lulus"
    }}
    """
        }
    ]

    # Terapkan chain 2 dan ekstrak JSON hasil scoring
    chain2_start = datetime.now()
    scoring_result = await llm.ainvoke(scoring_messages)
    chain2_time = (datetime.now() - chain2_start).total_seconds()
    write_log(log_path, f"\nCHAIN 2 TIME: {chain2_time:.2f}s")

    write_log(log_path, "\n=== CHAIN 2 RAW OUTPUT ===")
    write_log(log_path, scoring_result.content[:4000])
    scoring_json = extract_json_from_text(scoring_result.content)

    if not scoring_json:
        write_log(log_path, "CHAIN 2 FAILED")

        scoring_json = {
            "nilai": 0,
            "status": "Error"
        }

    nilai = max(0, min(100, int(scoring_json.get("nilai", 0))))
    scoring_json["nilai"] = nilai

    write_log(log_path, "\n=== CHAIN 2 PARSED JSON ===")

    write_log(
        log_path,
        json.dumps(
            scoring_json,
            ensure_ascii=False,
            indent=2
        )
    )


    # CHAIN 3: FEEDBACK
    feedback_messages = [
        {
            "role": "system",
            "content": (
                "Anda adalah DOSEN PEMBIMBING.\n"
                "Buat feedback akademik yang membangun, termasuk saran kode perbaikan yang tepat.\n"
                "Gunakan Markdown TERSTRUKTUR.\n"
                "WAJIB menggunakan heading Markdown (###).\n"
                "WAJIB mengikuti urutan section yang diminta.\n"
                "Isi field 'feedback' HARUS berupa Markdown.\n"
                "Jika tidak menggunakan heading Markdown (###), jawaban dianggap SALAH.\n"
                "Jika format tidak sesuai, ulangi jawaban sampai benar."
            )
        },
        {
            "role": "user",
            "content": f"""
    ANALISIS:
    {json.dumps(analysis_json, ensure_ascii=False)}

    NILAI:
    {json.dumps(scoring_json, ensure_ascii=False)}

    FORMAT FEEDBACK (WAJIB MARKDOWN):

    ### RINGKASAN
    Ringkasan singkat hasil evaluasi.

    ### HASIL ANALISIS
    Analisis per soal berdasarkan instruksi.

    ### REKAPITULASI NILAI
    Rincian perolehan skor dan total skor dalam bentuk list terpisah (SKOR DAN TOTAL SKOR JANGAN DISATUKAN DALAM SATU LIST).

    ### SARAN & PERBAIKAN
    Saran teknis dan akademik. Boleh sertakan potongan kode.

    ### NILAI AKHIR
    Penjelasan singkat nilai akhir.
    """
        }
    ]

    # Terapkan chain 3 dan ekstrak JSON hasil feedback
    chain3_start = datetime.now()
    final_result = await llm.ainvoke(feedback_messages)
    chain3_time = (datetime.now() - chain3_start).total_seconds()
    write_log(log_path, f"\nCHAIN 3 TIME: {chain3_time:.2f}s")

    raw_feedback = final_result.content
    write_log(log_path, "\n=== CHAIN 3 RAW OUTPUT ===")
    write_log(log_path, final_result.content[:4000])
    
    # Validasi keberadaan heading Markdown
    if "###" not in raw_feedback:
        write_log(log_path, "INVALID FEEDBACK FORMAT (TIDAK ADA HEADING ###)")
        
        # Jika format tidak sesuai, buat feedback fallback yang sederhana
        raw_feedback = f"### HASIL EVALUASI\n{raw_feedback}"

    # Buat final JSON yang menggabungkan semua hasil
    final_json = {
        "nama_mahasiswa": analysis_json.get("nama_mahasiswa", "Tidak Terdeteksi"),
        "nim": analysis_json.get("nim", "-"),
        "nilai": nilai, 
        "feedback": raw_feedback,
        "status": scoring_json.get("status", "Tidak Lulus")
    }

    write_log(log_path, "\n=== FINAL JSON ===")

    write_log(
        log_path,
        json.dumps(
            final_json,
            ensure_ascii=False,
            indent=2
        )
    )

    # Logging total time
    total_time = (datetime.now() - total_start).total_seconds()
    write_log(log_path, f"\nTOTAL TIME: {total_time:.2f}s")

    return final_json
