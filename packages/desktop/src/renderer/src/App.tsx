import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';

import { resolveDropSelection } from './drop';
import type {
  DesktopError,
  GenerateResult,
  GenerationFinishedMessage,
  GenerationProgressMessage,
  PreviewResult,
} from './env';
import type { AppView, RulesDraft, RunRecord } from './features/ingest/model/types';
import {
  bytesToMegabytes,
  deriveAppStatus,
  getPrimaryActionState,
  getWorkflowSteps,
  makeRequestKey,
  megabytesToBytes,
  normalizePatternAddition,
} from './features/ingest/model/view-model';
import { AppChrome } from './features/ingest/ui/AppChrome';
import { Inspector } from './features/ingest/ui/Inspector';
import { Sidebar } from './features/ingest/ui/Sidebar';
import { StatusBar } from './features/ingest/ui/StatusBar';
import { Workspace } from './features/ingest/ui/Workspace';

const initialRules: RulesDraft = {
  format: 'markdown',
  maxFileSizeMb: '10',
  includeInput: '',
  excludeInput: '',
  includePatterns: [],
  excludePatterns: [],
};

function createRunRecord(
  requestId: string,
  source: GenerateResult | PreviewResult,
  status: RunRecord['status'],
): RunRecord {
  return {
    id: requestId,
    projectName: source.projectName,
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tokenCount: 'tokenEstimate' in source ? source.tokenEstimate : source.estimatedTokenCount,
    outputBytes: 'outputBytes' in source ? source.outputBytes : source.estimatedOutputBytes,
    status,
  };
}

