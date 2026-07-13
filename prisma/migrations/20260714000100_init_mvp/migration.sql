-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AgeStage" AS ENUM ('ENLIGHTENMENT', 'GROWTH', 'YOUTH');

-- CreateEnum
CREATE TYPE "PlayMode" AS ENUM ('OBSERVER', 'CREATOR', 'DEVELOPER', 'FAMILY');

-- CreateEnum
CREATE TYPE "FivePower" AS ENUM ('SAFETY', 'SENSING', 'BRAINWAVE', 'CREATIVITY', 'COMMUNICATION');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'REVIEWING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ChildIdentity" AS ENUM ('MEMBER', 'GUEST');

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "anonymousName" TEXT NOT NULL,
    "ageStage" "AgeStage" NOT NULL,
    "mode" "PlayMode" NOT NULL DEFAULT 'CREATOR',
    "identity" "ChildIdentity" NOT NULL DEFAULT 'GUEST',
    "organizationId" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journey" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "currentPower" "FivePower" NOT NULL DEFAULT 'SAFETY',
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "completedLevels" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "publishStatus" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "safetyFlags" JSONB NOT NULL DEFAULT '[]',
    "parentConfirm" BOOLEAN NOT NULL DEFAULT false,
    "entryChoice" TEXT,
    "ideaText" TEXT,
    "powerScores" JSONB,
    "cardsPlayed" JSONB,
    "top3Concerns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "wqtSessionId" TEXT,
    "wqtReviewSnapshot" JSONB,
    "wqtReviewReportUrl" TEXT,
    "threeIssueEvals" JSONB,
    "systemRecommendation" TEXT,
    "selectedIssue" TEXT,
    "selectedIssueIndex" INTEGER,
    "protagonist" TEXT,
    "plot" TEXT,
    "evidence" TEXT,
    "materialSources" JSONB,
    "surfaceDescription" TEXT,
    "stakeholders" JSONB,
    "rootCauses" JSONB,
    "previousAttempts" JSONB,
    "entryWindow" TEXT,
    "mechanismDescription" TEXT,
    "aiCanDo" JSONB,
    "aiCannotDo" JSONB,
    "analogyDescription" TEXT,
    "modules" JSONB,
    "simplifiedModules" JSONB,
    "collaborationChecklist" JSONB,
    "safetyItems" JSONB,
    "ethicsItems" JSONB,
    "vision" TEXT,
    "aiAction" TEXT,
    "abcCanvas" JSONB,
    "demoPlan" TEXT,
    "effectVerification" TEXT,
    "responsibilityDecision" TEXT,
    "demoUrl" TEXT,
    "iterations" JSONB,
    "responsibilityReview" TEXT,
    "engineeringCheckpoint" BOOLEAN NOT NULL DEFAULT false,
    "bodyRelaxCheckpoint" BOOLEAN NOT NULL DEFAULT false,
    "edgeOneAssetId" TEXT,
    "realImpact" TEXT,
    "spreadImpact" TEXT,
    "slogan" TEXT,
    "sustainedImpact" TEXT,
    "stakeholderAnalysis" TEXT,
    "safetyReport" JSONB,
    "publishScript" JSONB,
    "videoUrl" TEXT,
    "workCardGenerated" BOOLEAN NOT NULL DEFAULT false,
    "allChecksPassed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourneyLog" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "fromLevel" INTEGER NOT NULL,
    "toLevel" INTEGER NOT NULL,
    "fromPower" TEXT NOT NULL,
    "toPower" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JourneyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "structuredOutput" JSONB,
    "tokenCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskCard" (
    "id" TEXT NOT NULL,
    "ageStage" "AgeStage" NOT NULL,
    "riskType" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "eventDescription" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "recommendedDemo" TEXT,
    "version" TEXT NOT NULL DEFAULT 'youth',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "riskTypes" TEXT[],
    "description" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "promptTemplate" TEXT,
    "previewUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Work" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "creatorNickname" TEXT NOT NULL,
    "ageStage" TEXT NOT NULL,
    "riskTypes" TEXT[],
    "usedPowers" TEXT[],
    "demoUrl" TEXT,
    "videoUrl" TEXT,
    "responsibilityStatement" TEXT NOT NULL,
    "slogan" TEXT,
    "publishStatus" TEXT NOT NULL DEFAULT 'under_review',
    "reviewNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT '负责任开发者',
    "power" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnergyLog" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "relatedId" TEXT,
    "operatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnergyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentConfirmation" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "workId" TEXT,
    "approved" BOOLEAN NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Parent_phone_key" ON "Parent"("phone");

-- CreateIndex
CREATE INDEX "Parent_phone_idx" ON "Parent"("phone");

-- CreateIndex
CREATE INDEX "Child_organizationId_idx" ON "Child"("organizationId");

-- CreateIndex
CREATE INDEX "Child_parentId_idx" ON "Child"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Child_anonymousName_key" ON "Child"("anonymousName");

-- CreateIndex
CREATE INDEX "Journey_childId_idx" ON "Journey"("childId");

-- CreateIndex
CREATE INDEX "Journey_currentLevel_idx" ON "Journey"("currentLevel");

-- CreateIndex
CREATE INDEX "Journey_publishStatus_idx" ON "Journey"("publishStatus");

-- CreateIndex
CREATE INDEX "JourneyLog_journeyId_createdAt_idx" ON "JourneyLog"("journeyId", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_journeyId_level_createdAt_idx" ON "Conversation"("journeyId", "level", "createdAt");

-- CreateIndex
CREATE INDEX "RiskCard_ageStage_riskType_status_idx" ON "RiskCard"("ageStage", "riskType", "status");

-- CreateIndex
CREATE INDEX "RiskCard_version_idx" ON "RiskCard"("version");

-- CreateIndex
CREATE INDEX "DemoTemplate_status_idx" ON "DemoTemplate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Work_journeyId_key" ON "Work"("journeyId");

-- CreateIndex
CREATE INDEX "Work_publishStatus_createdAt_idx" ON "Work"("publishStatus", "createdAt");

-- CreateIndex
CREATE INDEX "Work_creatorNickname_idx" ON "Work"("creatorNickname");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_journeyId_key" ON "Badge"("journeyId");

-- CreateIndex
CREATE INDEX "Badge_childId_idx" ON "Badge"("childId");

-- CreateIndex
CREATE INDEX "Badge_type_idx" ON "Badge"("type");

-- CreateIndex
CREATE INDEX "EnergyLog_childId_createdAt_idx" ON "EnergyLog"("childId", "createdAt");

-- CreateIndex
CREATE INDEX "EnergyLog_reason_idx" ON "EnergyLog"("reason");

-- CreateIndex
CREATE INDEX "ParentConfirmation_parentId_idx" ON "ParentConfirmation"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentConfirmation_parentId_journeyId_key" ON "ParentConfirmation"("parentId", "journeyId");

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journey" ADD CONSTRAINT "Journey_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JourneyLog" ADD CONSTRAINT "JourneyLog_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Work" ADD CONSTRAINT "Work_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "Journey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnergyLog" ADD CONSTRAINT "EnergyLog_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentConfirmation" ADD CONSTRAINT "ParentConfirmation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

