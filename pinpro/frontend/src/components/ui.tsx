import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../lib/cx';
import { AlertIcon, CheckIcon, InfoIcon } from './icons';


type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const variants: Record<Variant, string> = {
  primary: 'bg-fairway text-white hover:bg-fairway-dark shadow-sm',
  secondary: 'bg-white text-navy border border-slate-300 hover:border-slate-400 hover:bg-slate-50',
  ghost: 'text-slate-700 hover:bg-slate-100',
  danger: 'text-red-700 border border-red-200 bg-white hover:bg-red-50',
};

export const Button = ({
  variant = 'primary',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) => (
  <button
    {...props}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={cx(
      'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-base font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
      variants[variant],
      className
    )}
  >
    {loading && <Spinner className="h-4 w-4" />}
    {children}
  </button>
);

export const Spinner = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <span
    aria-hidden
    className={cx('inline-block animate-spin rounded-full border-2 border-current border-r-transparent', className)}
  />
);

export const Loading = ({ label = 'Loading…' }: { label?: string }) => (
  <div role="status" className="flex items-center justify-center gap-3 py-16 text-slate-600">
    <Spinner className="h-5 w-5 text-fairway" />
    {label}
  </div>
);

export const Card = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cx('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6', className)}>
    {children}
  </div>
);

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string | null;
  inputClassName?: string;
};

export const Input = ({ label, hint, error, className, inputClassName, ...props }: InputProps) => {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        {...props}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(
          'block min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 transition-colors',
          error ? 'border-red-500' : 'border-slate-300 hover:border-slate-400',
          inputClassName
        )}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-slate-500">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-sm text-red-700">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

type Tone = 'error' | 'success' | 'info';
const tones: Record<Tone, { box: string; Icon: typeof AlertIcon }> = {
  error: { box: 'border-red-200 bg-red-50 text-red-800', Icon: AlertIcon },
  success: { box: 'border-green-200 bg-fairway-soft text-fairway-dark', Icon: CheckIcon },
  info: { box: 'border-slate-200 bg-slate-50 text-slate-700', Icon: InfoIcon },
};

export const Alert = ({
  tone = 'info',
  children,
  action,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) => {
  const { box, Icon } = tones[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx('flex flex-wrap items-start gap-3 rounded-xl border px-4 py-3 text-sm', box, className)}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
};

export const EmptyState = ({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) => (
  <div className="flex flex-col items-center px-4 py-10 text-center">
    <div className="mb-4 rounded-full bg-fairway-soft p-3 text-fairway">{icon}</div>
    <h3 className="text-lg font-semibold text-navy">{title}</h3>
    {children && <p className="mt-1 max-w-sm text-slate-600">{children}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const PageHeader = ({ title, children, eyebrow }: { title: string; children?: ReactNode; eyebrow?: string }) => (
  <header className="mb-6 sm:mb-8">
    {eyebrow && <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-fairway">{eyebrow}</p>}
    <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">{title}</h1>
    {children && <p className="mt-2 max-w-2xl text-base text-slate-600 sm:text-lg">{children}</p>}
  </header>
);

