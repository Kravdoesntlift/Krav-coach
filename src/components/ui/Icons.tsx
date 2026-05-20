// Premium SVG icon set — clean geometric line icons
// All icons: 24×24 viewBox, strokeWidth 1.8, strokeLinecap/Join round

type IconProps = { size?: number; className?: string };
const d = (size = 22, className = "") => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.8,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  className,
});

export function DumbbellIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <path d="M6.5 6.5h11M6.5 17.5h11" />
      <circle cx="4" cy="6.5" r="2" />
      <circle cx="20" cy="6.5" r="2" />
      <circle cx="4" cy="17.5" r="2" />
      <circle cx="20" cy="17.5" r="2" />
      <line x1="4" y1="6.5" x2="4" y2="17.5" />
      <line x1="20" y1="6.5" x2="20" y2="17.5" />
      <line x1="9" y1="8" x2="9" y2="16" strokeWidth="2.5" />
      <line x1="15" y1="8" x2="15" y2="16" strokeWidth="2.5" />
    </svg>
  );
}

export function ClipboardIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <rect x="5" y="4" width="14" height="17" rx="2.5" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="13" y2="14" />
    </svg>
  );
}

export function ChatIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function ChartIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function UserIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function CalendarIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <rect x="3" y="4" width="18" height="18" rx="2.5" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function TrophyIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <path d="M6 9H3.5a2.5 2.5 0 0 0 0 5H6" />
      <path d="M18 9h2.5a2.5 2.5 0 0 1 0 5H18" />
      <path d="M6 4h12v10a6 6 0 0 1-12 0V4z" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="9" y1="22" x2="15" y2="22" />
    </svg>
  );
}

export function StarIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function CameraIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function FileIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export function BellIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function FlameIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <path d="M8.5 14.5A4.5 4.5 0 0 0 17 12c0-4.42-4-8-4-8S7 7.58 7 12a5 5 0 0 0 1.5 3.5" />
      <path d="M10.5 17.5a2.5 2.5 0 1 0 3 0c-.5-1.5-1.5-2-1.5-2s-1 .5-1.5 2z" />
    </svg>
  );
}

export function PlusIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function CheckIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function ArrowRightIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function TargetIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function BotIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <rect x="3" y="8" width="18" height="12" rx="3" />
      <path d="M9 12h.01M15 12h.01" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M9 16h6" />
      <path d="M12 8V5" />
      <circle cx="12" cy="4" r="1.2" />
    </svg>
  );
}

export function DownloadFileIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <polyline points="8 15 12 19 16 15" />
      <line x1="12" y1="11" x2="12" y2="19" />
    </svg>
  );
}

export function ForkKnifeIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <path d="M3 2v7c0 1.7 1.3 3 3 3s3-1.3 3-3V2" />
      <line x1="6" y1="2" x2="6" y2="22" />
      <path d="M21 2c0 0-4 2-4 9.5V22" />
      <path d="M17 11.5V2" />
    </svg>
  );
}

export function UsersIcon({ size, className }: IconProps) {
  return (
    <svg {...d(size, className)}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
