export type Role = 'passenger' | 'conductor' | 'operator';
export type RangeKey = 'today' | 'week' | 'month';
export type RideStatus = 'pending' | 'verified' | 'void';
export type LostStatus = 'reported' | 'waiting' | 'not_found' | 'pickup_pending' | 'closed';

export type PublicUser = {
  id: string;
  name: string;
  shortName: string;
  phone: string;
  role: Role;
  initials: string;
  demo: boolean;
  payoutPhone: string | null;
  payoutNetwork: string | null;
};

export type DemoAccount = {
  id: string;
  name: string;
  shortName: string;
  role: Role;
  phone: string;
  detail: string;
};

export type Notice = {
  id: string;
  href: string;
  title: string;
  body: string;
};

export type RideCard = {
  id: string;
  fleetNumber: string;
  route: string;
  amountNgwee: number;
  status: RideStatus;
  createdAt: number;
  whenLabel: string;
  code: string;
};

export type BusOption = {
  fleetNumber: string;
  route: string;
  status: 'active' | 'offline';
};

export type Receipt = {
  id: string;
  code: string;
  fleetNumber: string;
  route: string;
  amountNgwee: number;
  status: RideStatus;
  createdAt: number;
  verifiedAt: number | null;
  balanceNgwee: number;
};

export type WalletActivity = {
  id: string;
  type: string;
  amountNgwee: number;
  balanceAfter: number;
  note: string;
  createdAt: number;
};

export type LostSummary = {
  id: string;
  category: string;
  description: string;
  status: LostStatus;
  fleetNumber: string;
  route: string;
  createdAt: number;
  whenLabel: string;
};

export type PassengerLostDetail = {
  id: string;
  category: string;
  description: string;
  status: LostStatus;
  fleetNumber: string;
  route: string;
  conductorName: string | null;
  conductorPhone: string | null;
  pickupCode: string | null;
  pickupPlace: string | null;
  pickupUntil: number | null;
  pickupUntilLabel: string | null;
  photoData: string | null;
  tipNgwee: number;
  balanceNgwee: number;
  smsSent: boolean;
};

export type ConductorAlert = {
  id: string;
  category: string;
  description: string;
  tripLabel: string;
};

export type ConductorItem = {
  id: string;
  category: string;
  description: string;
  status: LostStatus;
  meta: string;
};

export type ChartPoint = {
  label: string;
  value: number;
};

export type BusPerformance = {
  id: string;
  fleetNumber: string;
  plate: string;
  route: string;
  status: 'active' | 'offline';
  conductorId: string | null;
  conductorName: string | null;
  conductorInitials: string | null;
  rides: number;
  earningsNgwee: number;
};

export type Dashboard = {
  range: RangeKey;
  totalNgwee: number;
  previousNgwee: number;
  rides: number;
  previousRides: number;
  activeBuses: number;
  totalBuses: number;
  nextPayoutNgwee: number;
  chart: ChartPoint[];
  buses: BusPerformance[];
  topConductor: { name: string; initials: string; earningsNgwee: number; rides: number } | null;
  openLost: number;
  routes: { fleetNumber: string; route: string }[];
};

export type ConductorOption = {
  id: string;
  shortName: string;
  phone: string;
  busFleet: string | null;
};

export type PayoutRow = {
  id: string;
  amountNgwee: number;
  status: string;
  network: string;
  destination: string;
  createdAt: number;
};

export type PayoutSummary = {
  availableNgwee: number;
  todayNgwee: number;
  nextPayoutNgwee: number;
  payoutPhone: string | null;
  payoutNetwork: string | null;
  history: PayoutRow[];
};

export type ExportRide = {
  createdAt: number;
  fleetNumber: string;
  plate: string;
  route: string;
  conductor: string;
  passenger: string;
  code: string;
  amountNgwee: number;
  status: string;
};

export type Fail = { ok: false; message: string };
