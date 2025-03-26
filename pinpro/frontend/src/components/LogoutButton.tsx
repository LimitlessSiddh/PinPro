// src/components/LogoutButton.tsx
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Sign out of Firebase (if applicable)
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase logout skipped (user not signed in)');
    }

    // Clear localStorage tokens
    localStorage.removeItem('token');          // manual login
    localStorage.removeItem('firebaseToken');  // google login
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');

    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
    >
      Logout
    </button>
  );
};

export default LogoutButton;
