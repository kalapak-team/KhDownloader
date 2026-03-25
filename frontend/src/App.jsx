import { useEffect } from "react";
import { Github } from "lucide-react";
import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import AdminDashboard from "./pages/AdminDashboard";
import History from "./pages/History";
import Home from "./pages/Home";
import JpgToPdf from "./pages/JpgToPdf";
import Login from "./pages/Login";
import MergePdf from "./pages/MergePdf";
import PdfToJpg from "./pages/PdfToJpg";
import PdfToWord from "./pages/PdfToWord";
import PdfToPptx from "./pages/PdfToPptx";
import ExcelToPdf from "./pages/ExcelToPdf";
import PdfToExcel from "./pages/PdfToExcel";
import PptxToPdf from "./pages/PptxToPdf";
import Profile from "./pages/Profile";
import WordToPdf from "./pages/WordToPdf";
import Register from "./pages/Register";
import { useAuthStore } from "./store/authStore";

export default function App() {
  const user = useAuthStore((state) => state.user);
  const isLoadingUser = useAuthStore((state) => state.isLoadingUser);
  const loadMe = useAuthStore((state) => state.loadMe);

  useEffect(() => {
    loadMe().catch(() => null);
  }, [loadMe]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-[min(1080px,calc(100vw-32px))] flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/history"
            element={isLoadingUser ? null : user ? <History /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/login"
            element={isLoadingUser ? null : user ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={isLoadingUser ? null : user ? <Navigate to="/" replace /> : <Register />}
          />
          <Route path="/pdf-to-jpg" element={<PdfToJpg />} />
          <Route path="/jpg-to-pdf" element={<JpgToPdf />} />
          <Route path="/merge-pdf" element={<MergePdf />} />
          <Route path="/pdf-to-word" element={<PdfToWord />} />
          <Route path="/word-to-pdf" element={<WordToPdf />} />
          <Route path="/pdf-to-pptx" element={<PdfToPptx />} />
          <Route path="/pptx-to-pdf" element={<PptxToPdf />} />
          <Route path="/pdf-to-excel" element={<PdfToExcel />} />
          <Route path="/excel-to-pdf" element={<ExcelToPdf />} />
          <Route
            path="/profile"
            element={isLoadingUser ? null : user ? <Profile /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/admin"
            element={
              isLoadingUser ? null
              : !user ? <Navigate to="/login" replace />
              : !user.is_admin ? <Navigate to="/" replace />
              : <AdminDashboard />
            }
          />
        </Routes>
      </main>
      <footer className="mt-auto border-t border-[rgba(255,255,255,0.06)] py-5">
        <div className="flex items-center justify-center gap-3 text-sm text-[#55556A]">
          <span>Made by</span>
          <a
            href="https://github.com/kalapak-team"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-[#e8472a] transition-colors hover:text-[#ff5c3a]"
          >
            <Github size={15} />
            Kalapak Team
          </a>
        </div>
      </footer>
    </div>
  );
}
