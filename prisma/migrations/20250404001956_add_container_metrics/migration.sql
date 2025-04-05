-- CreateTable
CREATE TABLE "ContainerMetrics" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "cpuUsage" DOUBLE PRECISION NOT NULL,
    "memoryUsage" DOUBLE PRECISION NOT NULL,
    "diskUsage" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContainerMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemMetrics" (
    "id" TEXT NOT NULL,
    "cpuUsage" DOUBLE PRECISION NOT NULL,
    "memoryUsage" DOUBLE PRECISION NOT NULL,
    "diskUsage" DOUBLE PRECISION NOT NULL,
    "networkRx" DOUBLE PRECISION NOT NULL,
    "networkTx" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContainerMetrics_containerId_key" ON "ContainerMetrics"("containerId");

-- AddForeignKey
ALTER TABLE "ContainerMetrics" ADD CONSTRAINT "ContainerMetrics_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "ContainerInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
