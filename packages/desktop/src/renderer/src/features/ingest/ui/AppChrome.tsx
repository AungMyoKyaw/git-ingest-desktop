import type { ReactElement } from 'react';

import { CheckIcon, ShieldIcon } from '../../../shared/icons/Icons';
import { cn } from '../../../shared/lib/cn';
import type { WorkflowStep } from '../model/view-model';

export function AppChrome({ steps }: { steps: WorkflowStep[] }): ReactElement {
  return (
    <header className="native-toolbar grid h-[52px] grid-cols-[240px_1fr_320px] border-b border-line">
      <div data-electron-drag-region />
      <div className="flex min-w-0 items-center justify-center px-4" data-electron-drag-region>
        <div
          aria-label="Workflow progress"
          className="flex min-w-0 items-center gap-1.5"
          data-electron-drag-region
        >
          {steps.map((step, index) => (
            <div key={step.label} className="flex min-w-0 items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex h-6 items-center gap-1 rounded-[7px] px-2 text-[12px] font-medium',
                  step.status === 'current' && 'bg-black/[0.075] text-ink',
                  step.status === 'complete' && 'bg-black/[0.045] text-ink/78',
                  step.status === 'pending' && 'text-muted',
                )}
              >
                {step.status === 'complete' ? <CheckIcon className="h-3 w-3" /> : null}
                {step.label}
              </span>
              {index < steps.length - 1 ? (
                <span className="text-[11px] text-muted/70">/</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 px-3" data-electron-drag-region>
        <div className="hidden h-8 items-center gap-1.5 rounded-[8px] border border-success/24 bg-success-soft px-2.5 text-xs font-medium text-success-strong lg:flex">
          <ShieldIcon className="h-3.5 w-3.5" />
          Local only
        </div>
      </div>
    </header>
  );
}
