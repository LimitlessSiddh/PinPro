// src/components/Navbar.tsx
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Navbar = () => {
  const navigate = useNavigate();
  const isLoggedIn =
    !!localStorage.getItem('token') || !!localStorage.getItem('firebaseToken');

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // Firebase may not have an active session
    }

    localStorage.clear();
    window.dispatchEvent(new Event('storage')); // 🔁 Notify App to recheck auth
    navigate('/login');
  };

  return (
    <nav className="bg-[#202334] text-slate-300 px-6 py-4 flex justify-between items-center shadow-md">
      <Link
        to="/"
        className="text-2xl font-bold italic text-white hover:text-green-400 transition"
      >
        PinPro
      </Link>

      <div className="space-x-4 flex items-center">
        <Link to="/start" className="hover:text-white transition">Start Round</Link>
        <Link to="/setup" className="hover:text-white transition">Setup</Link>
        <Link to="/profile" className="hover:text-white transition">Profile</Link>

        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
