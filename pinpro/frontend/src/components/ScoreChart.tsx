import { CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatToPar } from '../lib/golf';
import type { Round } from '../lib/rounds';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// `rounds` arrive newest first; the chart reads left to right, oldest to newest.
const ScoreChart = ({ rounds }: { rounds: Round[] }) => {
  const ordered = [...rounds].reverse();
  const label = (r: Round) => new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <Line
      aria-label={`Score to par for your last ${ordered.length} rounds, oldest to newest: ${ordered
        .map((r) => formatToPar(r.final_score))
        .join(', ')}`}
      role="img"
      data={{
        labels: ordered.map(label),
        datasets: [
          {
            label: 'Score to par',
            data: ordered.map((r) => r.final_score),
            borderColor: '#166534',
            backgroundColor: '#166534',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.25,
          },
        ],
      }}
      options={{
        animation: reducedMotion ? false : undefined,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const r = ordered[ctx.dataIndex];
                return `${formatToPar(r.final_score)} (${r.shots} strokes, ${r.total_holes} holes)`;
              },
            },
          },
        },
        scales: {
          y: { ticks: { callback: (v) => formatToPar(Number(v)) }, grid: { color: '#e2e8f0' } },
          x: { grid: { display: false } },
        },
      }}
    />
  );
};

export default ScoreChart;
