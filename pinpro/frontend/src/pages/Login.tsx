// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import GoogleLoginButton from '../components/GoogleLoginButton';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch('https://pinpro.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.username);

      window.dispatchEvent(new Event('storage')); // 🔄 Update global auth state
      navigate('/');
    } catch (err) {
      setError('Something went wrong.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <h1 className="text-3xl font-bold text-primary mb-4">Login</h1>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full max-w-sm border p-2 rounded mb-4"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full max-w-sm border p-2 rounded mb-4"
        />

        <button
          onClick={handleLogin}
          className="bg-black text-white px-6 py-2 rounded hover:bg-accent mb-4"
        >
          Login
        </button>

        <div className="mb-4">or</div>

        <GoogleLoginButton />

        {error && <p className="text-red-600 mt-4">{error}</p>}

        <p className="text-sm text-gray-600 mt-4">
          Don’t have an account?{' '}
          <Link to="/register" className="text-primary underline hover:text-accent">
            Register here
          </Link>
        </p>
      </div>
    </>
  );
};

export default Login;
