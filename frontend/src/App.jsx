import { useState } from "react";
import LandingPage from "./components/LandingPage";
import GradingWorkspace from "./components/GradingWorkspace";

function App() {
  // State Management
  // State untuk mengatur tampilan layar
  const [isGrading, setIsGrading] = useState(false);

  return (
    // Container Utama Aplikasi
    <div className="h-screen w-full overflow-hidden bg-gradient-to-b from-blue-50 via-white to-blue-50 font-sans text-slate-800">
      {/* Slider Vertikal */}
      <div 
        className={`w-full h-[200vh] transition-transform duration-1000 ease-in-out ${
          isGrading ? "-translate-y-[100vh]" : "translate-y-0"
        }`}
      >
      {/* Section Landing Page */}
      <div className="h-[100vh] w-full overflow-y-auto relative">
          <LandingPage onStart={() => setIsGrading(true)} />
        </div>

      {/* Section Grading Workspace */}
      <div className="h-[100vh] w-full overflow-y-auto relative">
          <div className="pb-20"> 
            <GradingWorkspace onBack={() => setIsGrading(false)} />
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;