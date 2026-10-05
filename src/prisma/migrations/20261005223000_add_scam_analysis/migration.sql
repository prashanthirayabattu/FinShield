-- CreateTable
CREATE TABLE "scam_analyses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "extractedUpiId" TEXT,
    "sourceType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scam_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scam_analyses_userId_idx" ON "scam_analyses"("userId");

-- CreateIndex
CREATE INDEX "scam_analyses_userId_riskLevel_idx" ON "scam_analyses"("userId", "riskLevel");

-- AddForeignKey
ALTER TABLE "scam_analyses" ADD CONSTRAINT "scam_analyses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
