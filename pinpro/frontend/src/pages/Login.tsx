import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { googleSignInEnabled } from '../lib/google';
import { Alert, Button, Input } from '../components/ui';
import { apiFetch, errorMessage } from '../lib/api';
import { lastLogoutReason, setSession, type Session } from '../lib/session';
import { usePageTitle } from '../lib/usePageTitle';

const Login = () => {
  usePageTitle('Log in');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const expired = lastLogoutReason() === 'expired';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      setSession(await apiFetch<Session>('/api/auth/login', { method: 'POST', body: { username, password } }));
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to see your clubs, rounds and handicap.">
      {expired && !error && (
        <Alert className="mb-6">Your session ended. Please log in again — an unfinished round is still saved on this device.</Alert>
      )}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          label="Username"
          autoComplete="username"
          autoCapitalize="none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" loading={loading} className="w-full">
          Log in
        </Button>
      </form>

      {googleSignInEnabled && (
        <>
          <div className="my-6 flex items-center gap-3 text-sm text-slate-500">
            <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
          </div>
          <GoogleLoginButton />
        </>
      )}

      <p className="mt-8 text-center text-slate-600">
        New to PinPro?{' '}
        <Link to="/register" className="font-semibold text-fairway underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
