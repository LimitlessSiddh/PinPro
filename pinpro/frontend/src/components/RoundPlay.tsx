import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, errorMessage } from '../lib/api';
import { CLUBS, parseYards, suggestClub, type Suggestion, type Yardages } from '../lib/golf';
import { shotsOnHole, type RoundDraft, type Shot } from '../lib/round';
import { TargetIcon } from './icons';
import { Alert, Button, Card } from './ui';
import { cx } from '../lib/cx';

export type SavedRound = { id: number; shots: number; finalScore: number };

type Props = {
  draft: RoundDraft;
  setDraft: (d: RoundDraft) => void;
  yardages: Yardages | null; // null while loading or if loading failed
  clubsError: string | null;
  onRetryClubs: () => void;
  onSaved: (round: SavedRound) => void;
  onAbandon: () => void;
};

const SuggestionText = ({ s }: { s: Suggestion }) => {
  if (s.kind === 'short') {
    return <>Inside 30 yards: <strong>chip or putt</strong>, depending on your lie.</>;
  }
  if (s.kind === 'max') {
    return (
      <><strong>{s.club}</strong>: your longest club ({s.yards} yds). It won’t reach, so plan a layup or a second shot.</>
    );
  }
  return <><strong>{s.club}</strong>: your {s.yards} yd club, the shortest that carries this distance.</>;
};

