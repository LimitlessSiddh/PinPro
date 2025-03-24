import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

const userId = localStorage.getItem('userId') || 'sidd123';

const StartRound = () => {
  const [yardages, setYardages] = useState<Record<string, number>>({});
  const [distance, setDistance] = useState<number | null>(null);
  const [suggestedClub, setSuggestedClub] = useState<string | null>(null);
  const [shots, setShots] = useState<{ distance: number; club: string }[]>([]);
  const [hole, setHole] = useState(1);
  const [totalHoles, setTotalHoles] = useState<number | null>(null);
  const [roundFinished, setRoundFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [selectingHoles, setSelectingHoles] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/clubs/${userId}`)
      .then((res) => res.json())
      .then((data) => setYardages(data))
      .catch((err) => console.error('Error fetching clubs:', err));
  }, []);

  const handleSuggest = () => {
    if (distance === null) return;

    if (distance <= 30) {
      setSuggestedClub('Putter');
      return;
    }

    const club = Object.entries(yardages).find(
      ([, yards]) => typeof yards === 'number' && distance >= yards - 10 && distance <= yards + 10
    );

    const selectedClub = club ? club[0] : 'No club matches — maybe chip it?';
    setSuggestedClub(selectedClub);
  };

  const handleTakeShot = () => {
    if (distance === null || !suggestedClub) return;
    setShots([...shots, { distance, club: suggestedClub }]);
    setDistance(null);
    setSuggestedClub(null);
    setScore(score + 1);
  };

  const handleFinishRound = () => {
    setRoundFinished(true);

    const par = totalHoles === 9 ? 36 : 72;
    const finalScore = score - par;

    fetch('http://localhost:5000/api/rounds/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        totalHoles,
        shots: score,
        finalScore,
        par,
        shotData: shots,
      }),
    })
      .then((res) => res.json())
      .then((data) => console.log('✅ Round saved:', data))
      .catch((err) => console.error('❌ Failed to save round:', err));
  };

  const handleNextHole = () => {
    if (hole === totalHoles) {
      handleFinishRound();
    } else {
      setHole(hole + 1);
    }
  };

  const handleEndRound = () => {
    handleFinishRound();
  };

  const par = totalHoles === 9 ? 36 : 72;
  const finalScore = score - par;

  if (selectingHoles) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
          <h1 className="text-3xl font-bold text-primary mb-6">How many holes are you playing?</h1>
          <div className="flex gap-6">
            <button
              onClick={() => {
                setTotalHoles(9);
                setSelectingHoles(false);
              }}
              className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-accent"
            >
              9 Holes
            </button>
            <button
              onClick={() => {
                setTotalHoles(18);
                setSelectingHoles(false);
              }}
              className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-accent"
            >
              18 Holes
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen px-6 py-10 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-primary mb-2">Hole {hole} of {totalHoles}</h1>

        {!roundFinished && (
          <div className="w-full max-w-md space-y-4">
            <input
              type="number"
              className="border border-gray-300 p-3 w-full rounded-md"
              placeholder="Enter distance to hole"
              value={distance ?? ''}
              onChange={(e) => setDistance(Number(e.target.value))}
            />

            <button
              onClick={handleSuggest}
              className="bg-black text-white py-2 w-full rounded-md font-medium hover:bg-accent transition"
            >
              Suggest Club
            </button>

            {suggestedClub && (
              <div className="text-xl text-green-800 font-semibold text-center">
                🏌️ Suggested Club: <span className="italic">{suggestedClub}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-6">
              <button
                onClick={handleTakeShot}
                className="bg-blue-600 text-white py-2 w-full rounded-md font-medium hover:bg-blue-700"
              >
                Take Shot
              </button>
              <button
                onClick={handleNextHole}
                className="bg-gray-700 text-white py-2 w-full rounded-md font-medium hover:bg-gray-800"
              >
                Next Hole
              </button>
              <button
                onClick={handleEndRound}
                className="bg-red-600 text-white py-2 w-full rounded-md font-medium hover:bg-red-700"
              >
                End Round Now
              </button>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">📊 Shot History</h2>
              <ul className="space-y-2">
                {shots.map((shot, index) => (
                  <li key={index} className="border-b pb-2 text-gray-600">
                    Shot {index + 1}: {shot.distance} yds → {shot.club}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {roundFinished && (
          <div className="text-center mt-10">
            <h2 className="text-2xl font-bold text-primary">🏁 Round Complete!</h2>
            <p className="text-lg text-gray-700 mt-2">
              Final Score: <span className="font-semibold">{score} shots</span> → {finalScore >= 0 ? `+${finalScore}` : finalScore} (Par {par})
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default StartRound;
