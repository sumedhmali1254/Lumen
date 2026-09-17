import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Mesh Gradient Background */}
      <div className="mesh-gradient" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />
        <main className="flex-1 w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  );
}
