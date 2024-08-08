-- DropForeignKey
ALTER TABLE "session_scenario" DROP CONSTRAINT "session_scenario_scenario_id_fkey";

-- DropForeignKey
ALTER TABLE "session_scenario" DROP CONSTRAINT "session_scenario_session_id_fkey";

-- AddForeignKey
ALTER TABLE "session_scenario" ADD CONSTRAINT "session_scenario_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_scenario" ADD CONSTRAINT "session_scenario_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
