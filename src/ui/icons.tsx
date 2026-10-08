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
