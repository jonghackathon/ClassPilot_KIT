-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'EARLY_LEAVE', 'ABSENT');

-- CreateEnum
CREATE TYPE "HomeworkStatus" AS ENUM ('COMPLETE', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('CODING', 'ESSAY', 'IMAGE');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'UNPAID', 'PARTIAL');

-- CreateEnum
CREATE TYPE "ConsultationType" AS ENUM ('PHONE', 'TEXT', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "MemoCategory" AS ENUM ('NOTICE', 'NOTABLE', 'STUDENT_NOTE', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ChurnLevel" AS ENUM ('SAFE', 'WARNING', 'DANGER');

-- CreateEnum
CREATE TYPE "CopilotSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BotQuestionStatus" AS ENUM ('PENDING', 'AI_ANSWERED', 'TEACHER_ANSWERED');

-- CreateTable
CREATE TABLE "Academy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Academy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grade" TEXT,
    "school" TEXT,
    "birthDate" TIMESTAMP(3),
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentContact" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumClass" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "level" TEXT,
    "stages" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "curriculumId" TEXT,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "level" TEXT,
    "description" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassTeacher" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "color" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "topic" TEXT,
    "status" "LessonStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "homeworkStatus" "HomeworkStatus",
    "homeworkNote" TEXT,
    "absenceReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "type" "AssignmentType" NOT NULL DEFAULT 'ESSAY',
    "dueDate" TIMESTAMP(3),
    "teacherNote" TEXT,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "content" TEXT,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiUsed" BOOLEAN NOT NULL DEFAULT false,
    "aiUsageDetail" TEXT,
    "submittedAt" TIMESTAMP(3),
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "teacherFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionHistory" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "charCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeekNote" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "lessonId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "studentReaction" TEXT,
    "curriculumStage" TEXT,
    "curriculumLesson" TEXT,
    "autoAssign" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeekNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "month" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" "ConsultationType" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memo" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "category" "MemoCategory" NOT NULL,
    "targetName" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Memo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportData" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "monthStr" TEXT NOT NULL,
    "comment" TEXT,
    "growth" TEXT,
    "attendanceSummary" TEXT,
    "assignmentSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "response" TEXT,
    "aiDraft" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChurnPrediction" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "level" "ChurnLevel" NOT NULL,
    "attendanceFactor" INTEGER NOT NULL,
    "homeworkFactor" INTEGER NOT NULL,
    "accessFactor" INTEGER NOT NULL,
    "questionFactor" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChurnPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CopilotSession" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "teacherId" TEXT,
    "topic" TEXT,
    "status" "CopilotSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CopilotSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CopilotQuestion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "beginner" TEXT,
    "example" TEXT,
    "advanced" TEXT,
    "summary" TEXT,
    "usedCards" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CopilotQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordingSummary" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "audioUrl" TEXT,
    "transcript" TEXT,
    "summary" TEXT,
    "questions" TEXT,
    "nextPoints" TEXT,
    "status" "RecordingStatus" NOT NULL DEFAULT 'PROCESSING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordingSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotQuestion" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT,
    "question" TEXT NOT NULL,
    "aiAnswer" TEXT,
    "teacherAnswer" TEXT,
    "helpful" BOOLEAN,
    "status" "BotQuestionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotFAQ" (
    "id" TEXT NOT NULL,
    "classId" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotFAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSummary" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT,
    "summary" TEXT NOT NULL,
    "quiz" JSONB,
    "preview" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassTeacher_classId_teacherId_key" ON "ClassTeacher"("classId", "teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_classId_studentId_key" ON "Enrollment"("classId", "studentId");

-- CreateIndex
CREATE INDEX "Schedule_classId_dayOfWeek_idx" ON "Schedule"("classId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Lesson_classId_date_idx" ON "Lesson"("classId", "date");

-- CreateIndex
CREATE INDEX "Attendance_classId_date_idx" ON "Attendance"("classId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_date_studentId_classId_key" ON "Attendance"("date", "studentId", "classId");

-- CreateIndex
CREATE INDEX "Assignment_classId_dueDate_idx" ON "Assignment"("classId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_assignmentId_studentId_key" ON "Submission"("assignmentId", "studentId");

-- CreateIndex
CREATE INDEX "SubmissionHistory_submissionId_createdAt_idx" ON "SubmissionHistory"("submissionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeekNote_classId_date_key" ON "WeekNote"("classId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_studentId_classId_month_key" ON "Payment"("studentId", "classId", "month");

-- CreateIndex
CREATE INDEX "Consultation_studentId_createdAt_idx" ON "Consultation"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "Memo_teacherId_archived_idx" ON "Memo"("teacherId", "archived");

-- CreateIndex
CREATE UNIQUE INDEX "ReportData_studentId_monthStr_key" ON "ReportData"("studentId", "monthStr");

-- CreateIndex
CREATE INDEX "Complaint_studentId_createdAt_idx" ON "Complaint"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "ChurnPrediction_studentId_calculatedAt_idx" ON "ChurnPrediction"("studentId", "calculatedAt");

-- CreateIndex
CREATE INDEX "CopilotQuestion_sessionId_createdAt_idx" ON "CopilotQuestion"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_academyId_key_key" ON "AppSetting"("academyId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentContact" ADD CONSTRAINT "ParentContact_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumClass" ADD CONSTRAINT "CurriculumClass_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "CurriculumClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTeacher" ADD CONSTRAINT "ClassTeacher_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassTeacher" ADD CONSTRAINT "ClassTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionHistory" ADD CONSTRAINT "SubmissionHistory_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeekNote" ADD CONSTRAINT "WeekNote_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeekNote" ADD CONSTRAINT "WeekNote_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeekNote" ADD CONSTRAINT "WeekNote_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memo" ADD CONSTRAINT "Memo_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memo" ADD CONSTRAINT "Memo_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportData" ADD CONSTRAINT "ReportData_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurnPrediction" ADD CONSTRAINT "ChurnPrediction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopilotSession" ADD CONSTRAINT "CopilotSession_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopilotSession" ADD CONSTRAINT "CopilotSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopilotQuestion" ADD CONSTRAINT "CopilotQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CopilotSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordingSummary" ADD CONSTRAINT "RecordingSummary_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotQuestion" ADD CONSTRAINT "BotQuestion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotQuestion" ADD CONSTRAINT "BotQuestion_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotFAQ" ADD CONSTRAINT "BotFAQ_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSummary" ADD CONSTRAINT "ReviewSummary_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSummary" ADD CONSTRAINT "ReviewSummary_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSetting" ADD CONSTRAINT "AppSetting_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
