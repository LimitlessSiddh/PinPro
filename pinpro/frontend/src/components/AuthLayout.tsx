import type { ReactNode } from 'react';
import { BagIcon, ChartIcon, TargetIcon } from './icons';
import Logo from './Logo';

const FEATURES = [
  { Icon: BagIcon, text: 'Save how far you hit every club.' },
  { Icon: TargetIcon, text: 'Get a club pick for any distance, based on your own yardages.' },
  { Icon: ChartIcon, text: 'Track rounds and an estimated handicap over time.' },
];

const AuthLayout = ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => (
  <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
    <aside className="bg-navy px-6 py-8 text-slate-300 sm:px-10 lg:flex lg:flex-col lg:justify-between lg:py-12">
      <Logo light />
      <div className="mt-6 lg:mt-0">
        <h2 className="max-w-md text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
          Know your numbers. Pick the right club.
        </h2>
        <ul className="mt-8 hidden space-y-4 lg:block">
          {FEATURES.map(({ Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="rounded-lg bg-white/10 p-2 text-green-300">
                <Icon className="h-5 w-5" />
              </span>
              <span className="pt-1.5">{text}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="hidden text-sm text-slate-400 lg:block">A personal golf caddy for the course.</p>
    </aside>

    <main className="flex items-start justify-center px-4 py-10 sm:px-6 lg:items-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold tracking-tight text-navy">{title}</h1>
        <p className="mt-2 text-slate-600">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  </div>
);

export default AuthLayout;