export function App() {
  const [selectedView, setSelectedView] = useState<AppView>('projects');
  const [folderPath, setFolderPath] = useState('');
  const [rules, setRules] = useState<RulesDraft>(initialRules);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [generated, setGenerated] = useState<GenerateResult | null>(null);
  const [recentProjects, setRecentProjects] = useState<
    Array<{ path: string; name: string; lastOpenedAt: string }>
  >([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<DesktopError | null>(null);
  const [phase, setPhase] = useState('');
  const [progressCounts, setProgressCounts] = useState<{ processed?: number; total?: number }>({});
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [lastPreviewKey, setLastPreviewKey] = useState<string | null>(null);
  const [previewRefreshToken, setPreviewRefreshToken] = useState(0);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);
  const [inlineFeedback, setInlineFeedback] = useState('');
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const activeRequestIdRef = useRef<string | null>(null);
  const activeGenerationKeyRef = useRef<string | null>(null);
  const folderPathRef = useRef('');
  const previewRef = useRef<PreviewResult | null>(null);
  const previewRequestRef = useRef(0);
  const requestKeyRef = useRef<string | null>(null);

  useEffect(() => {
    activeRequestIdRef.current = activeRequestId;
  }, [activeRequestId]);

  useEffect(() => {
    folderPathRef.current = folderPath;
  }, [folderPath]);

  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

  useEffect(() => {
    void window.gitIngest.getState().then((state) => {
      setRecentProjects(state.recentProjects);
      setFolderPath(state.lastFolderPath ?? '');
      setRules({
        format: state.settings.format,
        maxFileSizeMb: String(bytesToMegabytes(state.settings.maxFileSizeBytes)),
        includeInput: '',
        excludeInput: '',
        includePatterns: state.settings.includePatterns,
        excludePatterns: state.settings.excludePatterns,
      });
      setRulesOpen(false);
      setHydrated(true);
    });

    const stopProgress = window.gitIngest.onGenerationProgress(
      (message: GenerationProgressMessage) => {
        if (message.requestId !== activeRequestIdRef.current) {
          return;
        }

        if (activeGenerationKeyRef.current !== requestKeyRef.current) {
          return;
        }

        setPhase(message.phase);
        setProgressCounts({ processed: message.processedFiles, total: message.totalFiles });
      },
    );

    const stopFinished = window.gitIngest.onGenerationFinished(
      (message: GenerationFinishedMessage) => {
        if (message.requestId !== activeRequestIdRef.current) {
          return;
        }

        const finishedGenerationKey = activeGenerationKeyRef.current;
        const currentRequestKey = requestKeyRef.current;

        activeRequestIdRef.current = null;
        activeGenerationKeyRef.current = null;
        setBusy(false);
        setActiveRequestId(null);

        if (finishedGenerationKey !== currentRequestKey) {
          setPhase('');
          setProgressCounts({});
          setMessage('Generation output ignored because the project or rules changed.');
          setError(null);
          setGenerated(null);
          setSavedFilePath(null);
          setPreviewRefreshToken((current) => current + 1);
          return;
        }

        if (message.status === 'success') {
          setPhase('done');
          setPreview(message.result);
          setGenerated(message.result);
          setSavedFilePath(null);
          setError(null);
          setRuns((current) => [
            createRunRecord(message.requestId, message.result, 'success'),
            ...current,
          ]);
          setRecentProjects((current) => {
            const next = [
              {
                path: message.result.rootDir,
                name: message.result.projectName,
                lastOpenedAt: new Date().toISOString(),
              },
              ...current.filter((entry) => entry.path !== message.result.rootDir),
            ];
            return next.slice(0, 8);
          });
          return;
        }

        setPhase('');
        setError(message.error);
        setMessage(message.status === 'cancelled' ? 'Generation cancelled.' : '');
        setRuns((current) => {
          const currentFolderPath = folderPathRef.current;
          const currentPreview = previewRef.current;

          if (!currentFolderPath || !currentPreview) {
            return current;
          }

          return [createRunRecord(message.requestId, currentPreview, message.status), ...current];
        });
      },
    );

    return () => {
      stopProgress();
      stopFinished();
    };
  }, []);

  const requestPayload = useMemo(
    () => ({
      rootDir: folderPath,
      format: rules.format,
      maxFileSizeBytes: megabytesToBytes(rules.maxFileSizeMb),
      includePatterns: rules.includePatterns,
      excludePatterns: rules.excludePatterns,
    }),
    [folderPath, rules.excludePatterns, rules.format, rules.includePatterns, rules.maxFileSizeMb],
  );

  const requestKey = useMemo(() => makeRequestKey(requestPayload), [requestPayload]);
  requestKeyRef.current = requestKey;
  const readyToGenerate = Boolean(preview) && lastPreviewKey === requestKey && !busy;
  const appStatus = useMemo(
    () =>
      deriveAppStatus({
        busy,
        error,
        generated,
        hasProject: Boolean(folderPath),
        phase,
        preview,
      }),
    [busy, error, folderPath, generated, phase, preview],
  );
  const primaryAction = useMemo(
    () =>
      getPrimaryActionState({
        appStatus,
        canGenerate: readyToGenerate,
        hasOutput: Boolean(generated?.output),
      }),
    [appStatus, generated?.output, readyToGenerate],
  );
  const workflowSteps = useMemo(
    () =>
      getWorkflowSteps({
        hasProject: Boolean(folderPath),
        hasPreview: Boolean(preview),
        canGenerate: readyToGenerate,
        hasOutput: Boolean(generated?.output),
      }),
    [folderPath, generated?.output, preview, readyToGenerate],
  );

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!folderPath) {
      setPreview(null);
      setGenerated(null);
      setSavedFilePath(null);
      setLastPreviewKey(null);
      setPhase('');
      return;
    }

    if (activeRequestIdRef.current || activeGenerationKeyRef.current) {
      return;
    }

    const requestNumber = previewRequestRef.current + 1;
    previewRequestRef.current = requestNumber;
    setBusy(true);
    setPhase('Scanning preview');
    setProgressCounts({});
    setError(null);
    setMessage('');
    setGenerated(null);
    setSavedFilePath(null);

    void window.gitIngest.preview(requestPayload).then((result) => {
      if (previewRequestRef.current !== requestNumber) {
        return;
      }

      setBusy(false);
      setPhase('');

      if (!result.ok) {
        setPreview(null);
        setLastPreviewKey(null);
        setError(result.error);
        return;
      }

      setPreview(result.result);
      setLastPreviewKey(requestKey);
      setRecentProjects((current) => {
        const next = [
          {
            path: result.result.rootDir,
            name: result.result.projectName,
            lastOpenedAt: new Date().toISOString(),
          },
          ...current.filter((entry) => entry.path !== result.result.rootDir),
        ];
        return next.slice(0, 8);
      });
    });
  }, [folderPath, hydrated, previewRefreshToken, requestKey, requestPayload]);

  function resetFeedback() {
    setMessage('');
    setError(null);
    setInlineFeedback('');
  }

  function resetStaleProjectState() {
    setPreview(null);
    setGenerated(null);
    setSavedFilePath(null);
    setLastPreviewKey(null);
    setProgressCounts({});
  }

  function isGenerationActive() {
    return Boolean(activeRequestIdRef.current || activeGenerationKeyRef.current);
  }

  function blockGenerationMutation(
    message = 'Cancel the current generation before changing projects or rules.',
  ) {
    setMessage(message);
    setError(null);
  }

  async function chooseFolder() {
    if (isGenerationActive()) {
      blockGenerationMutation();
      return;
    }

    resetFeedback();
    const result = await window.gitIngest.chooseFolder();

    if (isGenerationActive()) {
      blockGenerationMutation();
      return;
    }

    if (!result.canceled && result.folderPath) {
      setFolderPath(result.folderPath);
      resetStaleProjectState();
      setSelectedView('projects');
    }
  }

  function addPattern(kind: 'include' | 'exclude') {
    if (isGenerationActive()) {
      blockGenerationMutation();
      return;
    }

    const inputKey = kind === 'include' ? 'includeInput' : 'excludeInput';
    const listKey = kind === 'include' ? 'includePatterns' : 'excludePatterns';
    const value = rules[inputKey].trim();
    const normalized = normalizePatternAddition(value, rules[listKey]);

    if (!normalized.accepted) {
      if (normalized.message) {
        setMessage(normalized.message);
        setInlineFeedback('');
      }
      return;
    }

    setRules((current) => ({
      ...current,
      [inputKey]: '',
      [listKey]: normalized.patterns,
    }));
    setMessage('Rules changed. Preview refreshed. Output cleared.');
    setInlineFeedback('');
  }

  function removePattern(kind: 'include' | 'exclude', pattern: string) {
    if (isGenerationActive()) {
      blockGenerationMutation();
      return;
    }

    const listKey = kind === 'include' ? 'includePatterns' : 'excludePatterns';
    setRules((current) => ({
      ...current,
      [listKey]: current[listKey].filter((entry) => entry !== pattern),
    }));
    setMessage('Rules changed. Preview refreshed. Output cleared.');
    setInlineFeedback('');
  }

  function handleRulesChange(nextRules: RulesDraft) {
    if (isGenerationActive()) {
      blockGenerationMutation();
      return;
    }

    const maxFileSize = Number(nextRules.maxFileSizeMb);
    setRules(nextRules);
    setGenerated(null);
    setSavedFilePath(null);
    setInlineFeedback('');
    setMessage(
      Number.isFinite(maxFileSize) && maxFileSize > 0
        ? 'Rules changed. Preview refreshed. Output cleared.'
        : 'Max file size must be positive.',
    );
  }

  async function generateOutput() {
    if (!readyToGenerate) {
      return;
    }

    resetFeedback();
    setBusy(true);
    setPhase('Generating output');
    setProgressCounts({});
    const generationKey = requestKey;
    activeGenerationKeyRef.current = generationKey;
    const result = await window.gitIngest.generate(requestPayload);

    if (!result.ok) {
      if (activeGenerationKeyRef.current === generationKey) {
        activeGenerationKeyRef.current = null;
      }

      setBusy(false);
      setPhase('');
      setError(result.error);
      return;
    }

    activeRequestIdRef.current = result.requestId;
    setActiveRequestId(result.requestId);
  }

  async function cancelGeneration() {
    if (!activeRequestId) {
      return;
    }

    const result = await window.gitIngest.cancelGeneration(activeRequestId);
    if (!result.ok && result.error) {
      setError(result.error);
    }
  }

  async function copyOutput() {
    if (!generated) {
      return;
    }

    const result = await window.gitIngest.copyOutput(generated.output);
    if (result.ok) {
      setMessage('Copied output to clipboard.');
      setInlineFeedback('Copied.');
      setError(null);
      return;
    }

    if (result.error) {
      setError(result.error);
    }
  }

  async function saveOutput() {
    if (!generated) {
      return;
    }

    const result = await window.gitIngest.saveOutput({
      output: generated.output,
      projectName: generated.projectName,
      format: generated.format,
    });

    if (result.ok && result.filePath) {
      setSavedFilePath(result.filePath);
      setMessage(`Saved output to ${result.filePath}`);
      setInlineFeedback('Saved.');
      setError(null);
      return;
    }

    if (result.error) {
      setError(result.error);
    }
  }

  async function openSavedFile() {
    if (!savedFilePath) {
      return;
    }

    const result = await window.gitIngest.openOutputFile(savedFilePath);
    if (!result.ok && result.error) {
      setError(result.error);
    }
  }

  async function revealSavedFile() {
    if (!savedFilePath) {
      return;
    }

    const result = await window.gitIngest.revealOutputFile(savedFilePath);
    if (!result.ok && result.error) {
      setError(result.error);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (isGenerationActive()) {
      blockGenerationMutation('Cancel the current generation before dropping another project.');
      return;
    }

    resetFeedback();
    const selection = resolveDropSelection({
      files: Array.from(event.dataTransfer.files).map((file) => file as File & { path?: string }),
      items: Array.from(event.dataTransfer.items),
    });

    if (selection.kind === 'error') {
      setError({ code: selection.code, userMessage: selection.message, detail: null });
      return;
    }

    setFolderPath(selection.path);
    resetStaleProjectState();
    setSelectedView('projects');
  }

  function selectRecentProject(path: string) {
    if (isGenerationActive()) {
      blockGenerationMutation('Cancel the current generation before opening another project.');
      return;
    }

    setFolderPath(path);
    resetFeedback();
    resetStaleProjectState();
    setPreviewRefreshToken((current) => current + 1);
    setSelectedView('projects');
  }

  async function removeRecentProject(path: string) {
    resetFeedback();
    const result = await window.gitIngest.removeRecentProject(path);

    if (result.ok) {
      setRecentProjects(result.recentProjects);
      if (folderPathRef.current === path) {
        setFolderPath('');
        resetStaleProjectState();
        setSelectedView('projects');
      }
      return;
    }

    setError(result.error);
  }

  return (
    <div className="h-dvh overflow-hidden bg-window text-ink selection:bg-accent/30">
      <div className="relative grid h-full grid-rows-[52px_1fr_26px] overflow-hidden bg-window">
        <AppChrome
          canSave={Boolean(generated?.output)}
          hasOutput={Boolean(generated?.output)}
          inspectorOpen={inspectorOpen}
          onCancel={() => void cancelGeneration()}
          onChooseFolder={() => void chooseFolder()}
          onCopy={() => void copyOutput()}
          onGenerate={() => void generateOutput()}
          onSave={() => void saveOutput()}
          onToggleInspector={() => setInspectorOpen((current) => !current)}
          primaryAction={primaryAction}
          steps={workflowSteps}
        />
        <div className="app-shell-grid grid min-h-0">
          <Sidebar
            onChooseFolder={() => void chooseFolder()}
            onRemoveRecentProject={removeRecentProject}
            onSelectRecentProject={selectRecentProject}
            onViewChange={setSelectedView}
            recentProjects={recentProjects}
            selectedView={selectedView}
          />
          <Workspace
            busy={busy}
            folderPath={folderPath}
            generated={generated}
            isDragging={isDragging}
            onAddPattern={addPattern}
            onCancel={() => void cancelGeneration()}
            onChooseFolder={() => void chooseFolder()}
            onCloseRules={() => setRulesOpen(false)}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              if (event.currentTarget === event.target) {
                setIsDragging(false);
              }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            onGenerate={() => void generateOutput()}
            onClearOutput={() => {
              setGenerated(null);
              setSavedFilePath(null);
              setMessage('');
            }}
            onCopy={() => void copyOutput()}
            onOpenRules={() => setRulesOpen(true)}
            onOpenSavedFile={() => void openSavedFile()}
            onRevealSavedFile={() => void revealSavedFile()}
            onRemovePattern={removePattern}
            onRulesChange={handleRulesChange}
            onSave={() => void saveOutput()}
            inlineFeedback={inlineFeedback}
            phase={phase}
            preview={preview}
            progressCounts={progressCounts}
            readyToGenerate={readyToGenerate}
            rules={rules}
            rulesOpen={rulesOpen}
            runs={runs}
            savedFilePath={savedFilePath}
            selectedView={selectedView}
          />
          <div className="desktop-inspector min-h-0">
            <Inspector
              error={error}
              generated={generated}
              message={message}
              preview={preview}
              savedFilePath={savedFilePath}
            />
          </div>
        </div>
        {inspectorOpen ? (
          <div className="inspector-drawer absolute inset-y-[52px] right-0 z-40 w-[360px] max-w-[92vw] border-l border-line shadow-window">
            <Inspector
              drawer
              error={error}
              generated={generated}
              message={message}
              onCloseDrawer={() => setInspectorOpen(false)}
              preview={preview}
              savedFilePath={savedFilePath}
            />
          </div>
        ) : null}
        <StatusBar
          appStatus={appStatus}
          folderPath={folderPath}
          generated={generated}
          preview={preview}
        />
      </div>
    </div>
  );
}
