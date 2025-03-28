// src/components/GoogleLoginButton.tsx
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const token = await user.getIdToken();
      const uid = user.uid;
      const email = user.email;

      const res = await fetch('https://pinpro.onrender.com/api/auth/sync-firebase-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid, email }),
      });

      const data = await res.json();
      console.log('🔁 Firebase user synced:', data); // ✅ Debug log

      localStorage.setItem('firebaseToken', token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.username);

      window.dispatchEvent(new Event('storage'));
      navigate('/');
    } catch (error) {
      console.error('❌ Google login failed:', error);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="bg-white border border-gray-300 text-black px-6 py-2 rounded-lg shadow-sm hover:shadow-md flex items-center gap-2 transition"
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google"
        className="w-5 h-5"
      />
      Continue with Google
    </button>
  );
};

export default GoogleLoginButton;
