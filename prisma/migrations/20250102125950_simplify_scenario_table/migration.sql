/*
  Warnings:

  - You are about to drop the column `model_version` on the `scenario` table. All the data in the column will be lost.
  - You are about to drop the column `parameters` on the `scenario` table. All the data in the column will be lost.
  - You are about to drop the column `result_data` on the `scenario` table. All the data in the column will be lost.
  - You are about to drop the column `result_data_completed_at` on the `scenario` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[parameters_hash]` on the table `scenario` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[run_id]` on the table `scenario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `run_id` to the `scenario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "scenario" DROP COLUMN "model_version",
DROP COLUMN "parameters",
DROP COLUMN "result_data",
DROP COLUMN "result_data_completed_at",
ADD COLUMN     "run_id" VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "scenario_parameters_hash_key" ON "scenario"("parameters_hash");

-- CreateIndex
CREATE UNIQUE INDEX "scenario_run_id_key" ON "scenario"("run_id");

-- CreateIndex
CREATE INDEX "scenario_parameters_hash_run_id_idx" ON "scenario"("parameters_hash", "run_id");
