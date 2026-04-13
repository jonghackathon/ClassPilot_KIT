# Figma 디자인 프롬프트 — 핵심 4화면

**목적:** 코드 구현 전, 컬러감·레이아웃·브랜드 톤을 시각적으로 검증
**도구:** Figma
**프레임:** Desktop 1440x900 / Mobile 390x844 (iPhone 15 기준)

---

## 공통 디자인 시스템 (모든 화면에 적용)

```
브랜드: AcadeMind — 학원 AI 관리 플랫폼
톤앤매너: 전문적이면서 따뜻한. 교육 특화. 신뢰감 있되 딱딱하지 않게.

컬러:
  Primary: #4F46E5 (Indigo-600) — 메인 버튼, 링크, 활성 메뉴
  Primary-Dark: #4338CA (Indigo-700) — 호버
  Primary-Light: #EEF2FF (Indigo-50) — 선택된 항목 배경
  Accent: #8B5CF6 (Violet-500) — AI 기능 전용 강조색
  Accent-Light: #EDE9FE (Violet-100) — AI 카드 배경
  Success: #16A34A (Green-600) — 출석, 완료, 정상
  Warning: #D97706 (Amber-600) — 지각, 주의
  Danger: #DC2626 (Red-600) — 결석, 위험, 에러
  Surface: #F8FAFC (Slate-50) — 페이지 배경
  Card: #FFFFFF — 카드, 모달 배경
  Text: #0F172A (Slate-900) — 제목
  Text-Secondary: #334155 (Slate-700) — 본문
  Text-Muted: #64748B (Slate-500) — 보조 텍스트
  Border: #CBD5E1 (Slate-300) — 테두리

폰트: Pretendard (또는 Inter)
  제목: 24px Bold
  소제목: 20px SemiBold
  본문: 14px Regular
  캡션: 12px Regular
  대시보드 숫자: 32px Bold

모서리: 카드 12px, 버튼 8px, 모달 16px, 배지 9999px (pill)
그림자: 카드 shadow-sm (0 1px 2px rgba(0,0,0,0.05))
```

---

## 화면 1: 로그인

### 프롬프트

```
AcadeMind 로그인 페이지를 디자인해줘.

[레이아웃]
- 데스크탑 1440x900
- 좌측 절반: 브랜드 영역 (그래디언트 배경)
- 우측 절반: 로그인 폼 (흰색 배경)
- 모바일에서는 그래디언트가 상단 배너로 축소되고, 폼이 전체를 차지

[좌측 브랜드 영역]
- 배경: Indigo-600(#4F46E5)에서 Violet-600(#7C3AED)으로 대각선 그래디언트
- 중앙에 큰 AcadeMind 로고 텍스트 (흰색, 32px Bold)
- 아래에 "학원 AI 관리 플랫폼" 서브 타이틀 (흰색, 16px, opacity 80%)
- 그 아래에 장식용 일러스트 또는 아이콘 패턴:
  졸업모자, 차트, AI 스파클 아이콘을 반투명 흰색으로 흩뿌린 패턴
- 전체적으로 고급스러우면서 교육적인 느낌

[우측 로그인 폼]
- 배경: 흰색
- 상단: "로그인" 제목 (24px Bold, Slate-900)
- 아래: "AcadeMind에 오신 것을 환영합니다" (14px, Slate-500)
- 이메일 입력 필드:
  좌측에 Mail 아이콘 (Slate-400)
  placeholder "이메일을 입력하세요"
  높이 44px, border Slate-300, rounded-lg
- 비밀번호 입력 필드:
  좌측에 Lock 아이콘
  우측에 Eye 토글 아이콘
  placeholder "비밀번호를 입력하세요"
  같은 스타일
- 로그인 버튼:
  전체 너비, 높이 48px
  배경 Indigo-600, 텍스트 흰색, rounded-xl
  "로그인" 텍스트 16px Medium
- 하단: "비밀번호를 잊으셨나요?" 링크 (Slate-500, 14px)

[추가 상태]
- 포커스된 입력 필드: border Indigo-500, ring-1
- 에러 상태: border Red-500, 필드 아래 "이메일 형식이 올바르지 않습니다" (Red-600, 12px)
- 로딩 상태: 버튼에 스피너, opacity 70%

[모바일 버전 (390x844)]
- 상단에 Indigo→Violet 그래디언트 배너 (높이 200px, 로고+서브타이틀)
- 아래 흰색 영역에 로그인 폼
- 버튼 높이 48px 유지
- 좌우 패딩 24px
```

