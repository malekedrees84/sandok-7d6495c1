export interface Member {
  id: string;
  name: string;
  phone: string;
  joinDate: string;
  paidUntil: string;
  totalPaid: number;
  lastReminderDate?: string;
  status: 'active' | 'inactive';
  profileImage?: string;
  headMemberId?: string;
}

export interface PaymentTransaction {
  id: string;
  memberId: string;
  amount: number;
  date: string;
  monthsCovered: number;
  previousPaidUntil: string;
  newPaidUntil: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface VisitorLog {
  phone: string;
  timestamp: string;
}

export interface TreasuryTransaction {
  id: string;
  holder: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: number;
  description: string;
  date: string;
}

export const TREASURY_HOLDERS = ['مالك', 'معين', 'مؤيد'] as const;

export interface Announcement {
  id: string;
  text: string;
  image?: string;
  createdAt: string;
  active: boolean;
}

export type UserRole = 'admin' | 'moderator';

export interface AppUser {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
}

export interface AppSessionUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

export const DEFAULT_APP_USERS: AppUser[] = [
  { id: 'admin-main', username: 'Admin', password: 'Admin123', displayName: 'Admin', role: 'admin' },
  { id: 'malek-owner', username: 'malek', password: 'Aa100300', displayName: 'malek', role: 'admin' },
  { id: 'edrees-moderator', username: 'edrees', password: '123456', displayName: 'Edrees', role: 'moderator' },
];

export const USER_MANAGER_USERNAME = 'malek';
export const MONTHLY_FEE = 50;
export const START_DATE = '2023-07-10';
export const ADMIN_USERNAME = "Admin";
export const ADMIN_PASSWORD = "Admin123";
export const MODERATOR_USERNAME = "edrees";
export const MODERATOR_PASSWORD = "123456";
