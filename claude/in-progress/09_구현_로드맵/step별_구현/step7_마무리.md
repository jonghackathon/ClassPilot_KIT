# Step 7: 마무리 (모바일 네비, 알림, 스켈레톤 UI, 에러처리, 배포)

**선행 조건:** Step 6 완료 (모든 기능 구현 후 폴리싱)
**작업 항목 수:** 10개
**예상 소요:** 2일

---

## 목표

모바일 대응, 로딩/에러 상태 처리, Vercel 배포를 완료하여 서비스를 출시 가능한 상태로 만든다.

---

## 작업 항목

| # | 항목 | 파일 | 설명 |
|---|------|------|------|
| 1 | 모바일 admin 햄버거 메뉴 | `src/components/layout/AdminMobileNav.tsx` | Sheet 컴포넌트로 오버레이 사이드바 |
| 2 | 모바일 teacher 하단 탭 | `src/components/layout/TeacherBottomNav.tsx` | 768px 이하 바텀 탭 전환 |
| 3 | safe-area-inset 대응 | `src/app/student/layout.tsx` | `env(safe-area-inset-bottom)` — iPhone 노치 |
| 4 | 알림 벨 드롭다운 | `src/app/api/notifications/route.ts` + `src/hooks/useNotifications.ts` | 최근 알림 5개 + 전체보기 |
| 5 | 스켈레톤 UI | `src/components/ui/Skeleton.tsx` | 데이터 로딩 시 플레이스홀더 |
| 6 | 빈 상태 (EmptyState) | `src/components/ui/EmptyState.tsx` | 데이터 0건일 때 안내 |
| 7 | 에러 처리 | `src/components/error/ErrorBoundary.tsx` + `src/app/error.tsx` | 401/403/404/500/네트워크 에러별 UI |
| 8 | 폰트 Pretendard | `src/app/layout.tsx` | Geist → Pretendard 교체 (`next/font`) |
| 9 | SEO 메타데이터 | 각 `page.tsx` | 페이지별 title, description |
| 10 | Vercel 배포 | `vercel.json` + `next.config.ts` + 환경변수 | 도메인 연결 + 프로덕션 최적화 |

---

## 모바일 대응 체크리스트

### Admin (운영자)
- [ ] 햄버거 버튼 클릭 → Sheet 사이드바 열기
- [ ] 메뉴 항목 클릭 → Sheet 닫기 + 페이지 이동

### Teacher (강사)
- [ ] 768px 이하에서 사이드바 → 하단 탭으로 전환
- [ ] 현재 활성 탭 하이라이트

### Student (수강생)
- [ ] 바텀 탭 4개 (홈/과제/출석/질문)
- [ ] iPhone safe area inset 대응

---

## 에러 처리 케이스

| 상태코드 | 처리 |
|---------|------|
| 401 Unauthorized | 로그인 페이지로 리다이렉트 |
| 403 Forbidden | "접근 권한이 없습니다" 토스트 |
| 404 Not Found | 커스텀 404 페이지 |
| 500 Server Error | "서버 오류가 발생했습니다" + 재시도 버튼 |
| 네트워크 에러 | "인터넷 연결을 확인해주세요" 토스트 |

---

## Vercel 배포 체크리스트

- [ ] 환경변수 전체 설정 (`DATABASE_URL`, `NEXTAUTH_SECRET`, `ANTHROPIC_API_KEY` 등)
- [ ] `DATABASE_URL` connection pooling 모드로 설정 (Supabase Transaction Pooler)
- [ ] Vercel Cron Jobs 설정 (이탈 예측 배치: 매일 오전 2시)
- [ ] 도메인 연결
- [ ] 빌드 성공 확인

---

## 결과물

- 모바일에서 사용 가능한 UI (admin/teacher/student 전체)
- 로딩/에러 상태 처리 완료
- Vercel 배포 완료, 데모 URL 확보
