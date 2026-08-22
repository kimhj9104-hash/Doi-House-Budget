"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { applyDueRecurringTransactions } from "@/lib/data/applyRecurring";
import type {
  Category,
  Household,
  HouseholdMember,
  Note,
  PaymentMethod,
  RecurringTransaction,
} from "@/lib/types";

type AuthContextValue = {
  ready: boolean;
  error: string | null;
  user: User | null;
  householdId: string | null;
  household: Household | null;
  members: HouseholdMember[];
  categories: Category[];
  recurringTransactions: RecurringTransaction[];
  paymentMethods: PaymentMethod[];
  notes: Note[];
};

const AuthContext = createContext<AuthContextValue>({
  ready: false,
  error: null,
  user: null,
  householdId: null,
  household: null,
  members: [],
  categories: [],
  recurringTransactions: [],
  paymentMethods: [],
  notes: [],
});

function describeFirestoreError(err: unknown): string {
  if (err instanceof Error && "code" in err && (err as { code: string }).code === "permission-denied") {
    return "Firestore 접근이 거부됐어요. firestore.rules를 Firebase 콘솔의 규칙(Rules) 탭에 붙여넣고 게시(Publish)했는지 확인해주세요.";
  }
  return err instanceof Error ? err.message : "데이터를 불러오지 못했어요";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authResolved, setAuthResolved] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [membershipResolved, setMembershipResolved] = useState(false);
  const [householdId, setHouseholdId] = useState<string | null>(null);

  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [householdDataResolved, setHouseholdDataResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const appliedRecurringForHousehold = useRef<string | null>(null);
  const lastHouseholdIdForRetry = useRef<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthResolved(true);
      if (!u) {
        setMembershipResolved(true);
        setHouseholdId(null);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- must clear stale membership before resubscribing on user change
    setMembershipResolved(false);
    return onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        setHouseholdId(snap.exists() ? (snap.data().householdId as string) : null);
        setMembershipResolved(true);
      },
      (err) => {
        setError(describeFirestoreError(err));
        setMembershipResolved(true);
      },
    );
  }, [user]);

  useEffect(() => {
    if (householdId !== lastHouseholdIdForRetry.current) {
      lastHouseholdIdForRetry.current = householdId;
      setRetryKey(0);
    }
  }, [householdId]);

  useEffect(() => {
    if (!householdId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear previous household's data when leaving/switching households
      setHousehold(null);
      setMembers([]);
      setCategories([]);
      setRecurringTransactions([]);
      setPaymentMethods([]);
      setNotes([]);
      setHouseholdDataResolved(true);
      return;
    }

    setHouseholdDataResolved(false);
    setError(null);
    let gotHousehold = false;
    let gotMembers = false;
    let gotCategories = false;
    let gotRecurring = false;
    let gotPaymentMethods = false;
    let gotNotes = false;
    const checkDone = () => {
      if (
        gotHousehold &&
        gotMembers &&
        gotCategories &&
        gotRecurring &&
        gotPaymentMethods &&
        gotNotes
      ) {
        setHouseholdDataResolved(true);
      }
    };

    const MAX_RETRIES = 4;
    const isPermissionDenied = (err: unknown) =>
      err instanceof Error && "code" in err && (err as { code: string }).code === "permission-denied";

    const onError = (err: unknown) => {
      // 가구를 막 만든 직후에는 방금 쓴 members 문서가 보안 규칙(exists() 검사)에
      // 아주 잠깐 반영되지 않아 일시적으로 permission-denied가 날 수 있다.
      // 이 경우 에러로 바로 보여주지 않고 잠깐 기다렸다가 다시 구독한다.
      if (isPermissionDenied(err) && retryKey < MAX_RETRIES) {
        setTimeout(() => setRetryKey((k) => k + 1), 1000 * (retryKey + 1));
        return;
      }
      setError(describeFirestoreError(err));
      gotHousehold = true;
      gotMembers = true;
      gotCategories = true;
      gotRecurring = true;
      gotPaymentMethods = true;
      gotNotes = true;
      checkDone();
    };

    const unsubHousehold = onSnapshot(
      doc(db, "households", householdId),
      (snap) => {
        if (snap.exists()) {
          setHousehold({ id: snap.id, ...(snap.data() as Omit<Household, "id">) });
        }
        gotHousehold = true;
        checkDone();
      },
      onError,
    );

    const unsubMembers = onSnapshot(
      collection(db, "households", householdId, "members"),
      (snap) => {
        setMembers(
          snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<HouseholdMember, "uid">) })),
        );
        gotMembers = true;
        checkDone();
      },
      onError,
    );

    const unsubCategories = onSnapshot(
      query(
        collection(db, "households", householdId, "categories"),
        orderBy("sortOrder", "asc"),
      ),
      (snap) => {
        setCategories(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, "id">) })),
        );
        gotCategories = true;
        checkDone();
      },
      onError,
    );

    const unsubRecurring = onSnapshot(
      collection(db, "households", householdId, "recurringTransactions"),
      (snap) => {
        setRecurringTransactions(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RecurringTransaction, "id">) })),
        );
        gotRecurring = true;
        checkDone();
      },
      onError,
    );

    const unsubPaymentMethods = onSnapshot(
      query(
        collection(db, "households", householdId, "paymentMethods"),
        orderBy("sortOrder", "asc"),
      ),
      (snap) => {
        setPaymentMethods(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PaymentMethod, "id">) })),
        );
        gotPaymentMethods = true;
        checkDone();
      },
      onError,
    );

    const unsubNotes = onSnapshot(
      query(
        collection(db, "households", householdId, "notes"),
        orderBy("createdAt", "desc"),
      ),
      (snap) => {
        setNotes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Note, "id">) })));
        gotNotes = true;
        checkDone();
      },
      onError,
    );

    return () => {
      unsubHousehold();
      unsubMembers();
      unsubCategories();
      unsubRecurring();
      unsubPaymentMethods();
      unsubNotes();
    };
  }, [householdId, retryKey]);

  useEffect(() => {
    if (!householdId || !user || recurringTransactions.length === 0) return;
    // recurringIds가 이전 실행과 같으면 건너뛴다 (매 스냅샷마다 다시 돌 필요는 없지만,
    // 새 고정 항목이 추가되거나 활성화 상태가 바뀌면 다시 확인해야 한다)
    const key = recurringTransactions
      .map((r) => `${r.id}:${r.active}`)
      .sort()
      .join(",");
    if (appliedRecurringForHousehold.current === `${householdId}:${key}`) return;
    appliedRecurringForHousehold.current = `${householdId}:${key}`;
    applyDueRecurringTransactions(householdId, user.uid, recurringTransactions).catch(() => {
      appliedRecurringForHousehold.current = null;
    });
  }, [householdId, user, recurringTransactions]);

  const ready = authResolved && membershipResolved && householdDataResolved;

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      error,
      user,
      householdId,
      household,
      members,
      categories,
      recurringTransactions,
      paymentMethods,
      notes,
    }),
    [
      ready,
      error,
      user,
      householdId,
      household,
      members,
      categories,
      recurringTransactions,
      paymentMethods,
      notes,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
