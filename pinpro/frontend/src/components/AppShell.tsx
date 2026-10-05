import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { clearSession, useSession } from '../lib/session';
import { BagIcon, FlagIcon, HomeIcon, LogoutIcon, UserIcon } from './icons';
import Logo from './Logo';
import { cx } from '../lib/cx';

const NAV = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/start', label: 'Play', Icon: FlagIcon, end: false },
  { to: '/setup', label: 'Clubs', Icon: BagIcon, end: false },
  { to: '/profile', label: 'Profile', Icon: UserIcon, end: false },
];

const AppShell = () => {
  const session = useSession();
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);

  // Move focus to the new page on navigation so screen readers announce it (not on first load).
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-navy"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 bg-navy text-slate-300 shadow-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo light />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cx(
                    'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'
                  )
                }
              >
                {label === 'Play' ? 'Play a round' : label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-40 truncate text-sm lg:inline" title={session?.user.username}>
              {session?.user.username}
            </span>
            <button
              type="button"
              onClick={() => clearSession()}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-medium hover:bg-white/10 hover:text-white"
            >
              <LogoutIcon className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto max-w-6xl px-4 pb-28 pt-6 outline-none sm:px-6 sm:pt-10 md:pb-16"
      >
        <Outlet />
      </main>

      {/* Thumb-reachable tab bar on phones, where PinPro is used on the course. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {NAV.map(({ to, label, Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cx(
                    'flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium',
                    isActive ? 'text-fairway' : 'text-slate-500'
                  )
                }
              >
                <Icon className="h-6 w-6" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default AppShell;
