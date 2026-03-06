from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import logging, time
from app.services.pdf_parser_groq import extract_text_from_pdf_groq
from app.services.grader import grade_submission
from app.models.grading import GradingResult


# Membuat router FastAPI khusus untuk fitur grading
# Router ini nanti akan di-include ke main app
router = APIRouter()

# Inisialisasi logger
# Digunakan untuk monitoring, debugging, dan audit log
logger = logging.getLogger(__name__)

# Batas maksimum file upload (10MB)
# Penting untuk mencegah server overload atau crash
MAX_FILE_SIZE = 10 * 1024 * 1024


# Endpoint utama untuk grading laporan mahasiswa
@router.post("/grade", response_model=GradingResult)
async def grade_report(
    file: UploadFile = File(...),
    instruction: str = Form(...)
):
    # Catat waktu mulai proses
    # Digunakan untuk monitoring performa total
    start_time = time.time()

    try:
        # VALIDASI TIPE FILE
        # Cek MIME type file yang diupload
        if file.content_type != "application/pdf":

            raise HTTPException(
                status_code=400,
                detail="File harus PDF"
            )

        # VALIDASI UKURAN FILE
        # Baca seluruh isi file untuk cek ukuran
        contents = await file.read()

        # Jika ukuran melebihi limit = tolak
        if len(contents) > MAX_FILE_SIZE:

            raise HTTPException(
                status_code=400,
                detail="Ukuran file terlalu besar (max 10MB)"
            )

        # Reset pointer file ke awal lagi
        # Karena tadi file.read() menggeser pointer ke akhir file
        await file.seek(0)

        # Log nama file untuk audit
        logger.info(f"Processing file: {file.filename}")

        # EXTRACT TEXT DARI PDF
        # Catat waktu mulai OCR
        extract_start = time.time()

        # Jalankan PDF parser untuk ekstrak teks dari PDF, termasuk OCR jika ada gambar
        text_content = await extract_text_from_pdf_groq(file)

        # Hitung durasi OCR
        extract_time = time.time() - extract_start

        # Jika text kosong, kemungkinan PDF rusak
        if not text_content:

            raise HTTPException(
                status_code=400,
                detail="Gagal membaca isi PDF"
            )

        # Log durasi OCR
        logger.info(f"OCR time: {extract_time:.2f}s")

        # KIRIM KE AI GRADER
        grade_start = time.time()

        # Kirim text dan instruction ke sistem penilaian AI
        result = await grade_submission(
            text_content,
            instruction
        )

        grade_time = time.time() - grade_start

        # HITUNG TOTAL WAKTU
        total_time = time.time() - start_time

        # Log performa lengkap
        logger.info(
            f"Grade success | OCR={extract_time:.2f}s | "
            f"LLM={grade_time:.2f}s | TOTAL={total_time:.2f}s"
        )

        # Return hasil grading ke frontend
        return result


    # Jika error yang memang disengaja (HTTPException)
    except HTTPException:
        raise

    # Jika error tidak terduga
    except Exception as e:

        logger.error(f"Grade error: {str(e)}")

        raise HTTPException(
            status_code=500,
            detail="Internal Server Error"
        )