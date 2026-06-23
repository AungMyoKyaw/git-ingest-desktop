import { randomUUID } from 'node:crypto'

import { generateProjectOutput, toGitIngestError, type GenerateProjectResult, type ProgressEvent, type ScanProjectOptions } from '@git-ingest/core'

export interface GenerationProgressMessage extends ProgressEvent {
  requestId: string
}

export type GenerationFinishedMessage =
  | { requestId: string; status: 'success'; result: GenerateProjectResult }
  | { requestId: string; status: 'cancelled'; error: { code: string; userMessage: string; detail: string | null } }
  | { requestId: string; status: 'error'; error: { code: string; userMessage: string; detail: string | null } }

export interface GenerationSessionCallbacks {
  onProgress: (message: GenerationProgressMessage) => void
  onFinished: (message: GenerationFinishedMessage) => void
}

export function createGenerationManager(callbacks: GenerationSessionCallbacks) {
  let active: { requestId: string; controller: AbortController } | null = null

  async function start(options: ScanProjectOptions) {
    if (active) {
      active.controller.abort()
    }

    const controller = new AbortController()
    const requestId = randomUUID()
    active = { requestId, controller }

    void generateProjectOutput({
      ...options,
      signal: controller.signal,
      onProgress: (event) => {
        if (active?.requestId !== requestId) {
          return
        }

        callbacks.onProgress({ requestId, ...event })
      }
    })
      .then((result) => {
        if (active?.requestId !== requestId) {
          return
        }

        active = null
        callbacks.onFinished({ requestId, status: 'success', result })
      })
      .catch((error) => {
        if (active?.requestId !== requestId) {
          return
        }

        active = null
        const normalized = toGitIngestError(error)
        callbacks.onFinished({
          requestId,
          status: normalized.code === 'CANCELLED' ? 'cancelled' : 'error',
          error: {
            code: normalized.code,
            userMessage: normalized.userMessage,
            detail: normalized.detail ?? null
          }
        })
      })

    return requestId
  }

  function cancel(requestId: string) {
    if (active?.requestId !== requestId) {
      return false
    }

    active.controller.abort()
    return true
  }

  function getActiveRequestId() {
    return active?.requestId ?? null
  }

  return { start, cancel, getActiveRequestId }
}
