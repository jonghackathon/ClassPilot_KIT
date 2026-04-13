# 02 · 로그인 페이지

심각도: 🟡 Medium  
영향 범위: `/login`, `/login/staff`, `/login/student`

---

## 문제 1 — "비밀번호를 잊으셨나요?" 버튼이 에러 메시지만 표시

**파일:** `src/app/(auth)/login/staff/page.tsx:146-149`

현재 코드:
```tsx
<button
  className="text-xs font-medium text-slate-500 transition hover:text-indigo-600"
  onClick={() => setErrorMessage('비밀번호 재설정은 관리자에게 문의해 주세요.')}
  type="button"
>
  비밀번호를 잊으셨나요?
```

비밀번호 재설정 전용 페이지가 없어서 임시로 에러 메시지를 쓰고 있음.  
문제는 이 메시지가 **에러 alert 박스**에 표시되어, 사용자가 잘못 입력했다고 착각함.

**수정 방법:**  
별도 상태 `forgotMessage`를 만들어 에러 스타일과 분리된 인포 박스로 표시:
```tsx
{forgotMessage ? (
  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
    {forgotMessage}
  </div>
) : null}
```

또는 `/login/staff/forgot` 페이지를 만들어 라우팅.

---

## 문제 2 — 로그인 성공 후 역할 기반 라우팅이 세션 없이 실행됨

**파일:** `src/app/(auth)/login/staff/page.tsx:66-73`

```tsx
const nextPath =
  callbackUrl && !callbackUrl.startsWith('/login')
    ? callbackUrl
    : result?.url && !result.url.includes('/login')
      ? result.url
      : resolveRoleHome()   // ← 세션이 없어서 항상 student/home으로 폴백
```

`resolveRoleHome()`이 `role` 인자 없이 호출되어 항상 `/student/home`으로 폴백.  
signIn 직후 세션이 아직 없는 시점이라 role을 읽을 수 없음.

**수정 방법:**  
`signIn` 결과의 `url`에서 역할 파악, 또는 `useSession` 훅으로 세션 갱신 후 라우팅:
```tsx
const session = await getSession()
router.push(resolveRoleHome(session?.user?.role))
```

---

## 문제 3 — 학생 로그인 Step Indicator에 완료 체크 표시가 없음

**파일:** `src/app/(auth)/login/student/page.tsx:31-57`

Step 2, 3 완료 시 이전 스텝의 `isDone` 상태가 `✓` 체크로 표시됨 — 이건 OK.  
그러나 PIN 4자리가 모두 입력됐을 때 로그인 버튼이 즉시 활성화되는데,  
입력 중인지 완료인지 시각적 피드백이 부족함.

**수정 방법:** (선택적)  
4자리 완성 시 PIN 표시 박스 테두리를 강조색으로 변경하는 애니메이션 추가.

---

## 체크리스트

- [ ] "비밀번호를 잊으셨나요?" 버튼 — 에러 박스 대신 인포 박스로 분리
- [ ] 로그인 후 역할 기반 라우팅 수정 (역할에 맞는 홈으로 이동)
- [ ] (선택) PIN 4자리 완성 시 시각적 피드백 개선
