import React from "react";
import { FileText, FileSpreadsheet, CheckCircle, Download } from "lucide-react";

// Komponen File Upload
const FileUpload = ({
  file,
  setFile,
  excelFile,
  setExcelFile,
  unsavedCount,
  setUnsavedCount,
  onDownloadExcel,
}) => {
  return (
    <div className="space-y-6">
      {/* Input PDF */}
      <div className="bg-red-50 p-4 rounded-lg border border-red-400">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Upload Laporan (PDF)
        </label>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label
            htmlFor="pdf-upload"
            className="cursor-pointer flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-semibold text-sm transition-all shadow-md active:scale-95 w-full sm:w-auto"
          >
            <FileText className="w-4 h-4" />
            <span>Pilih File PDF</span>
          </label>
          <span className="text-sm text-slate-500 italic truncate max-w-[200px] sm:max-w-[250px]">
            {file ? file.name : "Belum ada file dipilih"}
          </span>
          <input
            id="pdf-upload"
            key={file ? file.name : "reset-pdf"}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>
      </div>

      {/* Input Excel */}
      <div
        className={`p-4 rounded-lg border transition-all ${
          unsavedCount > 0
            ? "bg-green-100 border-green-300 ring-2 ring-green-300"
            : "bg-green-50 border-green-400"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
          <div className="flex items-center gap-2">
            <label className="block text-sm font-bold text-gray-700">
              File Rekapitulasi (Template Excel)
            </label>
          </div>
          {unsavedCount > 0 && (
            <span className="self-end sm:self-auto flex items-center gap-1 text-xs font-bold text-green-800 bg-white px-3 py-1 rounded-full shadow-sm animate-pulse border border-green-300 w-fit">
              <CheckCircle className="w-3 h-3 text-green-800" />
              {unsavedCount} Data Baru
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label
              htmlFor="excel-upload"
              className="cursor-pointer flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-semibold text-sm transition-all shadow-md active:scale-95 w-full sm:w-auto"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Pilih File Excel</span>
            </label>
            <span className="text-sm text-slate-500 italic truncate max-w-[200px] sm:max-w-[250px]">
              {excelFile ? excelFile.name : "Belum ada file dipilih"}
            </span>
            <input
              id="excel-upload"
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                setExcelFile(e.target.files[0]);
                setUnsavedCount(0); // Reset status unsaved jika ganti file
              }}
            />
          </div>

          {unsavedCount > 0 && (
            <button
              onClick={onDownloadExcel}
              className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              Download File Excel (Updated)
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2 italic">
          *Upload file Excel kosong sekali saja. Sistem akan mengisinya
          otomatis.
        </p>
      </div>
    </div>
  );
};

export default FileUpload;
