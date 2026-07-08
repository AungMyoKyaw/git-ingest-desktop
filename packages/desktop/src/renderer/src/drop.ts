export type DropSelection =
  | { kind: 'folder'; path: string }
  | {
      kind: 'error';
      code: 'EMPTY_DROP' | 'MULTI_DROP' | 'FILE_DROP' | 'DROP_UNSUPPORTED';
      message: string;
    };

export interface DropSelectionInput {
  files: Array<{ path?: string; type?: string }>;
  items: Array<{ kind: string }>;
}

export function resolveDropSelection(input: DropSelectionInput): DropSelection {
  if (input.files.length === 0) {
    return { kind: 'error', code: 'EMPTY_DROP', message: 'Drop a folder to scan.' };
  }

  if (input.files.length > 1) {
    return { kind: 'error', code: 'MULTI_DROP', message: 'Drop one folder at a time.' };
  }

  const dropped = input.files[0];
  if (!dropped.path) {
    return {
      kind: 'error',
      code: 'DROP_UNSUPPORTED',
      message: 'Use Choose Folder if this drop target cannot provide a folder path.',
    };
  }

  if (dropped.type) {
    return { kind: 'error', code: 'FILE_DROP', message: 'Drop a folder, not an individual file.' };
  }

  return { kind: 'folder', path: dropped.path };
}
