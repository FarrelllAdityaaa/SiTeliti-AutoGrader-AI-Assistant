import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api import endpoints
from app.services.exporter import process_export_grade


app = FastAPI(
    title="AutoGrader API",
    version="1.0.0",
    description="API untuk penilaian laporan otomatis berbasis LLM"
)

# Konfigurasi CORS (Cross-Origin Resource Sharing)
# Mengizinkan React (localhost:5173) mengakses Python
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sambungkan endpoint ke aplikasi utama
app.include_router(endpoints.router, prefix="/api")

# Endpoint sederhana untuk cek server berjalan dengan baik
@app.get("/")
def read_root():
    return {"message": "Server AutoGrader SiTeliti berjalan dengan baik!"}

# Endpoint untuk cek kesehatan server (health check)
@app.get("/health")
def health():
    return {"status": "ok"}

# Endpoint untuk Ekspor Nilai ke Excel
@app.post("/api/export")
async def export_grade(
    nama: str = Form(...),
    nilai: int = Form(...),
    pertemuan: int = Form(...),
    file_excel: UploadFile = File(...)
):
    # Panggil Logic dari Service
    output_path = await process_export_grade(nama, nilai, pertemuan, file_excel)

    # Cek apakah file berhasil dibuat
    if not os.path.exists(output_path):
        raise HTTPException(
            status_code=500,
            detail="File export gagal dibuat"
    )
  
    # Kirim Kembali File Excel yang sudah diupdate
    output_filename = f"Rekap_{nama}_P{pertemuan}.xlsx"
    return FileResponse(
        output_path, 
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        filename=output_filename
    )
