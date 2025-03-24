import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Home = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 text-center bg-white">
        <h1 className="text-5xl font-bold text-primary italic mb-4">PinPro </h1>
        <p className="text-gray-600 text-xl mb-8 max-w-xl">
          Your smart golf companion. Set your club distances, track rounds, and get personalized club suggestions — all in one place.
        </p>
        <button
          onClick={() => navigate('/start')}
          className="bg-primary text-white px-6 py-3 rounded-full text-lg font-medium shadow-md hover:bg-accent hover:scale-105 transition-transform duration-200"
        >
          Start a Round
        </button>
      </div>
    </>
  );
};

export default Home;
