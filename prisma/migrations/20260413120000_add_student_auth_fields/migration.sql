-- Academy.code 추가: 기존 행에는 임시로 id 앞 8자리를 대문자로 사용
ALTER TABLE "Academy" ADD COLUMN "code" TEXT;
UPDATE "Academy" SET "code" = UPPER(SUBSTRING("id", 1, 8)) WHERE "code" IS NULL;
ALTER TABLE "Academy" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "Academy_code_key" ON "Academy"("code");

-- User.email nullable 전환 (기존 ADMIN/TEACHER는 email 유지, 수강생은 null 허용)
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- StudentProfile.studentCode 추가
ALTER TABLE "StudentProfile" ADD COLUMN "studentCode" TEXT;
