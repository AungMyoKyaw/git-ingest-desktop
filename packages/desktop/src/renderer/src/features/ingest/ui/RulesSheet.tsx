import { useEffect, useRef, type ReactElement } from 'react';

import { SegmentedControl } from '../../../shared/ui/SegmentedControl';
import { Button } from '../../../shared/ui/Button';
import type { RulesDraft } from '../model/types';

export type RulesSheetProps = {
  rules: RulesDraft;
  onRulesChange: (rules: RulesDraft) => void;
  onAddPattern: (kind: 'include' | 'exclude') => void;
  onRemovePattern: (kind: 'include' | 'exclude', pattern: string) => void;
  onClose: () => void;
};

const formatItems = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'text', label: 'Text' },
] as const;

const focusableSelector = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => {
      return !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true';
    },
  );
}

function PatternEditor({
  kind,
  label,
  input,
  patterns,
  rules,
  onRulesChange,
  onAddPattern,
  onRemovePattern,
}: {
  kind: 'include' | 'exclude';
  label: string;
  input: string;
  patterns: string[];
  rules: RulesDraft;
  onRulesChange: (rules: RulesDraft) => void;
  onAddPattern: (kind: 'include' | 'exclude') => void;
  onRemovePattern: (kind: 'include' | 'exclude', pattern: string) => void;
}): ReactElement {
  const inputKey = kind === 'include' ? 'includeInput' : 'excludeInput';

  return (
    <div>
      <label className="text-[12px] font-medium text-ink/82" htmlFor={`${kind}-patterns`}>
        {label}
      </label>
      <p className="mt-1 text-[12px] leading-5 text-muted">
        {kind === 'include'
          ? 'Only include matching paths. Leave empty to include all non-ignored files.'
          : 'Exclude matching paths from the generated context.'}
      </p>
      <div className="mt-2 flex gap-2">
        <input
          className="h-9 min-w-0 flex-1 rounded-[9px] border border-line bg-white/80 px-3 py-0 text-[13px] text-ink outline-none focus:border-accent"
          id={`${kind}-patterns`}
          onChange={(event) => onRulesChange({ ...rules, [inputKey]: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onAddPattern(kind);
            }
          }}
          placeholder={kind === 'include' ? 'src/**/*.ts' : 'dist/**'}
          value={input}
        />
        <Button onClick={() => onAddPattern(kind)} size="sm">
          Add
        </Button>
      </div>
      {patterns.length === 0 ? (
        <p className="mt-2 text-[12px] text-muted">No {kind} patterns.</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {patterns.map((pattern) => (
            <button
              key={pattern}
              aria-label={`Remove ${kind} pattern ${pattern}`}
              className="inline-flex h-7 max-w-full items-center gap-1 rounded-[8px] border border-line bg-black/[0.035] px-2 py-0 text-[12px] text-ink/78"
              onClick={() => onRemovePattern(kind, pattern)}
              title={`Remove ${pattern}`}
              type="button"
            >
              <span className="truncate">{pattern}</span>
              <span aria-hidden="true" className="text-muted">
                x
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RulesSheet({
  rules,
  onRulesChange,
  onAddPattern,
  onRemovePattern,
  onClose,
}: RulesSheetProps): ReactElement {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const focusableElements = getFocusableElements(dialog);
    (focusableElements[0] ?? dialog).focus();

    function handleKeyDown(event: KeyboardEvent): void {
      const currentDialog = dialogRef.current;

      if (!currentDialog) {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const currentFocusableElements = getFocusableElements(currentDialog);

      if (currentFocusableElements.length === 0) {
        event.preventDefault();
        currentDialog.focus();
        return;
      }

      const firstElement = currentFocusableElements[0];
      const lastElement = currentFocusableElements[currentFocusableElements.length - 1];
      const activeElement = document.activeElement;

      if (
        event.shiftKey &&
        (activeElement === firstElement || !currentDialog.contains(activeElement))
      ) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-black/20">
      <aside
        ref={dialogRef}
        aria-labelledby="rules-sheet-title"
        aria-modal="true"
        className="h-full w-full max-w-[420px] overflow-auto border-l border-line bg-window px-5 py-4 shadow-window"
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-ink" id="rules-sheet-title">
              Rules
            </h2>
            <p className="mt-1 text-[12px] text-muted">Format, size limits, and path filters.</p>
          </div>
          <Button onClick={onClose} size="sm" variant="ghost">
            Close
          </Button>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <div className="mb-2 text-[12px] font-medium text-ink/82">Format</div>
            <SegmentedControl
              ariaLabel="Output format"
              items={formatItems}
              onChange={(format) => onRulesChange({ ...rules, format })}
              selected={rules.format}
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-ink/82" htmlFor="max-file-size">
              Max file size
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                className="h-9 w-28 rounded-[9px] border border-line bg-white/80 px-3 py-0 text-[13px] text-ink outline-none focus:border-accent"
                id="max-file-size"
                min="0.1"
                onChange={(event) => onRulesChange({ ...rules, maxFileSizeMb: event.target.value })}
                aria-describedby="max-file-size-help"
                step="0.1"
                type="number"
                value={rules.maxFileSizeMb}
              />
              <span className="text-[12px] text-muted">MB per file</span>
            </div>
            <p className="mt-1 text-[12px] leading-5 text-muted" id="max-file-size-help">
              Must be positive. Files above this size are skipped.
            </p>
          </div>

          <PatternEditor
            input={rules.includeInput}
            kind="include"
            label="Include patterns"
            onAddPattern={onAddPattern}
            onRemovePattern={onRemovePattern}
            onRulesChange={onRulesChange}
            patterns={rules.includePatterns}
            rules={rules}
          />
          <PatternEditor
            input={rules.excludeInput}
            kind="exclude"
            label="Exclude patterns"
            onAddPattern={onAddPattern}
            onRemovePattern={onRemovePattern}
            onRulesChange={onRulesChange}
            patterns={rules.excludePatterns}
            rules={rules}
          />
        </div>
      </aside>
    </div>
  );
}
