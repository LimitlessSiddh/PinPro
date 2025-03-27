import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';

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
  const [courseName, setCourseName] = useState<string>('');
  const [slopeRating, setSlopeRating] = useState<number>(120);
  const [courseRating, setCourseRating] = useState<number>(72);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const userId = localStorage.getItem('userId') || 'guest_user';

  useEffect(() => {
    fetch(`https://pinpro.onrender.com/api/clubs/${userId}`)
      .then((res) => res.json())
      .then((data) => setYardages(data))
      .catch((err) => console.error('Error fetching clubs:', err));
  }, [userId]);

  useEffect(() => {
    if ((window as any).google) {
      initAutocomplete();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://pinpro.onrender.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initAutocomplete;
    document.body.appendChild(script);
  }, []);

  const initAutocomplete = () => {
    if (!inputRef.current || !(window as any).google) return;

    const autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.name) {
        setCourseName(place.name);
      }
    });
  };

  const handleSuggest = () => {
    if (distance === null) return;

    if (distance <= 30) {
      setSuggestedClub('Putter');
      return;
    }

    const sorted = Object.entries(yardages)
      .filter(([, yards]) => typeof yards === 'number')
      .sort((a, b) => a[1] - b[1]);

    const club = sorted.find(([, yards]) => yards >= distance);
    const selectedClub = club
      ? club[0]
      : sorted.length > 0
        ? sorted[sorted.length - 1][0]
        : 'No clubs set';

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

    fetch('https://pinpro.onrender.com/api/rounds/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        totalHoles,
        shots: score,
        finalScore,
        par,
        shotData: shots,
        courseName,
        slopeRating,
        courseRating,
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

  if (selectingHoles) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f9f9f9]">
          <h1 className="text-4xl font-bold text-[#202334] mb-6 text-center">Start Your Round</h1>

          <div className="bg-white shadow-md rounded-xl p-6 w-full max-w-md mb-8 border border-gray-200">
            <h2 className="text-xl font-semibold text-[#202334] mb-4 text-center">📍 Course Details</h2>

            <label className="block text-left text-sm text-gray-600 mb-1">Course Name</label>
            <input
              ref={inputRef}
              type="text"
              placeholder="e.g. Pebble Beach"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="border border-gray-300 p-2 rounded mb-4 w-full shadow-sm"
            />

            <label className="block text-left text-sm text-gray-600 mb-1">Course Rating</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 70.2"
              value={courseRating}
              onChange={(e) => setCourseRating(Number(e.target.value))}
              className="border border-gray-300 p-2 rounded mb-4 w-full shadow-sm"
            />

            <label className="block text-left text-sm text-gray-600 mb-1">Slope Rating</label>
            <input
              type="number"
              placeholder="55–155"
              value={slopeRating}
              onChange={(e) => setSlopeRating(Number(e.target.value))}
              className="border border-gray-300 p-2 rounded w-full shadow-sm"
            />
          </div>

          <div className="flex gap-6">
            <button
              onClick={() => {
                setTotalHoles(9);
                setSelectingHoles(false);
              }}
              className="bg-black text-white px-6 py-3 rounded-full text-lg font-medium hover:bg-green-600 transition"
            >
              9 Holes
            </button>
            <button
              onClick={() => {
                setTotalHoles(18);
                setSelectingHoles(false);
              }}
              className="bg-black text-white px-6 py-3 rounded-full text-lg font-medium hover:bg-green-600 transition"
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
      <div className="min-h-screen p-6 flex flex-col items-center bg-[#f9f9f9]">
        <h1 className="text-3xl font-bold mb-2 text-center text-[#202334]">
          Hole {hole} of {totalHoles}
        </h1>
        <h2 className="text-md mb-6 text-gray-600 italic">Course: {courseName}</h2>

        {!roundFinished ? (
          <>
            <input
              type="number"
              placeholder="Distance to hole (yards)"
              value={distance ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setDistance(null);
                } else {
                  const parsed = parseInt(val, 10);
                  setDistance(isNaN(parsed) ? null : parsed);
                }
              }}
              className="border border-gray-300 p-3 rounded-lg w-80 text-center text-lg mb-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <button
              onClick={handleSuggest}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-lg mb-3 transition shadow"
            >
              Suggest Club
            </button>

            {suggestedClub && (
              <p className="text-lg mb-4 text-[#202334]">
                Suggested Club: <strong>{suggestedClub}</strong> 🏌️
              </p>
            )}

            <button
              onClick={handleTakeShot}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full text-lg mb-3 transition shadow"
            >
              Take Shot
            </button>

            <button
              onClick={handleNextHole}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-full text-lg mt-2 transition"
            >
              Next Hole
            </button>

            <button
              onClick={handleEndRound}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-lg mt-3 transition"
            >
              End Round
            </button>

            <div className="mt-8 w-full max-w-md bg-white p-4 rounded-xl border shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-center text-[#202334]">Shot History</h3>
              <ul className="list-disc list-inside text-left text-gray-700 space-y-1">
                {shots.map((shot, index) => (
                  <li key={index}>
                    Hole {index + 1}: <strong>{shot.distance} yards</strong> — {shot.club}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center mt-10 bg-white p-6 rounded-xl shadow border w-full max-w-lg">
            <h2 className="text-3xl font-bold text-green-600 mb-4">Round Complete!</h2>
            <p className="text-lg mb-2">Total Shots: <strong>{score}</strong></p>
            <p className="text-lg mb-2">Par: {totalHoles === 9 ? 36 : 72}</p>
            <p className="text-lg">
              Final Score:{' '}
              <span className={score - (totalHoles === 9 ? 36 : 72) >= 0 ? 'text-red-600' : 'text-green-600'}>
                {score - (totalHoles === 9 ? 36 : 72) >= 0
                  ? `+${score - (totalHoles === 9 ? 36 : 72)}`
                  : score - (totalHoles === 9 ? 36 : 72)}
              </span>
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default StartRound;
