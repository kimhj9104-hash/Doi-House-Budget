import {
  doc,
  collection,
  writeBatch,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const DEFAULT_CATEGORIES: {
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
  sortOrder: number;
}[] = [
  { name: "식비", type: "expense", color: "#e0433f", icon: "utensils", sortOrder: 1 },
  { name: "카페/간식", type: "expense", color: "#f59e0b", icon: "coffee", sortOrder: 2 },
  { name: "교통", type: "expense", color: "#8b5cf6", icon: "car", sortOrder: 3 },
  { name: "주거/공과금", type: "expense", color: "#0891b2", icon: "home", sortOrder: 4 },
  { name: "통신비", type: "expense", color: "#64748b", icon: "smartphone", sortOrder: 5 },
  { name: "쇼핑", type: "expense", color: "#db2777", icon: "shopping-bag", sortOrder: 6 },
  { name: "문화/여가", type: "expense", color: "#7c3aed", icon: "film", sortOrder: 7 },
  { name: "의료/건강", type: "expense", color: "#059669", icon: "heart-pulse", sortOrder: 8 },
  { name: "경조사/선물", type: "expense", color: "#ca8a04", icon: "gift", sortOrder: 9 },
  { name: "기타", type: "expense", color: "#6b7280", icon: "more-horizontal", sortOrder: 10 },
  { name: "급여", type: "income", color: "#2f6fed", icon: "wallet", sortOrder: 1 },
  { name: "부수입", type: "income", color: "#16a34a", icon: "trending-up", sortOrder: 2 },
  { name: "용돈", type: "income", color: "#0891b2", icon: "hand-coins", sortOrder: 3 },
  { name: "기타수입", type: "income", color: "#6b7280", icon: "more-horizontal", sortOrder: 4 },
];

const DEFAULT_PAYMENT_METHODS: {
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
}[] = [
  { name: "신용카드", color: "#2f6fed", icon: "credit-card", sortOrder: 1 },
  { name: "체크카드", color: "#0891b2", icon: "credit-card", sortOrder: 2 },
  { name: "현금", color: "#16a34a", icon: "wallet", sortOrder: 3 },
  { name: "계좌이체", color: "#7c3aed", icon: "landmark", sortOrder: 4 },
  { name: "간편결제", color: "#db2777", icon: "smartphone", sortOrder: 5 },
];

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createHousehold(
  uid: string,
  displayName: string,
  name: string,
): Promise<string> {
  const householdRef = doc(collection(db, "households"));
  const inviteCode = generateInviteCode();
  const setupBatch = writeBatch(db);

  setupBatch.set(householdRef, { name, inviteCode, createdAt: Date.now() });
  setupBatch.set(doc(householdRef, "members", uid), {
    displayName,
    joinedAt: Date.now(),
  });
  setupBatch.set(doc(db, "inviteCodes", inviteCode), { householdId: householdRef.id });
  setupBatch.set(doc(db, "users", uid), { householdId: householdRef.id });

  await setupBatch.commit();

  // 별도 batch로 분리: 카테고리 쓰기 규칙은 "이미 가구 구성원인지"를 확인하는데,
  // 같은 batch 안에 있으면 방금 만든 members 문서가 아직 반영되지 않아 거부됨
  const categoryBatch = writeBatch(db);
  for (const category of DEFAULT_CATEGORIES) {
    categoryBatch.set(doc(collection(householdRef, "categories")), category);
  }
  for (const method of DEFAULT_PAYMENT_METHODS) {
    categoryBatch.set(doc(collection(householdRef, "paymentMethods")), method);
  }
  await categoryBatch.commit();

  return householdRef.id;
}

export async function joinHouseholdByCode(
  uid: string,
  displayName: string,
  code: string,
): Promise<string> {
  const normalized = code.trim().toUpperCase();
  const inviteSnap = await getDoc(doc(db, "inviteCodes", normalized));

  if (!inviteSnap.exists()) {
    throw new Error("초대 코드를 찾을 수 없어요");
  }

  const householdId = inviteSnap.data().householdId as string;
  const batch = writeBatch(db);

  batch.set(doc(db, "households", householdId, "members", uid), {
    displayName,
    joinedAt: Date.now(),
  });
  batch.set(doc(db, "users", uid), { householdId });

  await batch.commit();
  return householdId;
}

export async function renameHousehold(householdId: string, name: string) {
  await updateDoc(doc(db, "households", householdId), { name });
}
