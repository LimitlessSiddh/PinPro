import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from './components/AppShell';
import { useSession } from './lib/session';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Setup from './pages/Setup';
import StartRound from './pages/StartRound';

// Logged-out visitors to a deep link go to /login and come back afterwards.
const ToLogin = () => {
  const location = useLocation();
  return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
};

const AfterLogin = ({ fallback }: { fallback: string }) => {
  const from = (useLocation().state as { from?: string } | null)?.from;
  return <Navigate to={from && from !== '/login' ? from : fallback} replace />;
};

function App() {
  const session = useSession();

  return (
    <BrowserRouter>
      <Routes>
        {session ? (
          <>
            <Route element={<AppShell />}>
              <Route path="/" element={<Home />} />
              <Route path="/start" element={<StartRound />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="/login" element={<AfterLogin fallback="/" />} />
            <Route path="/register" element={<AfterLogin fallback="/setup?welcome=1" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<ToLogin />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
