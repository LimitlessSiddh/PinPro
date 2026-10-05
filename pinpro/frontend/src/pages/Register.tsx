import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { googleSignInEnabled } from '../lib/google';
import { Alert, Button, Input } from '../components/ui';
import { apiFetch, errorMessage } from '../lib/api';
import { setSession, type Session } from '../lib/session';
import { usePageTitle } from '../lib/usePageTitle';

// Same rules as the server (authController.register).
const validate = (username: string, password: string) => ({
  username: /^[A-Za-z0-9_.-]{3,30}$/.test(username.trim())
    ? null
    : '3–30 characters: letters, numbers, dots, dashes or underscores.',
  password: password.length >= 8 ? null : 'Use at least 8 characters.',
});

const Register = () => {
  usePageTitle('Create account');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ username: false, password: false });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const errors = validate(username, password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true });
    if (errors.username || errors.password) return;
    setError(null);
    setLoading(true);
    try {
      // The router sends new accounts straight to club setup.
      setSession(await apiFetch<Session>('/api/auth/register', { method: 'POST', body: { username, password } }));
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="It takes a minute. Next, you'll add your club distances.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input
          label="Username"
          autoComplete="username"
          autoCapitalize="none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, username: true }))}
          hint="Letters, numbers, dots, dashes or underscores."
          error={touched.username ? errors.username : null}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          hint="At least 8 characters."
          error={touched.password ? errors.password : null}
        />
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" loading={loading} className="w-full">
          Create account
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
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-fairway underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
