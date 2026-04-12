# Step 3: Admin CRUD (학생, 반, 시간표, 수납, 상담, 민원)

**선행 조건:** Step 2 완료 (CRUD 패턴 확립)
**작업 항목 수:** 22개
**예상 소요:** 3일

---

## 목표

Step 2에서 확립한 패턴을 반복 적용하여 운영자 대시보드 전체 CRUD를 완성한다.

---

## 도메인별 작업

### 3-1. 사용자 관리 (Users)

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/users/route.ts` | GET (목록, role 필터), POST (등록) |
| 2 | `src/app/api/users/[id]/route.ts` | GET (상세), PATCH (수정), DELETE |
| 3 | `src/app/api/users/[id]/parents/route.ts` | POST — 학부모 연락처 등록 |
| 4 | `src/hooks/useUsers.ts` | SWR wrapper |
| 5 | `src/lib/validations/users.ts` | Zod 스키마 |

**화면 연결:** `admin/students`, `admin/students/[id]`, `admin/teachers`

### 3-2. 반 관리 (Classes)

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/classes/route.ts` | GET, POST |
| 2 | `src/app/api/classes/[id]/route.ts` | GET, PATCH, DELETE |
| 3 | `src/app/api/classes/[id]/members/route.ts` | POST (등록/해제) |
| 4 | `src/hooks/useClasses.ts` | SWR wrapper |
| 5 | `src/lib/validations/classes.ts` | Zod 스키마 |

**화면 연결:** `admin/classes`, `admin/classes/[id]`

### 3-3. 시간표 (Schedule)

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/schedule/route.ts` | GET, POST |
| 2 | `src/app/api/schedule/[id]/route.ts` | PATCH, DELETE |
| 3 | `src/hooks/useSchedule.ts` | SWR wrapper |

**화면 연결:** `admin/schedule` — 주 이동, 모바일 일별 전환

### 3-4. 수납 관리 (Payments)

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/payments/route.ts` | GET, POST |
| 2 | `src/app/api/payments/[id]/route.ts` | PATCH, DELETE |
| 3 | `src/hooks/usePayments.ts` | SWR wrapper |
| 4 | `src/lib/validations/payments.ts` | Zod 스키마 |

**화면 연결:** `admin/payments`

### 3-5. 상담 관리 (Consultations)

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/consultations/route.ts` | GET, POST |
| 2 | `src/app/api/consultations/[id]/route.ts` | PATCH, DELETE |
| 3 | `src/hooks/useConsultations.ts` | SWR wrapper |

**화면 연결:** `admin/churn` — 연락 기록, 이탈 처리

### 3-6. 민원 관리 (Complaints)

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/complaints/route.ts` | GET, POST |
| 2 | `src/app/api/complaints/[id]/respond/route.ts` | POST — 응답 처리 |
| 3 | `src/hooks/useComplaints.ts` | SWR wrapper |

**화면 연결:** `admin/complaints`

---

## 연관 모달 (9건)

| # | 모달 | 화면 | 설계서 ID |
|---|------|------|----------|
| 1 | 학생 등록 | admin/students | M-A01 |
| 2 | 학생 정보 수정 | admin/students/[id] | M-A02 |
| 3 | 강사 등록 | admin/teachers | M-A03 |
| 4 | 반 생성 | admin/classes | M-A04 |
| 5 | 수강 등록/해제 | admin/classes/[id] | M-A05, M-A07 |
| 6 | 납부 처리 | admin/payments | M-A08 |
| 7 | 연락 기록 | admin/churn | M-A09 |
| 8 | 이탈 처리 | admin/churn | M-A10 |
| 9 | 민원 응답 작성 | admin/complaints | M-A12 |

---

## 연관 인터랙션 (2건)

| # | 항목 | 화면 |
|---|------|------|
| 1 | 검색 (debounce + API 쿼리) | 모든 목록 페이지 |
| 2 | 필터/탭 전환 (클릭→상태→API 재요청) | 모든 필터 |

---

## 결과물

- Admin 대시보드 모든 CRUD 동작
- 사용자 등록/수정/삭제, 반 관리, 스케줄 편집, 결제 기록, 상담/민원 관리
- `admin/dashboard` 하드코딩 → 실제 API 연동 (SWR 5분 갱신)
