/*
  Warnings:

  - Added the required column `dataset_release_version` to the `scenario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "scenario" ADD COLUMN     "dataset_release_version" VARCHAR(30) NOT NULL;
