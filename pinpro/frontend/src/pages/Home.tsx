import { Link } from 'react-router-dom';
import { BagIcon, ChartIcon, FlagIcon, TargetIcon } from '../components/icons';
import { Alert, Button, Card } from '../components/ui';
import { CLUBS, formatHandicap, type Yardages } from '../lib/golf';
import { loadDraft } from '../lib/round';
import type { RoundsResponse } from '../lib/rounds';
import { useSession } from '../lib/session';
import { useApi } from '../lib/useApi';
import { usePageTitle } from '../lib/usePageTitle';


const primaryLink =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-fairway px-6 text-lg font-semibold text-white shadow-sm hover:bg-fairway-dark';
const secondaryLink =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/25 px-6 text-lg font-semibold text-white hover:bg-white/10';

const STEPS = [
  { Icon: BagIcon, title: 'Save your yardages', text: 'Enter how far you carry each club. Leave out clubs you don’t use.' },
  { Icon: TargetIcon, title: 'Get a club pick', text: 'Type the distance to the pin and PinPro picks from your own numbers.' },
  { Icon: ChartIcon, title: 'Track your rounds', text: 'Record shots hole by hole and watch your scores and handicap estimate.' },
];

const Home = () => {
  usePageTitle('Home');
  const { user } = useSession()!;
  const clubs = useApi<{ clubs: Yardages }>('/api/clubs');
  const rounds = useApi<RoundsResponse>('/api/rounds');
  const draft = loadDraft(user.id);

  const clubCount = clubs.data ? Object.keys(clubs.data.clubs).length : null;
  const needsClubs = clubCount === 0;
  const handicap = rounds.data?.handicap.value;
  const name = user.username.includes('@') ? user.username.split('@')[0] : user.username;

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl bg-navy px-6 py-10 text-white shadow-lg sm:px-10 sm:py-14">
        {/* Subtle fairway stripes */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-[0.07] sm:block"
          style={{ backgroundImage: 'repeating-linear-gradient(135deg, #fff 0 28px, transparent 28px 56px)' }}
        />
        <p className="text-sm font-semibold uppercase tracking-wide text-green-300">Welcome back, {name}</p>
        <h1 className="mt-2 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          {draft ? 'Your round is waiting.' : needsClubs ? 'Let’s set up your bag.' : 'Ready for your next round?'}
        </h1>
        <p className="mt-4 max-w-lg text-lg text-slate-300">
          {draft
            ? `You’re on hole ${draft.hole} of ${draft.totalHoles} at ${draft.courseName}.`
            : needsClubs
              ? 'Add your club distances first so PinPro can suggest the right club on the course.'
              : 'Pick a course, record your shots and get club suggestions from your own yardages.'}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {draft ? (
            <Link to="/start" className={primaryLink}><FlagIcon /> Resume round</Link>
          ) : needsClubs ? (
            <>
              <Link to="/setup" className={primaryLink}><BagIcon /> Set up clubs</Link>
              <Link to="/start" className={secondaryLink}>Play without suggestions</Link>
            </>
          ) : (
            <Link to="/start" className={primaryLink}><FlagIcon /> Start a round</Link>
          )}
        </div>
      </section>

      {(clubs.error || rounds.error) && (
        <Alert
          tone="error"
          className="mt-6"
          action={<Button variant="secondary" onClick={() => { clubs.reload(); rounds.reload(); }}>Retry</Button>}
        >
          Some of your data didn’t load. {clubs.error || rounds.error}
        </Alert>
      )}

      <section aria-label="Summary" className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { to: '/setup', label: 'Clubs saved', value: clubCount === null ? '…' : `${clubCount} / ${CLUBS.length}` },
          { to: '/profile', label: 'Rounds played', value: rounds.data ? String(rounds.data.rounds.length) : '…' },
          {
            to: '/profile',
            label: 'Handicap estimate',
            value: rounds.data ? (handicap == null ? '—' : formatHandicap(handicap)) : '…',
          },
        ].map((s) => (
          <Link key={s.label} to={s.to} className="group rounded-2xl">
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-navy">{s.value}</p>
            </Card>
          </Link>
        ))}
      </section>

      <section className="mt-12" aria-labelledby="how">
        <h2 id="how" className="text-xl font-semibold text-navy">How PinPro works</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li key={title}>
              <Card className="h-full">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-fairway-soft p-2 text-fairway"><Icon /></span>
                  <span className="text-sm font-semibold text-slate-500">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold text-navy">{title}</h3>
                <p className="mt-1 text-slate-600">{text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
};

export default Home;
