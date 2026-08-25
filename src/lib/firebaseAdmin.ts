import { cert, getApps, getApp, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// 지연 초기화: next build의 라우트 핸들러 정적 분석 단계에서도 이 모듈이 import되므로,
// 최상위에서 바로 초기화하면 env가 아직 없는 빌드 환경에서 빌드 자체가 깨진다.
// 실제 요청이 들어와 getAdminAuth()/getAdminDb()를 호출할 때만 초기화한다.
let adminApp: App | undefined;

function getAdminApp(): App {
  adminApp ??= getApps().length
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
  return adminApp;
}

let cachedAuth: Auth | undefined;
let cachedDb: Firestore | undefined;

export function getAdminAuth(): Auth {
  cachedAuth ??= getAuth(getAdminApp());
  return cachedAuth;
}

export function getAdminDb(): Firestore {
  cachedDb ??= getFirestore(getAdminApp());
  return cachedDb;
}
