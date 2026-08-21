"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
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
import type { Category, Household, HouseholdMember } from "@/lib/types";

type AuthContextValue = {
  ready: boolean;
  error: string | null;
  user: User | null;
  householdId: string | null;
  household: Household | null;
  members: HouseholdMember[];
  categories: Category[];
};

const AuthContext = createContext<AuthContextValue>({
  ready: false,
  error: null,
  user: null,
  householdId: null,
  household: null,
  members: [],
  categories: [],
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
  const [householdDataResolved, setHouseholdDataResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!householdId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear previous household's data when leaving/switching households
      setHousehold(null);
      setMembers([]);
      setCategories([]);
      setHouseholdDataResolved(true);
      return;
    }

    setHouseholdDataResolved(false);
    let gotHousehold = false;
    let gotMembers = false;
    let gotCategories = false;
    const checkDone = () => {
      if (gotHousehold && gotMembers && gotCategories) setHouseholdDataResolved(true);
    };

    const onError = (err: unknown) => {
      setError(describeFirestoreError(err));
      gotHousehold = true;
      gotMembers = true;
      gotCategories = true;
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

    return () => {
      unsubHousehold();
      unsubMembers();
      unsubCategories();
    };
  }, [householdId]);

  const ready = authResolved && membershipResolved && householdDataResolved;

  const value = useMemo<AuthContextValue>(
    () => ({ ready, error, user, householdId, household, members, categories }),
    [ready, error, user, householdId, household, members, categories],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
