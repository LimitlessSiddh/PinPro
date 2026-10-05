import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ChartIcon, FlagIcon } from '../components/icons';
import { Alert, Button, Card, EmptyState, Loading, PageHeader } from '../components/ui';
import { formatHandicap, formatToPar } from '../lib/golf';
import { statsFor, type RoundsResponse } from '../lib/rounds';
import { useSession } from '../lib/session';
import { useApi } from '../lib/useApi';
import { usePageTitle } from '../lib/usePageTitle';

const ScoreChart = lazy(() => import('../components/ScoreChart'));

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const Stat = ({ label, value, note }: { label: string; value: string; note?: string }) => (
  <Card className="sm:p-5">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-1 text-3xl font-bold tracking-tight text-navy">{value}</p>
    {note && <p className="mt-1 text-sm text-slate-500">{note}</p>}
  </Card>
);

const Profile = () => {
  usePageTitle('Profile');
  const username = useSession()!.user.username;
  const { data, error, loading, reload } = useApi<RoundsResponse>('/api/rounds');

  if (loading && !data) return <Loading label="Loading your rounds…" />;
  if (error && !data) {
    return (
      <>
        <PageHeader title="Your game" />
        <Alert tone="error" action={<Button variant="secondary" onClick={reload}>Try again</Button>}>
          Couldn’t load your rounds. {error}
        </Alert>
      </>
    );
  }

  const { rounds, handicap } = data!;
  const eighteen = statsFor(rounds, 18);
  const nine = statsFor(rounds, 9);
  const needed = handicap.minimumRounds - handicap.roundsConsidered;

  return (
    <>
      <PageHeader title="Your game" eyebrow={username} />

      <section aria-label="Stats" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat
          label="Handicap estimate"
          value={handicap.value === null ? '—' : formatHandicap(handicap.value)}
          note={
            handicap.value === null
              ? `Play ${needed} more 18-hole ${needed === 1 ? 'round' : 'rounds'}`
              : `Best ${handicap.roundsUsed} of last ${handicap.roundsConsidered} rounds`
          }
        />
        <Stat
          label="Rounds played"
          value={String(rounds.length)}
          note={rounds.length ? `${eighteen?.count ?? 0} × 18 · ${nine?.count ?? 0} × 9` : undefined}
        />
        <Stat
          label="Best 18"
          value={eighteen ? formatToPar(eighteen.best) : '—'}
          note={nine ? `Best 9: ${formatToPar(nine.best)}` : undefined}
        />
        <Stat
          label="Average 18"
          value={eighteen ? formatToPar(eighteen.average) : '—'}
          note={nine ? `Average 9: ${formatToPar(nine.average)}` : undefined}
        />
      </section>
      <p className="mt-3 text-sm text-slate-500">
        The handicap is an estimate using the World Handicap System’s “best of last 20” method on your 18-hole
        rounds. It isn’t an official Handicap Index.
      </p>

      {rounds.length === 0 ? (
        <Card className="mt-8">
          <EmptyState
            icon={<FlagIcon className="h-6 w-6" />}
            title="No rounds yet"
            action={
              <Link to="/start" className="inline-flex min-h-11 items-center rounded-lg bg-fairway px-5 font-semibold text-white hover:bg-fairway-dark">
                Play your first round
              </Link>
            }
          >
            Finish a round and your scores, history and handicap estimate show up here.
          </EmptyState>
        </Card>
      ) : (
        <>
          <Card className="mt-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
              <ChartIcon className="h-5 w-5 text-fairway" /> Score to par
            </h2>
            {rounds.length < 2 ? (
              <p className="mt-3 text-slate-600">Play one more round to see your trend.</p>
            ) : (
              <div className="mt-4 h-64">
                <Suspense fallback={<Loading label="Loading chart…" />}>
                  <ScoreChart rounds={rounds.slice(0, 20)} />
                </Suspense>
              </div>
            )}
          </Card>

          <section className="mt-8" aria-labelledby="history">
            <h2 id="history" className="mb-4 text-xl font-semibold text-navy">Round history</h2>

            {/* Phones: cards */}
            <ul className="space-y-3 md:hidden">
              {rounds.map((r) => (
                <li key={r.id}>
                  <Card className="flex items-center justify-between gap-4 sm:p-5">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{r.course_name || 'Unnamed course'}</p>
                      <p className="text-sm text-slate-500">
                        {formatDate(r.created_at)} · {r.total_holes} holes · {r.shots} strokes
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-navy" aria-label={`${formatToPar(r.final_score)} to par`}>
                      {formatToPar(r.final_score)}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>

            {/* Larger screens: table */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-sm text-slate-600">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">Date</th>
                    <th scope="col" className="px-5 py-3 font-medium">Course</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">Holes</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">Strokes</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">Par</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">To par</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rounds.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">{formatDate(r.created_at)}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{r.course_name || 'Unnamed course'}</td>
                      <td className="px-5 py-3 text-right">{r.total_holes}</td>
                      <td className="px-5 py-3 text-right">{r.shots}</td>
                      <td className="px-5 py-3 text-right">{r.par}</td>
                      <td className="px-5 py-3 text-right font-semibold text-navy">{formatToPar(r.final_score)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
};

export default Profile;
