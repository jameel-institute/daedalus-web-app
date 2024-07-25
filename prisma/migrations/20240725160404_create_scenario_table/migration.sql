-- CreateTable
CREATE TABLE "scenario" (
    "id" TEXT NOT NULL,
    "model_version" VARCHAR(30) NOT NULL,
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "parameters_hash" VARCHAR(255) NOT NULL,
    "result_data" JSONB NOT NULL DEFAULT '{}',
    "result_data_completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenario_pkey" PRIMARY KEY ("id")
);
