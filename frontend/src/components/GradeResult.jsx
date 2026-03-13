import React, { useState, useEffect, useRef } from "react";
import { Maximize2, CheckCircle } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

// Komponen pembersihan markdown
const fixUnclosedCodeBlocks = (text) => {
  if (!text) return "";
  // Hitung jumlah tanda backtick tiga kali (```)
  const count = (text.match(/```/g) || []).length;
  // Jika jumlahnya ganjil, berarti ada satu yang belum ditutup
  if (count % 2 !== 0) {
    return text + "\n```"; // Tutup paksa di akhir
  }
  return text;
};

// Komponen Typewriter Effect untuk Markdown
const TypewriterMarkdown = ({ text, speed = 1 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    setDisplayedText("");
    setIsTyping(true);
    let i = 0;

    if (!text) {
      setIsTyping(false);
      return;
    }

    // Konfigurasi kecepatan (ticks per karakter)
    const charsPerTick = 20;

    const intervalId = setInterval(() => {
      const currentSlice = text.slice(0, i);
      const safeText = fixUnclosedCodeBlocks(currentSlice);
      setDisplayedText(safeText);

      if (i > text.length) {
        setDisplayedText(fixUnclosedCodeBlocks(text));
        setIsTyping(false);
        clearInterval(intervalId);
        return;
      }
      i += charsPerTick;

    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed]);

  return (
    <div className="relative min-h-[100px] animate-fade-in">
      <MarkdownRenderer content={displayedText} />
      {/* Kursor berkedip */}
      {isTyping && (
        <span className="inline-block w-2 h-5 ml-1 bg-blue-600 animate-pulse align-text-bottom shadow-sm"></span>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

// Komponen Hasil Penilaian
const GradeResult = ({ result, onPreview }) => {
  if (!result) return null;

  // Nilai status dari backend AI
  const rawStatus = result.status ? result.status.toUpperCase() : "ERROR";
  
  // Kelas warna badge berdasarkan status
  let scoreColor = "text-gray-600 bg-gray-50 border-gray-200";
  let passStatus = rawStatus; // Teks default sesuai backend

  if (rawStatus === "TIDAK LULUS") {
    // Di bawah 70 Merah
    scoreColor = "text-red-600 bg-red-50 border border-red-200";
  } else if (rawStatus === "LULUS") {
    if (result.nilai >= 70 && result.nilai <= 75) {
      // Lulus tapi kurang memuaskan (70 - 75) Kuning
      scoreColor = "text-yellow-600 bg-yellow-50 border border-yellow-200";
    } else {
      // Lulus aman (> 75) Hijau
      scoreColor = "text-green-600 bg-green-50 border border-green-200";
    }
  }

  const feedbackContent =
    result.feedback_text || result.feedback || "Tidak ada feedback tersedia.";

  return (
    <div className="mt-12 animate-fade-in-up pb-20">
      {/* Header Result */}
      <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
        Hasil Analisis AI
      </h3>

      {/* Grid Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Mahasiswa
          </p>
          <h4 className="text-xl font-bold text-slate-900">
            {result.nama_mahasiswa}
          </h4>
          <p className="text-slate-500 font-mono mt-1 text-md">
            {result.nim || "NIM tidak terdeteksi"}
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between items-end text-right">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Nilai Akhir
            </p>
            <div className="text-5xl font-extrabold text-blue-600 tracking-tight">
              {result.nilai}
            </div>
          </div>
          <div
            className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border border-current ${scoreColor}`}
          >
            {passStatus}
          </div>
        </div>
      </div>

      {/* Area Feedback */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-bl-full -mr-10 -mt-10 opacity-50 pointer-events-none"></div>

        <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase text-sm tracking-wider border-b border-slate-100 pb-4">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Laporan Analisis & Feedback
        </h4>

        {/* Render Text */}
        <TypewriterMarkdown text={feedbackContent} speed={3} />
      </div>

      <div className="mt-8 flex justify-center pb-4">
        <button
          onClick={onPreview}
          className="group px-8 py-3 rounded-xl font-semibold text-base text-white bg-slate-900 shadow-lg hover:bg-blue-600 hover:shadow-blue-200 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3"
        >
          <Maximize2 className="w-5 h-5" />
          Tinjau Detail & Simpan
        </button>
      </div>
    </div>
  );
};

export default GradeResult;
