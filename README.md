# 도이네 가게부

부부가 함께 쓰는 모바일 우선 가계부 웹앱입니다. Next.js + Firebase + Tailwind CSS로 만들었고, Pretendard 폰트를 사용합니다.

로그인은 구글 로그인 없이 **이메일 + 비밀번호**로 직접 가입해서 씁니다. 데이터 저장은 Firebase(구글의 서비스)를 사용합니다 — 콘솔 화면이 익숙한 구글 스타일이라 비교적 따라 하기 쉽습니다. 이 문서는 개발을 처음 접하는 분도 따라 할 수 있도록 클릭 단위로 자세히 적었습니다.

## 전체 흐름 한눈에 보기

1. Firebase 콘솔에서 새 프로젝트를 만든다
2. "웹 앱"을 하나 등록하고, 나오는 설정값(코드 조각)을 복사해둔다
3. 이메일/비밀번호 로그인을 켠다 (토글 하나)
4. Firestore(데이터베이스)를 만들고, 보안 규칙을 붙여넣는다
5. 복사해둔 설정값을 내 컴퓨터의 `.env.local` 파일에 적어 넣는다
6. `npm install` → `npm run dev`로 내 컴퓨터에서 실행하고, 이메일/비밀번호로 회원가입해본다
7. (선택) Vercel에 올려서 핸드폰/PC 어디서든 접속되게 만든다

각 단계마다 "✅ 확인" 표시로 제대로 됐는지 스스로 점검할 수 있게 해뒀습니다.

---

## 1단계. Firebase 프로젝트 만들기

1. 브라우저에서 [console.firebase.google.com](https://console.firebase.google.com) 접속 → 구글 계정으로 로그인
2. **프로젝트 만들기(Create a project)** 클릭
3. 프로젝트 이름 입력 (예: `도이네 가게부`) → **계속**
4. Google Analytics 사용 여부를 물어보면 **껐다(사용 안 함)**로 두고 진행해도 충분합니다 → **프로젝트 만들기**
5. 1분 정도 기다리면 프로젝트 대시보드로 이동합니다

✅ 확인: 프로젝트 이름이 화면 위쪽에 보이면 성공입니다.

---

## 2단계. 웹 앱 등록하고 설정값 복사하기

1. 프로젝트 대시보드 중앙(또는 왼쪽 톱니바퀴 옆 ⚙️ **프로젝트 설정**)에서 **`</>`(웹)** 아이콘 클릭
2. 앱 닉네임 입력 (예: `도이네 가게부 웹`) → **Firebase Hosting 설정**은 체크하지 않아도 됩니다 → **앱 등록**
3. 화면에 아래처럼 생긴 코드 조각이 나타납니다. 이 안의 값들을 메모장에 복사해두세요.

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "xxxxx.firebaseapp.com",
  projectId: "xxxxx",
  storageBucket: "xxxxx.firebasestorage.app",
  messagingSenderId: "...",
  appId: "1:...:web:...",
};
```

4. **콘솔로 이동** 클릭해서 넘어갑니다 (나중에 이 값이 다시 필요하면 ⚙️ **프로젝트 설정** 맨 아래 "내 앱" 목록에서 다시 볼 수 있습니다)

✅ 확인: `firebaseConfig` 안의 6개 값(apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)을 전부 복사해뒀으면 성공입니다.

---

## 3단계. 이메일/비밀번호 로그인 켜기

1. 왼쪽 메뉴 **빌드(Build) > Authentication** 클릭 → **시작하기(Get started)** 클릭
2. 로그인 제공업체 목록에서 **이메일/비밀번호(Email/Password)** 클릭
3. 첫 번째 토글(이메일/비밀번호)을 **사용 설정**으로 켜기 → **저장**

✅ 확인: Sign-in method 탭에서 "이메일/비밀번호"의 상태가 "사용 설정됨"으로 보이면 성공입니다. (다른 로그인 방식은 전혀 켤 필요 없습니다)

---

## 4단계. 데이터베이스(Firestore) 만들고 보안 규칙 붙여넣기

1. 왼쪽 메뉴 **빌드(Build) > Firestore Database** 클릭 → **데이터베이스 만들기(Create database)** 클릭
2. 위치(Location): **asia-northeast3 (Seoul)** 선택 → **다음**
3. 보안 규칙 시작 모드: **프로덕션 모드에서 시작(Start in production mode)** 선택 → **사용 설정(Enable)**
   (1~2분 정도 걸릴 수 있습니다)
4. 데이터베이스가 만들어지면 위쪽 탭에서 **규칙(Rules)** 클릭
5. 이 프로젝트 폴더 안의 [`firestore.rules`](firestore.rules) 파일을 VSCode에서 열어 **전체 내용을 복사**(Ctrl+A → Ctrl+C)
6. Firebase 콘솔의 규칙 편집창 내용을 전부 지우고 방금 복사한 내용을 **붙여넣기**
7. 오른쪽 위 **게시(Publish)** 클릭

✅ 확인: "규칙이 게시되었습니다" 같은 메시지가 뜨면 성공입니다.

> ❗ 이 단계를 건너뛰면: 기본 보안 규칙은 모든 접근을 막고 있어서, 앱에서 로그인은 되는데 가구 생성이나 거래 추가가 전부 "권한 없음" 오류로 실패합니다. 꼭 규칙을 붙여넣고 게시해주세요.

---

## 5단계. 접속 키를 내 컴퓨터에 저장하기 (.env.local)

1. VSCode에서 프로젝트 폴더의 `.env.local.example` 파일을 우클릭 → **복사(Copy)** → 같은 폴더에 **붙여넣기(Paste)** → 파일 이름을 `.env.local`로 변경
   - 또는 VSCode 터미널(단축키 <kbd>Ctrl</kbd>+<kbd>`</kbd>)에서 아래 명령 실행:
     ```powershell
     Copy-Item .env.local.example .env.local
     ```
