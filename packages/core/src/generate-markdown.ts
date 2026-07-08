import type { IncludedFile, ProjectSummary } from './types.js';

function buildTree(files: IncludedFile[]) {
  return files.map((file) => `- ${file.relativePath}`).join('\n');
}

export function generateMarkdown(summary: ProjectSummary) {
  const sections: string[] = [];

  sections.push('# Project Overview');
  sections.push('');
  sections.push(`- Project: ${summary.projectName}`);
  sections.push(`- Root: ${summary.rootDir}`);
  sections.push(`- Included files: ${summary.includedFiles.length}`);
  sections.push(`- Skipped files: ${summary.skippedFiles.length}`);
  sections.push(`- Ignored directories: ${summary.ignoredDirectories.length}`);

  if (summary.warnings.length > 0) {
    sections.push('');
    sections.push('## Warnings');
    sections.push('');
    summary.warnings.forEach((warning) => sections.push(`- ${warning}`));
  }

  sections.push('');
  sections.push('## File Tree');
  sections.push('');
  sections.push('```text');
  sections.push(buildTree(summary.includedFiles));
  sections.push('```');

  sections.push('');
  sections.push('## File Contents');

  summary.includedFiles.forEach((file) => {
    sections.push('');
    sections.push(`## ${file.relativePath}`);
    sections.push('');
    sections.push(`\`\`\`${file.language}`);
    sections.push(file.content ?? '');
    sections.push('```');
  });

  return `${sections.join('\n').trim()}\n`;
}
