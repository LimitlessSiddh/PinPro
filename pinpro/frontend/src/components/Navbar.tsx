import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-[#202334] text-slate-300 px-6 py-4 flex justify-between items-center shadow-md">
      {/* 🏠 Logo that links to Home */}
      <Link to="/" className="text-2xl font-bold italic text-white hover:text-green-400 transition">
        PinPro
      </Link>

      {/* Add nav links here if needed */}
      <div className="space-x-4">
        <Link to="/start" className="hover:text-white transition">Start Round</Link>
        <Link to="/setup" className="hover:text-white transition">Setup</Link>
        <Link to="/profile" className="hover:text-white transition">Profile</Link>
      </div>
    </nav>
  );
};

export default Navbar;
