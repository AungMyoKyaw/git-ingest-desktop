import type { IncludedFile, ProjectSummary } from './types.js';

function buildTree(files: IncludedFile[]) {
  return files.map((file) => `- ${file.relativePath}`).join('\n');
}

export function generateText(summary: ProjectSummary) {
  const sections: string[] = [];

  sections.push('PROJECT OVERVIEW');
  sections.push(`Project: ${summary.projectName}`);
  sections.push(`Root: ${summary.rootDir}`);
  sections.push(`Included files: ${summary.includedFiles.length}`);
  sections.push(`Skipped files: ${summary.skippedFiles.length}`);
  sections.push(`Ignored directories: ${summary.ignoredDirectories.length}`);

  if (summary.warnings.length > 0) {
    sections.push('');
    sections.push('WARNINGS');
    summary.warnings.forEach((warning) => sections.push(`- ${warning}`));
  }

  sections.push('');
  sections.push('FILE TREE');
  sections.push(buildTree(summary.includedFiles));
  sections.push('');
  sections.push('FILE CONTENTS');

  summary.includedFiles.forEach((file: IncludedFile) => {
    sections.push('');
    sections.push(`--- ${file.relativePath} ---`);
    sections.push(file.content ?? '');
  });

  return `${sections.join('\n').trim()}\n`;
}
