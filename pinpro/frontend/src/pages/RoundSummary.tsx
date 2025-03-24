import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

type Shot = {
  distance: number;
  club: string;
};

const RoundSummary = () => {
  const [shots, setShots] = useState<Shot[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('lastRound');
    if (saved) {
      setShots(JSON.parse(saved));
    }
  }, []);

  const totalShots = shots.length;

  const mostUsedClub = (() => {
    const clubCount: Record<string, number> = {};
    shots.forEach(({ club }) => {
      clubCount[club] = (clubCount[club] || 0) + 1;
    });
    const sorted = Object.entries(clubCount).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'N/A';
  })();

  const averageDistance = Math.round(
    shots.reduce((sum, s) => sum + s.distance, 0) / (shots.length || 1)
  );

  return (
    <>
      <Navbar />
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-primary mb-4">🏁 Round Summary</h1>

        <div className="bg-white shadow rounded-md p-4 mb-6 space-y-3">
          <p><strong>Total Shots:</strong> {totalShots}</p>
          <p><strong>Average Distance:</strong> {averageDistance} yards</p>
          <p><strong>Most Used Club:</strong> {mostUsedClub}</p>
        </div>

        <h2 className="text-xl font-semibold mb-2">Shot Breakdown:</h2>
        <ul className="space-y-2">
          {shots.map((shot, index) => (
            <li key={index} className="border-b pb-2 text-gray-600">
              Shot {index + 1}: {shot.distance} yds → {shot.club}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default RoundSummary;
