-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "processor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_correlationId_key" ON "Payment"("correlationId");
