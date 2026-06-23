import { useEffect, useMemo, useRef, useState } from 'react'

import { resolveDropSelection } from './drop'
import type { DesktopError, GenerateResult, GenerationFinishedMessage, GenerationProgressMessage, PreviewResult } from './env'

function bytesToMegabytes(value: number) {
  return Number((value / (1024 * 1024)).toFixed(1))
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function projectNameFromPath(folderPath: string) {
  return folderPath.split(/[\\/]/).filter(Boolean).at(-1) ?? 'project'
}

export function App() {
  const [folderPath, setFolderPath] = useState('')
  const [format, setFormat] = useState<'markdown' | 'text'>('markdown')
  const [maxFileSizeMb, setMaxFileSizeMb] = useState('10')
  const [includePatterns, setIncludePatterns] = useState<string[]>([])
  const [excludePatterns, setExcludePatterns] = useState<string[]>([])
  const [includeInput, setIncludeInput] = useState('')
  const [excludeInput, setExcludeInput] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [generated, setGenerated] = useState<GenerateResult | null>(null)
  const [recentProjects, setRecentProjects] = useState<Array<{ path: string; name: string; lastOpenedAt: string }>>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState<DesktopError | null>(null)
  const [phase, setPhase] = useState('')
  const [progressCounts, setProgressCounts] = useState<{ processed?: number; total?: number }>({})
  const [busy, setBusy] = useState(false)
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null)
  const activeRequestIdRef = useRef<string | null>(null)

  useEffect(() => {
    activeRequestIdRef.current = activeRequestId
  }, [activeRequestId])

  useEffect(() => {
    void window.gitIngest.getState().then((state) => {
      setRecentProjects(state.recentProjects)
      setFolderPath(state.lastFolderPath ?? '')
      setFormat(state.settings.format)
      setMaxFileSizeMb(String(bytesToMegabytes(state.settings.maxFileSizeBytes)))
      setIncludePatterns(state.settings.includePatterns)
      setExcludePatterns(state.settings.excludePatterns)
      setAdvancedOpen(state.settings.advancedOpen)
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

      setBusy(false)
      setActiveRequestId(null)

      if (message.status === 'success') {
        setPhase('done')
        setPreview(message.result)
        setGenerated(message.result)
        setSavedFilePath(null)
        setRecentProjects((current) => {
          const next = [{ path: message.result.rootDir, name: message.result.projectName, lastOpenedAt: new Date().toISOString() }, ...current.filter((entry) => entry.path !== message.result.rootDir)]
          return next.slice(0, 8)
        })
        return
      }

      setPhase('')
      setError(message.error)
      if (message.status === 'cancelled') {
        setMessage('Generation cancelled.')
      }
    })

    return () => {
      stopProgress()
      stopFinished()
    }
  }, [])

  const requestPayload = useMemo(() => ({
    rootDir: folderPath,
    format,
    maxFileSizeBytes: Math.max(1, Math.round(Number(maxFileSizeMb || '0') * 1024 * 1024)),
    includePatterns,
    excludePatterns
  }), [excludePatterns, folderPath, format, includePatterns, maxFileSizeMb])

  function resetFeedback() {
    setMessage('')
    setError(null)
  }

  async function chooseFolder() {
    resetFeedback()
    const result = await window.gitIngest.chooseFolder()
    if (!result.canceled && result.folderPath) {
      setFolderPath(result.folderPath)
      setPreview(null)
      setGenerated(null)
      setSavedFilePath(null)
    }
  }

  function addPattern(kind: 'include' | 'exclude') {
    const value = (kind === 'include' ? includeInput : excludeInput).trim()
    if (!value) return

    if (kind === 'include') {
      setIncludePatterns((current) => [...current, value])
      setIncludeInput('')
      return
    }

    setExcludePatterns((current) => [...current, value])
    setExcludeInput('')
  }

  async function previewProject() {
    resetFeedback()
    setBusy(true)
    setPhase('Scanning preview')
    const result = await window.gitIngest.preview(requestPayload)
    setBusy(false)
    setPhase('')

    if (!result.ok) {
      setError(result.error)
      return
    }

    setPreview(result.result)
    setGenerated(null)
    setSavedFilePath(null)
    setRecentProjects((current) => {
      const next = [{ path: result.result.rootDir, name: result.result.projectName, lastOpenedAt: new Date().toISOString() }, ...current.filter((entry) => entry.path !== result.result.rootDir)]
      return next.slice(0, 8)
    })
  }

  async function generateOutput() {
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
    if (!activeRequestId) return
    await window.gitIngest.cancelGeneration(activeRequestId)
  }

  async function copyOutput() {
    if (!generated) return
    const result = await window.gitIngest.copyOutput(generated.output)
    if (result.ok) {
      setMessage('Copied output to clipboard.')
    }
  }

  async function saveOutput() {
    if (!generated) return
    const result = await window.gitIngest.saveOutput({
      output: generated.output,
      projectName: generated.projectName,
      format: generated.format
    })

    if (result.ok && result.filePath) {
      setSavedFilePath(result.filePath)
      setMessage(`Saved output to ${result.filePath}`)
    }
  }

  async function openSavedFile() {
    if (!savedFilePath) return
    const result = await window.gitIngest.openOutputFile(savedFilePath)
    if (!result.ok && result.error) {
      setError(result.error)
    }
  }

  async function revealSavedFile() {
    if (!savedFilePath) return
    const result = await window.gitIngest.revealOutputFile(savedFilePath)
    if (!result.ok && result.error) {
      setError(result.error)
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
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
    setPreview(null)
    setGenerated(null)
    setSavedFilePath(null)
  }

  return (
    <main className="shell">
      <section
        className={`panel hero ${isDragging ? 'drag-active' : ''}`}
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
      >
        <div>
          <p className="eyebrow">Local only</p>
          <h1>Git-Ingest</h1>
          <p className="subtle">Choose a folder, preview what an AI will see, then copy or save one clean output.</p>
        </div>

        <div className="folder-box">
          <div>
            <div className="label">Selected folder</div>
            <div className="folder-name">{folderPath ? projectNameFromPath(folderPath) : 'No folder selected'}</div>
            <div className="folder-path">{folderPath || 'Drop a folder here or use the button below.'}</div>
          </div>

          <button className="primary" onClick={folderPath ? generateOutput : chooseFolder} disabled={busy}>
            {busy ? 'Generating…' : folderPath ? 'Generate' : 'Choose Folder'}
          </button>
        </div>

        {folderPath ? (
          <div className="toolbar">
            <button onClick={chooseFolder} disabled={busy}>Change Folder</button>
            <button onClick={previewProject} disabled={busy}>Preview</button>
            {busy ? <button onClick={cancelGeneration}>Cancel</button> : null}
            <button onClick={() => setAdvancedOpen((value) => !value)}>{advancedOpen ? 'Hide Advanced' : 'Advanced'}</button>
          </div>
        ) : null}

        {advancedOpen ? (
          <section className="advanced-grid">
            <label>
              <span>Format</span>
              <select value={format} onChange={(event) => setFormat(event.target.value as 'markdown' | 'text')}>
                <option value="markdown">Markdown for ChatGPT / Claude</option>
                <option value="text">Plain text for legacy workflows</option>
              </select>
            </label>

            <label>
              <span>Max file size (MB)</span>
              <input value={maxFileSizeMb} onChange={(event) => setMaxFileSizeMb(event.target.value)} inputMode="decimal" />
            </label>

            <div>
              <span>Include patterns</span>
              <div className="inline-form">
                <input placeholder="*.ts or **/*.md" value={includeInput} onChange={(event) => setIncludeInput(event.target.value)} />
                <button onClick={() => addPattern('include')}>Add</button>
              </div>
              <div className="chips">{includePatterns.map((pattern) => <button key={pattern} className="chip" onClick={() => setIncludePatterns((current) => current.filter((entry) => entry !== pattern))}>{pattern}</button>)}</div>
            </div>

            <div>
              <span>Exclude patterns</span>
              <div className="inline-form">
                <input placeholder="dist/** or *.test.ts" value={excludeInput} onChange={(event) => setExcludeInput(event.target.value)} />
                <button onClick={() => addPattern('exclude')}>Add</button>
              </div>
              <div className="chips">{excludePatterns.map((pattern) => <button key={pattern} className="chip" onClick={() => setExcludePatterns((current) => current.filter((entry) => entry !== pattern))}>{pattern}</button>)}</div>
            </div>
          </section>
        ) : null}

        {phase ? <p className="status">Status: {phase}{progressCounts.processed ? ` (${progressCounts.processed}${progressCounts.total ? ` / ${progressCounts.total}` : ''})` : ''}</p> : null}
        {message ? <p className="message">{message}</p> : null}
        {error ? (
          <details className="error" open>
            <summary>{error.userMessage}</summary>
            {error.detail ? <pre>{error.detail}</pre> : null}
          </details>
        ) : null}
      </section>

      <section className="columns">
        <section className="panel summary">
          <h2>Preview</h2>
          {preview ? (
            <>
              <div className="stats-grid">
                <div><strong>{preview.totalFiles}</strong><span>Total files</span></div>
                <div><strong>{preview.includedFiles.length}</strong><span>Included</span></div>
                <div><strong>{preview.skippedFiles.length}</strong><span>Skipped</span></div>
                <div><strong>{formatBytes(preview.estimatedOutputBytes)}</strong><span>Estimated output</span></div>
              </div>
              {preview.warnings.length > 0 ? <div className="warning-list">{preview.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div> : null}
              <h3>Top file types</h3>
              <ul className="list">{preview.fileTypes.map((entry) => <li key={entry.label}><span>{entry.label}</span><span>{entry.count} files · {entry.percentage}%</span></li>)}</ul>
              <h3>Ignored directories</h3>
              <ul className="list">{preview.ignoredDirectories.map((entry) => <li key={entry.path}><span>{entry.path}</span><span>{entry.reason}</span></li>)}</ul>
            </>
          ) : (
            <p className="subtle">Run a preview to see file counts, ignored folders, and output size before generating.</p>
          )}
        </section>

        <section className="panel output">
          <div className="output-header">
            <div>
              <h2>Output</h2>
              <p className="subtle">Preview the exact generated content before copying it.</p>
            </div>
            <div className="toolbar">
              <button onClick={copyOutput} disabled={!generated}>Copy</button>
              <button onClick={saveOutput} disabled={!generated}>Save As</button>
              <button onClick={openSavedFile} disabled={!savedFilePath}>Open File</button>
              <button onClick={revealSavedFile} disabled={!savedFilePath}>{navigator.platform.includes('Mac') ? 'Reveal in Finder' : 'Show in Folder'}</button>
              <button onClick={() => void window.gitIngest.openExternal('https://github.com/aungmyokyaw/git-ingest')}>
                GitHub
              </button>
            </div>
          </div>

          {generated ? (
            <>
              <div className="output-stats">
                <span>{formatBytes(generated.outputBytes)}</span>
                <span>Approx. {generated.tokenEstimate} tokens</span>
              </div>
              <textarea readOnly value={generated.output} />
            </>
          ) : (
            <p className="subtle">Generated output will appear here.</p>
          )}
        </section>
      </section>

      <section className="panel recent">
        <h2>Recent projects</h2>
        {recentProjects.length === 0 ? (
          <p className="subtle">Your recent folders will appear here after the first preview or generation.</p>
        ) : (
          <ul className="list">{recentProjects.map((project) => <li key={project.path}><button className="recent-button" onClick={() => setFolderPath(project.path)}>{project.name}<span>{project.path}</span></button></li>)}</ul>
        )}
      </section>
    </main>
  )
}
