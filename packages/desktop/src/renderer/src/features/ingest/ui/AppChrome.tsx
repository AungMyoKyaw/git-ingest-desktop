import type { ReactElement } from 'react';

import { CheckIcon, CopyIcon, FileIcon, PlayIcon, ShieldIcon } from '../../../shared/icons/Icons';
import { cn } from '../../../shared/lib/cn';
import { Button } from '../../../shared/ui/Button';
import type { PrimaryActionKind } from '../model/view-model';
import type { WorkflowStep } from '../model/view-model';

export type AppChromeProps = {
  steps: WorkflowStep[];
  primaryAction: { kind: PrimaryActionKind; label: string; disabled: boolean };
  hasOutput: boolean;
  canSave: boolean;
  inspectorOpen: boolean;
  onChooseFolder: () => void;
  onGenerate: () => void;
  onCancel: () => void;
  onCopy: () => void;
  onSave: () => void;
  onToggleInspector: () => void;
};

export function AppChrome({
  steps,
  primaryAction,
  hasOutput,
  canSave,
  inspectorOpen,
  onChooseFolder,
  onGenerate,
  onCancel,
  onCopy,
  onSave,
  onToggleInspector,
}: AppChromeProps): ReactElement {
  const primaryHandler = {
    'choose-folder': onChooseFolder,
    generate: onGenerate,
    cancel: onCancel,
    copy: onCopy,
  }[primaryAction.kind];

  const primaryIcon =
    primaryAction.kind === 'copy' ? (
      <CopyIcon className="h-3.5 w-3.5" />
    ) : primaryAction.kind === 'generate' ? (
      <PlayIcon className="h-3.5 w-3.5" />
    ) : undefined;

  return (
    <header className="native-toolbar chrome-grid grid h-[52px] border-b border-line">
      <div className="pl-[84px]" data-electron-drag-region />
      <div className="flex min-w-0 items-center justify-center px-4" data-electron-drag-region>
        <div aria-label="Workflow progress" className="flex min-w-0 items-center gap-1.5">
          {steps.map((step, index) => (
            <div key={step.label} className="flex min-w-0 items-center gap-1.5">
              <span
                aria-current={step.status === 'current' ? 'step' : undefined}
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
                <span className="text-[11px] text-muted/70">·</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 px-3">
        <div className="hidden h-8 items-center gap-1.5 rounded-[8px] border border-success/24 bg-success-soft px-2.5 text-xs font-medium text-success-strong lg:flex">
          <ShieldIcon className="h-3.5 w-3.5" />
          Local only
        </div>
        {hasOutput ? (
          <Button
            disabled={!canSave}
            leftIcon={<FileIcon className="h-3.5 w-3.5" />}
            onClick={onSave}
            size="sm"
            variant="secondary"
          >
            Save
          </Button>
        ) : null}
        <Button
          aria-busy={primaryAction.kind === 'cancel'}
          disabled={primaryAction.disabled}
          leftIcon={primaryIcon}
          onClick={primaryHandler}
          size="sm"
          variant={primaryAction.kind === 'cancel' ? 'danger' : 'primary'}
        >
          {primaryAction.label}
        </Button>
        <Button
          aria-expanded={inspectorOpen}
          aria-label="Toggle inspector"
          className="inspector-toggle"
          onClick={onToggleInspector}
          size="sm"
          variant="toolbar"
        >
          Inspector
        </Button>
      </div>
    </header>
  );
}
