import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import RoundPlay, { type SavedRound } from '../components/RoundPlay';
import { CheckIcon } from '../components/icons';
import { Alert, Button, Card, Input, PageHeader } from '../components/ui';
import { formatToPar, type Yardages } from '../lib/golf';
import {
  clearDraft,
  defaultSetup,
  loadDraft,
  saveDraft,
  validateSetup,
  type RoundDraft,
  type RoundSetup,
  type SetupForm,
} from '../lib/round';
import { useSession } from '../lib/session';
import { useApi } from '../lib/useApi';
import { usePageTitle } from '../lib/usePageTitle';
import { cx } from '../lib/cx';

// Attaches Google Places autocomplete when the Maps script is available; typing always works without it.
const useCourseAutocomplete = (onPick: (name: string) => void) => {
  const ref = useRef<HTMLInputElement>(null);
  const pick = useRef(onPick);
  pick.current = onPick;

  useEffect(() => {
    const attach = () => {
      const Autocomplete = window.google?.maps?.places?.Autocomplete;
      if (!Autocomplete || !ref.current) return;
      const ac = new Autocomplete(ref.current, { types: ['establishment'] });
      ac.addListener('place_changed', () => {
        const name = ac.getPlace().name;
        if (name) pick.current(name);
      });
    };
    if (window.google?.maps?.places) return attach();
    const script = document.getElementById('google-maps-script');
    script?.addEventListener('load', attach, { once: true });
    return () => script?.removeEventListener('load', attach);
  }, []);
  return ref;
};

const SetupRound = ({ onStart }: { onStart: (setup: RoundSetup) => void }) => {
  const [form, setForm] = useState<SetupForm>({ courseName: '', ...defaultSetup(18) });
  const [errors, setErrors] = useState<ReturnType<typeof validateSetup>['errors']>({});
  const courseRef = useCourseAutocomplete((courseName) => setForm((f) => ({ ...f, courseName })));

  const set = (field: keyof SetupForm) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const chooseHoles = (holes: 9 | 18) =>
    setForm((f) => ({ ...f, ...defaultSetup(holes), slopeRating: f.slopeRating }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validateSetup(form);
    setErrors(result.errors);
    if (result.setup) onStart(result.setup);
    else document.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
  };

  return (
    <>
      <PageHeader title="Play a round">
        Tell PinPro where you’re playing. Ratings are printed on the scorecard; the defaults are fine if you don’t
        know them, but your handicap estimate will be less accurate.
      </PageHeader>
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div>
            <label htmlFor="course" className="mb-1.5 block text-sm font-medium text-slate-700">
              Course name <span className="text-red-700" aria-hidden>*</span>
            </label>
            <input
              id="course"
              ref={courseRef}
              required
              autoComplete="off"
              placeholder="e.g. Pebble Beach Golf Links"
              value={form.courseName}
              onChange={set('courseName')}
              aria-invalid={errors.courseName ? true : undefined}
              aria-describedby={errors.courseName ? 'course-error' : undefined}
              className={cx(
                'block min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-base',
                errors.courseName ? 'border-red-500' : 'border-slate-300 hover:border-slate-400'
              )}
            />
            {errors.courseName && <p id="course-error" className="mt-1.5 text-sm text-red-700">{errors.courseName}</p>}
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-slate-700">Holes</legend>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              {([9, 18] as const).map((holes) => (
                <label
                  key={holes}
                  className={cx(
                    'flex min-h-11 cursor-pointer items-center justify-center rounded-lg font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-fairway',
                    form.totalHoles === holes ? 'bg-white text-navy shadow-sm' : 'text-slate-600 hover:text-navy'
                  )}
                >
                  <input
                    type="radio"
                    name="holes"
                    value={holes}
                    checked={form.totalHoles === holes}
                    onChange={() => chooseHoles(holes)}
                    className="sr-only"
                  />
                  {holes} holes
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-3">
            <Input label="Par" inputMode="numeric" value={form.par} onChange={set('par')} error={errors.par} />
            <Input
              label="Course rating"
              inputMode="decimal"
              value={form.courseRating}
              onChange={set('courseRating')}
              error={errors.courseRating}
            />
            <Input
              label="Slope rating"
              inputMode="numeric"
              value={form.slopeRating}
              onChange={set('slopeRating')}
              error={errors.slopeRating}
            />
          </div>

          <Button type="submit" className="w-full sm:w-auto">Start round</Button>
        </form>
      </Card>
    </>
  );
};

type Finished = SavedRound & Pick<RoundDraft, 'courseName' | 'totalHoles' | 'par'>;

const RoundComplete = ({ round, onNew }: { round: Finished; onNew: () => void }) => (
  <Card className="mx-auto max-w-lg text-center sm:p-10">
    <div className="mx-auto mb-4 w-fit rounded-full bg-fairway-soft p-3 text-fairway">
      <CheckIcon className="h-8 w-8" />
    </div>
    <h1 className="text-3xl font-bold tracking-tight text-navy">Round saved</h1>
    <p className="mt-1 text-slate-600">{round.courseName} · {round.totalHoles} holes</p>
    <dl className="mt-8 grid grid-cols-3 gap-3">
      {[
        ['Strokes', String(round.shots)],
        ['Par', String(round.par)],
        ['To par', formatToPar(round.finalScore)],
      ].map(([label, value]) => (
        <div key={label} className="rounded-xl bg-slate-50 py-4">
          <dt className="text-sm text-slate-500">{label}</dt>
          <dd className="mt-1 text-2xl font-bold text-navy">{value}</dd>
        </div>
      ))}
    </dl>
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Link
        to="/profile"
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-fairway px-5 font-semibold text-white hover:bg-fairway-dark"
      >
        See your stats
      </Link>
      <Button variant="secondary" onClick={onNew}>Play another round</Button>
    </div>
  </Card>
);

const StartRound = () => {
  usePageTitle('Play a round');
  const userId = useSession()!.user.id; // this page only renders for signed-in users
  const [draft, setDraft] = useState<RoundDraft | null>(() => loadDraft(userId));
  const [resumed] = useState(() => draft !== null && draft.shots.length > 0);
  const [finished, setFinished] = useState<Finished | null>(null);
  const clubs = useApi<{ clubs: Yardages }>('/api/clubs');

  useEffect(() => {
    if (draft) saveDraft(userId, draft);
  }, [draft, userId]);

  if (finished) return <RoundComplete round={finished} onNew={() => setFinished(null)} />;
  if (!draft) return <SetupRound onStart={(setup) => setDraft({ ...setup, hole: 1, shots: [] })} />;

  return (
    <>
      {resumed && <Alert className="mb-5">Picked up where you left off.</Alert>}
      <RoundPlay
        draft={draft}
        setDraft={setDraft}
        yardages={clubs.data?.clubs ?? null}
        clubsError={clubs.error}
        onRetryClubs={clubs.reload}
        onSaved={(saved) => {
          clearDraft(userId);
          setFinished({ ...saved, courseName: draft.courseName, totalHoles: draft.totalHoles, par: draft.par });
          setDraft(null);
        }}
        onAbandon={() => {
          clearDraft(userId);
          setDraft(null);
        }}
      />
    </>
  );
};

export default StartRound;
