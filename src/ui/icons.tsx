import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export function ChatsIcon(props: IconProps) {
  return (
    <svg
      {...base}
      {...props}
    >
      <path d="M4 5h16v11H9l-5 4z" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg
      {...base}
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <svg
      {...base}
      {...props}
    >
      <circle
        cx="12"
        cy="8"
        r="4"
      />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg
      {...base}
      {...props}
    >
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10" />
    </svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <svg
      {...base}
      {...props}
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg
      {...base}
      {...props}
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg
      {...base}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="8"
      />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg
      {...base}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="8"
      />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  );
}

export function BackIcon(props: IconProps) {
  return (
    <svg
      {...base}
      {...props}
    >
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}
