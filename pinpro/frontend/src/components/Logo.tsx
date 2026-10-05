import { Link } from 'react-router-dom';

export const LogoMark = ({ className = 'h-8 w-8' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden>
    <rect width="32" height="32" rx="8" fill="#166534" />
    <path d="M12 25V7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M12 7.5h9l-2.5 3.5L21 14.5h-9z" fill="#fff" />
    <ellipse cx="16" cy="25.2" rx="7" ry="1.6" fill="#fff" opacity=".45" />
  </svg>
);

const Logo = ({ light = false }: { light?: boolean }) => (
  <Link to="/" className="inline-flex items-center gap-2.5 rounded-lg">
    <LogoMark />
    <span className={`text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-navy'}`}>PinPro</span>
  </Link>
);

export default Logo;
