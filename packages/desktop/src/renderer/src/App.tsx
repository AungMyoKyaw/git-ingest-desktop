import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'

import { resolveDropSelection } from './drop'
import type { DesktopError, GenerateResult, GenerationFinishedMessage, GenerationProgressMessage, PreviewResult } from './env'
import type { AppView, RulesDraft, RunRecord } from './features/ingest/model/types'
import { bytesToMegabytes, makeRequestKey, megabytesToBytes } from './features/ingest/model/view-model'
import { AppChrome } from './features/ingest/ui/AppChrome'
import { Inspector } from './features/ingest/ui/Inspector'
import { Sidebar } from './features/ingest/ui/Sidebar'
import { StatusBar } from './features/ingest/ui/StatusBar'
import { Workspace } from './features/ingest/ui/Workspace'

const initialRules: RulesDraft = {
  format: 'markdown',
  maxFileSizeMb: '10',
  includeInput: '',
  excludeInput: '',
  includePatterns: [],
  excludePatterns: []
}

function createRunRecord(
  requestId: string,
  source: GenerateResult | PreviewResult,
  status: RunRecord['status']
): RunRecord {
  return {
    id: requestId,
    projectName: source.projectName,
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tokenCount: 'tokenEstimate' in source ? source.tokenEstimate : source.estimatedTokenCount,
    outputBytes: 'outputBytes' in source ? source.outputBytes : source.estimatedOutputBytes,
    status
  }
}