---

## 화면 2: 운영자 대시보드

### 프롬프트

```
AcadeMind 운영자(Admin) 대시보드 페이지를 디자인해줘.

[전체 레이아웃 — 데스크탑 1440x900]
- 좌측 사이드바 (240px 고정, Slate-800 #1E293B 배경)
- 상단 탑바 (64px 높이, 흰색 배경, 하단 border Slate-200)
- 메인 콘텐츠 (Surface #F8FAFC 배경, 패딩 24px)

[좌측 사이드바]
- 상단: AcadeMind 로고 (흰색 텍스트, 18px Bold) + 작은 스파클 아이콘
- 메뉴 항목 (각 44px 높이, 좌측 아이콘 20px + 텍스트 14px):
  📊 대시보드     ← 현재 활성: bg-Indigo-600/20, text-white, 좌측 border-l-3 Indigo-400
  👨‍🎓 학생 관리    ← 비활성: text-Slate-400, hover시 bg-white/5
  👨‍🏫 강사 관리
  📚 반 관리
  📅 시간표
  💰 수강료
  🔴 이탈 예측    ← 우측에 빨간 dot 배지 (위험 학생 있음을 표시)
  📋 민원 관리    ← 우측에 "3" 숫자 배지 (bg-Red-500, 흰 텍스트, pill)
- 하단: 구분선 후 "로그아웃" (LogOut 아이콘 + 텍스트, Slate-500)
- 사이드바 아이콘: Lucide 스타일 (선형, 1.5px stroke)

[상단 탑바]
- 좌측: "대시보드" 페이지 제목 (20px SemiBold, Slate-900)
- 우측: 알림 벨 아이콘 (Slate-500) + 빨간 dot / 프로필 아바타 (32px 원형, Indigo-100 배경에 이니셜)

[메인 콘텐츠]

1. 상단 StatCard 4개 (가로 4열 그리드, gap 16px):
   ┌────────────────┐
   │  👨‍🎓 전체 수강생   │  값: "87명" (32px Bold, Slate-900)
   │  활성 85명        │  부제: (14px, Slate-500)
   │  ↑ +3 이번 달     │  트렌드: (12px, Green-600)
   └────────────────┘
   각 카드: 흰색 배경, rounded-lg(12px), shadow-sm, padding 20px
   
   카드2: 📅 오늘 수업 "12반" / 완료 3/12 / 트렌드 없음
   카드3: 💰 미납 수강료 "3명" (값 색상 Red-600) / 800,000원
   카드4: 🔴 이탈 위험 "2명" (값 색상 Red-600) / 주의 5명 (Amber-600)

2. 이탈 위험 알림 섹션 (전체 너비 카드):
   - 헤더: "⚠ 이탈 위험 학생" (16px SemiBold) + 우측 "전체보기 →" (Ghost 링크, Indigo-600)
   - 3행 리스트:
     🔴 김민준 (화-초4)  위험 70  "연속결석 2회 + 미제출 3회"
     🟡 이수현 (목-초6)  주의 45  "1주 미접속"
     🟡 박지민 (화-중등) 주의 40  "과제 제출률 하락"
   - 각 행: 좌측에 위험도 배지 (pill, bg-Red-100 text-Red-700 또는 bg-Amber-100 text-Amber-700)
   - 위험도 숫자: bold
   - 카드: 흰색 배경, rounded-lg, shadow-sm, 좌측 border-l-4 Red-500

3. 하단 2컬럼 (gap 16px):
   좌측 — "오늘 수업 현황" 카드:
     3개 수업 리스트
     각 행: 시간(Slate-500) / 반이름(Bold) / 강사명 / 인원 / [출결입력] 버튼(sm, Primary)
   
   우측 — "미제출 과제 현황" 카드:
     2개 과제 리스트
     각 행: 과제명 / 반이름 / "미제출 2/6" (Red-600) / "마감 D-2" (Amber-600 배지)
     하단: "전체보기 →" 링크

[디자인 포인트]
- 전체적으로 깔끔하고 데이터 밀도 높되 숨쉴 공간(whitespace) 충분히
- StatCard 호버 시 shadow-md로 미세하게 떠오르는 효과
- 이탈 위험 섹션은 시선을 먼저 끄는 위치 (위험 상황 즉시 인지)
- 컬러 사용 절제: 대부분 Slate 톤, 상태 표시에만 컬러 사용
```

