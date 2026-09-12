import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout
import Navbar from './components/Navbar';

// Pages/Views
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Placeholder Home component
const Home = () => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
      Zero Hunger. <span className="text-emerald-500">Maximum Impact.</span>
    </h1>
    <p className="text-xl text-gray-400 mb-8 max-w-2xl">
      Bridge the gap between excess food and those in need. Join our platform as a Donor, NGO, or Volunteer to make a difference today.
    </p>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#0a0f1c] text-[#f8fafc]">
          <Navbar />
          <main className="flex-grow w-full flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/:role/dashboard" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <ToastContainer position="bottom-right" autoClose={3000} />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
