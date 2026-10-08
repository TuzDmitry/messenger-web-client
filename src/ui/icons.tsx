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
