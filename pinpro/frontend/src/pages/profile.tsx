import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

const userId = localStorage.getItem('userId') || 'sidd123';

interface Round {
  id: number;
  total_holes: number;
  shots: number;
  final_score: number;
  par: number;
  created_at: string;
}

const Profile = () => {
  const [rounds, setRounds] = useState<Round[]>([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/rounds/${userId}`)
      .then(res => res.json())
      .then(data => setRounds(data))
      .catch(err => console.error('Error fetching rounds:', err));
  }, []);

  const totalRounds = rounds.length;
  const bestScore = rounds.reduce((best, r) => r.final_score < best ? r.final_score : best, 999);
  const averageScore = rounds.length ? Math.round(rounds.reduce((acc, r) => acc + r.final_score, 0) / rounds.length) : 0;

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-primary mb-4">🏌️ Profile</h1>

        <div className="bg-white shadow-md rounded-lg p-4 mb-8">
          <p className="text-xl font-semibold mb-2">User ID: <span className="text-gray-600 italic">{userId}</span></p>
          <p className="text-lg text-gray-700">Total Rounds: {totalRounds}</p>
          <p className="text-lg text-gray-700">Best Score: {bestScore >= 0 ? `+${bestScore}` : bestScore}</p>
          <p className="text-lg text-gray-700">Avg Score: {averageScore >= 0 ? `+${averageScore}` : averageScore}</p>
        </div>

        <h2 className="text-2xl font-semibold text-primary mb-3">📋 Past Rounds</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-3 border">Date</th>
                <th className="p-3 border">Holes</th>
                <th className="p-3 border">Shots</th>
                <th className="p-3 border">Score</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map(round => (
                <tr key={round.id} className="hover:bg-gray-50">
                  <td className="p-3 border">{new Date(round.created_at).toLocaleDateString()}</td>
                  <td className="p-3 border">{round.total_holes}</td>
                  <td className="p-3 border">{round.shots}</td>
                  <td className="p-3 border">{round.final_score >= 0 ? `+${round.final_score}` : round.final_score}</td>
                </tr>
              ))}
              {rounds.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center p-4 text-gray-500 italic">No rounds yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Profile;
