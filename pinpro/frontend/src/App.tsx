import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import StartRound from "./pages/StartRound";
import Setup from "./pages/Setup";
import Profile from "./pages/profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoutes";

function App() {
  const token = localStorage.getItem('token');

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect to login or profile based on token */}
        <Route path="/" element={<Navigate to={token ? "/profile" : "/login"} />} />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/start" element={<ProtectedRoute><StartRound /></ProtectedRoute>} />
        <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