---

## 화면 3: 강사 AI 코파일럿

### 프롬프트

```
AcadeMind 강사용 AI 수업 코파일럿 세션 화면을 디자인해줘.
이 화면은 강사가 수업 중에 태블릿/데스크탑에서 사용하는 핵심 AI 기능이야.

[전체 레이아웃 — 데스크탑 1280x900]
- 상단 탑바 (64px, 흰색)
- 탭 네비 (48px): 홈 | 출결 | 과제 | 진도 | AI 코파일럿 ← 활성 (border-b-2 Indigo-600)
- 메인 콘텐츠 (Surface 배경)

[코파일럿 헤더 섹션]
- 배경: Indigo-600에서 Violet-600으로 그래디언트 (rounded-lg, padding 20px)
- 흰색 텍스트:
  "🎯 AI 수업 코파일럿" (20px Bold)
  "(화-초4) 친절한 설명 · 예외처리 try-catch-finally" (14px, opacity 80%)
  "반 구성: 초보 30% / 중간 50% / 심화 20%" (12px, opacity 60%)
- 우측: [세션 종료] 버튼 (흰색 배경, Indigo-600 텍스트, sm)

[학생 질문 카드]
- 흰색 카드, rounded-lg, shadow-sm
- 좌측에 Violet-500 세로 라인 (border-l-4)
- "🙋 finally는 항상 실행되나요?" (16px SemiBold, Slate-900)
- 우측: "15:23" (12px, Slate-400)

[생성 완료 표시]
- "⏱ 생성 완료 2.3s" (12px, Slate-500)

[4개 AI 응답 카드 — 2x2 그리드]

카드 1 — 🟢 초보자 설명 (좌상):
  - 흰색 배경, rounded-lg, shadow-sm
  - 좌측 border-l-4 Green-500
  - 헤더: "🟢 초보자 설명" (14px SemiBold, Green-700, bg-Green-50 패딩)
  - 본문: "finally는 try와 catch가 끝나면 무조건 실행되는 블록이에요.
    🎒 비유: 수업 끝나면 무조건 청소하는 것!" (14px, Slate-700)
  - 하단: [복사] 버튼 (Ghost, sm) + [✓ 사용함] 버튼 (Primary, sm)

카드 2 — 🟣 심화 추가 질문 (우상):
  - 좌측 border-l-4 Violet-500
  - 헤더: bg-Violet-50
  - 본문: "Q1. System.exit() 호출 시에도 실행될까요?
    Q2. return 문 이후에도 실행될까요?"

카드 3 — 🔵 예시 코드 (좌하, 전체 너비 가능):
  - 좌측 border-l-4 Blue-500
  - 헤더: bg-Blue-50
  - 코드 블록: bg-Slate-900, rounded-md, padding 16px
    폰트: JetBrains Mono / Fira Code, 13px
    코드 구문 하이라이팅 (키워드: Violet-400, 문자열: Green-400, 주석: Slate-500)
    특정 줄 "← 여기!" 강조 (bg-Amber-500/20, 좌측 border-l-2 Amber-400)
  - 하단: [코드 복사] + [✓ 사용함]

카드 4 — 🟡 판서용 핵심 정리 (우하):
  - 좌측 border-l-4 Amber-500
  - 헤더: bg-Amber-50
  - 본문: bullet 리스트 3줄
    "• finally = 반드시 실행"
    "• 예외 발생 여부 무관"
    "• 자원 해제에 활용"

[하단 입력 바]
- 흰색 카드, rounded-lg, shadow-sm
- 텍스트 입력: "학생 질문을 입력하세요..." (placeholder, Slate-400)
  높이 44px, border Slate-300, rounded-lg, flex-grow
- 🎙 음성 버튼: 원형 44px, bg-Slate-100, 아이콘 Slate-500
- → 전송 버튼: 원형 44px, bg-Indigo-600, 아이콘 White (Send/ArrowRight)

[이전 질문 히스토리]
- 접기/펼치기 가능한 섹션
- "이전 질문 (2개)" + 펼치기 아이콘
- 각 행: 질문 텍스트 (14px, Slate-600) + 시간 (12px, Slate-400)

[디자인 포인트]
- AI 기능임을 시각적으로 확실히 전달: Violet 그래디언트 헤더 + 각 카드의 컬러 보더
- 4카드는 각각 다른 좌측 컬러 보더로 즉시 구분
- 코드 블록은 다크 테마 (Slate-900) — 실제 IDE 느낌
- 전체적으로 "수업 중 빠르게 스캔하고 쓰는" 느낌. 복잡하지 않게.
- 입력 바는 채팅 앱처럼 하단 고정 느낌

[모바일 버전 (390x844)]
- 4카드 → 1열 스택 (세로 스크롤)
- 입력 바 하단 고정 (sticky bottom)
- 헤더 그래디언트 높이 축소
```

