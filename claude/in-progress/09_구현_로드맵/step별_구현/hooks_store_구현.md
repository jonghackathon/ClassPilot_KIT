# hooks/store 구현 계획

**현재 상태:** `src/hooks/` 비어 있음, `src/store/` 비어 있음
**목표:** SWR 기반 hooks 10+개, Zustand store 3+개

---

## hooks — SWR Wrapper 목록

각 hook은 Step별로 함께 구현된다.

| Hook | 파일 | Step | 설명 |
|------|------|------|------|
| `useAttendance` | `src/hooks/useAttendance.ts` | 2 | 출결 데이터 |
| `useUsers` | `src/hooks/useUsers.ts` | 3 | 사용자 목록 |
| `useClasses` | `src/hooks/useClasses.ts` | 3 | 반 목록 |
| `useSchedule` | `src/hooks/useSchedule.ts` | 3 | 시간표 |
| `usePayments` | `src/hooks/usePayments.ts` | 3 | 수납 목록 |
| `useConsultations` | `src/hooks/useConsultations.ts` | 3 | 상담 목록 |
| `useComplaints` | `src/hooks/useComplaints.ts` | 3 | 민원 목록 |
| `useAssignments` | `src/hooks/useAssignments.ts` | 4 | 과제 목록 |
| `useCurriculum` | `src/hooks/useCurriculum.ts` | 4 | 커리큘럼 |
| `useProgress` | `src/hooks/useProgress.ts` | 4 | 진도 기록 |
| `useMemo` | `src/hooks/useMemo.ts` | 4 | 메모 목록 |
| `useReview` | `src/hooks/useReview.ts` | 5 | 복습 목록 |
| `useQnA` | `src/hooks/useQnA.ts` | 5 | 질문/답변 |
| `useCopilot` | `src/hooks/useCopilot.ts` | 6 | SSE EventSource |
| `useNotifications` | `src/hooks/useNotifications.ts` | 7 | 알림 목록 |

---

## 표준 Hook 패턴

```typescript
// src/hooks/useAttendance.ts
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

export function useAttendance(classId: string, date: string) {
  const key = classId && date ? `/api/attendance?classId=${classId}&date=${date}` : null

  const { data, error, isLoading, mutate } = useSWR(key, fetcher)

  return {
    attendance: data?.data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  }
}
```

---

## store — Zustand 목록

| Store | 파일 | 용도 |
|-------|------|------|
| `useAuthStore` | `src/store/authStore.ts` | 세션 사용자 정보 클라이언트 캐시 |
| `useUIStore` | `src/store/uiStore.ts` | 모달 open/close 전역 상태 |
| `useCopilotStore` | `src/store/copilotStore.ts` | 코파일럿 세션 + 카드 상태 |

---

## Zustand 패턴

```typescript
// src/store/uiStore.ts
import { create } from 'zustand'

interface UIStore {
  activeModal: string | null
  openModal: (id: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}))
```

---

## 현재 설정된 인프라

- `src/app/providers.tsx` — `SWRConfig` 글로벌 설정 완료
- `src/lib/fetcher.ts` — Step 2에서 생성 예정

---

## 구현 순서

1. **Step 2:** `useAttendance` + `fetcher.ts` (패턴 확립)
2. **Step 3:** Admin 관련 hooks 7개 (패턴 복제)
3. **Step 3:** `useUIStore` 추가 (모달 상태 관리 필요 시)
4. **Step 4:** Teacher 관련 hooks 4개
5. **Step 5:** Student 관련 hooks 2개
6. **Step 6:** `useCopilot` (SSE 전용 로직)
7. **Step 7:** `useNotifications`
