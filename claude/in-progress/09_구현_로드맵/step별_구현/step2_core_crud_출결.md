# Step 2: Core CRUD 패턴 확립 (출결 full cycle)

**선행 조건:** Step 0 (Prisma schema) + Step 1 (인증) 완료
**작업 항목 수:** 9개
**예상 소요:** 1.5일

---

## 목표

출결(Attendance) 전체 사이클을 한 번 완성하여, 이후 모든 CRUD가 따를 **표준 패턴**을 확립한다.

```
DB 모델 → API Route → SWR Hook → UI 모달
```

---

## 작업 항목

| # | 작업 | 파일 | 설명 |
|---|------|------|------|
| 1 | Fetcher 유틸 | `src/lib/fetcher.ts` | SWR용 표준 fetcher |
| 2 | API 응답 헬퍼 | `src/lib/api-response.ts` | `{ success, data, error }` 포맷 |
| 3 | Zod 스키마 | `src/lib/validations/attendance.ts` | 입력 검증 |
| 4 | API: GET 목록 | `src/app/api/attendance/route.ts` | 날짜+반 기준 조회 |
| 5 | API: POST 생성 | `src/app/api/attendance/route.ts` | 개별 출결 입력 |
| 6 | API: POST 일괄 | `src/app/api/attendance/bulk/route.ts` | 전체출석 일괄 처리 |
| 7 | API: PATCH/DELETE | `src/app/api/attendance/[id]/route.ts` | 출결 수정/삭제 |
| 8 | SWR Hook | `src/hooks/useAttendance.ts` | SWR wrapper |
| 9 | UI 연결 | `src/app/teacher/attendance/page.tsx` | 실데이터 + 모달 연결 |

---

## 확립하는 패턴 (이후 모든 CRUD 복제)

### API 패턴
```typescript
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // 역할별 데이터 범위 필터
  // Prisma 쿼리
  // 표준 응답 형식 { success, data, error }
}
```

### SWR 패턴
```typescript
const { data, error, isLoading, mutate } = useSWR(key, fetcher)
```

### 낙관적 업데이트 패턴
```typescript
mutate(optimisticData, false) → API 호출 → 성공 시 revalidate / 실패 시 rollback
```

### 모달 패턴
```typescript
const [open, setOpen] = useState(false)
<Dialog open={open} onOpenChange={setOpen}>...</Dialog>
```

---

## 연관 모달

| 모달 | 설계서 ID | 화면 |
|------|----------|------|
| 전체출석 확인 | M-T01 | teacher/attendance |

---

## 결과물

- 출석 CRUD 전체 동작 (목록 조회, 체크, 수정, 삭제)
- 재사용 가능한 CRUD 패턴 템플릿 확보
- SWR 캐시 자동 갱신 확인
- Step 3~5 작업 시 이 파일들을 템플릿으로 복사 사용
