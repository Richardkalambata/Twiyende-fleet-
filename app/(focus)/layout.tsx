import { PhoneShell } from '@/components/shell';

export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return <PhoneShell>{children}</PhoneShell>;
}