export function App() {
  const [selectedView, setSelectedView] = useState<AppView>('projects')
  const [folderPath, setFolderPath] = useState('')
  const [rules, setRules] = useState<RulesDraft>(initialRules)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [runs, setRuns] = useState<RunRecord[]>([])
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [generated, setGenerated] = useState<GenerateResult | null>(null)
  const [recentProjects, setRecentProjects] = useState<Array<{ path: string; name: string; lastOpenedAt: string }>>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState<DesktopError | null>(null)
  const [phase, setPhase] = useState('')
  const [progressCounts, setProgressCounts] = useState<{ processed?: number; total?: number }>({})
  const [busy, setBusy] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [lastPreviewKey, setLastPreviewKey] = useState<string | null>(null)
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null)

  const activeRequestIdRef = useRef<string | null>(null)
  const folderPathRef = useRef('')
  const previewRef = useRef<PreviewResult | null>(null)
  const previewRequestRef = useRef(0)

  useEffect(() => {
    activeRequestIdRef.current = activeRequestId
  }, [activeRequestId])

  useEffect(() => {
    folderPathRef.current = folderPath
  }, [folderPath])

  useEffect(() => {
    previewRef.current = preview
  }, [preview])

  useEffect(() => {
    void window.gitIngest.getState().then((state) => {
      setRecentProjects(state.recentProjects)
      setFolderPath(state.lastFolderPath ?? '')
      setRules({
        format: state.settings.format,
        maxFileSizeMb: String(bytesToMegabytes(state.settings.maxFileSizeBytes)),
        includeInput: '',
        excludeInput: '',
        includePatterns: state.settings.includePatterns,
        excludePatterns: state.settings.excludePatterns
      })
      setRulesOpen(false)
      setHydrated(true)
    })

    const stopProgress = window.gitIngest.onGenerationProgress((message: GenerationProgressMessage) => {
      if (message.requestId !== activeRequestIdRef.current) {
        return
      }

      setPhase(message.phase)
      setProgressCounts({ processed: message.processedFiles, total: message.totalFiles })
    })

    const stopFinished = window.gitIngest.onGenerationFinished((message: GenerationFinishedMessage) => {
      if (message.requestId !== activeRequestIdRef.current) {
        return
      }

      activeRequestIdRef.current = null
      setBusy(false)
      setActiveRequestId(null)

      if (message.status === 'success') {
        setPhase('done')
        setPreview(message.result)
        setGenerated(message.result)
        setSavedFilePath(null)
        setError(null)
        setRuns((current) => [createRunRecord(message.requestId, message.result, 'success'), ...current])
        setRecentProjects((current) => {
          const next = [
            { path: message.result.rootDir, name: message.result.projectName, lastOpenedAt: new Date().toISOString() },
            ...current.filter((entry) => entry.path !== message.result.rootDir)
          ]
          return next.slice(0, 8)
        })
        return
      }

      setPhase('')
      setError(message.error)
      setMessage(message.status === 'cancelled' ? 'Generation cancelled.' : '')
      setRuns((current) => {
        const currentFolderPath = folderPathRef.current
        const currentPreview = previewRef.current

        if (!currentFolderPath || !currentPreview) {
          return current
        }

        return [createRunRecord(message.requestId, currentPreview, message.status), ...current]
      })
    })

    return () => {
      stopProgress()
      stopFinished()
    }
  }, [])

  const requestPayload = useMemo(() => ({
    rootDir: folderPath,
    format: rules.format,
    maxFileSizeBytes: megabytesToBytes(rules.maxFileSizeMb),
    includePatterns: rules.includePatterns,
    excludePatterns: rules.excludePatterns
  }), [folderPath, rules.excludePatterns, rules.format, rules.includePatterns, rules.maxFileSizeMb])

  const requestKey = useMemo(() => makeRequestKey(requestPayload), [requestPayload])
  const readyToGenerate = Boolean(preview) && lastPreviewKey === requestKey && !busy

  useEffect(() => {
    if (!hydrated) {
      return
    }

    if (!folderPath) {
      setPreview(null)
      setGenerated(null)
      setSavedFilePath(null)
      setLastPreviewKey(null)
      setPhase('')
      return
    }

    if (activeRequestIdRef.current) {
      return
    }

    const requestNumber = previewRequestRef.current + 1
    previewRequestRef.current = requestNumber
    setBusy(true)
    setPhase('Scanning preview')
    setProgressCounts({})
    setError(null)
    setMessage('')
    setGenerated(null)
    setSavedFilePath(null)

    void window.gitIngest.preview(requestPayload).then((result) => {
      if (previewRequestRef.current !== requestNumber) {
        return
      }

      setBusy(false)
      setPhase('')

      if (!result.ok) {
        setPreview(null)
        setLastPreviewKey(null)
        setError(result.error)
        return
      }

      setPreview(result.result)
      setLastPreviewKey(requestKey)
      setRecentProjects((current) => {
        const next = [
          { path: result.result.rootDir, name: result.result.projectName, lastOpenedAt: new Date().toISOString() },
          ...current.filter((entry) => entry.path !== result.result.rootDir)
        ]
        return next.slice(0, 8)
      })
    })
  }, [folderPath, hydrated, requestKey, requestPayload])

  function resetFeedback() {
    setMessage('')
    setError(null)
  }

  function resetStaleProjectState() {
    setPreview(null)
    setGenerated(null)
    setSavedFilePath(null)
    setLastPreviewKey(null)
    setProgressCounts({})
  }

  async function chooseFolder() {
    resetFeedback()
    const result = await window.gitIngest.chooseFolder()
    if (!result.canceled && result.folderPath) {
      setFolderPath(result.folderPath)
      resetStaleProjectState()
      setSelectedView('projects')
    }
  }

  function addPattern(kind: 'include' | 'exclude') {
    const inputKey = kind === 'include' ? 'includeInput' : 'excludeInput'
    const listKey = kind === 'include' ? 'includePatterns' : 'excludePatterns'
    const value = rules[inputKey].trim()

    if (!value) {
      return
    }

    setRules((current) => ({
      ...current,
      [inputKey]: '',
      [listKey]: [...current[listKey], value]
    }))
  }

  function removePattern(kind: 'include' | 'exclude', pattern: string) {
    const listKey = kind === 'include' ? 'includePatterns' : 'excludePatterns'
    setRules((current) => ({
      ...current,
      [listKey]: current[listKey].filter((entry) => entry !== pattern)
    }))
  }

  async function generateOutput() {
    if (!readyToGenerate) {
      return
    }

    resetFeedback()
    setBusy(true)
    setPhase('Generating output')
    setProgressCounts({})
    const result = await window.gitIngest.generate(requestPayload)

    if (!result.ok) {
      setBusy(false)
      setPhase('')
      setError(result.error)
      return
    }

    activeRequestIdRef.current = result.requestId
    setActiveRequestId(result.requestId)
  }

  async function cancelGeneration() {
    if (!activeRequestId) {
      return
    }

    const result = await window.gitIngest.cancelGeneration(activeRequestId)
    if (!result.ok && result.error) {
      setError(result.error)
    }
  }

  async function copyOutput() {
    if (!generated) {
      return
    }

    const result = await window.gitIngest.copyOutput(generated.output)
    if (result.ok) {
      setMessage('Copied output to clipboard.')
      setError(null)
      return
    }

    if (result.error) {
      setError(result.error)
    }
  }

  async function saveOutput() {
    if (!generated) {
      return
    }

    const result = await window.gitIngest.saveOutput({
      output: generated.output,
      projectName: generated.projectName,
      format: generated.format
    })

    if (result.ok && result.filePath) {
      setSavedFilePath(result.filePath)
      setMessage(`Saved output to ${result.filePath}`)
      setError(null)
      return
    }

    if (result.error) {
      setError(result.error)
    }
  }

  async function openSavedFile() {
    if (!savedFilePath) {
      return
    }

    const result = await window.gitIngest.openOutputFile(savedFilePath)
    if (!result.ok && result.error) {
      setError(result.error)
    }
  }

  async function revealSavedFile() {
    if (!savedFilePath) {
      return
    }

    const result = await window.gitIngest.revealOutputFile(savedFilePath)
    if (!result.ok && result.error) {
      setError(result.error)
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    resetFeedback()
    const selection = resolveDropSelection({
      files: Array.from(event.dataTransfer.files).map((file) => file as File & { path?: string }),
      items: Array.from(event.dataTransfer.items)
    })

    if (selection.kind === 'error') {
      setError({ code: selection.code, userMessage: selection.message, detail: null })
      return
    }

    setFolderPath(selection.path)
    resetStaleProjectState()
    setSelectedView('projects')
  }

  function selectRecentProject(path: string) {
    setFolderPath(path)
    resetFeedback()
    resetStaleProjectState()
    setSelectedView('projects')
  }

  return (
    <div className="h-dvh overflow-hidden p-0 text-ink selection:bg-accent/30 lg:p-5">
      <div className="relative mx-auto grid h-full max-w-[1680px] grid-rows-[52px_1fr_26px] overflow-hidden border-line-strong bg-window shadow-window ring-1 ring-line lg:rounded-[18px] lg:border">
        <AppChrome canGenerate={readyToGenerate} isGenerating={busy} onGenerate={() => void generateOutput()} />
        <div className="grid min-h-0 grid-cols-[260px_minmax(0,1fr)_340px]">
          <Sidebar
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
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              if (event.currentTarget === event.target) {
                setIsDragging(false)
              }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            onGenerate={() => void generateOutput()}
            onOpenRules={() => setRulesOpen(true)}
            onRemovePattern={removePattern}
            onRulesChange={setRules}
            phase={phase}
            preview={preview}
            progressCounts={progressCounts}
            readyToGenerate={readyToGenerate}
            rules={rules}
            rulesOpen={rulesOpen}
            runs={runs}
            selectedView={selectedView}
          />
          <Inspector
            error={error}
            generated={generated}
            message={message}
            onClearOutput={() => {
              setGenerated(null)
              setSavedFilePath(null)
              setMessage('')
            }}
            onCopy={() => void copyOutput()}
            onOpenSavedFile={() => void openSavedFile()}
            onRevealSavedFile={() => void revealSavedFile()}
            onSave={() => void saveOutput()}
            preview={preview}
            savedFilePath={savedFilePath}
          />
        </div>
        <StatusBar folderPath={folderPath} generated={generated} phase={phase} preview={preview} />
      </div>
    </div>
  )
}
