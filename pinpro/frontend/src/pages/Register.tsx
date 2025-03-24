import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const res = await fetch('http://localhost:5050/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.username);

      navigate('/profile');
    } catch (err) {
      setError('Something went wrong.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <h1 className="text-3xl font-bold text-primary mb-4">Register</h1>
        <input
          type="text"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full max-w-sm border p-2 rounded mb-4"
        />
        <input
          type="password"
          placeholder="Choose a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full max-w-sm border p-2 rounded mb-4"
        />
        <button
          onClick={handleRegister}
          className="bg-black text-white px-6 py-2 rounded hover:bg-accent"
        >
          Register
        </button>
        {error && <p className="text-red-600 mt-4">{error}</p>}
        <p className="text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary underline hover:text-accent">
            Login here
          </Link>
        </p>
      </div>
    </>
  );
};

export default Register;
