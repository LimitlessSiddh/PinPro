import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, Loading, PageHeader } from '../components/ui';
import { apiFetch, errorMessage } from '../lib/api';
import { CLUB_GROUPS, CLUBS, parseYards, type Yardages } from '../lib/golf';
import { useApi } from '../lib/useApi';
import { usePageTitle } from '../lib/usePageTitle';

type Form = Record<string, string>;

const toForm = (clubs: Yardages): Form =>
  Object.fromEntries(CLUBS.map((c) => [c, clubs[c] ? String(clubs[c]) : '']));

const Setup = () => {
  usePageTitle('Your clubs');
  const [params] = useSearchParams();
  const welcome = params.get('welcome') === '1';
  const { data, error: loadError, loading, reload } = useApi<{ clubs: Yardages }>('/api/clubs');

  const [form, setForm] = useState<Form>(() => toForm({}));
  const [saved, setSaved] = useState<Form>(() => toForm({}));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!data) return;
    const loaded = toForm(data.clubs);
    setForm(loaded);
    setSaved(loaded);
  }, [data]);

  const errors = useMemo(
    () => Object.fromEntries(CLUBS.map((c) => [c, parseYards(form[c], { optional: true }).error])),
    [form]
  );
  const dirty = CLUBS.some((c) => form[c].trim() !== saved[c]);
  const filled = CLUBS.filter((c) => form[c].trim() !== '').length;
  const savedCount = CLUBS.filter((c) => saved[c] !== '').length;

  const persist = async (next: Form, message: string) => {
    const clubs: Yardages = {};
    for (const c of CLUBS) {
      const { value } = parseYards(next[c], { optional: true });
      if (value) clubs[c] = value;
    }
    setSaving(true);
    setStatus(null);
    try {
      await apiFetch('/api/clubs', { method: 'PUT', body: { clubs } });
      const normalised = toForm(clubs);
      setForm(normalised);
      setSaved(normalised);
      setTouched({});
      setStatus({ tone: 'success', text: message });
    } catch (err) {
      setStatus({ tone: 'error', text: `Not saved: ${errorMessage(err)}` });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (CLUBS.some((c) => errors[c])) {
      setTouched(Object.fromEntries(CLUBS.map((c) => [c, true])));
      setStatus({ tone: 'error', text: 'Fix the highlighted distances before saving.' });
      document.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    persist(form, `Saved ${filled} ${filled === 1 ? 'club' : 'clubs'}.`);
  };

  const handleClear = () => {
    if (!window.confirm('Clear all saved club distances? This can’t be undone.')) return;
    persist(toForm({}), 'All club distances cleared.');
  };

  if (loading && !data) return <Loading label="Loading your clubs…" />;

  if (loadError && !data) {
    return (
      <>
        <PageHeader title="Your clubs" />
        <Alert tone="error" action={<Button variant="secondary" onClick={reload}>Try again</Button>}>
          Couldn’t load your clubs. {loadError}
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Your clubs" eyebrow={welcome ? 'Step 1 of 2' : undefined}>
        Enter your typical carry distance for each club you use. PinPro suggests clubs from these numbers, so
        leave out clubs you don’t carry.
      </PageHeader>

      {welcome && savedCount === 0 && (
        <Alert tone="success" className="mb-6">
          Account created. Add a few distances, save, then start your first round.
        </Alert>
      )}

      <form onSubmit={handleSave} noValidate>
        <div className="grid gap-5 lg:grid-cols-3">
          {CLUB_GROUPS.map((group) => (
            <Card key={group.label}>
              <fieldset>
                <legend className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {group.label}
                </legend>
                <div className="space-y-3">
                  {group.clubs.map((club) => {
                    const id = `club-${club.replace(/\s+/g, '-')}`;
                    const showError = touched[club] && errors[club];
                    return (
                      <div key={club}>
                        <div className="flex items-center justify-between gap-3">
                          <label htmlFor={id} className="font-medium text-slate-800">{club}</label>
                          <div className="relative w-28 shrink-0">
                            <input
                              id={id}
                              inputMode="numeric"
                              autoComplete="off"
                              placeholder="—"
                              value={form[club]}
                              onChange={(e) => setForm((f) => ({ ...f, [club]: e.target.value }))}
                              onBlur={() => setTouched((t) => ({ ...t, [club]: true }))}
                              aria-invalid={showError ? true : undefined}
                              aria-describedby={showError ? `${id}-error` : undefined}
                              className={`min-h-11 w-full rounded-lg border bg-white py-2 pl-3 pr-11 text-right text-base text-slate-900 ${
                                showError ? 'border-red-500' : 'border-slate-300 hover:border-slate-400'
                              }`}
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">
                              yds
                            </span>
                          </div>
                        </div>
                        {showError && (
                          <p id={`${id}-error`} className="mt-1 text-right text-sm text-red-700">{errors[club]}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            </Card>
          ))}
        </div>

        <div className="sticky bottom-20 z-10 mt-6 md:static">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center md:shadow-sm">
            <p className="flex-1 text-sm text-slate-600" aria-live="polite">
              {dirty ? 'You have unsaved changes.' : `${filled} of ${CLUBS.length} clubs set.`}
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="danger" onClick={handleClear} disabled={saving || filled === 0}>
                Clear all
              </Button>
              <Button type="submit" loading={saving} disabled={!dirty} className="flex-1 sm:flex-none">
                Save clubs
              </Button>
            </div>
          </div>
          {status && (
            <Alert
              tone={status.tone}
              className="mt-3"
              action={
                status.tone === 'success' && !dirty && filled > 0 ? (
                  <Link to="/start" className="font-semibold underline underline-offset-4">Start a round</Link>
                ) : undefined
              }
            >
              {status.text}
            </Alert>
          )}
        </div>
      </form>
    </>
  );
};

export default Setup;
