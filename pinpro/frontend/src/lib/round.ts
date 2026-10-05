export type Shot = { hole: number; club: string; distance: number | null };

export type RoundSetup = {
  courseName: string;
  totalHoles: 9 | 18;
  par: number;
  courseRating: number;
  slopeRating: number;
};

export type RoundDraft = RoundSetup & { hole: number; shots: Shot[] };

export type SetupForm = {
  courseName: string;
  totalHoles: 9 | 18;
  par: string;
  courseRating: string;
  slopeRating: string;
};

export const defaultSetup = (totalHoles: 9 | 18): Omit<SetupForm, 'courseName'> => ({
  totalHoles,
  par: String(totalHoles * 4),
  courseRating: totalHoles === 18 ? '72.0' : '36.0',
  slopeRating: '113',
});

// Mirrors validateRound on the server so problems show next to the field before anything is sent.
export const validateSetup = (
  form: SetupForm
): { setup: RoundSetup | null; errors: Partial<Record<keyof SetupForm, string>> } => {
  const errors: Partial<Record<keyof SetupForm, string>> = {};
  const holes = form.totalHoles;
  const courseName = form.courseName.trim();
  const par = Number(form.par);
  const courseRating = Number(form.courseRating);
  const slopeRating = Number(form.slopeRating);

  if (!courseName) errors.courseName = 'Enter the course name.';
  else if (courseName.length > 100) errors.courseName = 'Keep the course name under 100 characters.';

  if (!/^\d+$/.test(form.par.trim()) || par < holes * 3 || par > holes * 5) {
    errors.par = `Par for ${holes} holes is between ${holes * 3} and ${holes * 5}.`;
  }
  if (!form.courseRating.trim() || !Number.isFinite(courseRating) || courseRating < 25 || courseRating > 85) {
    errors.courseRating = 'Course rating is usually 30–40 for 9 holes, 65–78 for 18.';
  }
  if (!/^\d+$/.test(form.slopeRating.trim()) || slopeRating < 55 || slopeRating > 155) {
    errors.slopeRating = 'Slope is a whole number from 55 to 155 (113 is average).';
  }

  if (Object.keys(errors).length > 0) return { setup: null, errors };
  return { setup: { courseName, totalHoles: holes, par, courseRating, slopeRating }, errors };
};

export const shotsOnHole = (draft: RoundDraft, hole: number) =>
  draft.shots.filter((s) => s.hole === hole);

// The in-progress round survives refreshes and a locked phone. Keyed by user so accounts never mix.
const draftKey = (userId: number) => `pinpro.round.${userId}`;

export const loadDraft = (userId: number): RoundDraft | null => {
  try {
    const raw = localStorage.getItem(draftKey(userId));
    const d = raw ? JSON.parse(raw) : null;
    if (d && (d.totalHoles === 9 || d.totalHoles === 18) && Array.isArray(d.shots) && Number.isInteger(d.hole)) {
      return d;
    }
  } catch {
    // corrupt or unavailable storage: start fresh
  }
  return null;
};

export const saveDraft = (userId: number, draft: RoundDraft) => {
  try {
    localStorage.setItem(draftKey(userId), JSON.stringify(draft));
  } catch {
    // storage full or blocked: the round still works, it just won't survive a refresh
  }
};

export const clearDraft = (userId: number) => {
  try {
    localStorage.removeItem(draftKey(userId));
  } catch {
    // ignore
  }
};