---

## 화면 4: 수강생 홈 (모바일)

### 프롬프트

```
AcadeMind 수강생 홈 화면을 모바일(390x844)로 디자인해줘.
학생이 스마트폰에서 매일 처음 보는 화면이야. 심플하고 따뜻하게.

[전체 레이아웃]
- 배경: Surface #F8FAFC
- 상단: 미니 탑바 (48px, 흰색, 하단 border Slate-200)
  좌측 "AcadeMind" (16px SemiBold, Indigo-600)
  우측 알림 벨 아이콘 (Slate-500)
- 하단: 바텀 탭 바 (64px, 흰색, 상단 border Slate-200)
  4개 탭: 🏠 홈 | 📋 출결 | 📝 과제 | 📚 복습
  홈 탭 활성: 아이콘+텍스트 Indigo-600
  나머지: 아이콘+텍스트 Slate-400
  각 탭 터치 영역 최소 64x64px
- 콘텐츠: 좌우 패딩 16px, 스크롤 가능
- safe-area 하단 여백 (iPhone 홈 인디케이터)

[인사 섹션]
- "안녕하세요, 김민준님 👋" (20px SemiBold, Slate-900)
- "2026년 4월 8일 (수)" (14px, Slate-500)
- 상단 여백 16px

[카드 1 — 📅 오늘 수업]
- 흰색 카드, rounded-xl (16px), shadow-sm, padding 16px
- 헤더: "📅 오늘 수업" (14px SemiBold, Slate-700)
- 구분선 (Slate-100, 1px)
- 내용:
  "🕒 15:00~17:00" (16px SemiBold, Slate-900)
  "(화-초4) 친절한 설명" (14px, Slate-700)
  "예외처리 try-catch-finally" (14px, Slate-500)
- 카드 전체가 부드러운 느낌. 모서리 넉넉하게.

[카드 2 — 📬 복습 자료 도착]
- 흰색 카드, rounded-xl, shadow-sm
- 좌측에 Violet-500 세로 라인 (border-l-4) — AI 생성 콘텐츠 표시
- "📬 복습 자료 도착!" (16px SemiBold, Violet-700)
- "어제 수업 복습 요약이 준비됐어요" (14px, Slate-500)
- [확인하기 →] 버튼:
  전체 너비, 높이 44px
  bg-Violet-600, text-white, rounded-xl
  미세한 그림자
- 이 카드는 살짝 눈에 띄게: bg-Violet-50 또는 Violet 보더

[카드 3 — 📝 제출할 과제]
- 흰색 카드, rounded-xl, shadow-sm
- "📝 제출할 과제" (14px SemiBold, Slate-700)
- 리스트 2개:
  항목1: "예외처리 실습" + "D-2" (Amber-600 배지, pill)
         [작성하기 →] (Ghost 버튼, Indigo-600)
  항목2: "독서 감상문" + "D+1" (Red-600 배지, pill, "마감 지남")
         [제출하기 →]
- 항목 사이 구분선 (Slate-100)

[카드 4 — 📊 이번 달 출석률]
- 흰색 카드, rounded-xl, shadow-sm
- "📊 이번 달 출석률" (14px SemiBold, Slate-700)
- 프로그레스 바: 높이 8px, rounded-full
  채움: Green-500, 배경: Slate-200
  "80%" 텍스트 우측 (14px Bold, Green-600)
- 하단 3개 통계:
  "출석 16" (Green-600) | "결석 2" (Red-600) | "지각 1" (Amber-600)
  각각 작은 원형 dot + 텍스트

[디자인 포인트]
- 카드 사이 간격 12px — 너무 넓지 않게 콤팩트하면서도 숨쉴 공간
- 카드 모서리 16px (rounded-xl) — 모바일에서 부드러운 느낌
- 전체적으로 밝고 가벼운 톤. 학생이 부담 없이 열어보는 느낌.
- 텍스트 크기 적절히 큼 (본문 14px, 제목 16~20px) — 가독성
- CTA 버튼은 확실하게 눈에 띄게 (Indigo-600 또는 Violet-600)
- 복습 카드는 Violet 포인트로 "AI가 만들어준 특별한 콘텐츠" 느낌
- D-2, D+1 배지로 시간 긴박감 전달 (Amber = 임박, Red = 지남)
- 바텀 탭은 iOS/Android 네이티브 느낌. 선택된 탭은 Indigo-600.

[데스크탑 버전 (1440x900) — 참고]
- 바텀 탭 → 상단 네비로 이동
- 콘텐츠 max-width 640px, 화면 중앙 정렬
- 카드 레이아웃 동일 (수강생은 데스크탑에서도 좁은 레이아웃 유지)
```

