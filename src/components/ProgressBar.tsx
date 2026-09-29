interface Props {
  value: number;
  max: number;
  warnAt: number;
  dangerAt: number;
}

/** Voortgangsbalk die van kleur wisselt: groen → oranje (warnAt) → rood (dangerAt). */
export default function ProgressBar({ value, max, warnAt, dangerAt }: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const cls =
    value >= dangerAt ? 'progress__bar--danger' : value >= warnAt ? 'progress__bar--warn' : '';
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className={`progress__bar ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
