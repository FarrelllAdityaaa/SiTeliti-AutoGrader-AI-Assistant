import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, FileText, Save } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

// Komponen Modal Preview
const PreviewModal = ({
  file,
  result,
  onClose,
  onSave,
  meeting,
  setMeeting,
  saving,
}) => {

  // State untuk mengatur rasio split antara PDF dan Feedback
  const [splitRatio, setSplitRatio] = useState(50); // Persentase ukuran layar (default 50%)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      // Mendeteksi apakah dari sentuhan jari (HP) atau klik mouse (Laptop)
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      // Cek apakah mode HP (vertikal) atau Laptop (horizontal). Batas breakpoint md Tailwind = 768px
      if (window.innerWidth < 768) {
        // Mode HP: Tarik Atas / Bawah
        const newRatio = ((clientY - containerRect.top) / containerRect.height) * 100;
        if (newRatio > 10 && newRatio < 90) setSplitRatio(newRatio);
      } else {
        // Mode Laptop: Tarik Kiri / Kanan
        const newRatio = ((clientX - containerRect.left) / containerRect.width) * 100;
        if (newRatio > 10 && newRatio < 90) setSplitRatio(newRatio);
      }
    };

    const handleUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener("mousemove", handleMove);
      // passive: false untuk mencegah scroll saat drag di HP
      document.addEventListener("touchmove", handleMove, { passive: false });
      document.addEventListener("mouseup", handleUp);
      document.addEventListener("touchend", handleUp);
      document.body.style.userSelect = "none"; // Cegah teks ter-blok saat ditarik
    } else {
      document.body.style.userSelect = "";
    }

    // Bersihkan event listener saat komponen unmount atau saat isDragging berubah
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.removeEventListener("touchend", handleUp);
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  if (!file || !result) return null;
  // Membuat URL untuk preview PDF
  const fileUrl = file ? URL.createObjectURL(file) + "#view=FitH" : "";

  // Status nilai
  const isPassed = result.nilai >= 60;
  const badgeText = isPassed ? "LULUS" : "PERBAIKAN";

  const badgeClass = 
    result.nilai >= 80
      ? "text-green-800 bg-green-100 border-green-200"
      : result.nilai >= 60
      ? "text-yellow-800 bg-yellow-100 border-yellow-200"
      : "text-red-800 bg-red-100 border-red-200";

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4 animate-fade-in">
      <div className="bg-white w-full md:w-[95vw] h-[90vh] md:h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden relative animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex-none bg-gray-100 px-4 py-3 md:px-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileText className="text-blue-600 w-5 h-5 flex-shrink-0" />
            <h2 className="font-bold text-gray-800 text-sm md:text-lg truncate">
              Review: {result.nama_mahasiswa}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Modal Body */}
        <div ref={containerRef} className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
          
          {/* PDF Preview */}
          <div className="bg-gray-200 flex-shrink-0 relative flex flex-col items-center justify-center"style={{ flexBasis: `${splitRatio}%` }}>
             <iframe
              src={fileUrl}
              className="w-full h-full block"
              title="PDF Preview"
              scrolling="yes" 
              style={{ border: "none" }}
            />

            {/* Drag Handle */}
            {isDragging && (
              <div className="absolute inset-0 z-10 bg-transparent cursor-row-resize md:cursor-col-resize"></div>
            )}
          </div>

          {/* Pembatas atau Divider */}
          <div
            className="w-full h-4 md:w-4 md:h-full bg-gray-100 border-y md:border-y-0 md:border-x border-gray-300 hover:bg-blue-200 active:bg-blue-300 flex items-center justify-center cursor-row-resize md:cursor-col-resize z-20 flex-shrink-0 transition-colors"
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={(e) => {
              // Hentikan propagasi agar tidak scroll layar HP
              if (e.cancelable) e.preventDefault(); 
              setIsDragging(true);
            }}
          >
            {/* Visual Handle (Garis kecil abu-abu di tengah pembatas) */}
            <div className="w-12 h-1 md:w-1 md:h-12 bg-gray-400 rounded-full pointer-events-none" />
          </div>

          {/* Feedback AI */}
          <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-white custom-scrollbar min-w-0 min-h-0">
            <div className="flex justify-between items-end mb-6 border-b pb-4">
              <div>
                <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wide font-bold">
                  Nilai yang Diberikan
                </p>
                <p className="text-4xl md:text-5xl font-extrabold text-blue-700">
                  {result.nilai}
                </p>
              </div>
              {/* Badge Status Nilai */}
              <span
                className={`px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm font-bold rounded-lg border ${badgeClass}`}
              >
                {badgeText}
              </span>
            </div>
            <div className="prose prose-sm max-w-none text-gray-800 pb-10">
              <MarkdownRenderer content={result.feedback} />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex-none bg-gray-50 px-4 py-3 md:px-6 border-t flex flex-col-reverse md:flex-row justify-between items-center gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-10">
          <button
            onClick={onClose}
            className="w-full md:w-auto px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 text-sm transition-colors"
          >
            Kembali
          </button>

          <div className="w-full md:w-auto flex flex-row items-center gap-3">
            <div className="flex-shrink-0 flex items-center gap-2 bg-white md:bg-transparent p-1 md:p-0 rounded border md:border-0 border-gray-200">
              <label className="text-sm font-bold text-gray-600 hidden md:block">
                Pertemuan:
              </label>
              <select
                value={meeting}
                onChange={(e) => setMeeting(e.target.value)}
                className="p-1.5 border-none md:border md:border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer bg-transparent md:bg-white"
              >
                {[...Array(14)].map((_, i) => {
                  const num = i + 1;
                  let label = num.toString();
                  if (num === 6) label = "UTS";
                  if (num === 14) label = "UAS";
                  return (
                    <option key={num} value={num}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={onSave}
              disabled={saving}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 font-bold rounded-lg transition-all text-white shadow-md text-sm whitespace-nowrap ${
                saving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? (
                "Menyimpan..."
              ) : (
                <>
                  <span className="md:hidden">Simpan</span>
                  <span className="hidden md:inline">Simpan ke Template Excel</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PreviewModal;