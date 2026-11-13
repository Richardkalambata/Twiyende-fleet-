import {
  ArrowRight,
  Bell,
  Bus,
  Camera,
  Check,
  ChevronLeft,
  Clock,
  Home,
  IdCard,
  KeyRound,
  LogOut,
  MapPin,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  QrCode,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Ticket,
  TrendingUp,
  Umbrella,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';

type IconProps = { className?: string };

function icon(Icon: typeof Bus) {
  return function Wrapped({ className }: IconProps) {
    return <Icon className={className ?? 'h-5 w-5'} strokeWidth={1.75} aria-hidden />;
  };
}

export const BusIcon = icon(Bus);
export const HomeIcon = icon(Home);
export const RidesIcon = icon(Ticket);
export const LostIcon = icon(MapPin);
export const UserIcon = icon(User);
export const BellIcon = icon(Bell);
export const QrIcon = icon(QrCode);
export const ArrowIcon = icon(ArrowRight);
export const BackIcon = icon(ChevronLeft);
export const CheckIcon = icon(Check);
export const ShieldIcon = icon(ShieldCheck);
export const ClockIcon = icon(Clock);
export const ChartIcon = icon(TrendingUp);
export const TicketIcon = icon(Ticket);
export const UsersIcon = icon(Users);
export const WalletIcon = icon(Wallet);
export const GearIcon = icon(Settings);
export const LogoutIcon = icon(LogOut);
export const CameraIcon = icon(Camera);
export const PhoneIcon = icon(Smartphone);
export const BagIcon = icon(ShoppingBag);
export const IdIcon = icon(IdCard);
export const KeyIcon = icon(KeyRound);
export const UmbrellaIcon = icon(Umbrella);
export const DotsIcon = icon(MoreHorizontal);
export const CloseIcon = icon(X);
export const MenuIcon = icon(Menu);
export const PinIcon = icon(MapPin);
export const PlusIcon = icon(Plus);
export const PencilIcon = icon(Pencil);

const CATEGORY = {
  phone: PhoneIcon,
  bag: BagIcon,
  wallet: WalletIcon,
  id: IdIcon,
  keys: KeyIcon,
  umbrella: UmbrellaIcon,
  other: DotsIcon,
} as const;

export function CategoryIcon({ id, className }: { id: string; className?: string }) {
  const Icon = CATEGORY[id as keyof typeof CATEGORY] ?? DotsIcon;
  return <Icon className={className} />;
}