---

## 사용 방법

### Figma에서 작업 순서

1. **로그인 화면** 먼저 → 브랜드 컬러감(Indigo+Violet 그래디언트) 확인
2. **수강생 홈** → 모바일 카드 레이아웃, 바텀 탭, Violet AI 포인트 확인
3. **운영자 대시보드** → 사이드바 다크 테마, StatCard, 데이터 밀도 확인
4. **AI 코파일럿** → 4카드 그리드, 코드 블록, 입력 바 확인

### 검증 포인트

| 화면 | 확인할 것 |
|------|---------|
| 로그인 | Indigo→Violet 그래디언트가 고급스러운지, 폼이 깔끔한지 |
| 수강생 홈 | 심플한지, 3초 안에 할 일 파악 가능한지, Violet AI 포인트가 자연스러운지 |
| 운영자 대시보드 | Slate-800 사이드바가 무겁지 않은지, StatCard 4개 정보 밀도 적절한지 |
| AI 코파일럿 | 4카드 구분이 명확한지, 코드 블록 가독성, 입력 바 사용성 |

### 컬러 조합 전체 검증

```
 Primary(Indigo) + Accent(Violet) → 조화로운지?
 Slate 중립색 → 충분히 따뜻한지, 너무 차갑지 않은지?
 Success(Green) + Warning(Amber) + Danger(Red) → 구분 명확한지?
 흰 배경 위 Indigo-600 텍스트 → 대비 충분한지? (6.3:1 ✅)
 전체 톤 → "교육 플랫폼"다운 신뢰감 + 친근함이 느껴지는지?
```
