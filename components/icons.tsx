type IconProps = { className?: string };

function base(path: string, className?: string) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'h-6 w-6'} aria-hidden>
      <path d={path} />
    </svg>
  );
}

export function BusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className ?? 'h-6 w-6'} aria-hidden>
      <rect x="4" y="4" width="16" height="13" rx="2" />
      <path d="M4 10h16M7 17v2M17 17v2M7 7h3" strokeLinecap="round" />
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return base('M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z', className);
}

export function RidesIcon({ className }: IconProps) {
  return base('M4 7h16v10H4zM8 7V5h8v2M8 12h8M8 15h5', className);
}

export function LostIcon({ className }: IconProps) {
  return base('M12 21s7-4.4 7-10a7 7 0 1 0-14 0c0 5.6 7 10 7 10zM12 11.2a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z', className);
}

export function UserIcon({ className }: IconProps) {
  return base('M12 12a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 12zM5 19.2a7 7 0 0 1 14 0', className);
}

export function BellIcon({ className }: IconProps) {
  return base('M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 19a2 2 0 0 0 4 0', className);
}

export function QrIcon({ className }: IconProps) {
  return base('M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-6v-2h4z', className);
}

export function ArrowIcon({ className }: IconProps) {
  return base('M5 12h14M13 6l6 6-6 6', className);
}

export function BackIcon({ className }: IconProps) {
  return base('M15 5 8 12l7 7', className);
}

export function CheckIcon({ className }: IconProps) {
  return base('M5 12.5 9.2 17 19 7', className);
}

export function ShieldIcon({ className }: IconProps) {
  return base('M12 3 5 6v6c0 4.2 2.8 7.2 7 8.5 4.2-1.3 7-4.3 7-8.5V6zM9 12l2 2 4-4', className);
}

export function ClockIcon({ className }: IconProps) {
  return base('M12 7v5l3 2M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9z', className);
}

export function ChartIcon({ className }: IconProps) {
  return base('M4 19h16M7 16V9M12 16V5M17 16v-4', className);
}

export function TicketIcon({ className }: IconProps) {
  return base('M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2a2 2 0 0 1 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z', className);
}

export function UsersIcon({ className }: IconProps) {
  return base('M9 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM16 11a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 16 11zM3.5 19a5.5 5.5 0 0 1 11 0M14 19a4.5 4.5 0 0 1 6.5-4', className);
}

export function WalletIcon({ className }: IconProps) {
  return base('M4 7h16v12H4zM4 10h16M16 14h2', className);
}

export function GearIcon({ className }: IconProps) {
  return base('M12 15.5a3.5 3.5 0 1 0-3.5-3.5 3.5 3.5 0 0 0 3.5 3.5zM12 3.5v2M12 18.5v2M4.9 6.5l1.5 1.5M17.6 16l1.5 1.5M3.5 12h2M18.5 12h2M4.9 17.5l1.5-1.5M17.6 8l1.5-1.5', className);
}

export function LogoutIcon({ className }: IconProps) {
  return base('M10 7V5H5v14h5v-2M10 12H20M16 8l4 4-4 4', className);
}

export function CameraIcon({ className }: IconProps) {
  return base('M4 8h3l1.5-2h7L17 8h3v11H4zM12 16.5a3 3 0 1 0-3-3 3 3 0 0 0 3 3z', className);
}

export function PhoneIcon({ className }: IconProps) {
  return base('M8 3h8v18H8zM11 18h2', className);
}

export function BagIcon({ className }: IconProps) {
  return base('M6 8h12l-1 12H7zM9 8V6a3 3 0 0 1 6 0v2', className);
}

export function IdIcon({ className }: IconProps) {
  return base('M4 6h16v12H4zM8 11h4M8 14h8M16 10.5a1.2 1.2 0 1 0 .1 0z', className);
}

export function KeyIcon({ className }: IconProps) {
  return base('M8 15a4 4 0 1 1 3.5-6H21v3h-2v2h-2v2h-3.2A4 4 0 0 1 8 15z', className);
}

export function UmbrellaIcon({ className }: IconProps) {
  return base('M12 4c5 0 8 3.2 8 6H4c0-2.8 3-6 8-6zM12 10v8a2 2 0 0 0 4 0', className);
}

export function DotsIcon({ className }: IconProps) {
  return base('M6 12h.01M12 12h.01M18 12h.01', className);
}

export function CloseIcon({ className }: IconProps) {
  return base('M6 6l12 12M18 6 6 18', className);
}

export function MenuIcon({ className }: IconProps) {
  return base('M5 7h14M5 12h14M5 17h14', className);
}

export function PinIcon({ className }: IconProps) {
  return base('M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z', className);
}

export function PlusIcon({ className }: IconProps) {
  return base('M12 6v12M6 12h12', className);
}

export function PencilIcon({ className }: IconProps) {
  return base('M4 20h4l10-10-4-4L4 16zM13 7l4 4', className);
}

const CATEGORY_ICONS = {
  phone: PhoneIcon,
  bag: BagIcon,
  wallet: WalletIcon,
  id: IdIcon,
  keys: KeyIcon,
  umbrella: UmbrellaIcon,
  other: DotsIcon,
} as const;

export function CategoryIcon({ id, className }: { id: string; className?: string }) {
  const Icon = CATEGORY_ICONS[id as keyof typeof CATEGORY_ICONS] ?? DotsIcon;
  return <Icon className={className} />;
}
