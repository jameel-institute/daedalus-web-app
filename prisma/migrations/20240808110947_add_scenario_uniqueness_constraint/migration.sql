/*
  Warnings:

  - A unique constraint covering the columns `[model_version,parameters,dataset_release_version]` on the table `scenario` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "scenario_model_version_parameters_dataset_release_version_key" ON "scenario"("model_version", "parameters", "dataset_release_version");
