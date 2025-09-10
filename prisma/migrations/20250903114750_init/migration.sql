-- CreateTable
CREATE TABLE "public"."users" (
    "userId" INTEGER NOT NULL,
    "username" VARCHAR(255) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."schedules" (
    "scheduleId" UUID NOT NULL,
    "scheduleName" VARCHAR(255) NOT NULL,
    "memo" TEXT NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("scheduleId")
);

-- CreateTable
CREATE TABLE "public"."candidates" (
    "candidateId" SERIAL NOT NULL,
    "candidateName" VARCHAR(255) NOT NULL,
    "scheduleId" UUID NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("candidateId")
);

-- CreateTable
CREATE TABLE "public"."availabilities" (
    "candidateId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "availability" INTEGER NOT NULL DEFAULT 0,
    "scheduleId" UUID NOT NULL,

    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("candidateId","userId")
);

-- CreateTable
CREATE TABLE "public"."comments" (
    "scheduleId" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "comment" VARCHAR(255) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("scheduleId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE INDEX "schedules_createdBy_idx" ON "public"."schedules"("createdBy");

-- CreateIndex
CREATE INDEX "candidates_scheduleId_idx" ON "public"."candidates"("scheduleId");

-- CreateIndex
CREATE INDEX "availabilities_scheduleId_idx" ON "public"."availabilities"("scheduleId");

-- AddForeignKey
ALTER TABLE "public"."schedules" ADD CONSTRAINT "schedules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."candidates" ADD CONSTRAINT "candidates_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."schedules"("scheduleId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."availabilities" ADD CONSTRAINT "availabilities_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "public"."candidates"("candidateId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."availabilities" ADD CONSTRAINT "availabilities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."schedules"("scheduleId") ON DELETE CASCADE ON UPDATE CASCADE;
