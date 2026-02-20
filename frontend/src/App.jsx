import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Repository from "./pages/Repository";
import Upload from "./pages/Upload";
import Review from "./pages/Review";
import Notices from "./pages/Notices";
import AdminPanel from "./pages/AdminPanel";
import Analytics from "./pages/Analytics";

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/repository" element={<Repository />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/review" element={<Review />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
