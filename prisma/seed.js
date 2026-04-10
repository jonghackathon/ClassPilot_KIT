const bcrypt = require("bcryptjs")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function resetDatabase() {
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.copilotQuestion.deleteMany()
  await prisma.copilotSession.deleteMany()
  await prisma.recordingSummary.deleteMany()
  await prisma.reviewSummary.deleteMany()
  await prisma.botFAQ.deleteMany()
  await prisma.botQuestion.deleteMany()
  await prisma.churnPrediction.deleteMany()
  await prisma.complaint.deleteMany()
  await prisma.reportData.deleteMany()
  await prisma.memo.deleteMany()
  await prisma.consultation.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.submissionHistory.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.weekNote.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.classTeacher.deleteMany()
  await prisma.parentContact.deleteMany()
  await prisma.studentProfile.deleteMany()
  await prisma.appSetting.deleteMany()
  await prisma.class.deleteMany()
  await prisma.curriculumClass.deleteMany()
  await prisma.user.deleteMany()
  await prisma.academy.deleteMany()
}

async function main() {
  await resetDatabase()

  const password = await bcrypt.hash("1234", 10)

  const academy = await prisma.academy.create({
    data: {
      name: "AcadeMind",
      settings: {
        create: [
          { key: "theme.primary", value: "indigo" },
          { key: "reports.defaultComment", value: "이번 달도 꾸준히 성장하고 있습니다." },
        ],
      },
    },
  })

  const admin = await prisma.user.create({
    data: {
      academyId: academy.id,
      email: "admin@academind.kr",
      password,
      name: "정태",
      role: "ADMIN",
      phone: "010-1111-1111",
    },
  })

  const teacherPark = await prisma.user.create({
    data: {
      academyId: academy.id,
      email: "teacher@academind.kr",
      password,
      name: "박강사",
      role: "TEACHER",
      phone: "010-2222-1111",
    },
  })

  const teacherKim = await prisma.user.create({
    data: {
      academyId: academy.id,
      email: "kim@academind.kr",
      password,
      name: "김강사",
      role: "TEACHER",
      phone: "010-2222-2222",
    },
  })

  const teacherLee = await prisma.user.create({
    data: {
      academyId: academy.id,
      email: "lee@academind.kr",
      password,
      name: "이강사",
      role: "TEACHER",
      phone: "010-2222-3333",
    },
  })

  const teacherJung = await prisma.user.create({
    data: {
      academyId: academy.id,
      email: "jung@academind.kr",
      password,
      name: "정강사",
      role: "TEACHER",
      phone: "010-2222-4444",
    },
  })

  const studentMain = await prisma.user.create({
    data: {
      academyId: academy.id,
      email: "student@academind.kr",
      password,
      name: "민수",
      role: "STUDENT",
      phone: "010-3333-1111",
      studentProfile: {
        create: {
          grade: "중2",
          school: "중앙중",
          memo: "수학 심화반 메인 데모 계정",
          parents: {
            create: [{ name: "민수 어머니", phone: "010-9999-0001", relation: "모" }],
          },
        },
      },
    },
  })

  const studentJieun = await prisma.user.create({
    data: {
      academyId: academy.id,
      email: "jieun@academind.kr",
      password,
      name: "이지은",
      role: "STUDENT",
      studentProfile: {
        create: {
          grade: "중2",
          school: "서초중",
          parents: {
            create: [{ name: "이지은 아버지", phone: "010-9999-0002", relation: "부" }],
          },
        },
      },
    },
  })

  const studentWoojin = await prisma.user.create({
    data: {
      academyId: academy.id,
      email: "woojin@academind.kr",
      password,
      name: "정우진",
      role: "STUDENT",
      studentProfile: { create: { grade: "중3", school: "반포중" } },
    },
  })

  const studentSoyoung = await prisma.user.create({
    data: {
      academyId: academy.id,
      email: "soyoung@academind.kr",
      password,
      name: "한소영",
      role: "STUDENT",
      studentProfile: { create: { grade: "중2", school: "잠원중" } },
    },
  })

  const studentTaeho = await prisma.user.create({
    data: {
      academyId: academy.id,
      email: "taeho@academind.kr",
      password,
      name: "김태호",
      role: "STUDENT",
      studentProfile: { create: { grade: "중1", school: "서일중" } },
    },
  })

  const pythonCurriculum = await prisma.curriculumClass.create({
    data: {
      academyId: academy.id,
      name: "Python 중급 코스",
      subject: "코딩",
      level: "중등 심화",
      sortOrder: 1,
      stages: [
        {
          id: "stage-1",
          name: "1단계 · 반복문 기초",
          lessons: [
            { number: "1-1", title: "반복문 도입", theme: "for와 while 개념" },
            { number: "1-2", title: "for문 연습", theme: "range와 리스트 순회" },
          ],
        },
        {
          id: "stage-2",
          name: "2단계 · 반복문 응용",
          lessons: [
            { number: "2-1", title: "조건과 반복", theme: "if와 반복문 결합" },
            { number: "2-2", title: "누적 계산", theme: "합계와 카운팅" },
            { number: "2-3", title: "리스트 컴프리헨션", theme: "표현식 축약" },
          ],
        },
      ],
    },
  })

  const webCurriculum = await prisma.curriculumClass.create({
    data: {
      academyId: academy.id,
      name: "웹 기초 코스",
      subject: "웹",
      level: "초급",
      sortOrder: 2,
      stages: [
        {
          id: "stage-web-1",
          name: "1단계 · HTML 구조",
          lessons: [
            { number: "1-1", title: "제목과 문단", theme: "콘텐츠 구조화" },
            { number: "1-2", title: "카드 레이아웃", theme: "정보 카드 만들기" },
          ],
        },
      ],
    },
  })

  const mathClass = await prisma.class.create({
    data: {
      academyId: academy.id,
      curriculumId: pythonCurriculum.id,
      name: "수학 A반",
      subject: "수학",
      level: "중급",
      capacity: 24,
      description: "내신과 사고력 문제를 함께 다루는 중급반",
    },
  })

  const englishClass = await prisma.class.create({
    data: {
      academyId: academy.id,
      name: "영어 B반",
      subject: "영어",
      level: "고급",
      capacity: 18,
      description: "독해와 서술형 중심 고급반",
    },
  })

  const koreanClass = await prisma.class.create({
    data: {
      academyId: academy.id,
      name: "국어 A반",
      subject: "국어",
      level: "중급",
      capacity: 16,
      description: "문해력과 독서 토론 중심 국어반",
    },
  })

  const codingClass = await prisma.class.create({
    data: {
      academyId: academy.id,
      curriculumId: webCurriculum.id,
      name: "중급 A반",
      subject: "코딩",
      level: "중급",
      capacity: 12,
      description: "Python 반복문과 웹 기초를 연결하는 메인 데모 반",
    },
  })

  await prisma.classTeacher.createMany({
    data: [
      { classId: mathClass.id, teacherId: teacherPark.id },
      { classId: englishClass.id, teacherId: teacherKim.id },
      { classId: koreanClass.id, teacherId: teacherLee.id },
      { classId: codingClass.id, teacherId: teacherPark.id },
      { classId: codingClass.id, teacherId: teacherJung.id },
    ],
  })

  await prisma.enrollment.createMany({
    data: [
      { classId: codingClass.id, studentId: studentMain.id },
      { classId: codingClass.id, studentId: studentJieun.id },
      { classId: codingClass.id, studentId: studentWoojin.id },
      { classId: codingClass.id, studentId: studentSoyoung.id },
      { classId: codingClass.id, studentId: studentTaeho.id },
      { classId: mathClass.id, studentId: studentMain.id },
      { classId: mathClass.id, studentId: studentJieun.id },
      { classId: englishClass.id, studentId: studentWoojin.id },
      { classId: koreanClass.id, studentId: studentSoyoung.id },
    ],
  })

  const scheduleCoding = await prisma.schedule.create({
    data: {
      classId: codingClass.id,
      dayOfWeek: 1,
      startTime: "14:00",
      endTime: "15:30",
      room: "3강의실",
      color: "violet",
      note: "코파일럿 대표 수업",
    },
  })

  const scheduleMath = await prisma.schedule.create({
    data: {
      classId: mathClass.id,
      dayOfWeek: 1,
      startTime: "16:00",
      endTime: "18:00",
      room: "3강의실",
      color: "indigo",
    },
  })

  const scheduleEnglish = await prisma.schedule.create({
    data: {
      classId: englishClass.id,
      dayOfWeek: 2,
      startTime: "17:00",
      endTime: "19:00",
      room: "2강의실",
      color: "sky",
    },
  })

  const scheduleKorean = await prisma.schedule.create({
    data: {
      classId: koreanClass.id,
      dayOfWeek: 3,
      startTime: "15:00",
      endTime: "17:00",
      room: "1강의실",
      color: "violet",
    },
  })

  const lessonCoding = await prisma.lesson.create({
    data: {
      classId: codingClass.id,
      scheduleId: scheduleCoding.id,
      date: new Date("2026-04-10T14:00:00.000Z"),
      topic: "Python 반복문과 리스트 컴프리헨션",
      status: "COMPLETED",
    },
  })

  const lessonMath = await prisma.lesson.create({
    data: {
      classId: mathClass.id,
      scheduleId: scheduleMath.id,
      date: new Date("2026-04-10T16:00:00.000Z"),
      topic: "중간고사 대비 함수 응용",
      status: "SCHEDULED",
    },
  })

  await prisma.lesson.create({
    data: {
      classId: englishClass.id,
      scheduleId: scheduleEnglish.id,
      date: new Date("2026-04-11T17:00:00.000Z"),
      topic: "고급 독해와 요약문 작성",
      status: "SCHEDULED",
    },
  })

  await prisma.lesson.create({
    data: {
      classId: koreanClass.id,
      scheduleId: scheduleKorean.id,
      date: new Date("2026-04-12T15:00:00.000Z"),
      topic: "비문학 구조 읽기",
      status: "SCHEDULED",
    },
  })

  await prisma.attendance.createMany({
    data: [
      {
        classId: codingClass.id,
        studentId: studentJieun.id,
        lessonId: lessonCoding.id,
        date: lessonCoding.date,
        status: "PRESENT",
        homeworkStatus: "COMPLETE",
      },
      {
        classId: codingClass.id,
        studentId: studentWoojin.id,
        lessonId: lessonCoding.id,
        date: lessonCoding.date,
        status: "LATE",
        homeworkStatus: "INCOMPLETE",
        absenceReason: "교통 지연으로 10분 늦게 도착",
        homeworkNote: "숙제 일부만 작성",
      },
      {
        classId: codingClass.id,
        studentId: studentSoyoung.id,
        lessonId: lessonCoding.id,
        date: lessonCoding.date,
        status: "PRESENT",
        homeworkStatus: "COMPLETE",
      },
      {
        classId: codingClass.id,
        studentId: studentTaeho.id,
        lessonId: lessonCoding.id,
        date: lessonCoding.date,
        status: "ABSENT",
        homeworkStatus: "INCOMPLETE",
        absenceReason: "감기 증상으로 결석 연락",
      },
      {
        classId: codingClass.id,
        studentId: studentMain.id,
        lessonId: lessonCoding.id,
        date: lessonCoding.date,
        status: "PRESENT",
        homeworkStatus: "COMPLETE",
      },
    ],
  })

  const codingAssignment = await prisma.assignment.create({
    data: {
      classId: codingClass.id,
      teacherId: teacherPark.id,
      title: "Python 반복문 실습",
      content: "for문과 while문 차이를 예제 중심으로 정리하고 직접 코드를 작성해 보세요.",
      type: "CODING",
      dueDate: new Date("2026-04-12T14:59:00.000Z"),
      teacherNote: "코드와 설명을 함께 제출",
    },
  })

  const imageAssignment = await prisma.assignment.create({
    data: {
      classId: codingClass.id,
      teacherId: teacherPark.id,
      title: "HTML 포트폴리오 페이지",
      content: "레이아웃 결과 캡처 이미지와 함께 제출해 주세요.",
      type: "IMAGE",
      dueDate: new Date("2026-04-15T14:59:00.000Z"),
      imageUrls: ["https://example.com/layout-reference.png"],
      teacherNote: "모바일 화면 1장 포함",
    },
  })

  const essayAssignment = await prisma.assignment.create({
    data: {
      classId: codingClass.id,
      teacherId: teacherPark.id,
      title: "리스트 컴프리헨션 설명 에세이",
      content: "반복문 대비 장점을 자신의 말로 설명해 보세요.",
      type: "ESSAY",
      dueDate: new Date("2026-04-22T14:59:00.000Z"),
      teacherNote: "AI 첨삭 허용",
    },
  })

  const submissionJieun = await prisma.submission.create({
    data: {
      assignmentId: codingAssignment.id,
      studentId: studentJieun.id,
      content: "for문은 횟수가 정해진 반복에 좋고, while문은 조건 중심 반복에 적합합니다.",
      aiUsed: true,
      aiUsageDetail: "예시 문장 다듬기 2회",
      submittedAt: new Date("2026-04-09T05:32:00.000Z"),
      status: "SUBMITTED",
    },
  })

  await prisma.submission.create({
    data: {
      assignmentId: codingAssignment.id,
      studentId: studentWoojin.id,
      content: "while문을 사용할 때 종료 조건을 더 조심해야 합니다.",
      submittedAt: new Date("2026-04-09T00:15:00.000Z"),
      status: "SUBMITTED",
    },
  })

  await prisma.submission.create({
    data: {
      assignmentId: essayAssignment.id,
      studentId: studentSoyoung.id,
      content: "리스트 컴프리헨션은 코드를 짧게 줄이는 데 도움이 됩니다.",
      attachments: ["https://example.com/essay-image-1.png"],
      aiUsed: true,
      aiUsageDetail: "문장 교정 1회",
      status: "DRAFT",
    },
  })

  await prisma.submissionHistory.createMany({
    data: [
      {
        submissionId: submissionJieun.id,
        content: "초안 시작",
        charCount: 120,
      },
      {
        submissionId: submissionJieun.id,
        content: "예시 코드 보강",
        charCount: 240,
      },
    ],
  })

  await prisma.weekNote.createMany({
    data: [
      {
        classId: codingClass.id,
        scheduleId: scheduleCoding.id,
        lessonId: lessonCoding.id,
        date: lessonCoding.date,
        content: "리스트 컴프리헨션 도입 전 반복문 복습을 10분 진행했습니다.",
        studentReaction: "질문이 많아 실습 시간을 늘리는 편이 좋았습니다.",
        curriculumStage: "2단계 · 반복문 응용",
        curriculumLesson: "2-3 리스트 컴프리헨션",
        autoAssign: true,
      },
      {
        classId: mathClass.id,
        scheduleId: scheduleMath.id,
        lessonId: lessonMath.id,
        date: lessonMath.date,
        content: "함수 응용 문제를 중간고사 유형으로 연결했습니다.",
        curriculumStage: "함수 응용",
        curriculumLesson: "중간고사 대비 1주차",
      },
    ],
  })

  await prisma.payment.createMany({
    data: [
      {
        studentId: studentMain.id,
        classId: mathClass.id,
        amount: 320000,
        status: "UNPAID",
        month: "2026-04",
        note: "학부모 문자 발송 예정",
      },
      {
        studentId: studentJieun.id,
        classId: codingClass.id,
        amount: 290000,
        status: "PAID",
        month: "2026-04",
        paidAt: new Date("2026-04-02T02:00:00.000Z"),
      },
    ],
  })

  await prisma.consultation.createMany({
    data: [
      {
        studentId: studentMain.id,
        ownerId: admin.id,
        type: "PHONE",
        content: "출결보다 과제 루틴 정착이 먼저 필요하다는 점을 안내했습니다.",
      },
      {
        studentId: studentWoojin.id,
        ownerId: teacherPark.id,
        type: "IN_PERSON",
        content: "후반 집중력이 떨어지는 구간에서 쉬는 시간 운영을 조정하기로 했습니다.",
      },
    ],
  })

  await prisma.memo.createMany({
    data: [
      {
        teacherId: teacherPark.id,
        classId: codingClass.id,
        title: "중급 A반 질문 패턴 메모",
        content: "리스트 컴프리헨션에서 조건식 위치를 자주 헷갈립니다.",
        category: "STUDENT_NOTE",
        targetName: "중급 A반",
      },
      {
        teacherId: teacherPark.id,
        title: "김민수 학부모 상담 포인트",
        content: "숙제 루틴 이야기를 먼저 꺼내는 편이 효과적이었습니다.",
        category: "NOTICE",
        targetName: "민수",
      },
      {
        teacherId: teacherPark.id,
        title: "4월 평가안 준비",
        content: "월간 보고서 성취도 문장을 더 짧고 통일되게 맞춥니다.",
        category: "OTHER",
        archived: true,
      },
    ],
  })

  await prisma.reportData.createMany({
    data: [
      {
        studentId: studentJieun.id,
        monthStr: "2026-04",
        comment: "개념 이해가 안정적이고 질문도 적극적입니다.",
        growth: "설명형 답변이 자연스러워졌고 예시 확장 속도도 좋아졌습니다.",
        attendanceSummary: "출석 94%",
        assignmentSummary: "과제 9 / 10 제출",
      },
      {
        studentId: studentWoojin.id,
        monthStr: "2026-04",
        comment: "수업 참여는 좋지만 후반 집중 유지가 과제입니다.",
        growth: "문제 해결 속도는 좋아졌지만 실수 체크 루틴 보강이 필요합니다.",
        attendanceSummary: "출석 82%",
        assignmentSummary: "과제 7 / 10 제출",
      },
    ],
  })

  await prisma.complaint.create({
    data: {
      studentId: studentMain.id,
      content: "수업 시간 조정 요청",
      aiDraft: "현재 시간표와 강의실 사용 현황을 확인한 뒤 회신 예정입니다.",
      status: "IN_PROGRESS",
    },
  })

  await prisma.churnPrediction.createMany({
    data: [
      {
        studentId: studentMain.id,
        score: 80,
        level: "DANGER",
        attendanceFactor: 30,
        homeworkFactor: 25,
        accessFactor: 15,
        questionFactor: 10,
      },
      {
        studentId: studentWoojin.id,
        score: 62,
        level: "WARNING",
        attendanceFactor: 20,
        homeworkFactor: 18,
        accessFactor: 12,
        questionFactor: 12,
      },
    ],
  })

  const copilotSession = await prisma.copilotSession.create({
    data: {
      lessonId: lessonCoding.id,
      teacherId: teacherPark.id,
      topic: "Python 반복문과 리스트 컴프리헨션",
      status: "ACTIVE",
    },
  })

  await prisma.copilotQuestion.createMany({
    data: [
      {
        sessionId: copilotSession.id,
        question: "for문이랑 while문 중에 어떤 걸 써야 하나요?",
        beginner: "for문은 횟수가 정해질 때, while문은 조건이 유지될 때 사용합니다.",
        example: "for i in range(5): print(i)",
        advanced: "종료 조건을 스스로 제어해야 할 때 while문이 더 적합합니다.",
        summary: "for = 횟수 중심, while = 조건 중심",
        usedCards: ["beginner", "example"],
      },
    ],
  })

  await prisma.recordingSummary.create({
    data: {
      lessonId: lessonCoding.id,
      audioUrl: "https://example.com/recordings/lesson-1.mp3",
      transcript: "오늘은 for문과 while문 차이를 정리했습니다.",
      summary: "학생 질문이 반복문 종료 조건에 집중되었습니다.",
      questions: "range 포함 여부, 들여쓰기 규칙",
      nextPoints: "리스트 컴프리헨션 예시 추가",
      status: "COMPLETED",
      progress: 100,
    },
  })

  await prisma.botQuestion.createMany({
    data: [
      {
        studentId: studentMain.id,
        classId: codingClass.id,
        question: "리스트 컴프리헨션에서 if는 어디에 쓰나요?",
        aiAnswer: "표현식 뒤에 조건식을 붙이면 됩니다.",
        helpful: true,
        status: "AI_ANSWERED",
      },
      {
        studentId: studentJieun.id,
        classId: codingClass.id,
        question: "while문은 언제 멈추는지 헷갈려요.",
        teacherAnswer: "조건이 false가 되는 지점을 직접 표시해 보세요.",
        status: "TEACHER_ANSWERED",
      },
    ],
  })

  await prisma.botFAQ.createMany({
    data: [
      {
        classId: codingClass.id,
        question: "과제 제출은 어디서 하나요?",
        answer: "수강생 홈의 과제 페이지에서 바로 제출할 수 있습니다.",
      },
      {
        classId: codingClass.id,
        question: "AI 첨삭을 써도 되나요?",
        answer: "허용된 과제에서만 사용하고, 사용 여부를 체크해 주세요.",
      },
    ],
  })

  await prisma.reviewSummary.create({
    data: {
      studentId: studentMain.id,
      lessonId: lessonCoding.id,
      summary: "for문과 while문의 차이, 리스트 컴프리헨션 도입을 3줄로 복습합니다.",
      quiz: [
        {
          question: "for문이 더 적합한 상황은?",
          options: ["조건이 불명확한 반복", "횟수가 정해진 반복", "무한 반복"],
          correctIndex: 1,
        },
      ],
      preview: "다음 시간에는 조건식이 포함된 컴프리헨션을 다룹니다.",
    },
  })

  console.log("Seed complete", {
    academy: academy.name,
    admin: admin.email,
    teacher: teacherPark.email,
    student: studentMain.email,
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
