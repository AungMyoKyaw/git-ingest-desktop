export class GitIngestError extends Error {
  code: string
  userMessage: string
  detail?: string

  constructor(code: string, userMessage: string, detail?: string) {
    super(userMessage)
    this.name = 'GitIngestError'
    this.code = code
    this.userMessage = userMessage
    this.detail = detail
  }
}

export class AppError extends GitIngestError {}

export function toGitIngestError(error: unknown) {
  if (error instanceof GitIngestError || error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new GitIngestError('UNEXPECTED_ERROR', 'Something went wrong while processing the project.', error.message)
  }

  return new GitIngestError('UNEXPECTED_ERROR', 'Something went wrong while processing the project.')
}
