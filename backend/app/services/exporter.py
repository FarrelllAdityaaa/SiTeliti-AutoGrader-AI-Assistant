import os, shutil, openpyxl, difflib, uuid
from fastapi import UploadFile, HTTPException


async def process_export_grade(nama: str, nilai: int, pertemuan: int, file_excel: UploadFile):
    """
    Fungsi untuk memproses ekspor nilai ke file Excel yang diunggah oleh user.
    
    Args:
        nama (str): Nama mahasiswa.
        nilai (int): Nilai yang akan dimasukkan.
        pertemuan (int): Pertemuan ke-berapa.
        file_excel (UploadFile): File Excel yang diunggah oleh user.

    Returns:
        str: Path ke file Excel yang telah diperbarui.

    Output:
        File Excel yang sudah diperbarui dengan nilai baru untuk mahasiswa yang sesuai.
    """

    temp_input_path = None
    try:
        # Buat nama file sementara yang unik
        unique_id = uuid.uuid4().hex
        original_name = file_excel.filename
        temp_input_path = f"temp_{unique_id}_{original_name}"
        
        # Simpan file Excel dari user ke server sementara
        with open(temp_input_path, "wb") as buffer:
            shutil.copyfileobj(file_excel.file, buffer)
        
        # Buka Excel
        workbook = openpyxl.load_workbook(temp_input_path)
        sheet = workbook.active 
        
        # Cari Baris Mahasiswa (SMART SEARCH / FUZZY MATCH)
        target_row = None
        
        # Ambil semua nama dari Template Excel (Baris 12 ke bawah)
        # Format Dictionary: {'NAMA BERSIH': Nomor_Baris}
        excel_names_map = {}
        
        for row in range(12, 150): 
            cell_value = sheet.cell(row=row, column=3).value 
            if cell_value:
                # Bersihkan nama dari Excel (Hapus spasi depan/belakang, jadikan huruf besar)
                raw_name = str(cell_value)
                clean_name = raw_name.strip().upper()
                excel_names_map[clean_name] = row

        # Bersihkan nama target dari PDF
        target_name_clean = nama.strip().upper()

        # LOGIKA 1: Pencarian Persis (Exact Match)
        if target_name_clean in excel_names_map:
            target_row = excel_names_map[target_name_clean]
            print(f"[INFO] Exact match found: {target_name_clean}")
        
        # LOGIKA 2: Pencarian Mirip (Fuzzy Match) - Jika persis gagal
        if not target_row:
            # Cari 1 nama yang paling mirip (kemiripan minimal 60%)
            matches = difflib.get_close_matches(target_name_clean, excel_names_map.keys(), n=1, cutoff=0.6)
            if matches:
                best_match = matches[0]
                target_row = excel_names_map[best_match]
                print(f"[INFO] Fuzzy match found: '{nama}' -> '{best_match}'")

        if not target_row:
             # Hapus file temp jika gagal biar server bersih
             if os.path.exists(temp_input_path):
                os.remove(temp_input_path)
             raise HTTPException(status_code=404, detail=f"Mahasiswa atas nama '{nama}' tidak ditemukan di Excel. Cek ejaan manual.")
       
        # Konfigurasi Baris Header
        HEADER_ROW_PERTEMUAN = 11  # Baris berisi angka 1, 2, ... 6 (UTS)
        HEADER_ROW_JENIS = 12      # Baris berisi Absen, Tugas
        
        # Scan dan cari kolom yang sesuai dengan pertemuan
        found_meeting_col_start = None
        # Tentukan Kolom Nilai berdasarkan Pertemuan
        target_col = None

        # Variabel untuk menyimpan header yang cocok (untuk log)
        matched_header_str = ""
        
        for col in range(4, 50):
            val = sheet.cell(row=HEADER_ROW_PERTEMUAN, column=col).value
            val_str = str(val).strip().lower() if val else "" 
            pertemuan_str = str(pertemuan)
            
            is_match = False
            
            # Pengecekan kecocokan (Apakah sama dengan pertemuan yang diminta?)
            if val_str == pertemuan_str:
                is_match = True
            # Pengecekan angka dengan spasi (misal "3 " atau " 3")
            elif val_str.startswith(f"{pertemuan_str} "):
                is_match = True
            # Pengcekan untuk UTS/UAS
            elif pertemuan == 6 and "uts" in val_str:
                is_match = True
            elif pertemuan == 14 and "uas" in val_str:
                is_match = True
            
            if is_match:
                found_meeting_col_start = col
                matched_header_str = val_str 
                print(f"[INFO] Header Pertemuan {pertemuan} ketemu di Kolom {col}: '{val}'")
                break
        
        if not found_meeting_col_start:
             if os.path.exists(temp_input_path): os.remove(temp_input_path)
             raise HTTPException(status_code=400, detail=f"Kolom Pertemuan {pertemuan} tidak ditemukan di Excel (Cek Baris {HEADER_ROW_PERTEMUAN}).")

        # Tentukan Kolom Target untuk Nilai
        # Cek apakah ini mode Ujian?
        is_exam_mode = False
        
        # Cek dari input user
        if int(pertemuan) == 6 or int(pertemuan) == 14:
            is_exam_mode = True
            print(f"[DEBUG] Mode Ujian Aktif (Berdasarkan Input: {pertemuan})")
            
        # Cek dari teks header yang ditemukan
        if "uts" in matched_header_str or "uas" in matched_header_str:
            is_exam_mode = True
            print(f"[DEBUG] Mode Ujian Aktif (Berdasarkan Header: '{matched_header_str}')")

        if is_exam_mode:
            # Kasus UTS/UAS: Langsung kunci di kolom pertemuan
            target_col = found_meeting_col_start
            print(f"[ACTION] Mengunci Target di Kolom {target_col} (Tanpa Scan 'Tugas')")
        else:
            # Kasus Tugas: Cari sub-kolom "Tugas" di samping kanan kolom pertemuan
            print(f"[DEBUG] Mode Biasa. Memulai scan kolom 'Tugas'...")
            for offset in range(0, 3): 
                current_check_col = found_meeting_col_start + offset
                sub_header = sheet.cell(row=HEADER_ROW_JENIS, column=current_check_col).value
                sub_header_str = str(sub_header).strip().lower() if sub_header else ""
                
                if "tugas" in sub_header_str:
                    target_col = current_check_col
                    print(f"[INFO] Sub-kolom 'Tugas' ditemukan di Kolom {target_col}")
                    break
            
            if not target_col:
                target_col = found_meeting_col_start
                print(f"[WARN] Tidak ada sub-header 'Tugas', default ke Kolom {target_col}")
        
        # Masukkan Nilai ke Sel yang Ditentukan
        sheet.cell(row=target_row, column=target_col).value = nilai
        
        # Simpan Perubahan ke File Excel
        workbook.save(temp_input_path)
        return temp_input_path
    
    except Exception as e:
        if temp_input_path and os.path.exists(temp_input_path):
            os.remove(temp_input_path)
        # Re-raise HTTP exceptions atau bungkus error lain
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Export Service Error: {str(e)}")