import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Home = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 bg-white text-center">
        <h1 className="text-5xl font-bold text-primary italic mb-4 animate-fade-in">PinPro</h1>
        <p className="text-gray-600 text-xl mb-8 max-w-2xl animate-fade-in delay-200">
          Your smart golf companion. Set your club distances, track rounds, and get personalized club suggestions — all in one place.
        </p>
        <button
          onClick={() => navigate('/start')}
          className="bg-black text-white px-6 py-3 rounded-full text-lg font-medium shadow-md hover:bg-accent hover:scale-105 transition-transform duration-200 animate-fade-in delay-300"
        >
          Start a Round
        </button>

        {/* Feature section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          <div className="p-6 bg-gray-50 border rounded-lg shadow hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-primary mb-2">📏 Custom Yardages</h3>
            <p className="text-gray-600 text-sm">Save personalized yardages for every club so suggestions match your game.</p>
          </div>
          <div className="p-6 bg-gray-50 border rounded-lg shadow hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-primary mb-2">📈 Round Tracker</h3>
            <p className="text-gray-600 text-sm">Track your performance per hole and see stats update in your profile.</p>
          </div>
          <div className="p-6 bg-gray-50 border rounded-lg shadow hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-primary mb-2">🤖 Smart Suggestions</h3>
            <p className="text-gray-600 text-sm">Let AI recommend the right club based on distance and your saved data.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
