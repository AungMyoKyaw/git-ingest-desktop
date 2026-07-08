import { access, stat } from 'node:fs/promises';

import { AppError } from '@git-ingest/core';

export async function validateExistingFilePath(filePath: unknown) {
  if (typeof filePath !== 'string' || filePath.trim().length === 0) {
    throw new AppError(
      'INVALID_FILE',
      'Choose a generated file before opening it.',
      'filePath must be a string',
    );
  }

  try {
    await access(filePath);
    const details = await stat(filePath);
    if (!details.isFile()) {
      throw new AppError(
        'INVALID_FILE',
        'Choose a generated file before opening it.',
        `${filePath} is not a file`,
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('MISSING_FILE', 'The saved file could not be found.', String(error));
  }

  return filePath;
}
