import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { gradePaper } from "../services/api";
import { ArrowLeft, Sparkles } from "lucide-react";

// Komponen Utama Aplikasi
import FileUpload from "./FileUpload";
import GradingInstruction from "./GradingInstruction";
import GradeResult from "./GradeResult";
import PreviewModal from "./PreviewModal";

const GradingWorkspace = ({ onBack }) => {
  // State Management
  const [file, setFile] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [instruction, setInstruction] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [meeting, setMeeting] = useState("1");
  const [saving, setSaving] = useState(false);
  const [unsavedCount, setUnsavedCount] = useState(0);

  // Fitur Ref untuk scroll ke hasil
  const resultsRef = useRef(null);
  // Fitur proteksi agar tidak close tab sembarangan saat ada perubahan belum disimpan
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (unsavedCount > 0) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsavedCount]);

  const handleGrade = async () => {
    if (!file) {
      Swal.fire({
        icon: "error",
        title: "File Belum Diupload",
        text: "Mohon pilih file laporan (PDF) terlebih dahulu sebelum memulai.",
        confirmButtonColor: "#d33",
        confirmButtonText: "Mengerti",
      });
      return;
    }
    if (!excelFile) {
      Swal.fire({
        icon: "info",
        title: "File Rekap Belum Diupload",
        text: "Mohon pilih file rekapitulasi (Excel) terlebih dahulu sebelum memulai.",
        confirmButtonColor: "#10B981",
        confirmButtonText: "Mengerti",
      });
      return;
    }
    if (!instruction) {
      Swal.fire({
        icon: "warning", // Ikon tanda seru kuning animasi
        title: "Instruksi Kosong!",
        text: "Agar AI bisa menilai dengan akurat, mohon berikan instruksi atau rubrik penilaiannya.",
        confirmButtonColor: "rgba(0, 58, 250, 1)",
        confirmButtonText: "Oke, Saya Isi Dulu",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Panggil Backend
      const data = await gradePaper(file, instruction);
      setResult(data);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      setError("Gagal kterhubung ke server. Silakan coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menyimpan nilai ke memori (chacing)
  const handleAddToExcel = async () => {
    if (!result || !excelFile) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("nama", result.nama_mahasiswa);
      formData.append("nilai", result.nilai);
      formData.append("pertemuan", meeting);
      formData.append("file_excel", excelFile); // Kirim file dari memori

      const response = await axios.post(
        "https://siteliti-autograder-ai-assistant.onrender.com/api/export",
        formData,
        {
          responseType: "blob",
        }
      );

      // Update State Excel dengan file baru dari server
      const updatedFile = new File([response.data], excelFile.name, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      setExcelFile(updatedFile);
      setUnsavedCount((prev) => prev + 1);

      Swal.fire({
        icon: "success",
        title: "Tersimpan!",
        html: `Nilai <b>${result.nama_mahasiswa}</b> masuk ke Excel.<br/>Lanjut mahasiswa berikutnya.`,
        timer: 1500,
        showConfirmButton: false,
      });

      // Reset untuk next mahasiswa
      setShowPreview(false);
      setFile(null);
      setResult(null);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        Swal.fire({
          icon: "error",
          title: "Nama Tidak Ditemukan",
          text: `Pastikan nama "${result.nama_mahasiswa}" ada di Excel.`,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Menyimpan",
          text: "Terjadi kesalahan server.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // Fungsi untuk mengunduh file Excel yang sudah diupdate
  const handleFinalDownload = () => {
    if (!excelFile) return;
    const url = window.URL.createObjectURL(excelFile);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `REKAP_FINAL_UPDATED.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setUnsavedCount(0); // Reset warning
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center pt-20 px-6 font-sans text-slate-900 relative overflow-hidden selection:bg-blue-100 pb-20">
      {/* Background Decorations */}
      <div className="fixed inset-0 -z-50 bg-[#F8FAFC]"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-100/40 rounded-full blur-[120px] -z-40 opacity-60 pointer-events-none"></div>
      <div className="max-w-5xl w-full relative z-10">
        {/* Workspace Header dengan Tombol Kembali */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-slate-900 tracking-tight">
              Ruang Penilaian
            </h2>
            <p className="text-slate-800 mt-2 font-light text-xl">
              Upload laporan praktikum & kelola nilai secara otomatis.
            </p>
          </div>
          {/* Tombol Kembali ke Atas */}
          <button
            onClick={onBack}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:shadow-md transition-all duration-300"
            title="Kembali ke Halaman Depan"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Kembali</span>
          </button>
        </div>

        {/* Form Area */}
        <div className="space-y-8">
          <div className="animate-fade-in-up space-y-8">
            <FileUpload
              file={file}
              setFile={setFile}
              excelFile={excelFile}
              setExcelFile={setExcelFile}
              unsavedCount={unsavedCount}
              setUnsavedCount={setUnsavedCount}
              onDownloadExcel={handleFinalDownload}
            />

            <GradingInstruction
              instruction={instruction}
              setInstruction={setInstruction}
              onGrade={handleGrade}
              loading={loading}
            />
          </div>

          {/* Tombol Eksekusi */}
          <div className="pt-6 flex flex-col items-center animate-fade-in-up delay-100">
            <button
              onClick={handleGrade}
              disabled={loading}
              className={`px-8 py-3 min-w-[200px] rounded-xl font-semibold text-base text-white shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] ${
                loading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-blue-600 hover:shadow-blue-200 hover:-translate-y-1"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sedang Menganalisis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300 fill-current" />
                  <span>Jalankan Penilaian AI</span>
                </>
              )}
            </button>
            <p className="text-center text-sm font-medium text-slate-400 mt-4">
              *Proses analisis akan memakan waktu, tergantung dari panjangnya
              laporan.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center justify-center animate-shake">
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Result Area */}
        <div ref={resultsRef} className="scroll-mt-24 mt-12">
          <GradeResult result={result} onPreview={() => setShowPreview(true)} />
        </div>
      </div>

      {/* Modal Popup */}
      {showPreview && file && result && (
        <PreviewModal
          file={file}
          result={result}
          onClose={() => setShowPreview(false)}
          onSave={handleAddToExcel}
          meeting={meeting}
          setMeeting={setMeeting}
          saving={saving}
        />
      )}
    </div>
  );
};

export default GradingWorkspace;
