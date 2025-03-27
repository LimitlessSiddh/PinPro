import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

const clubs = [
  'Driver', '3 Wood', 'Hybrid', '4 Iron', '5 Iron', '6 Iron',
  '7 Iron', '8 Iron', '9 Iron', 'Pitching Wedge', 'Sand Wedge', 'Lob Wedge',
];

const Setup = () => {
  const userId = localStorage.getItem('userId') || 'guest_user';
  const [yardages, setYardages] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch(`https://pinpro.onrender.com/api/clubs/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setYardages(data);
        }
      })
      .catch((err) => console.error('Error fetching clubs:', err));
  }, [userId]);

  const saveToBackend = (clubsData: Record<string, number>, message = 'Saved ✅') => {
    fetch('https://pinpro.onrender.com/clubs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, clubs: clubsData }),
    })
      .then((res) => res.json())
      .then(() => {
        setStatus(message);
        setTimeout(() => setStatus(null), 1500);
      })
      .catch((err) => {
        console.error('Error saving clubs:', err);
        setStatus('Save failed ❌');
      });
  };

  const handleChange = (club: string, value: number) => {
    const updated = { ...yardages, [club]: value };
    setYardages(updated);
    saveToBackend(updated);
  };

  const handleReset = () => {
    const cleared: Record<string, number> = {};
    clubs.forEach((club) => (cleared[club] = 0));
    setYardages(cleared);
    saveToBackend(cleared, 'Clubs reset ✅');
  };

  const handleManualSave = () => {
    saveToBackend(yardages, 'Saved ✅');
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-6 bg-[#f9f9f9] flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-2 text-center text-[#202334]">Setup Your Clubs</h1>
        <p className="text-lg text-gray-600 mb-6 text-center">Customize your go-to yardages for each club </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-3xl">
          {clubs.map((club) => (
            <div
              key={club}
              className="flex items-center justify-between bg-white p-4 rounded-xl shadow-md border hover:scale-[1.02] transition-all duration-200"
            >
              <label className="text-gray-800 font-medium text-lg">{club}</label>
              <input
                type="number"
                value={yardages[club] || ''}
                onChange={(e) => handleChange(club, Number(e.target.value))}
                placeholder="Yards"
                className="border border-gray-300 p-2 rounded-md w-24 text-center focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-6 mt-8">
          <button
            onClick={handleManualSave}
            className="bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 transition shadow"
          >
             Save
          </button>
          <button
            onClick={handleReset}
            className="bg-red-600 text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-red-700 transition shadow"
          >
             Reset
          </button>
        </div>

        {status && (
          <div className="mt-6 px-4 py-2 rounded-full text-white bg-green-600 text-lg animate-fade-in-down shadow">
            {status}
          </div>
        )}
      </div>
    </>
  );
};

export default Setup;
