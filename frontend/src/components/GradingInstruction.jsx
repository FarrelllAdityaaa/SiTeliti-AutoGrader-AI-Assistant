import React from "react";
import { Info } from "lucide-react";

// Komponen Instruksi Penilaian
const GradingInstruction = ({ instruction, setInstruction }) => {
  return (
    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mt-6 relative z-10">
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-bold text-gray-700">
          Instruksi / Rubrik (Chat)
        </label>

        {/* TOOLTIP WRAPPER */}
        <div className="group relative flex items-center">
          {/* Ikon Tanda Seru */}
          <Info className="w-5 h-5 text-orange-500 cursor-help hover:text-orange-700 transition-colors" />

          {/* Isi Popup Template */}
          <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 top-full mt-2 z-50 w-[85vw] sm:w-80 md:w-96 p-4 bg-white border border-gray-200 rounded-lg shadow-2xl text-sm text-gray-700 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              💡 Template Instruksi (Narasi):
            </h4>

            <div className="bg-gray-50 p-3 rounded border border-gray-100 mb-3 leading-relaxed text-gray-600">
              <p>
                "Tolong nilai laporan praktikum{" "}
                <strong>[Nama Mata Kuliah]</strong> ini. Fokus penilaian ada
                pada <strong>[Jumlah]</strong> poin utama.
              </p>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>
                  <strong>Pertama</strong>, periksa bagian{" "}
                  <strong>[Topik/Soal A]</strong>, pastikan mahasiswa
                  menggunakan metode <strong>[Nama Metode Wajib]</strong>,
                  bobotnya <strong>[X] poin</strong>.
                </li>
                <li>
                  <strong>Kedua</strong>, cek analisis pada{" "}
                  <strong>[Topik/Soal B]</strong>, apakah hasilnya sesuai dengan{" "}
                  <strong>[Kriteria Khusus]</strong>, bobotnya{" "}
                  <strong>[Y] poin</strong>.
                </li>
              </ul>
              <p className="mt-2">
                Jika terdapat pelanggaran seperti{" "}
                <strong>[Kondisi Denda/Kesalahan Pengerjaan]</strong>, tolong
                kurangi <strong>[Z] poin</strong> dari total nilai."
              </p>
            </div>

            <p className="text-xs text-blue-600 italic">
              *Tips: Tulislah seperti Anda sedang menjelaskan tugas ke asisten
              manusia. AI akan otomatis membagi poin penilaiannya.
            </p>
          </div>
        </div>
      </div>

      <textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none transition-all"
        rows="4"
        placeholder="Ketik instruksi penilaian di sini... (Lihat ikon tanda seru untuk contoh template)"
      />
    </div>
  );
};

export default GradingInstruction;
