type IconName = 'learn' | 'quiz' | 'mistakes' | 'progress' | 'arrow' | 'search' | 'close' | 'expand' | 'check' | 'cross';
const paths: Record<IconName, React.ReactNode> = {
  learn: <><path d="M3 5.5c3-1.6 6-1.6 9 0v14c-3-1.6-6-1.6-9 0z"/><path d="M21 5.5c-3-1.6-6-1.6-9 0v14c3-1.6 6-1.6 9 0z"/></>,
  quiz: <><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.3 2.3 4.8-5"/></>,
  mistakes: <><path d="M12 3 2.8 20h18.4z"/><path d="M12 9v5M12 17.2h.01"/></>,
  progress: <><path d="M4 20V12M10 20V7M16 20v-4M22 20V3"/></>,
  arrow: <path d="m15 18-6-6 6-6"/>,
  search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
  close: <path d="M5 5 19 19M19 5 5 19"/>,
  expand: <><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></>,
  check: <path d="m4 12 5 5L20 6"/>,
  cross: <path d="M5 5 19 19M19 5 5 19"/>,
};
export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
