import type { ReactElement, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function IconShell({ children, ...props }: IconProps): ReactElement {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      {children}
    </svg>
  );
}

export function CheckIcon(props: IconProps): ReactElement {
  return (
    <IconShell {...props}>
      <path d="m5 12 4 4L19 6" />
    </IconShell>
  );
}

export function ClockIcon(props: IconProps): ReactElement {
  return (
    <IconShell {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </IconShell>
  );
}

export function CopyIcon(props: IconProps): ReactElement {
  return (
    <IconShell {...props}>
      <rect height="11" rx="2" width="11" x="8" y="8" />
      <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </IconShell>
  );
}

export function ExternalIcon(props: IconProps): ReactElement {
  return (
    <IconShell {...props}>
      <path d="M14 4h6v6" />
      <path d="m10 14 10-10" />
      <path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" />
    </IconShell>
  );
}

export function FileIcon(props: IconProps): ReactElement {
  return (
    <IconShell {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
    </IconShell>
  );
}

export function FolderIcon(props: IconProps): ReactElement {
  return (
    <IconShell {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </IconShell>
  );
}

export function PlayIcon(props: IconProps): ReactElement {
  return (
    <IconShell {...props}>
      <path d="m8 5 11 7-11 7Z" />
    </IconShell>
  );
}

export function SearchIcon(props: IconProps): ReactElement {
  return (
    <IconShell {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </IconShell>
  );
}

export function SettingsIcon(props: IconProps): ReactElement {
  return (
    <IconShell {...props}>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 0 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.4 7A2 2 0 0 1 7.2 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 0 1 20 7.2l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2a2 2 0 0 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1Z" />
    </IconShell>
  );
}

export function ShieldIcon(props: IconProps): ReactElement {
  return (
    <IconShell {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </IconShell>
  );
}

export function SidebarIcon(props: IconProps): ReactElement {
  return (
    <IconShell {...props}>
      <rect height="16" rx="2" width="18" x="3" y="4" />
      <path d="M9 4v16" />
    </IconShell>
  );
}

export function TableIcon(props: IconProps): ReactElement {
  return (
    <IconShell {...props}>
      <rect height="16" rx="2" width="18" x="3" y="4" />
      <path d="M3 10h18" />
      <path d="M9 10v10" />
    </IconShell>
  );
}

export function XIcon(props: IconProps): ReactElement {
  return (
    <IconShell {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </IconShell>
  );
}
