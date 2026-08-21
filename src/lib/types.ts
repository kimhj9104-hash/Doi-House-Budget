export type TransactionType = "income" | "expense";

export type Household = {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: number;
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

export type RecurringTransaction = {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  categoryId: string | null;
  memo: string;
  dayOfMonth: number;
  active: boolean;
  createdAt: number;
};
