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

export interface Announcement {
  id: string;
  text: string;
  image?: string;
  createdAt: string;
  active: boolean;
}

export const MONTHLY_FEE = 50;
export const START_DATE = '2023-07-10';
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "Aa100300";
export const MODERATOR_USERNAME = "edrees";
export const MODERATOR_PASSWORD = "123456";