2. 새로 만든 `.env.local` 파일을 열어서, 2단계에서 복사해둔 `firebaseConfig` 값을 각각 채워 넣습니다.

```
NEXT_PUBLIC_FIREBASE_API_KEY=firebaseConfig의 apiKey 값
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=firebaseConfig의 authDomain 값
NEXT_PUBLIC_FIREBASE_PROJECT_ID=firebaseConfig의 projectId 값
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=firebaseConfig의 storageBucket 값
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=firebaseConfig의 messagingSenderId 값
NEXT_PUBLIC_FIREBASE_APP_ID=firebaseConfig의 appId 값
```

값 앞뒤에 따옴표(`"`)는 빼고 넣어주세요. (예: `apiKey: "AIzaSy123"` → `NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy123`)

3. 파일 저장 (Ctrl+S)

✅ 확인: `.env.local` 파일의 6개 값이 전부 실제 값(placeholder가 아닌)으로 채워져 있으면 완료입니다. 이 파일은 `.gitignore`에 등록돼 있어서 깃허브에 실수로 올라가지 않습니다.

---

## 6단계. 내 컴퓨터에서 실행하고 계정 만들기

1. VSCode에서 터미널 열기: 상단 메뉴 **터미널 > 새 터미널** (또는 <kbd>Ctrl</kbd>+<kbd>`</kbd>)
2. 아래 명령을 순서대로 입력하고 Enter (처음 한 번만 install이 필요합니다)

```powershell
npm install
npm run dev
```

3. `Ready in ...` 같은 메시지가 뜨면 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

4. 계정 만들고 테스트해보기:
   - **회원가입** 탭 클릭 → 이름, 이메일(진짜 이메일 아니어도 됩니다, 예: `husband@doi.local`)과 비밀번호(6자 이상) 입력 → **회원가입** 클릭
   - 자동으로 로그인되면서 **가구 만들기** 화면으로 이동합니다 → 가구 이름(예: "도이네") 입력 → **가구 만들고 시작하기**
   - 대시보드가 보이면 성공! **거래 추가**를 눌러 지출/수입을 하나 등록해보세요
   - 배우자 계정도 똑같이 **회원가입**으로 하나 더 만든 다음(예: `wife@doi.local`), **설정** 메뉴에서 확인한 초대 코드를 배우자 계정 로그인 후 **초대 코드로 참여** 탭에 입력하면 같은 가계부를 공유하게 됩니다 (Firebase는 실시간 동기화라 배우자가 거래를 추가하면 새로고침 없이 바로 화면에 나타납니다)

터미널에서 서버를 끄고 싶으면 <kbd>Ctrl</kbd>+<kbd>C</kbd>를 누르면 됩니다.

> 💡 이메일 주소는 실제로 존재하지 않아도 됩니다. 다만 비밀번호를 잊어버리면 찾을 방법이 없으니(비밀번호 재설정 기능은 없음) 두 분이 쓸 이메일/비밀번호를 미리 정해서 메모해두는 걸 추천드려요.

---

## 7단계 (선택). 인터넷에 배포해서 핸드폰에서도 접속하기 — Vercel

지금까지는 내 컴퓨터가 켜져 있을 때(`npm run dev`)만 접속됩니다. 핸드폰이나 다른 곳에서 언제든 접속하려면 Vercel에 배포해야 합니다. 순서: **GitHub에 코드 올리기 → Vercel에서 배포 → Firebase에 배포 주소 등록**, 이렇게 3단계입니다.

### 7-1. GitHub에 코드 올리기

1. [github.com](https://github.com) 접속 → 로그인
2. 오른쪽 위 **+** 아이콘 클릭 → **New repository**
3. **Repository name**: `doi-family-budget` 등 원하는 이름 입력
4. **Private** 선택 (가계부는 개인정보라 비공개 추천 — Public으로 해도 실제 비밀번호/데이터는 코드에 없어서 큰 문제는 없지만, 굳이 공개할 필요는 없으니까요)
5. "Add a README file" 등 아래 체크박스들은 전부 **체크 해제** (이미 이 폴더에 파일들이 있으므로) → **Create repository**
6. 저장소가 만들어지면 "…or push an existing repository from the command line" 아래에 있는 주소를 확인합니다. `https://github.com/내계정/doi-family-budget.git` 같은 형태입니다.
7. VSCode 터미널(<kbd>Ctrl</kbd>+<kbd>`</kbd>)에서 아래 명령을 **한 줄씩** 순서대로 실행합니다 (마지막 줄의 주소는 6번에서 확인한 본인 주소로 바꿔주세요):

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/내계정/doi-family-budget.git
git push -u origin main
```

8. 처음 push할 때 브라우저 로그인 창이 뜨면 GitHub 계정으로 로그인해서 권한을 허용해주세요.

✅ 확인: GitHub 저장소 페이지를 새로고침했을 때 `src`, `package.json` 같은 파일들이 올라와 있으면 성공입니다. (원하시면 이 단계는 제가 대신 실행해드릴 수도 있어요, 말씀해주세요.)

### 7-2. Vercel에서 배포하기

1. [vercel.com](https://vercel.com) 접속 → **Continue with GitHub**로 로그인
2. 대시보드에서 **Add New... > Project** 클릭
3. 방금 만든 저장소가 목록에 보이면 옆의 **Import** 클릭
   - 목록에 안 보이면 **Adjust GitHub App Permissions** 클릭 → 방금 만든 저장소에 접근 허용 → 다시 목록에서 Import
4. **Configure Project** 화면에서 **Environment Variables** 항목을 펼칩니다
5. `.env.local` 파일을 VSCode에서 열어 6개 줄 전체를 복사(Ctrl+A → Ctrl+C)한 뒤, Vercel의 환경변수 입력창에 그대로 붙여넣기 하면 6개 값이 자동으로 각각의 칸에 나뉘어 들어갑니다 (한 줄씩 직접 입력해도 됩니다)
6. **Deploy** 클릭 → 1~2분 정도 빌드 로그가 올라오다가 완료됩니다
7. "Congratulations!" 화면과 함께 `https://프로젝트이름.vercel.app` 같은 주소가 나옵니다 — 이 주소를 복사해두세요

✅ 확인: 배포 URL에 접속했을 때 로그인 화면이 정상적으로 보이면 성공입니다. (아직 로그인은 안 될 수 있어요, 다음 단계가 남아있습니다.)

### 7-3. Firebase에 배포 주소 등록하기 (꼭 필요합니다)

이 단계를 빠뜨리면 배포된 사이트에서 로그인/회원가입 시 `auth/unauthorized-domain` 오류가 납니다. Firebase는 등록된 도메인에서 온 로그인 요청만 허용하기 때문입니다.

1. [Firebase 콘솔](https://console.firebase.google.com/project/doi-house-budget/authentication/settings) 접속 (본인 프로젝트의 Authentication > Settings 화면)
2. **승인된 도메인(Authorized domains)** 탭 클릭
3. **도메인 추가(Add domain)** 클릭
4. 7-2에서 받은 주소를 `https://` 없이 도메인만 입력 (예: `doi-family-budget.vercel.app`) → **추가**

✅ 확인: 목록에 방금 추가한 도메인이 보이면 완료입니다. 이제 핸드폰 브라우저에서 배포 주소로 접속해 로그인/가구 생성/거래 추가가 잘 되는지 확인해보세요.
핸드폰 브라우저 메뉴에서 **홈 화면에 추가**를 누르면 앱 아이콘처럼 설치됩니다.

> 💡 나중에 코드를 수정하면, 같은 폴더에서 `git add .` → `git commit -m "설명"` → `git push` 세 줄만 실행하면 Vercel이 자동으로 재배포합니다.

---

## 막혔을 때 체크리스트

- 로그인/회원가입 버튼을 눌러도 반응 없음 → `.env.local` 값이 비어있거나 오타 없는지, `npm run dev`를 재시작했는지 확인
- 회원가입/로그인은 되는데 "가구 만들기" 화면에서 계속 멈춰있거나 오류가 남 → 4단계 Firestore 보안 규칙을 붙여넣고 **게시(Publish)** 했는지 확인
- "이메일 또는 비밀번호가 올바르지 않아요" → 오타 확인, 비밀번호는 대소문자 구분됨
- "초대 코드를 찾을 수 없어요" → 코드에 오타가 없는지 확인 (붙여넣기 시 공백이 섞이지 않게 주의)
- 화면이 계속 로딩 스피너만 보임 → 브라우저 개발자 도구(F12) > Console 탭에서 빨간 에러 메시지 확인, 대부분 Firestore 규칙 미게시 또는 `.env.local` 값 오타가 원인

---

## 기술 스택

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** — 테마 색상은 `src/app/globals.css`에 정의
- **Firebase** — Firestore(데이터베이스), 이메일/비밀번호 로그인(Authentication), 가구 단위 데이터 격리는 Firestore 보안 규칙(`firestore.rules`)으로 처리
- **Vercel** — 무료 배포, 핸드폰/PC 어디서든 URL로 접속

## 폴더 구조

- `src/app/(app)/` — 로그인 + 가구 설정이 끝난 사용자만 보는 화면 (대시보드, 거래내역, 카테고리, 설정)
- `src/app/login`, `src/app/onboarding` — 로그인/회원가입 및 가구 생성/참여 흐름
- `src/lib/firebase.ts` — Firebase 앱/Auth/Firestore 초기화
- `src/lib/data/` — Firestore 읽기/쓰기 함수 (가구, 카테고리, 거래)
- `src/contexts/AuthContext.tsx` — 로그인 상태 + 가구/구성원/카테고리를 실시간으로 구독해 앱 전체에 제공하는 컨텍스트
- `firestore.rules` — Firestore 보안 규칙 (가구 구성원만 자기 가구 데이터를 읽고 쓸 수 있도록 제한)
