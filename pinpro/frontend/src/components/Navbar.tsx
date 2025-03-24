import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-black text-white px-6 py-4 flex justify-between items-center shadow">
      <Link to="/" className="text-2xl font-bold italic text-primary hover:text-accent transition">
        PinPro 🏌️
      </Link>
      <div className="flex gap-4 text-lg">
        <Link to="/start" className="hover:text-accent transition">Start Round</Link>
        <Link to="/setup" className="hover:text-accent transition">Setup</Link>
        <Link to="/profile" className="hover:text-accent transition">Profile</Link>
      </div>
    </nav>
  );
};

export default Navbar;
