import React, { useState, useEffect } from "react";
import {
  Sparkles,
  FileText,
  FileSpreadsheet,
  // BrainCircuit,
  BotMessageSquare,
  // ScanEye,
  SearchCheck,
  // ArrowRight,
} from "lucide-react";
// import labCoIcon from "../assets/lab-co-analyzing.png";

const LandingPage = ({ onStart }) => {
  // Logika typewriter
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  // Pesan yang akan ditampilkan secara bergantian
  const messages = ["Selamat Datang, Kawan.", "Semoga Hari Anda Cerah Selalu!"];

  useEffect(() => {
    const handleTyping = () => {
      const i = loopNum % messages.length;
      const fullText = messages[i];

      // Teks yang sedang diketik atau dihapus
      setText(
        isDeleting
          ? fullText.substring(0, text.length - 1)
          : fullText.substring(0, text.length + 1)
      );

      // Kecepatan Mengetik vs Menghapus
      setTypingSpeed(isDeleting ? 50 : 100);

      // Logika Pergantian Kalimat
      if (!isDeleting && text === fullText) {
        // Jeda sejenak setelah selesai mengetik
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && text === "") {
        // Mulai mengetik kalimat berikutnya
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(500); // Jeda dikit sebelum mulai ngetik lagi
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum]);

  const features = [
    {
      title: "Analisis PDF",
      desc: "Ekstraksi teks otomatis & pencocokan jawaban mahasiswa secara cerdas.",
      icon: FileText,
      color: "text-red-500",
      bgIcon: "bg-red-50",
      bgDecor: "bg-red-100", // Warna dekorasi sudut
    },
    {
      title: "Integrasi Excel",
      desc: "Export nilai otomatis langsung ke template file Excel yang telah disesuaikan.",
      icon: FileSpreadsheet,
      color: "text-green-600",
      bgIcon: "bg-green-50",
      bgDecor: "bg-green-100", // Warna dekorasi sudut
    },
    {
      title: "Feedback AI",
      desc: "Hasil analisis dokumen dan Saran perbaikan kode & logika yang mendidik dan konstruktif.",
      icon: Sparkles,
      color: "text-purple-600",
      bgIcon: "bg-purple-50",
      bgDecor: "bg-purple-100", // Warna dekorasi sudut
    },
  ];

  return (
    // Wrapper Halaman dengan latar belakang terang dan font sans-serif
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 relative overflow-hidden selection:bg-blue-100">
      {/* Container Utama */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] -z-10 opacity-60"></div>

      {/* Icon Brand "SiTeliti" */}
      <div className="absolute top-4 left-4 md:top-6 md:left-8 z-20">
        <div className="group flex items-center gap-3 px-3 py-2 cursor-default transition-all duration-300 hover:opacity-80">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform duration-300">
            {/* <ScanEye className="w-5 h-5 text-white" /> */}
            <SearchCheck className="w-5 h-5 text-white" />
          </div>
          <div className="text-2xl font-bold tracking-tight flex items-center gap-0.5">
            <span className="text-slate-900">Si</span>
            <span className="text-blue-600">Teliti</span>
          </div>
        </div>
      </div>
      <div className="flex-grow flex flex-col items-center justify-start pt-32 md:justify-center md:pt-24 p-6 relative z-10">
        {/* Logo/Icon */}
        <div className="mb-14 animate-fade-in-down">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white border border-slate-200/80 rounded-full shadow-sm shadow-slate-100 hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-default group">
            <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
              {/* <BrainCircuit className="w-3.5 h-3.5 text-blue-600 group-hover:text-white transition-colors duration-300" /> */}
              {/* <ScanEye className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors duration-300" /> */}
              <BotMessageSquare className="w-4.5 h-4.5 text-blue-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <span className="text-md font-bold text-slate-700 tracking-wide">
              Auto-Grader AI Assistant
            </span>
          </div>
        </div>

        {/* Gambar LabCo */}
        {/* <img
              src={labCoIcon}
              alt="Lab-CO Analyzing"
              className="w-32 h-auto object-contain drop-shadow-xl"
            /> */}

        {/* Text Sapaan */}
        <div className="max-w-5xl text-center mb-10 h-24 flex items-center justify-center">
          <h1 className="text-5xl md:text-6xl font-serif font-medium tracking-tight text-slate-900 leading-[1.2]">
            {text}
            <span className="text-blue-600 animate-pulse font-sans ml-1">
              |
            </span>
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-slate-600 text-center max-w-3xl mb-20 leading-relaxed font-light">
          Saya adalah
          <span className="inline-flex items-center gap-0.5 font-bold tracking-tight mx-1.5">
            <span className="text-slate-900">Si</span>
            <span className="text-blue-600">Teliti</span>
          </span>
          asisten AI Auto-Grader Anda. Tugas praktikum apa yang ingin kita koreksi hari ini?
        </p>

        {/* Action Area (Tombol Utama) */}
        <div className="mb-28 w-full flex justify-center px-4">
          <button
            onClick={onStart}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-3 bg-slate-900 text-white text-lg font-semibold rounded-2xl shadow-2xl shadow-slate-300 hover:bg-blue-600 hover:shadow-blue-200 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto max-w-xs sm:max-w-none"
          >
            <span className="whitespace-nowrap">Mulai Penilaian Baru</span>
          </button>
        </div>

        {/* Feature Cards (Grid) */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-12 px-4">
          {features.map((item, index) => (
            <div
              key={index}
              className="relative flex flex-col items-center text-center p-8 rounded-3xl 
                         bg-white/60 backdrop-blur-sm border border-white/50 
                         hover:bg-white hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-1
                         transition-all duration-300 group overflow-hidden"
            >
              {/* Dekorasi Sudut */}
              <div
                className={`absolute top-0 right-0 w-24 h-24 ${item.bgDecor} 
                            rounded-bl-full -mr-4 -mt-4 opacity-50 
                            transition-transform duration-500 group-hover:scale-110`}
              ></div>
              {/* Ikon Container */}
              <div
                className={`relative z-10 w-16 h-16 ${item.bgIcon} rounded-2xl 
                            flex items-center justify-center mb-6 
                            group-hover:scale-110 transition-transform duration-300`}
              >
                <item.icon className={`w-8 h-8 ${item.color}`} />
              </div>
              {/* Judul dan Deskripsi */}
              <h3 className="relative z-10 text-xl font-bold text-slate-900 mb-3">
                {item.title}
              </h3>
              <p className="relative z-10 text-base text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="w-full py-10 text-center text-sm font-medium text-slate-400">
        © 2025 Auto-Grader AI Assistant (SiTeliti). Powered by Llama 3.3 & Groq.
      </div>
    </div>
  );
};

export default LandingPage;
