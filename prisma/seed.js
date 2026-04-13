require("dotenv/config")
const bcrypt = require("bcryptjs")
const { PrismaClient } = require("@prisma/client")
const { PrismaPg } = require("@prisma/adapter-pg")
const { Pool } = require("pg")

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

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
  const pin = await bcrypt.hash("1234", 10) // 수강생 PIN (4자리)

  const academy = await prisma.academy.create({
    data: {
      name: "ClassPilot",
      code: "DEMO-1234",
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
      email: null,
      password: pin,
      name: "민수",
      role: "STUDENT",
      phone: "010-3333-1111",
      studentProfile: {
        create: {
          studentCode: "2025-001",
          grade: "중2",
          school: "중앙중",
          memo: "수학 심화반 메인 데모 계정 · PIN: 1234",
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
      email: null,
      password: pin,
      name: "이지은",
      role: "STUDENT",
      studentProfile: {
        create: {
          studentCode: "2025-002",
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
      email: null,
      password: pin,
      name: "정우진",
      role: "STUDENT",
      studentProfile: { create: { studentCode: "2025-003", grade: "중3", school: "반포중" } },
    },
  })

  const studentSoyoung = await prisma.user.create({
    data: {
      academyId: academy.id,
      email: null,
      password: pin,
      name: "한소영",
      role: "STUDENT",
      studentProfile: { create: { studentCode: "2025-004", grade: "중2", school: "잠원중" } },
    },
  })

  const studentTaeho = await prisma.user.create({
    data: {
      academyId: academy.id,
      email: null,
      password: pin,
      name: "김태호",
      role: "STUDENT",
      studentProfile: { create: { studentCode: "2025-005", grade: "중1", school: "서일중" } },
    },
  })

  const koreanCurriculum = await prisma.curriculumClass.create({
    data: {
      academyId: academy.id,
      name: "국어 논술 중급 코스",
      subject: "국어",
      level: "중등 심화",
      sortOrder: 1,
      stages: [
        {
          id: "stage-1",
          name: "1단계 · 비문학 독해 기초",
          lessons: [
            { number: "1-1", title: "지문 구조 파악", theme: "문단별 핵심 문장 찾기" },
            { number: "1-2", title: "논지 정리", theme: "주장과 근거 구분하기" },
          ],
        },
        {
          id: "stage-2",
          name: "2단계 · 서술형 답안 작성",
          lessons: [
            { number: "2-1", title: "개요 작성법", theme: "서론-본론-결론 구조" },
            { number: "2-2", title: "근거 제시", theme: "사례와 인용 활용" },
            { number: "2-3", title: "첨삭과 퇴고", theme: "문장 다듬기와 논리 점검" },
          ],
        },
      ],
    },
  })

  const mathCurriculum = await prisma.curriculumClass.create({
    data: {
      academyId: academy.id,
      name: "수학 내신 기초 코스",
      subject: "수학",
      level: "초급",
      sortOrder: 2,
      stages: [
        {
          id: "stage-math-1",
          name: "1단계 · 함수 기초",
          lessons: [
            { number: "1-1", title: "일차함수 개념", theme: "그래프와 기울기" },
            { number: "1-2", title: "이차함수 도입", theme: "꼭짓점과 축" },
          ],
        },
      ],
    },
  })

  const mathClass = await prisma.class.create({
    data: {
      academyId: academy.id,
      curriculumId: mathCurriculum.id,
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
      curriculumId: koreanCurriculum.id,
      name: "국어 A반",
      subject: "국어",
      level: "중급",
      capacity: 16,
      description: "문해력과 독서 토론 중심 국어반",
    },
  })

  const mainClass = await prisma.class.create({
    data: {
      academyId: academy.id,
      curriculumId: koreanCurriculum.id,
      name: "논술 중급반",
      subject: "국어",
      level: "중급",
      capacity: 12,
      description: "비문학 독해와 서술형 답안 작성을 다루는 메인 데모 반",
    },
  })

  await prisma.classTeacher.createMany({
    data: [
      { classId: mathClass.id, teacherId: teacherPark.id },
      { classId: englishClass.id, teacherId: teacherKim.id },
      { classId: koreanClass.id, teacherId: teacherLee.id },
      { classId: mainClass.id, teacherId: teacherPark.id },
      { classId: mainClass.id, teacherId: teacherJung.id },
    ],
  })

  await prisma.enrollment.createMany({
    data: [
      { classId: mainClass.id, studentId: studentMain.id },
      { classId: mainClass.id, studentId: studentJieun.id },
      { classId: mainClass.id, studentId: studentWoojin.id },
      { classId: mainClass.id, studentId: studentSoyoung.id },
      { classId: mainClass.id, studentId: studentTaeho.id },
      { classId: mathClass.id, studentId: studentMain.id },
      { classId: mathClass.id, studentId: studentJieun.id },
      { classId: englishClass.id, studentId: studentWoojin.id },
      { classId: koreanClass.id, studentId: studentSoyoung.id },
    ],
  })

  const scheduleMain = await prisma.schedule.create({
    data: {
      classId: mainClass.id,
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

  const lessonMain = await prisma.lesson.create({
    data: {
      classId: mainClass.id,
      scheduleId: scheduleMain.id,
      date: new Date("2026-04-10T14:00:00.000Z"),
      topic: "비문학 독해와 서술형 답안 작성",
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
        classId: mainClass.id,
        studentId: studentJieun.id,
        lessonId: lessonMain.id,
        date: lessonMain.date,
        status: "PRESENT",
        homeworkStatus: "COMPLETE",
      },
      {
        classId: mainClass.id,
        studentId: studentWoojin.id,
        lessonId: lessonMain.id,
        date: lessonMain.date,
        status: "LATE",
        homeworkStatus: "INCOMPLETE",
        absenceReason: "교통 지연으로 10분 늦게 도착",
        homeworkNote: "숙제 일부만 작성",
      },
      {
        classId: mainClass.id,
        studentId: studentSoyoung.id,
        lessonId: lessonMain.id,
        date: lessonMain.date,
        status: "PRESENT",
        homeworkStatus: "COMPLETE",
      },
      {
        classId: mainClass.id,
        studentId: studentTaeho.id,
        lessonId: lessonMain.id,
        date: lessonMain.date,
        status: "ABSENT",
        homeworkStatus: "INCOMPLETE",
        absenceReason: "감기 증상으로 결석 연락",
      },
      {
        classId: mainClass.id,
        studentId: studentMain.id,
        lessonId: lessonMain.id,
        date: lessonMain.date,
        status: "PRESENT",
        homeworkStatus: "COMPLETE",
      },
    ],
  })

  const workbookAssignment = await prisma.assignment.create({
    data: {
      classId: mainClass.id,
      teacherId: teacherPark.id,
      title: "비문학 지문 분석 워크북",
      content: "제시된 지문의 핵심 논지를 정리하고 문단별 요약을 작성해 보세요.",
      type: "WORKBOOK",
      dueDate: new Date("2026-04-12T14:59:00.000Z"),
      teacherNote: "지문 분석표와 요약을 함께 제출",
    },
  })

  const imageAssignment = await prisma.assignment.create({
    data: {
      classId: mainClass.id,
      teacherId: teacherPark.id,
      title: "독서 감상문 손글씨 작성",
      content: "읽은 책의 핵심 내용과 느낀 점을 손글씨로 작성하고 스캔해 제출해 주세요.",
      type: "IMAGE",
      dueDate: new Date("2026-04-15T14:59:00.000Z"),
      imageUrls: ["https://example.com/sample-essay.png"],
      teacherNote: "원고지 양식으로 작성",
    },
  })

  const essayAssignment = await prisma.assignment.create({
    data: {
      classId: mainClass.id,
      teacherId: teacherPark.id,
      title: "사회 이슈 논술 에세이",
      content: "제시된 주제에 대해 자신의 입장을 논리적으로 서술해 보세요.",
      type: "ESSAY",
      dueDate: new Date("2026-04-22T14:59:00.000Z"),
      teacherNote: "AI 첨삭 허용",
    },
  })

  const submissionJieun = await prisma.submission.create({
    data: {
      assignmentId: workbookAssignment.id,
      studentId: studentJieun.id,
      content: "지문의 핵심 논지는 환경 보호의 경제적 가치이며, 근거로 세 가지 사례를 들고 있습니다.",
      aiUsed: true,
      aiUsageDetail: "예시 문장 다듬기 2회",
      submittedAt: new Date("2026-04-09T05:32:00.000Z"),
      status: "SUBMITTED",
    },
  })

  await prisma.submission.create({
    data: {
      assignmentId: workbookAssignment.id,
      studentId: studentWoojin.id,
      content: "주장과 근거의 연결이 약한 부분을 보완해야 합니다.",
      submittedAt: new Date("2026-04-09T00:15:00.000Z"),
      status: "SUBMITTED",
    },
  })

  await prisma.submission.create({
    data: {
      assignmentId: essayAssignment.id,
      studentId: studentSoyoung.id,
      content: "논술에서 서론의 역할은 독자의 관심을 끌고 주제를 제시하는 것입니다.",
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
        content: "근거 사례 보강",
        charCount: 240,
      },
    ],
  })

  await prisma.weekNote.createMany({
    data: [
      {
        classId: mainClass.id,
        scheduleId: scheduleMain.id,
        lessonId: lessonMain.id,
        date: lessonMain.date,
        content: "서술형 답안 작성 전 지문 구조 복습을 10분 진행했습니다.",
        studentReaction: "질문이 많아 연습 시간을 늘리는 편이 좋았습니다.",
        curriculumStage: "2단계 · 서술형 답안 작성",
        curriculumLesson: "2-1 개요 작성법",
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
        classId: mainClass.id,
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
        classId: mainClass.id,
        title: "논술 중급반 질문 패턴 메모",
        content: "서론에서 주제 제시와 배경 설명의 순서를 자주 헷갈립니다.",
        category: "STUDENT_NOTE",
        targetName: "논술 중급반",
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
      lessonId: lessonMain.id,
      teacherId: teacherPark.id,
      topic: "비문학 독해와 서술형 답안 작성",
      status: "ACTIVE",
    },
  })

  await prisma.copilotQuestion.createMany({
    data: [
      {
        sessionId: copilotSession.id,
        question: "서론에서 주제를 바로 제시해야 하나요, 배경을 먼저 써야 하나요?",
        beginner: "독자의 관심을 끌기 위해 배경이나 질문으로 시작하고, 이어서 주제를 제시하는 것이 자연스럽습니다.",
        example: "예: '최근 환경 문제가 심각해지고 있다. 이 글에서는 환경 보호의 경제적 가치를 살펴보겠다.'",
        advanced: "논술 유형에 따라 두괄식(주제 먼저)과 미괄식(결론 나중)을 구분해서 써 보세요.",
        summary: "배경으로 관심을 끈 뒤 주제를 제시하는 것이 기본",
        usedCards: ["beginner", "example"],
      },
    ],
  })

  await prisma.recordingSummary.create({
    data: {
      lessonId: lessonMain.id,
      audioUrl: "https://example.com/recordings/lesson-1.mp3",
      transcript: "오늘은 비문학 지문의 구조를 파악하고 서술형 답안 개요를 작성했습니다.",
      summary: "학생 질문이 서론 작성 방법에 집중되었습니다.",
      questions: "주제 제시 순서, 근거 배치 방법",
      nextPoints: "본론 근거 제시 연습 추가",
      status: "COMPLETED",
      progress: 100,
    },
  })

  await prisma.botQuestion.createMany({
    data: [
      {
        studentId: studentMain.id,
        classId: mainClass.id,
        question: "논술에서 반론을 어디에 넣어야 하나요?",
        aiAnswer: "본론의 마지막 단락에서 반론을 제시하고 재반박하는 구조가 일반적입니다.",
        helpful: true,
        status: "AI_ANSWERED",
      },
      {
        studentId: studentJieun.id,
        classId: mainClass.id,
        question: "결론을 어떻게 마무리해야 할지 모르겠어요.",
        teacherAnswer: "본론의 핵심 주장을 한 문장으로 요약하고, 전망이나 제안으로 마무리해 보세요.",
        status: "TEACHER_ANSWERED",
      },
    ],
  })

  await prisma.botFAQ.createMany({
    data: [
      {
        classId: mainClass.id,
        question: "과제 제출은 어디서 하나요?",
        answer: "수강생 홈의 과제 페이지에서 바로 제출할 수 있습니다.",
      },
      {
        classId: mainClass.id,
        question: "AI 첨삭을 써도 되나요?",
        answer: "허용된 과제에서만 사용하고, 사용 여부를 체크해 주세요.",
      },
    ],
  })

  await prisma.reviewSummary.create({
    data: {
      studentId: studentMain.id,
      lessonId: lessonMain.id,
      summary: "비문학 지문 구조 파악과 서술형 개요 작성의 핵심을 3줄로 복습합니다.",
      quiz: [
        {
          question: "서론에서 가장 먼저 해야 할 것은?",
          options: ["반론 제시", "독자의 관심 유도", "결론 요약"],
          correctIndex: 1,
        },
      ],
      preview: "다음 시간에는 본론에서 근거를 효과적으로 제시하는 방법을 다룹니다.",
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