const RoundPlay = ({ draft, setDraft, yardages, clubsError, onRetryClubs, onSaved, onAbandon }: Props) => {
  const [distance, setDistance] = useState('');
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [club, setClub] = useState('');
  const [holeError, setHoleError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const holeShots = shotsOnHole(draft, draft.hole);
  const isLastHole = draft.hole === draft.totalHoles;
  const hasClubs = yardages !== null && Object.keys(yardages).length > 0;
  const progress = ((draft.hole - 1) / draft.totalHoles) * 100;

  const handleSuggest = (e: FormEvent) => {
    e.preventDefault();
    const { value, error } = parseYards(distance, { max: 700 });
    setDistanceError(error);
    if (value === null || !yardages) return setSuggestion(null);
    const s = suggestClub(value, yardages);
    setSuggestion(s);
    if (s?.kind === 'fit' || s?.kind === 'max') setClub(s.club);
  };

  const record = (shot: Omit<Shot, 'hole'>) => {
    setDraft({ ...draft, shots: [...draft.shots, { ...shot, hole: draft.hole }] });
    setDistance('');
    setDistanceError(null);
    setSuggestion(null);
    setHoleError(null);
  };

  const handleRecord = () => {
    if (!club) return setHoleError('Choose the club you hit.');
    const { value, error } = parseYards(distance, { max: 700, optional: true });
    if (error) return setDistanceError(error);
    record({ club, distance: value });
  };

  const undo = () => {
    const index = draft.shots.map((s) => s.hole).lastIndexOf(draft.hole);
    if (index >= 0) setDraft({ ...draft, shots: draft.shots.filter((_, i) => i !== index) });
  };

  const save = async () => {
    if (saving) return; // no double submits
    setSaving(true);
    setSaveError(null);
    try {
      const { courseName, totalHoles, par, courseRating, slopeRating, shots } = draft;
      const saved = await apiFetch<SavedRound>('/api/rounds', {
        method: 'POST',
        body: { courseName, totalHoles, par, courseRating, slopeRating, shotData: shots },
      });
      onSaved(saved);
    } catch (err) {
      setSaveError(errorMessage(err));
      setSaving(false);
    }
  };

  const next = () => {
    if (holeShots.length === 0) return setHoleError(`Record at least one shot on hole ${draft.hole} first.`);
    if (isLastHole) return save();
    setDraft({ ...draft, hole: draft.hole + 1 });
    setClub('');
  };

  const confirmAbandon = () => {
    if (window.confirm('Abandon this round? Your shots won’t be saved.')) onAbandon();
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-5">
        {/* Hole header */}
        <section aria-label="Current hole" className="rounded-2xl bg-navy p-5 text-white shadow-md sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm text-slate-300">{draft.courseName}</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Hole {draft.hole} <span className="text-lg font-medium text-slate-400">of {draft.totalHoles}</span>
              </h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-300">Strokes</p>
              <p className="text-3xl font-bold">{holeShots.length}</p>
            </div>
          </div>
          <div
            className="mt-5 h-2 overflow-hidden rounded-full bg-white/15"
            role="progressbar"
            aria-label="Round progress"
            aria-valuemin={0}
            aria-valuemax={draft.totalHoles}
            aria-valuenow={draft.hole - 1}
          >
            <div className="h-full rounded-full bg-green-400 transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-300">
            {draft.shots.length} total strokes · par {draft.par}
          </p>
        </section>

        {/* Suggestion */}
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
            <TargetIcon className="h-5 w-5 text-fairway" /> Club suggestion
          </h2>
          {clubsError ? (
            <Alert tone="error" className="mt-4" action={<Button variant="secondary" onClick={onRetryClubs}>Retry</Button>}>
              Couldn’t load your clubs, so suggestions are unavailable. You can still record shots.
            </Alert>
          ) : yardages !== null && !hasClubs ? (
            <Alert className="mt-4">
              You haven’t saved any club distances yet.{' '}
              <Link to="/setup" className="font-semibold text-fairway underline underline-offset-4">Add your clubs</Link>{' '}
              to get suggestions. Your round stays saved on this device.
            </Alert>
          ) : (
            <form onSubmit={handleSuggest} noValidate className="mt-4">
              <label htmlFor="distance" className="mb-1.5 block text-sm font-medium text-slate-700">
                Distance to the pin
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    id="distance"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="e.g. 150"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    aria-invalid={distanceError ? true : undefined}
                    aria-describedby={distanceError ? 'distance-error' : undefined}
                    className={cx(
                      'min-h-12 w-full rounded-lg border bg-white py-2 pl-3 pr-12 text-lg',
                      distanceError ? 'border-red-500' : 'border-slate-300'
                    )}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">yds</span>
                </div>
                <Button type="submit" variant="secondary" disabled={yardages === null}>Suggest</Button>
              </div>
              {distanceError && <p id="distance-error" className="mt-1.5 text-sm text-red-700">{distanceError}</p>}
              {suggestion && (
                <div className="mt-4 rounded-xl bg-fairway-soft px-4 py-3 text-fairway-dark" role="status">
                  <SuggestionText s={suggestion} />
                </div>
              )}
            </form>
          )}
        </Card>

        {/* Record */}
        <Card>
          <h2 className="text-lg font-semibold text-navy">Record a shot</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label htmlFor="club" className="sr-only">Club</label>
              <select
                id="club"
                value={club}
                onChange={(e) => setClub(e.target.value)}
                className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base"
              >
                <option value="">Choose club…</option>
                {CLUBS.map((c) => (
                  <option key={c} value={c}>
                    {c}{yardages?.[c] ? ` (${yardages[c]} yds)` : ''}
                  </option>
                ))}
                <option value="Putter">Putter</option>
              </select>
            </div>
            <Button onClick={handleRecord}>Record shot</Button>
            <Button variant="secondary" onClick={() => record({ club: 'Putter', distance: null })}>+ Putt</Button>
          </div>
          {holeError && <Alert tone="error" className="mt-3">{holeError}</Alert>}

          {holeShots.length > 0 && (
            <ol className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
              {holeShots.map((s, i) => (
                <li key={i} className="flex items-center justify-between py-2.5">
                  <span>
                    <span className="mr-3 text-sm text-slate-500">Shot {i + 1}</span>
                    <span className="font-medium text-slate-800">{s.club}</span>
                  </span>
                  <span className="text-sm text-slate-500">{s.distance ? `${s.distance} yds out` : ''}</span>
                </li>
              ))}
            </ol>
          )}
          {holeShots.length > 0 && (
            <button type="button" onClick={undo} className="mt-2 min-h-11 text-sm font-medium text-slate-600 underline underline-offset-4">
              Undo last shot
            </button>
          )}
        </Card>
      </div>

      {/* Scorecard + actions */}
      <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <h2 className="text-lg font-semibold text-navy">Scorecard</h2>
          <ol className="mt-4 grid grid-cols-9 gap-1.5 text-center">
            {Array.from({ length: draft.totalHoles }, (_, i) => {
              const hole = i + 1;
              const strokes = shotsOnHole(draft, hole).length;
              return (
                <li
                  key={hole}
                  aria-current={hole === draft.hole ? 'step' : undefined}
                  className={cx(
                    'rounded-md border py-1',
                    hole === draft.hole ? 'border-fairway bg-fairway-soft' : 'border-slate-200'
                  )}
                >
                  <span className="block text-[11px] text-slate-500">{hole}</span>
                  <span className="block text-sm font-semibold text-slate-800">{strokes || '–'}</span>
                </li>
              );
            })}
          </ol>
        </Card>

        {saveError && (
          <Alert tone="error" action={<Button variant="secondary" onClick={save}>Retry</Button>}>
            Round not saved yet: {saveError} Your shots are kept on this device.
          </Alert>
        )}

        <div className="flex flex-col gap-3">
          <Button onClick={next} loading={saving} className="w-full py-3 text-lg">
            {isLastHole ? 'Finish & save round' : `Next hole →`}
          </Button>
          <div className="flex gap-3">
            {draft.hole > 1 && (
              <Button variant="ghost" className="flex-1" onClick={() => setDraft({ ...draft, hole: draft.hole - 1 })} disabled={saving}>
                ← Previous hole
              </Button>
            )}
            <Button variant="danger" className="flex-1" onClick={confirmAbandon} disabled={saving}>
              Abandon round
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundPlay;
