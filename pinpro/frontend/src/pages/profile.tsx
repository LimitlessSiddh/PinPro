import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import Navbar from '../components/Navbar';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

interface Round {
  id: number;
  total_holes: number;
  shots: number;
  final_score: number;
  par: number;
  created_at: string;
  course_name: string;
}

const Profile = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [handicap, setHandicap] = useState<number>(0);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    const storedId = localStorage.getItem('userId');
    if (storedId && storedId !== 'undefined') {
      setUserId(storedId);
    } else {
      setUserId(null);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    fetch(`https://pinpro.onrender.com/api/rounds/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setRounds(data.rounds || []);
        setHandicap(data.handicap ?? 0);
      })
      .catch((err) => {
        console.error('Error fetching rounds:', err);
        setRounds([]);
        setHandicap(0);
      });
  }, [userId]);

  const totalRounds = rounds.length;
  const bestScore = rounds.reduce((best, r) => (r.final_score < best ? r.final_score : best), 999);
  const averageScore = rounds.length
    ? Math.round(rounds.reduce((acc, r) => acc + r.final_score, 0) / rounds.length)
    : 0;

  const formatScore = (score: number) => {
    if (score === 0) return 'E';
    return score > 0 ? `+${score}` : `${score}`;
  };

  const chartData = {
    labels: rounds.map((_r, i) => `Round ${i + 1}`),
    datasets: [
      {
        label: 'Final Score',
        data: rounds.map((r) => r.final_score),
        borderColor: '#2563eb',
        backgroundColor: '#93c5fd',
        tension: 0.2,
        pointRadius: 4,
      },
    ],
  };

  return (
    <>
      <Navbar />
      {!userId ? (
        <div className="min-h-screen flex items-center justify-center text-center text-red-600 text-xl">
          ⚠️ No user ID found. Please log in again.
        </div>
      ) : (
        <div className="min-h-screen bg-[#f7f9fb] px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-bold text-primary mb-6 text-center">Player Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">User Info</h2>
                <p className="text-gray-700 mb-2">
                  User ID: <span className="italic text-gray-600">{userId}</span>
                </p>
                <p className="text-gray-700">
                  Rounds Played: <span className="font-semibold">{totalRounds}</span>
                </p>
              </div>

              <div
                onClick={() => setShowChart(!showChart)}
                className="bg-white shadow-lg rounded-lg p-6 border border-gray-200 cursor-pointer hover:shadow-xl transition"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Stats Summary</h2>
                <p className="text-gray-700 mb-2">
                  Best Score:{' '}
                  <span className={bestScore >= 0 ? 'text-red-500' : 'text-green-600'}>
                    {totalRounds > 0 ? formatScore(bestScore) : 'N/A'}
                  </span>
                </p>
                <p className="text-gray-700 mb-2">
                  Average Score:{' '}
                  <span className={averageScore >= 0 ? 'text-red-500' : 'text-green-600'}>
                    {totalRounds > 0 ? formatScore(averageScore) : 'N/A'}
                  </span>
                </p>
                <p className="text-gray-700">
                  Handicap:{' '}
                  <span className={handicap >= 0 ? 'text-red-500' : 'text-green-600'}>
                    {handicap === 0 ? 'E' : formatScore(handicap)}
                  </span>
                </p>
              </div>
            </div>

            {showChart && totalRounds > 0 && (
              <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200 shadow">
                <h3 className="text-lg font-semibold mb-4">Score Progression</h3>
                <Line data={chartData} />
              </div>
            )}

            <h2 className="text-2xl font-semibold text-primary mb-4">Past Rounds</h2>
            <div className="overflow-x-auto shadow border border-gray-200 rounded-lg">
              <table className="w-full bg-white text-left">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-3 border">Date</th>
                    <th className="p-3 border">Course</th>
                    <th className="p-3 border">Holes</th>
                    <th className="p-3 border">Shots</th>
                    <th className="p-3 border">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rounds.map((round) => (
                    <tr key={round.id} className="hover:bg-gray-50">
                      <td className="p-3 border">
                        {new Date(round.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 border font-semibold italic text-blue-600">
                        {round.course_name || '—'}
                      </td>
                      <td className="p-3 border">{round.total_holes}</td>
                      <td className="p-3 border">{round.shots}</td>
                      <td
                        className={`p-3 border font-medium ${
                          round.final_score >= 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {formatScore(round.final_score)}
                      </td>
                    </tr>
                  ))}
                  {rounds.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center p-4 text-gray-500 italic">
                        No rounds yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
