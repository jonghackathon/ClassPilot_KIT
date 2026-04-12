# 모달/폼 15건 미구현

**현재 상태:** 버튼은 존재하나 클릭해도 모달이 열리지 않음
**구현 방법:** shadcn `Dialog` 컴포넌트 + `useState(false)` 패턴

---

## 전체 목록

| # | 모달명 | 화면 | 설계서 ID | 구현 Step |
|---|-------|------|----------|---------|
| 1 | 학생 등록 | `admin/students` | M-A01 | Step 3 |
| 2 | 학생 정보 수정 | `admin/students/[id]` | M-A02 | Step 3 |
| 3 | 강사 등록 | `admin/teachers` | M-A03 | Step 3 |
| 4 | 반 생성 | `admin/classes` | M-A04 | Step 3 |
| 5 | 수강 등록/해제 | `admin/classes/[id]` | M-A05, M-A07 | Step 3 |
| 6 | 납부 처리 | `admin/payments` | M-A08 | Step 3 |
| 7 | 연락 기록 | `admin/churn` | M-A09 | Step 3 |
| 8 | 이탈 처리 | `admin/churn` | M-A10 | Step 3 |
| 9 | 민원 응답 작성 | `admin/complaints` | M-A12 | Step 3 |
| 10 | 전체출석 확인 | `teacher/attendance` | M-T01 | Step 2 |
| 11 | 과제 등록 | `teacher/assignments` | M-T02 | Step 4 |
| 12 | 과제 이력 타임라인 | `teacher/assignments/[id]` | M-T03 | Step 4 |
| 13 | 피드백 작성 | `teacher/assignments/[id]` | M-T04 | Step 4 |
| 14 | 코파일럿 종료 확인 | `teacher/copilot/[lessonId]` | M-T05 | Step 6 |
| 15 | 과제 제출 확인 | `student/assignments/[id]` | M-S01 | Step 5 |

---

## Step별 집계

| Step | 모달 수 |
|------|--------|
| Step 2 | 1건 (전체출석 확인) |
| Step 3 | 9건 (Admin 전체) |
| Step 4 | 3건 (과제 등록, 이력, 피드백) |
| Step 5 | 1건 (과제 제출 확인) |
| Step 6 | 1건 (코파일럿 종료) |

---

## 표준 구현 패턴

```tsx
// 1. 페이지 컴포넌트에 상태 추가
const [openModal, setOpenModal] = useState(false)

// 2. 버튼에 onClick 연결
<Button onClick={() => setOpenModal(true)}>+ 학생 등록</Button>

// 3. shadcn Dialog 추가
<Dialog open={openModal} onOpenChange={setOpenModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>학생 등록</DialogTitle>
    </DialogHeader>
    {/* 폼 내용 */}
    <form onSubmit={handleSubmit}>
      {/* 필드들 */}
      <Button type="submit">등록</Button>
    </form>
  </DialogContent>
</Dialog>

// 4. 폼 제출 핸들러
const handleSubmit = async (data) => {
  await apiRequest('/api/users', { method: 'POST', body: data })
  mutate() // SWR 캐시 갱신
  setOpenModal(false)
}
```

---

## 설계서 참고

각 모달의 폼 필드 상세는 `claude/docs/05_화면 설계서/11_모달_다이얼로그_인벤토리.md` 참조.
