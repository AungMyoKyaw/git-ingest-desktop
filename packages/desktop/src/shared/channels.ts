export const IPC_CHANNELS = {
  chooseFolder: 'dialog:choose-folder',
  previewProject: 'project:preview',
  generateProject: 'project:generate',
  copyOutput: 'output:copy',
  saveOutput: 'output:save',
  openExternal: 'shell:open-external',
  revealFile: 'shell:reveal-file',
  getState: 'state:get',
} as const;
