import type { ReactElement } from 'react';

export type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
};

export function MetricCard({ label, value, helper }: MetricCardProps): ReactElement {
  return (
    <div className="rounded-[10px] border border-line bg-white/68 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/38">
        {label}
      </div>
      <div className="mt-2 truncate text-[18px] font-semibold tracking-[-0.02em] text-ink">
        {value}
      </div>
      {helper ? <div className="mt-1 truncate text-[11px] text-muted">{helper}</div> : null}
    </div>
  );
}
