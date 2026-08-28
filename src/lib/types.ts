export type TransactionType = "income" | "expense";

export type Household = {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: number;
  fiscalStartDay?: number;
  // 사용자가 설정 화면에서 올린 앱 아이콘 (512x512 정사각형 PNG/JPEG data URL)
  appIconDataUrl?: string;
  appIconUpdatedAt?: number;
};

export type HouseholdMember = {
  uid: string;
  displayName: string;
  joinedAt: number;
};

export type Category = {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  sortOrder: number;
};

export type PaymentMethod = {
  id: string;
  name: string;
  icon: string;
  color: string;
  note: string;
  sortOrder: number;
};

export type Transaction = {
  id: string;
  uid: string;
  categoryId: string | null;
  paymentMethodId?: string | null;
  type: TransactionType;
  amount: number;
  memo: string;
  note: string;
  occurredOn: string;
  createdAt: number;
  recurringId?: string | null;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  uid: string;
  createdAt: number;
  updatedAt?: number;
};

export type RecurringTransaction = {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  categoryId: string | null;
  paymentMethodId?: string | null;
  memo: string;
  note: string;
  dayOfMonth: number;
  active: boolean;
  createdAt: number;
  sortOrder?: number;
};

export type GoogleCalendarIntegration = {
  connected: boolean;
  connectedByUid?: string;
  connectedAt?: number;
  calendarSummary?: string;
};

export type GoogleCalendarEvent = {
  id: string;
  date: string;
  title: string;
  time?: string;
};
