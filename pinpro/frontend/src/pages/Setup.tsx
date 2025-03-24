import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

const clubs = [
  'Driver', '3 Wood', 'Hybrid', '4 Iron', '5 Iron', '6 Iron',
  '7 Iron', '8 Iron', '9 Iron', 'Pitching Wedge', 'Sand Wedge', 'Lob Wedge',
];

const userId = localStorage.getItem('userId') || 'sidd123'; // replace later with real auth

const Setup = () => {
  const [yardages, setYardages] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/clubs/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setYardages(data);
        }
      })
      .catch((err) => console.error('Error fetching clubs:', err));
  }, []);

  const handleChange = (club: string, value: number) => {
    const updated = { ...yardages, [club]: value };
    setYardages(updated);

    fetch('http://localhost:5000/api/clubs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, clubs: updated }),
    })
      .then((res) => res.json())
      .then(() => {
        setStatus('Saved ✅');
        setTimeout(() => setStatus(null), 1500);
      })
      .catch((err) => {
        console.error('Error saving clubs:', err);
        setStatus('Save failed ❌');
      });
  };

  const handleReset = () => {
    const cleared: Record<string, number> = {};
    clubs.forEach((club) => (cleared[club] = 0));
    setYardages(cleared);

    fetch('http://localhost:5000/api/clubs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, clubs: cleared }),
    })
      .then(() => setStatus('Clubs reset ✅'))
      .catch((err) => {
        console.error('Error resetting clubs:', err);
        setStatus('Reset failed ❌');
      });
  };

  const handleManualSave = () => {
    fetch('http://localhost:5000/api/clubs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, clubs: yardages }),
    })
      .then(() => {
        setStatus('Saved ✅');
        setTimeout(() => setStatus(null), 1500);
      })
      .catch((err) => {
        console.error('Error saving manually:', err);
        setStatus('Save failed ❌');
      });
  };

  return (
    <>
      <Navbar />
      <div className="max-w-xl mx-auto p-6">
        <h2 className="text-3xl font-bold text-primary mb-2">Set Your Club Yardages</h2>
        <p className="text-gray-500 mb-4">All changes are saved automatically.</p>

        {clubs.map((club) => (
          <div key={club} className="mb-4">
            <label className="block text-gray-700 font-medium mb-1">{club}</label>
            <input
              type="number"
              value={yardages[club] ?? ''}
              onChange={(e) => handleChange(club, parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Enter yardage"
            />
          </div>
        ))}

        <div className="flex justify-between mt-6 gap-4">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Reset Clubs
          </button>
          <button
            onClick={handleManualSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Manually
          </button>
        </div>

        {status && (
          <p className="text-sm text-green-600 italic mt-4">{status}</p>
        )}
      </div>
    </>
  );
};

export default Setup;
