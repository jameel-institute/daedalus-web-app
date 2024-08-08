-- CreateTable
CREATE TABLE "session_scenario" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_scenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_scenario_scenario_id_session_id_key" ON "session_scenario"("scenario_id", "session_id");

-- AddForeignKey
ALTER TABLE "session_scenario" ADD CONSTRAINT "session_scenario_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_scenario" ADD CONSTRAINT "session_scenario_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
